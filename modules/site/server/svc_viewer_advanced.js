/**
 * ###Advanced operations for Viewer accounts
 *
 * These are intended to be requested from the client side by admin users.
 * 
 * Doesn't seem to be an efficient way to do this stuff with the Viewer Model.
 * That is, to update a group of accounts without needing multiple requests
 * to the server from the client. And without needing multiple calls to the 
 * database.
 */


var log = AD.Util.Log;
var logDump = AD.Util.LogDump;
var db = AD.Model.Datastore.DB;

var siteHub = null;   // Module's Notification Center (note: be sure not to use this until setup() is called)
var siteDispatch = null;  // Module's Dispatch Center (for sending messages among Clients)

var viewerAdvanced = new AD.App.Service({});
module.exports = viewerAdvanced;

var encodeMD5 = function(plainText)
{
    var md5 = require('crypto').createHash('md5');
    md5.update(plainText);
    return md5.digest('hex');
}


////---------------------------------------------------------------------
var hasPermission = function(req, res, next) 
{
    // Verify the current viewer has permission to perform this action.

    if (req.aRAD.viewer.hasRole('admin')) {
        // Only admins should be using this service
        next();
    } else {
        var errorData = { errorMSG:'No Permission' }
        AD.Comm.Service.sendError(req, res, errorData, AD.Const.HTTP.ERROR_FORBIDDEN ); // 403
    }

}


// The sharedDB is not always set to the default database. So make sure of that
// here.
var setDB = function(req, res, next)
{
    db.query("USE " + AD.Defaults.dbName, [], function() {
        next();
    });
}


var viewerStack = [
        hasPermission,      // make sure we have permission to access this
        setDB
    ];
        


//-----------------------------------------------------------------------------
viewerAdvanced.setup = function(app) 
{
    // setup any handlers, subscriptions, etc... that need to have passed in 
    // private resources from the Module:
    //  this.hub = the module's Notification Hub
    //  this.listModels = the list of Model objects in the current Module
    // 
    
    siteHub = this.module.hub;
    siteDispatch = this.module.dispatch;
    
    
    /**
     * Converts the `viewer_id` parameter that may be supplied by the client
     * into a sanitized DB condition string.
     */
    var viewerIdsToCond = function(viewerIDs)
    {
        // Convert viewer_id parameters into an array if needed
        var listViewerIDs;
        if (typeof viewerIDs == 'string') {
            listViewerIDs = viewerIDs.split(',');
        } else {
            // Already an array
            listViewerIDs = viewerIDs;
        }
        // Make sure each viewer_id is an integer
        AD.jQuery.each(listViewerIDs, function(index, value) {
            listViewerIDs[index] = parseInt(value);
        });

        // Return the sanitized viewer_id list as a condition
        var stringViewerIDs = listViewerIDs.join(',');
        return "`viewer_id` IN (" + stringViewerIDs + ")";
    }
    

    // Service for finding the extended viewer account info of one or more 
    // viewers. This includes any roles that are assigned to the accounts.
    // "Pending" accounts will not be included.
    //
    // `viewer_id` can be specified as a querystring parameter. 
    //   e.g.   GET /service/site/viewer/extended?viewer_id=123
    // You may specify it multiple times. 
    //   e.g.   GET /service/site/viewer/extended?viewer_id=123&viewer_id=345&viewer_id=456
    // Or use commas to separate values.
    //   e.g.   GET /service/site/viewer/extended?viewer_id=123,345,456
    // If not specified then this will return _all_ viewer accounts.
    //
    // `filter` can be specified as a querystring parameter.
    // Format is [fieldname]/[op]/[value]
    // As before, multiple filters can be specified, though not with commas now.
    // Possible ops are: `is`, `not`, and `like`
    //   e.g.   ?filter=viewer_userID/like/jsmith
    //   e.g.   ?filter=viewer_isActive/is/1
    //   e.g.   ?filter=language_key/is/zh-hans&filter=viewer_userID/like/yao.ming
    app.get('/service/site/viewer/extended', viewerStack, function(req, res, next) 
    {
        var viewerIDs = req.param('viewer_id');
        var filters = req.param('filter');
        var sql = " \
            SELECT \
                v.viewer_id, v.viewer_userID, v.viewer_globalUserID, \
                v.language_key, v.viewer_isActive, v.viewer_lastLogin, \
                r.* \
            FROM `site_viewer` v \
            LEFT JOIN `site_perm_viewer_roles` pvr \
                ON v.viewer_globalUserID = pvr.viewer_guid \
            LEFT JOIN `site_perm_roles` r \
                ON pvr.role_id = r.role_id \
            WHERE v.viewer_isActive != 8 \
        ";
        var dbConds = [];
        
        if (viewerIDs) {
            dbConds.push( viewerIdsToCond(viewerIDs) );
        }
        
        if (filters) {
            if (typeof filters == 'string') {
                filters = [filters];
            }
            AD.jQuery.each(filters, function(index, value) {
                var parts = value.split('/');
                //// Validate/sanitize the filter
                // Invalid filters will be ignored.
                
                // Must have exactly 3 components
                if (parts.length != 3) return;

                // Can only filter by these fields
                var validFields = [
                    'viewer_userID', 'viewer_globalUserID', 'viewer_isActive', 
                    'language_key', 'role_id', 'role_label', 'viewer_id'
                ];
                if (validFields.indexOf(parts[0]) < 0) return;
                
                // Value may only contain alphanumerics, spaces, and a very 
                // select few symbols ( . , _ - )
                if (!parts[2].match(/^[\w., -]+$/i)) return;
                
                //// Convert filter to DB condition
                switch (parts[1].toLowerCase()) {
                    case 'is':
                        dbConds.push(parts[0] + " = '" + parts[2] + "'");
                        break;
                    case 'not':
                        dbConds.push(parts[0] + " != '" + parts[2] + "'");
                        break;
                    case 'like':
                        dbConds.push(parts[0] + " LIKE '%" + parts[2] + "%'");
                        break;
                }
            });
        }
        
        // Append all DB conditions to the SQL string
        if (dbConds.length > 0) {
            sql += " AND " + dbConds.join(' AND ');
        }
        
        db.query(
            sql, [],
            function(err, results, fields) {
                if (err) {
                    log('SQL error');
                    log(sql);
                    logDump(err);
                    AD.Comm.Service.sendError(req, res, err, AD.Const.HTTP.ERROR_SERVER);
                    return;
                };
                
                // Parse through the results and consolidate the same accounts
                // together, with their different roles collected into 
                // a sub-object.
                var accounts = {};
                for (var i=0; i<results.length; i++) {
                    var viewerID = results[i]['viewer_id'];
                    var roleID = results[i]['role_id'];
                    if (accounts[viewerID]) {
                        // Add additional role info to an existing entry
                        accounts[viewerID]['roles'][roleID] = {
                            role_id: roleID,
                            role_label: results[i]['role_label']
                        };
                    } else {
                        // First time this viewer is listed.
                        accounts[viewerID] = results[i];
                        // Put the role info into an object.
                        accounts[viewerID]['roles'] = {};
                        accounts[viewerID]['roles'][roleID] = {
                            role_id: roleID,
                            role_label: results[i]['role_label']
                        };
                        delete accounts[viewerID]['role_id'];
                        delete accounts[viewerID]['role_label'];
                    }
                }
                
                AD.Comm.Service.sendSuccess(req, res, accounts);
                logDump(req, 'finished GET viewer/extended');
            }
        );
    });



    // Service for updating the extended viewer account info of one or more 
    // viewers. This includes any roles to be assigned to the accounts.
    //
    // BODY parameters:
    //   {String} viewer_id 
    //      [required] comma-separated viewer_id values
    //   {Integer} role_id
    //   {String} language_key
    //   {Boolean} viewer_isActive
    app.post('/service/site/viewer/extended', viewerStack, function(req, res, next)
    {
        // test using: POST http://localhost:8088/service/site/viewer/extended
        
        var fields = {
            "viewer_isActive" : req.param('viewer_isActive'),
            "language_key" : req.param('language_key')
        };
        var roleID = req.param('role_id');
        var viewerIDs = req.param('viewer_id');
        
        if (!viewerIDs) {
            logDump(req, 'no viewer_id specified');
            AD.Comm.Service.sendError(req, res, { message: "viewer_id is required" }, AD.Const.HTTP.ERROR_CLIENT);
            return;
        }
        var dbCond = viewerIdsToCond(viewerIDs);
        
        async.parallel([
            // Update the main `site_viewer` table
            function(next) {
                var changes = [];
                AD.jQuery.each(fields, function(fieldName, value) {
                    if (value != undefined) {
                        // Remove unsafe characters from the value
                        value = value.replace(/[^\w-]/, '');
                        changes.push(" `"+fieldName+"` = '"+value+"' ");
                    }
                });
                if (changes.length == 0) {
                    return next();
                }

                var sql = "UPDATE `site_viewer` ";
                sql += " SET ";
                sql += changes.join(',');
                sql += " WHERE " + dbCond;
                db.query(sql, [], function(err, results, fields) {
                    next(err);
                });
            },
            // Add new role to `site_perm_viewer_roles`
            function(next) {
                if (!roleID) {
                    return next();
                }
                
                // ** NOTE **
                // "INSERT IGNORE" may be an optimization unique to MySQL.
                // It prevents inserting a row if an identical row already 
                // exists in the table that would normally cause an error.
                // Other options are:
                // - "REPLACE"
                // - "INSERT ON DUPLICATE KEY UPDATE"
                // - manually delete duplicates before inserting
                // - do a SELECT first to find duplicates
                
                db.query(" \
                    INSERT IGNORE \
                    INTO `site_perm_viewer_roles` \
                        (`viewer_guid`, `role_id`) \
                        SELECT `viewer_globalUserID`, ? \
                            FROM `site_viewer` \
                            WHERE " + dbCond + " \
                ", [roleID], function(err, results, fields) {
                    next(err);
                });
            }
        ], 
        // ...finished all SQL operations
        function(err) {
            if (err) {
                log(req, err);
            }
            logDump(req, 'finished POST viewer/extended');
            AD.Comm.Service.sendSuccess(req, res, {});
        
        });
        
    });
    
    
    // Service for creating the extended viewer account info of a single
    // viewer. This includes any roles to be assigned to the account.
    //
    // BODY parameters:
    //   {String} viewer_userID
    //   {String} viewer_passWord
    //   {String} viewer_passWord_MD5
    //      [optional] Can pass in MD5 encoded password instead of plaintext
    //   {Integer} role_id
    //      [optional] Can have multiple values by separating with commas
    //   {String} language_key
    //   {Boolean} viewer_isActive
    //      [optional] 1 or 0. Default is 1.
    app.put('/service/site/viewer/extended', viewerStack, function(req, res, next)
    {
        // test using: PUT http://localhost:8088/service/site/viewer/extended
        
        var fields = {
            "viewer_userID" : req.param('viewer_userID'),
            "viewer_passWord" : req.param('viewer_passWord') || '',
            "viewer_isActive" : req.param('viewer_isActive'),
            "language_key" : req.param('language_key')
        };
        var passwordMD5 = req.param('viewer_passWord_MD5');
        
        if (typeof fields['viewer_isActive'] == 'undefined') {
            fields['viewer_isActive'] = 1;
        }
        if (fields['viewer_isActive'] != 0 && AD.Defaults.authMethod == 'CAS') {
            // We use `viewer_isActive` to indicate this account is
            // pre-authorized for CAS and has not been logged into yet.
            fields['viewer_isActive'] = 9; // pre-approved for CAS
        } else if (fields['viewer_isActive'] == 0) {
            fields['viewer_isActive'] = 8; // pending admin aproval
        }

        var roleID = req.param('role_id');
        var listRoleID = [];
        if (typeof roleID == 'string') {
            listRoleID = roleID.split(',');
        } else if (typeof roleID == 'number') {
            listRoleID = [roleID];
        } else if (Array.isArray(roleID)) {
            listRoleID = roleID;
        }
        AD.jQuery.each(listRoleID, function(index, value) {
            // Make sure all role_id values are integers
            var finalValue = parseInt(value);
            if (finalValue > 0) {
                listRoleID[index] = finalValue;
            } else {
                listRoleID.splice(index, 1);
            }
        });
        
        // Using the async waterfall construct so that if an error is found
        // at any step, then the rest of the steps will not be called.
        async.waterfall([
            // Server side validation
            function(next) {
                var err = null;
                if (typeof fields.viewer_userID == 'undefined' || fields.viewer_userID == '') {
                    err = new Error('UserID is required');
                }
                // If we wanted to enforce password complexity, it would
                // be done here. Can only do that with plaintext passwords.
                next(err);
            },
            // Encode password if needed
            function(next) {
                if (typeof passwordMD5 == 'undefined') {
                    // convert plaintext password to MD5 now
                    passwordMD5 = encodeMD5(fields['viewer_passWord']);
                }
                fields['viewer_passWord'] = passwordMD5;
                return next(null);
            },
            // Check for duplicate userID
            function(next) {
                // Under CAS, this operation is used to pre-authorize 
                // accounts before the user first logs in.
                // This GUID will be updated after the user logs in.
                var userID = fields.viewer_globalUserID = fields.viewer_userID;
                var sql = " \
                    SELECT COUNT(*) AS numAccounts \
                    FROM `site_viewer` \
                    WHERE `viewer_userID` LIKE ? \
                    OR `viewer_globalUserID` LIKE ? \
                ";
                db.query(sql, [ userID, userID ],
                    function(err, results, fields) {
                        if (err) {
                            log('SQL error');
                            log(sql);
                            return next(err);
                        }
                        if (results[0]['numAccounts'] > 0) {
                            next(new Error("userID [" + userID + "] is already being used."));
                        } else {
                            next(null);
                        }
                    }
                );
            },
            // Load site default language if needed
            function(next) {
                if (typeof fields['language_key'] == 'undefined') {
                    site.Settings.findAll(
                        { settings_key: 'siteDefaultLanguage' },
                        function(list) {
                            fields['language_key'] = list[0]['settings_value'];
                            next();
                        },
                        function(err) { next(err); }
                    );
                }
                else {
                    next();
                }
            },
            // Add to the main `site_viewer` table
            function(next) {
                var sql = " \
                    INSERT INTO `site_viewer` \
                        (viewer_userID, viewer_globalUserID, viewer_passWord, viewer_isActive, language_key) \
                    VALUES \
                        (?, ?, ?, ?, ?) \
                ";
                db.query(sql, [
                        fields.viewer_userID,
                        fields.viewer_globalUserID,
                        fields.viewer_passWord,
                        fields.viewer_isActive,
                        fields.language_key
                    ], function(err, results, fields) {
                    next(err);
                });
            },
            // Add new roles to `site_perm_viewer_roles`
            function(next) {
                if (listRoleID.length == 0) {
                    return next(null);
                }
                
                var sql = " \
                    INSERT \
                    INTO `site_perm_viewer_roles` \
                        (`viewer_guid`, `role_id`) \
                    VALUES \
                ";
                var values = [];
                var params = [];
                for (var i=0; i<listRoleID.length; i++) {
                    values.push('(?, ?)');
                    params.push( fields.viewer_globalUserID );
                    params.push( listRoleID[i] );
                }
                sql += values.join(',');
                
                db.query(sql, params, function(err, results, fields) {
                    next(err);
                });
            }
        ], 
        // ...finished all SQL operations
        function(err) {
            if (err) {
                logDump(req, err);
                AD.Comm.Service.sendError(req, res, {
                    errorMSG: err.message
                }, AD.Const.HTTP.ERROR_SERVER); // 500 : sql error == our fault???
            }
            else {
                logDump(req, 'finished PUT viewer/extended');
                AD.Comm.Service.sendSuccess(req, res, {});
            }
        });
        
    });


    // Service for removing the extended viewer account info of one or more 
    // viewers. At this time that just means any role assigned to the accounts.
    //
    // parameters:
    //   {String} viewer_id 
    //      [required] comma-separated viewer_id values
    //   {Integer} role_id
    //      [required] Can only delete one role at a time.
    app.delete('/service/site/viewer/extended', viewerStack, function(req, res, next)
    {
        // test using: DELETE http://localhost:8088/service/site/viewer/extended
        
        var viewerIDs = req.param('viewer_id');
        if (!viewerIDs) {
            log(req, 'DELETE viewer/extended');
            logDump(req, 'no viewer_id specified');
            AD.Comm.Service.sendError(req, res, { errorMSG: "viewer_id is required" }, AD.Const.HTTP.ERROR_CLIENT);
            return;
        }
        var dbCond = viewerIdsToCond(viewerIDs);
        
        var roleID = parseInt(req.param('role_id'));
        if (isNaN(roleID) || roleID <= 0) {
            log(req, 'DELETE viewer/extended');
            logDump(req, 'invalid role_id');
            AD.Comm.Service.sendError(req, res, { errorMSG: 'invalid role_id' }, AD.Const.HTTP.ERROR_CLIENT);
            return;
        }
        
        var sql = " \
            DELETE FROM `site_perm_viewer_roles` \
            WHERE `role_id` = ? \
            AND `viewer_guid` IN ( \
                SELECT `viewer_globalUserID` \
                FROM `site_viewer` \
                WHERE " + dbCond + " \
            ) \
        ";
        db.query(sql, [roleID], function(err, results, fields) {
            if (err) {
                log(req, 'SQL error');
                logDump(req, err);
                AD.Comm.Service.sendError(req, res, err, AD.Const.HTTP.ERROR_SERVER);
                return;
            }
            
            logDump(req, 'finished DELETE viewer/extended');
            AD.Comm.Service.sendSuccess(req, res, {});
        });
    });
    
    
    // Service for confirming an account registration request.
    // This changes `viewer_isActive` to 1, and assigns the relevant role 
    // to the account.
    // Can only affect accounts that are currently pending.
    app.post('/service/site/viewer/pending/confirm/:viewer_id', viewerStack, function(req, res) 
    {
        var viewerID = req.param('viewer_id');
        var newRoleID = null;
        var defaultPage = null;

        async.series({
            
            "load_role": function(next) {
                AD.Model.List['site.Settings'].findAll(
                    { settings_key: 'siteAuthorizationDefault-newUserRole' },
                    function(list) {
                        if (list && list[0]) {
                            newRoleID = list[0]['settings_value'];
                        }
                        next();
                    }, 
                    function(err) { next(err) }
                );
            },

            "update_viewer": function(next) {
                db.query(" \
                    UPDATE `site_viewer` \
                    SET `viewer_isActive` = ? \
                    WHERE `viewer_id` = ? \
                    AND `viewer_isActive` = ? \
                ", [1, viewerID, 8], function(err, results, fields) {
                    if (results.affectedRows < 1) {
                        newRoleID = null;
                    }
                    next(err);
                });
            },

            "add_role": function(next) {
                if (!newRoleID) { 
                    return next();
                }
                db.query(" \
                    INSERT INTO `site_perm_viewer_roles` \
                        (`role_id`, `viewer_guid`) \
                        ( \
                            SELECT ?, `viewer_globalUserID` \
                            FROM `site_viewer` \
                            WHERE `viewer_id` = ? \
                        ) \
                ", [newRoleID, viewerID], function(err, results, fields) {
                    next(err);
                });
            }
            
        },
        function(err) {
            if (err) {
                log(err);
            }
            logDump(req, 'finished viewer/extended/confirm');
            AD.Comm.Service.sendSuccess(req, res, {});
        });
    });


    // Service for rejecting an account registration request.
    // This changes `viewer_isActive` to 0, and removes all roles.
    // Can only affect accounts that are currently pending.
    app.post('/service/site/viewer/pending/deny/:viewer_id', viewerStack, function(req, res) 
    {
        var viewerID = req.param('viewer_id');
        async.series({
            "delete_role": function(next) {
                db.query(" \
                    DELETE pvr \
                    FROM `site_viewer` v \
                    LEFT JOIN `site_perm_viewer_roles` pvr \
                        ON v.`viewer_globalUserID` = pvr.`viewer_guid` \
                    WHERE v.`viewer_id` = ? \
                    AND v.`viewer_isActive` = ? \
                ", [viewerID, 8], function(err, results, fields) {
                    next(err);
                });
            },
            "disable_account": function(next) {
                db.query(" \
                    UPDATE `site_viewer` \
                    SET `viewer_isActive` = ? \
                    WHERE `viewer_id` = ? \
                    AND `viewer_isActive` = ? \
                ", [0, viewerID, 8], function(err, results, fields) {
                    next(err);
                });
            }
        }, 
        function(err) {
            if (err) {
                logDump(req, err);
                AD.Comm.Service.sendError(req, res, { errorMSG: err.message }, AD.Const.HTTP.ERROR_SERVER);
            } else {
                logDump(req, 'finished viewer/extended/deny');
                AD.Comm.Service.sendSuccess(req, res, {});
            }
        });
    });
    

} // end setup()

