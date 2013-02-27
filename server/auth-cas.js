/**
 * @class authCAS
 * @parent Authentication
 *
 * This is the appDev object for handling CAS authentication. 
 *
 * Uses the cas module:
 *
 * * <https://github.com/joshchan/node-cas>
 * * `git clone git@github.com:joshchan/node-cas.git node_modules/cas`
 *
 * Which should eventually make it back into npm:
 *
 * * `npm install cas`
 *
 * An optional submodule for mapping CAS the login ID into a GUID can be 
 * specified during installation (`AD.Defaults.authCAS.submodule`). This 
 * should be a .js file placed inside the `node_modules` directory.
 */

var request = require('request');
var db = AD.Model.Datastore.DB;
var authCAS = AD.Defaults.authCAS;

// A submodule for mapping CAS the login ID into a GUID can be specified.
var casMapGUID = null;
if (authCAS.submodule) {
    /**
     * @function submodule
     *
     * This function should be the sole thing exported by the CAS
     * authentication submodule.
     *
     * Maps a CAS login into a GUID value. Async.
     *
     * @param {string} username
     *    The CAS login ID
     * @param {object} attributes
     *    A list of key:[value] attribute pairs, if any
     * @param {function} callback
     *    On completion this will be called with the GUID as parameter.
     *    `callback(err, guid)`
     */
    casMapGUID = require(authCAS.submodule);
}

var CAS = require('cas'); // object class
var cas; // object instance

if (authCAS.path[0] != '/') {
    // add a slash in front of the CAS base path if needed
    authCAS.path = '/' + authCAS.path;
}
var casOptions = {
    base_url: 'https://'+authCAS.host+':'+authCAS.port+authCAS.path,
    version: 2.0,
    external_pgt_url: authCAS.pgtCallbackURL // <-- may be undefined
};
if (casOptions.external_pgt_url) {
    // Check PGT callback URL
    request.get(authCAS.pgtCallbackURL, function(err, res, body) {
        if (err) {
            // PGT callback URL failed. Don't use CAS proxy.
            console.log(' -- CAS PGT callback URL was specified in defaults.js but the callback server is down --');
            delete casOptions['external_pgt_url'];
        }
        cas = new CAS(casOptions);
    });
} else {
    // No PGT callback was specified.
    console.log(' -- No CAS PGT callback URL was specified --');
    cas = new CAS(casOptions);
}

    
    

// Expose the cas.getProxyTicket() method
AD.Defaults.authCAS.getProxyTicket = function(pgtIOU, targetService, callback)
{
    return cas.getProxyTicket(pgtIOU, targetService, callback);
}


var authLabels;

/**
 * Pass in the labels.
 */
exports.setLabels = function(labels)
{
    authLabels = labels;
}


/**
 * @function getExemptedRoutes
 *
 * A list of routes that do not require authentication under this auth handler.
 *
 * @return {Array}
 */
exports.getExemptedRoutes = function() 
{
    return [
        // what's the logout URL?
    ];
}


// This will keep track of the CAS tickets and Express sessionID values.
var ticketSessionStore = {};
// Do garbage collection once every hour
setInterval(function() {
    var now = process.uptime();
    for (var ticket in ticketSessionStore) {
        var timestamp = ticketSessionStore[ticket]['timestamp'];
        // Delete entries older than 5 hours
        if (now - timestamp > 60 * 60 * 5) {
            delete ticketSessionStore[ticket];
        }
    }
}, 1000 * 60);



/**
 * @function preAuthentication
 *
 * Check if the CAS server is requesting us to logout a user.
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
exports.preAuthentication = function(req, res, next)
{
    cas.handleSingleSignout(req, res, next, function(ticket) {
        destroySessionByTicket(ticket);
        res.end('OK');
        return;
    });
}


/**
 * Internal function used by both `authenticatePage()` and `autheticateService()`.
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Object} extended Extended user data returned by the CAS module.
 * @param {Function} errCallback
 * @param {Function} next
 */
var finishAuthentication = function(req, res, extended, errCallback, next)
{
    var username = extended['username'];
    var ticket = extended['ticket'];
    
    // Track the ticket and the session ID, so we can delete the session later
    // based on the ticket.
    ticketSessionStore[ticket] = { 
        'timestamp': process.uptime(),
        'sessionID': req.sessionID 
    };
    
    // Store the PGTIOU in the session if we got one
    if (extended['PGTIOU']) {
        req.session['CAS-PGTIOU'] = extended['PGTIOU'];
    } else {
        req.session['CAS-PGTIOU'] = undefined;
    }

    // Map the CAS username into a GUID using a submodule
    if (casMapGUID) {
        var attributes = extended['attributes'];
        casMapGUID(username, attributes, function(err, guid) {
            if (err) {
                errCallback(err);
                return;
            }
            else {
                createSession(req, res, next, username, guid);
                return;
            }
        });
    }
    // No submodule. Use the username directly as GUID.
    else {
        var guid = username;
        createSession(req, res, next, username, guid);
        return;
    }

}


/**
 * @function authenticatePage
 *
 * CAS authentication for a web page.
 *
 * @param object req
 * @param object res
 * @param function next
 */
exports.authenticatePage = function(req, res, next) 
{
    // Force CAS authentication and fetch the username
    cas.authenticate(req, res, function(err, status, username, extended) {
        if (err) {
            var date = new Date();
            var token = Math.round(date.getTime() / 60000);
            if (req.query['_cas_retry'] != token) {
                // There was a CAS error. A common cause is when the `ticket` 
                // portion of the querystring remains when the session times
                // out and the user refreshes the page.
                // So remove the `ticket` and try again.
                var url = req.url
                    .replace(/_cas_retry=\d+&?/, '')
                    .replace(/([?&])ticket=[\w-]+/, '$1_cas_retry='+token)
                res.writeHead(307, {'Location': url});
                res.write('<html><body><a href="' + url + '">retry login</a></body></html>');
                res.end();
            } else {
                // Already retried. There is no way to recover from this.
                res.writeHead(401, {'Content-Type': 'text/html'});
                res.write("<dt>CAS login failed</dt>");
                res.write('<dd>' + err.message + '</dd>');
                res.end();
                return;
            }
        }
        else {
            finishAuthentication(req, res, extended, 
                // GUID mapping error
                function(err) {
                    res.writeHead(401, {'Content-Type': 'text/html'});
                    res.write('<dt>Sorry, your login could not be completed.</dt>');
                    res.write('<dd>' + err.message + '</dd>');
                    res.end();
                    return;
                },
                // Success
                next
            );
        }
    });
}


/**
 * @function authenticateService
 *
 * CAS authentication for a web service.
 *
 * @param object req
 * @param object res
 * @param function next
 *      The callback to execute if authentication passes.
 */
exports.authenticateService = function(req, res, next) 
{
    // Looks like we have a proxy ticket. Go ahead and authenticate that.
    if (req.query['ticket']) {
        cas.authenticate(req, res, function(err, status, username, extended) {
            if (err) {
                // unexpected CAS error
                AD.Comm.Service.sendError(req, res, {
                    errorID: 55,
                    errorMSG: err.message
                }, AD.Const.HTTP.ERROR_SERVER); // 500: assuming this is our problem
                return;
            }
            finishAuthentication(req, res, extended,
                // GUID mapping error
                function(err) {
                    AD.Comm.Service.sendError(req, res, {
                        errorID: 0,
                        errorMSG: err.message
                    }, AD.Const.HTTP.ERROR_SERVER); // 500: our problem still?
                },
                // Success
                next
            );
        });
        return;
    }
    
    // No ticket, so that means the requester is not authenticated, and is 
    // not a CAS proxy.
    else {
        AD.Comm.Service.sendError(req, res, {
            errorID: 55, 
            errorMSG: authLabels['[site.autherrors.Reauthenticate]'][req.aRAD.defaults['siteDefaultLanguage']]
        }, AD.Const.HTTP.ERROR_UNAUTHORIZED); // 401: not authorized!  
    }
}


/**
 * @function logoutPage
 *
 * Log the user out and return to the default page.
 */
exports.logoutPage = function(req, res, returnUrl) 
{
    if (!returnUrl) {
        returnUrl = AD.Defaults.siteURL;
    }
    cas.logout(req, res, returnUrl, true);
}


/**
 * @function login
 *
 * A service that accepts authentication credentials and sends a response.
 * This has no purpose under CAS.
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
exports.login = function(req, res, next) {}


/**
 * Logs a user in using their viewer_globalUserID.
 * This will automatically create a new viewer entry if one does not exist.
 *
 * @param object req
 * @param object res
 * @param function next
 * @param string username
 * @param string guid
 */
var createSession = function(req, res, next, username, guid) 
{
    var viewerObj = null;
    var doUpdateGUID = false;

    async.series([

        // Search by GUID
        function(callback) {
            AD.Viewer.viewerFromGUID(guid, function(err, viewer) {
                viewerObj = viewer;
                callback();
            });
        },

        // Search by username. This is only done if the GUID search failed.
        function(callback) {
            // Skip if we already loaded the viewer.
            if (viewerObj && viewerObj['viewer_id'] > 0) {
                return callback();
            }
            // Check to see if an admin has pre-created an account with
            // this CAS user's username.
            AD.Model.List['site.Viewer'].findAll(
                {
                    viewer_userID: username,
                    viewer_isActive: 9 // <-- means pre-created account
                },
                function(list) {
                    if (list && list.length > 0) {
                        doUpdateGUID = true;
                        viewerObj.loadData(list[0]);
                        AD.Viewer.loadPermissions(viewerObj, function(viewer) {
                            viewerObj = viewer;
                            callback()
                        });
                    } else {
                        callback();
                    }
                },
                function(err) {
                    console.error(err);
                    callback();
                }
            );
        },

        // Update GUID
        // This will only take effect if:
        //  - An admin pre-created an account for this user.
        //  - The user's CAS username was correctly specified by the admin.
        //  - The user's GUID and username are different.
        function(callback) {
            // Skip if viewer still not loaded.
            if (!viewerObj || !viewerObj['viewer_id'] || viewerObj['viewer_id'] < 0) {
                return callback();
            }
            // Skip if update not needed.
            if (!doUpdateGUID) {
                return callback();
            }
            // Need to update the GUID values for this pre-created account.
            // So the next time logging in will be normal.
            var queries = [
                { 
                    sql: "UPDATE "+AD.Defaults.dbName+".site_viewer \
                          SET \
                            viewer_globalUserID = ?, \
                            viewer_isActive = ? \
                          WHERE viewer_globalUserID = ?",
                    params: [guid, 1, username]
                },
                {
                    sql: "UPDATE "+AD.Defaults.dbName+".site_perm_viewer_roles \
                          SET viewer_guid = ? \
                          WHERE viewer_guid = ?",
                    params: [guid, username]
                }
            ];
            async.forEach(queries, function(data, fn) {
                db.query(data.sql, data.params, function(err) {
                    if (err) console.error(err);
                    fn();
                });
            }, callback);
        },
        
        // Create/update viewer
        function(callback) {
            // Viewer was correctly loaded
            if (viewerObj && viewerObj['viewer_id'] && viewerObj['viewer_id'] > 0) {
                // Update the last login date, and also the userID if needed
                AD.Viewer.updateViewer({
                    'viewer_id': viewerObj['viewer_id'],
                    'viewer_userID': username,
                    'viewer_lastLogin': "now"
                }, function(err) {
                    viewerObj['viewer_userID'] = username;
                    callback();
                });
            }
            // Viewer could not be found.
            // And there was no pre-created account with matching username.
            else {
                // So create a new viewer account now for this CAS user.
                viewerObj['viewer_userID'] = username;
                viewerObj['viewer_globalUserID'] = guid;
                autoCreateAccount(viewerObj, callback);
            }
        },
        
        // Store viewer in session
        function(callback) {
            switch (viewerObj['viewer_isActive']) {
                default:
                case 0:
                    // Account has been disabled by an admin
                    res.send("Your global CAS login is good, but your account on this site is not enabled. Please contact an admin.");
                    return;
                    break;
                
                case 9:
                    // This should not be possible because it should have been 
                    // set to '1' by now.
                case 8:
                    // Account was automatically created when this CAS user
                    // logged in. It has limited access while pending admin 
                    // approval.
                case 1:
                    // store viewer in session
                    viewerObj.isAuthenticated = true;
                    req.session.viewer = viewerObj;
                    req.aRAD.viewer = viewerObj;
                    return callback();
                    break;
            }
        }

    ], next);
}


/**
 * This function is called when a new user logs in with CAS. A viewer
 * account will be automatically created, depending on the site settings.
 *
 * @param {ViewerLocal} viewerObj
 * @param {Function} callback
 */
var autoCreateAccount = function(viewerObj, callback)
{
    var guid = viewerObj.viewer_globalUserID;
    var username = viewerObj.viewer_userID;

    var roleID = null;
    var pageRoute = null;
    var status = 0;

    async.auto({
        
        // 1. Load system settings from DB
        "load_settings": function(next) {
            AD.Model.List['site.Settings'].findAll(
                {dbCond: "`settings_key` LIKE 'siteAuthorizationDefault-%'"},
                function(list) {
                    // Convert results array into an object
                    var settings = {};
                    for (var i=0; i<list.length; i++) {
                        var key = list[i]['settings_key'];
                        var value = list[i]['settings_value'];
                        settings[key] = value;
                    }
                    switch (settings['siteAuthorizationDefault-accountApproval']) {
                        case 'admin':
                            // Only admins are allowed to create accounts.
                            // So this CAS user will have status inactive.
                            status = 0;
                            viewerObj.isAuthenticated = false;
                            break;
                        case 'visitors':
                            // Visitors can create their own accounts.
                            status = 1;
                            roleID = settings['siteAuthorizationDefault-newUserRole'];
                            pageRoute = settings['siteAuthorizationDefault-newUserPage'];
                            viewerObj.isAuthenticated = true;
                            break;
                        default:
                        case 'visitors-with-admin':
                            // Visitors can create their own accounts, but will
                            // only have limited access until they are approved
                            // by an admin.
                            status = 8;
                            roleID = settings['siteAuthorizationDefault-pendingUserRole'];
                            pageRoute = settings['siteAuthorizationDefault-pendingUserPage'];
                            viewerObj.isAuthenticated = true;
                            break;
                    }
                    next();
                },
                function(err) {
                    console.error(err);
                    next(); // ?
                }
            );
        },
        
        // 2a. Create viewer account
        "create_viewer": ['load_settings', function(next) {
            AD.Viewer.createViewer({
                'viewer_globalUserID': guid,
                'viewer_userID': username,
                'viewer_passWord': '--CAS--',
                'viewer_isActive': status,
                'viewer_lastLogin': "now"
            }, function(data) {
                viewerObj.loadData(data);
                viewerObj['viewer_isActive'] = status;
                next();
            });
        }],
        
        // 2b. Add viewer's default role
        "add_roles": ['create_viewer', function(next) {
            if (roleID) {
                AD.Model.List['site.PermissionsViewerRoles'].create(
                    { viewer_guid: guid, role_id: roleID },
                    function(data) {
                        next();
                    },
                    function(err) {
                        console.error(err);
                        next(); // ?
                    }
                );
            } else {
                next();
            }
        }],
        
        // 2c. Set viewer's default page
        "set_page": ['create_viewer', function(next) {
            // todo: add this user's default page route setting
            next();
        }]

    }, callback);
}


/**
 * Find a logged in user by the ST (CAS service ticket) that they used to 
 * log in with, and delete their session.
 *
 * @param string ticket
 */
var destroySessionByTicket = function(ticket)
{
    if (ticketSessionStore[ticket]) {
        var sessionID = ticketSessionStore[ticket]['sessionID'];
        process.nextTick(function() {
            AD.SessionStore.destroy(sessionID);
        });
    }
}


/**
 * An array of additional routes needed for CAS authentication
 */
exports.routes = {
    
    /**
     * @function routes."page/cas/frame-auth"
     *
     * @codestart
     * /page/cas/frame-auth
     * @codeend
     *
     * A CAS-authenticated blank HTML page that will close itself 
     * with Javascript. 
     *
     * It is meant to be opened inside an IFRAME when the user needs to
     * reauthenticate after a session has timed out. The frame will redirect
     * to the CAS login page, and return with the new login ticket. Once
     * validation passes the session will be updated and the frame should
     * close.
     *
     * see `data/scripts/appDev/appDev.js`
     */

    /*
     */

    '/page/cas/frame-auth': function(req, res, next) {
        res.send(" \
        <!DOCTYPE html> \
        <html> \
            <head> \
                <script type='text/javascript'> \
                    if (top.AppDev) { \
                        top.AppDev.winLogin.done(); \
                    } else { \
                        window.close(); \
                    } \
                </script> \
            </head> \
            <body> \
                <div style='width:5em; margin:8em auto;'>Logging in...</div> \
            </body> \
        </html> \
        ");
    }

};

