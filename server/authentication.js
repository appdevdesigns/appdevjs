/**
 * @class Authentication
 * @parent AD.Auth
 *
 * (not really a class)
 *
 * ###Authentication
 *
 * We use a modular authentication system. Currently there are two supported
 * authentication handlers: `local` and `CAS`. This setting is specified 
 * during installation and recorded in `defaults.js`.
 *
 */

var log = AD.Util.Log;


var url = require('url');

// use the authentication method specified in defaults.js
var authHandler;
switch (AD.Defaults.authMethod) {

    default:
    case 'local':
        authHandler = require('./auth-local.js');
        break;
        
    case 'CAS':
        authHandler = require('./auth-cas.js');
        break;

}

var authLabels = {
    '[site.autherrors.Reauthenticate]':{'en':'Reauthenticate'},
    '[site.autherrors.InvalidUP]':{'en':'invalid userID/pW0rd'}
}

var Labels = require(__appdevPath + '/modules/site/models/Labels.js');
var conditionLabels = "label_path LIKE '/page/site/autherrors%'";


var refresh = function() {

    Labels.findAll({ dbCond: conditionLabels },function(resultArray) {

            for (var i=0; i<resultArray.length; i++) {
                var thisLabel = resultArray[i];
                
                
                // key
                var key = thisLabel['label_key'];
                if (typeof authLabels[key] == 'undefined') {
                    authLabels[key] = {}
                }
                
                // key -> lang
                var lang = thisLabel['language_code'];
                authLabels[key][lang] = thisLabel['label_label'];
            }
            
            authHandler.setLabels(authLabels);
            
        });
    
}
exports.refresh = refresh;
refresh();


/**
 * @function preAuthentication
 *
 * This allows the authentication modules to perform any required tasks
 * before the actual authentication is done.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
exports.preAuthentication = authHandler.preAuthentication || function(req, res, next)
{
    return next();
}


/**
 * Determines whether the current request requires authentication.
 * Used internally only.
 *
 * @param {Object} req
 *     An HTTP request object
 * @return boolean
 */
var isAuthRequired = function(req) 
{
    var msg = "   - authentication.isAuthRequired() ";

    var currentViewer = AD.Viewer.trueViewer(req);
    req.aRAD.viewer = currentViewer;

    // See if the viewer has already been authenticated
    if (currentViewer.isAuthenticated) {
        log(req,msg + ' -> already authenticated');
        return false;
    }

    // Authentication can be disabled at the site level
    if (!AD.Defaults.authRequired) {
        log(req,msg + ' -> authorization NOT Required');
        return false;
    }
    
    var exemptedRoutes = [];
    if (AD.Defaults.listNoAuthRequiredRoutes) {
        // The site settings may have provided a list of routes
        exemptedRoutes = AD.Defaults.listNoAuthRequiredRoutes;
    }
    // Merge the list with routes provided by the current auth handler
    exemptedRoutes = exemptedRoutes.concat(authHandler.getExemptedRoutes());

    // See if the current request is an exempted route
    for (var i=0; i<exemptedRoutes.length; i++) {
        if (req.url.match( exemptedRoutes[i] )) {
            log(req,msg + ' -> this route exempt from authentication');
            return false;
        }
    }

    return true;
}


/**
 * @function authenticatePage
 *
 * Verify that the current viewer is authenticated. If not, redirect to
 * the login page.
 *
 * @param object req
 * @param object res
 * @param function next
 */
exports.authenticatePage = function(req, res, next) 
{
    if (!isAuthRequired(req)) {
        // no authentication needed for this request
        next();
    } 
    else {
        // authenticate now
        authHandler.authenticatePage(req, res, next);
    }
}



/**
 * @function authenticateService
 *
 * Verify that the current viewer is authenticated. If not, respond with
 * an error message so the client side script can initiate reauthentication.
 *
 * @param object req
 * @param object res
 * @param function next
 */
exports.authenticateService = function(req, res, next) 
{
    if (!isAuthRequired(req)) {
        // no authentication needed for this request
        next();
    } 
    else {
        // authenticate now
        authHandler.authenticateService(req, res, next);
    }
}



/**
 * @function login
 *
 * A service that accepts authentication credentials, stores the viewer in
 * the session, and sends a response.
 *
 * @param object req
 * @param object res
 * @param function next
 */
exports.login = authHandler.login;



/**
 * Lets the auth handler set up any additional routes it needs
 */
exports.routes = authHandler.routes;



//-----------------------------------------------------------------------
//  Switcheroo Object
//-----------------------------------------------------------------------

var Switcheroo = require(__appdevPath +'/modules/site/models/Switcheroo.js');


/**
 * @function switcheroo
 *
 * This allows privileged admin users to assume the identity of another user
 * on the system. Intended for testing and debugging purposes.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
exports.switcheroo = function(req, res, next) 
{
    
    var msg = '   - authentication.switcheroo() ';
    
    // get the actual Viewer
    //var currentViewer = AD.Viewer.currentViewer(req);
    var currentViewer = AD.Viewer.trueViewer(req);

    if (currentViewer.isAuthenticated) { 

        // if an entry in our Switcheroo table exists for currentViewer
        Switcheroo.findAll({ switcheroo_realID: currentViewer.viewer_globalUserID }, function (list){
            /// Successfull operation
            
            // if a switcheroo entry was found
            if (list && list[0]) {
                
                // store our true viewer info
                req.session.trueViewer = currentViewer;
                
                // now lookup our fake info
                var fakeID = list[0].switcheroo_fakeID;
                log(req, msg+' :::> fakeID['+fakeID+']');
                
                AD.Viewer.viewerFromGUID(fakeID, function(err, data) { 
                
                 
                    if (err == null) {
                    
                        // switcheroo account loaded so ...
                        // store fake viewer as req.aRAD.viewer
                        req.aRAD.viewer.loadData(data);
                        next();
                        
                    } else {
                    
                        next();
                    }
                   
                }); // end AD.Viewer.viewerFromUserID();
            
            } else {
            
                // no entries returned so just continue:
                next();
            }
            
            
        }, function (err){
            // no switcheroo so continue.
            log(req,msg+' :: returned error:');
            log(req,err);
            next();
        });
        

    
    } else {
    
    
        // 
        // if req.session.trueViewer
        
        log(req,msg);
        // when we are done: req.aRAD.viewer needs to be initialized
        next();
    
    }

}

