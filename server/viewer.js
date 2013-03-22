/**
 * @class AD_Server.Viewer
 * @parent AD_Server
 *
 * ###Viewer
 *
 * This module provides an interface for discovering the `ViewerLocal` account
 * object of the current user. It is primarily used by the authentication
 * system.
 *
 * This is not the actual viewer making the request, but a set of functions
 * that allow us to discover the current viewer.
 *
 * The current viewer can differ on each request, so refer to `req.aRAD.viewer`
 * for that information within a request.
 */


var myDB = AD.Model.Datastore.DB;

// The Viewer model that is our interface to the site_viewer table.
var viewerModel = require(__appdevPath+'/modules/site/models/Viewer.js');



/**
 * @function trueViewer
 *
 * Return a viewer object that represents the current viewer.
 * This is who we actually are
 *
 * @param {object} req
 *      An HTTP request object
 * @return {object}
 */
exports.trueViewer = function(req)
{
    if (req.session && req.session.viewer) {

        // Objects stored into the session lose their prototype methods.
        // So init a new ViewerLocal using the old stored object.
        var viewer = new ViewerLocal( req.session.viewer );

    } else {

        var viewer = new ViewerLocal();
    }

    return viewer;

}



/**
 * @function currentViewer
 *
 * Return a viewer object that represents the current viewer.
 * This is who we WANT the application to think we are.
 *
 * @param {object} req
 *      An HTTP request object
 * @return {object}
 */
exports.currentViewer = function(req)
{
    if (req.aRAD && req.aRAD.viewer) {

        var viewer = req.aRAD.viewer;

    } else {

        var viewer = exports.trueViewer(req);
    }

    return viewer;

}



/**
 * @function createViewer
 *
 * Insert a new entry into the site_viewer table.
 *
 * @param object params
 *   Object containing the field:value pairs to populate the entry with.
 * @param function callback
 *   Function to execute after the entry has been inserted.
 */
exports.createViewer = function(params, callback)
{
	// make sure date is properly set:
	if (typeof params.viewer_lastLogin != 'undefined') {
		if (params['viewer_lastLogin'] == 'now') {
			params['viewer_lastLogin'] = getDateNow();
		}
	} else {
	    params['viewer_lastLogin'] = getDateNow();
	}
	viewerModel.create(params, callback, function(err){ throw err; });

}



/**
 * @function updateViewer
 *
 * Updates an existing viewer entry.
 *
 * @param object params
 *      List of field:value pairs. `viewer_id` is required.
 * @param function callback
 */
exports.updateViewer = function(params, callback) {

 // make sure date is properly set:
    if (typeof params.viewer_lastLogin != 'undefined') {
        if (params['viewer_lastLogin'] == 'now') {
            params['viewer_lastLogin'] = getDateNow();
        }
    } else {
        params['viewer_lastLogin'] = getDateNow();
    }

    var id = -1;
    if (typeof params['viewer_id'] != 'undefined') {
        id = params['viewer_id'];
        delete params['viewer_id'];
    }

    if (id != -1) {
        viewerModel.update(id, params, callback, function(err){ throw err; });
    } else {
        console.log('viewer.js:updateViewer()  No viewer_id provided! (or viewer_id == -1)');
        console.log(params);
        throw 'no viewer_id = -1! How can I update?';
    }


}



//---------------------------------------------------------------
/**
 * @function viewerLookup
 *
 * Load a viewer entry from the database based on one or more of its field
 * values.
 *
 * @param {Object} attr
 *      An object containing the fieldname:value pairs to search by.
 * @param {Function} callBack
 *      function(err, viewer)
 */
var viewerLookup = function(attr, callBack)
{
    var viewer = new ViewerLocal();

    viewerModel.findAll(attr,
        function(list) {
            // DB Success
            if (!list || list.length < 1) {
                // ...but no viewer found
                callBack(null, viewer);

            } else {
                // found viewer
                viewer.loadData(list[0]);
                viewer.isAuthenticated = true;
                loadPermissions( viewer, callBack );
            }
        },
        function(err) {
            // DB Error
            console.log(err);
            callBack(err, viewer);
    });
}



/**
 * @function viewerFromLogin
 *
 * Load a viewer entry by its userID and password.
 *
 * @param {String} userID
 * @param {String} pWord
 * @param {Function} callBack
 */
exports.viewerFromLogin = function(userID, pWord, callBack)
{

    viewerLookup({ viewer_userID:userID, viewer_passWord:pWord }, callBack);
}



/**
 * @function viewerFromUserID
 *
 * Load a viewer by it's userID.
 *
 * @param {String} userID
 * @param {String} pWord
 * @param {Function} callBack
 */
exports.viewerFromUserID = function(userID, callBack)
{
    viewerLookup({ viewer_userID:userID }, callBack);
}



/**
 * @function viewerFromGUID
 *
 * Load a viewer entry by its GUID.
 *
 * @param string guid
 * @param function callBack
 */
exports.viewerFromGUID = function(guid, callBack)
{

    viewerLookup({ viewer_globalUserID:guid }, callBack);
}


// This is the cache for viewer permissions loaded from the DB.
// Note that a separate instance will be created each time this
// file is loaded through require().
var cachePermissions = {};


/**
 * @function resetPermissionsCache
 *
 * Clear any previously cached permissions entries.
 */
exports.resetPermissionsCache = function()
{
    cachePermissions = {};
}



/**
 * Load the roles and tasks of a viewer, and embeds them into
 * the `viewer` object.
 *
 * Roles will be referenced by role_label, case insensitive.
 * Tasks will be referenced by task_key, case insensitive.
 *
 * @param {Object} viewer
 *      A populated ViewerLocal object
 * @param {Function} callback
 *      function(err, viewer)
 * @param {Boolean} refresh
 *      Set to TRUE to force loading from the DB even if a cached value exists
 */
var loadPermissions = function(viewer, callBack, refresh)
{
    var guid = viewer['viewer_globalUserID'];

    // Return the cached permissions if they exist
    if (!refresh && cachePermissions[guid]) {
        viewer.permissions = cachePermissions[guid];
        return callBack(undefined, viewer);
    }

    // Otherwise fetch them from the database
    var sql = '\
        SELECT role_label, task_key \
        FROM '+AD.Defaults.dbName+'.site_perm_viewer_roles as vr \
        INNER JOIN '+AD.Defaults.dbName+'.site_perm_roles as r \
            ON vr.role_id=r.role_id \
        LEFT JOIN '+AD.Defaults.dbName+'.site_perm_role_tasks as ra \
            ON vr.role_id=ra.role_id \
        LEFT JOIN '+AD.Defaults.dbName+'.site_perm_tasks_data as a \
            ON ra.task_id=a.task_id \
        WHERE viewer_guid=? \
    ';

    myDB.query(sql, [guid], function(err, results, fields) {

        viewer.permissions = { roles:{},  tasks:{} };

        if (err) {

            console.log(err);
            return callBack(err, viewer);

        }
        else if (results.length < 1) {

            // didn't find any roles so return
            return callBack(null, viewer);

        }
        else {

            // found him, so load the viewer object
            for (var indx=0; indx < results.length; indx++) {
                // Every result must have a role label
                var role = results[indx].role_label.toLowerCase();
                viewer.permissions.roles[role] = true;
                // Task key may be NULL if the role has no tasks assigned
                if (results[indx].task_key) {
                    var task = results[indx].task_key.toLowerCase();
                    viewer.permissions.tasks[task] = true;
                }
            }

            // store the results in the cache
            cachePermissions[guid] = viewer.permissions;

            return callBack(null, viewer);
        }

    });

}
exports.loadPermissions = loadPermissions;



/**
 * Returns the current date in YMD format.
 *
 * @return string
 */
var getDateNow = function()
{
    var now = new Date();
    var ymdDate = '' + now.getFullYear() + '-'
        + (now.getMonth()+1) + '-'
        + now.getDate() + ' '
        + now.getHours() + ':'
        + now.getMinutes();
    return ymdDate;
}



//--------------------------------------------------------------------
//  ViewerLocal class
//--------------------------------------------------------------------

/**
 * @class ViewerLocal
 * @parent AD.Viewer
 *
 * This represents the current viewer of a requested page/service.
 *
 * It is the `viewer` object that will be embedded inside req.aRAD for each
 * request.
 *
 * @param {Object} properties
 *      Properties to copy into the new ViewerLocal object.
 *      This enabled viewer info stored in the session to be quickly recalled.
 */
var ViewerLocal = function(properties) {

    this.isAuthenticated= false;
    this.id = -1;
    this.languageKey='en';  // TODO: replace with Defaults.SITE_LANG_DEFAULT

    this.permissions = { roles: {}, tasks: {} };

    // Populate this ViewerLocal instance with the given properties
    if (typeof properties == 'object') {
        this.loadData(properties);
    }
};



/**
 * @function loadData
 *
 * Populate the data of the ViewerLocal object from the results of a
 * database query.
 */
ViewerLocal.prototype.loadData = function(data)
{
    for (var field in data) {
        this[field] = data[field];
    }
}



/**
 * @function hasRole
 *
 * Checks the viewer's loaded permissions to see if a given role is present.
 *
 * @param {String} key
 *      The role_label to check for, case insensitive.
 * @return {Boolean}
 */
ViewerLocal.prototype.hasRole = function(key)
{
    // Super User admin always has permissions to everything.
    if ((this.id === 1) || this.permissions.roles['root']) {
        return true;
    }

    key = key.toLowerCase();
    return (typeof this.permissions.roles[key] != 'undefined');
}



/**
 * @function hasTask
 *
 * Checks the viewer's loaded permissions to see if a given task is present.
 *
 * @param {String} key
 *      The task_key to check for, case insensitive.
 * @param {Boolean} strictChecking
 *      (optional) Set this to TRUE to avoid checking implicit permissions.
 * @return {Boolean}
 */
ViewerLocal.prototype.hasTask = function(key, strictChecking)
{
    // Super User admin always has permissions to everything.
    if ((this.id === 1) || this.permissions.roles['root']) {
        return true;
    }

    key = key.toLowerCase();
    var result = (typeof this.permissions.tasks[key] != 'undefined');

    // The exact permission was not found. But we can also check to see if the
    // permission is implicitly granted.
    if (!result && !strictChecking) {
        for (var permKey in this.permissions.tasks) {
            // Permission is implied if there exists another permission that
            // begins exactly the same way.
            // e.g. "hris.manageothers.piu" implies "hris.manageothers"
            if (permKey.indexOf(key+'.') === 0) {
                result = true;
                break;
            }
        }
    }

    return result;
}



/**
 * @function guid
 *
 * Return the current viewer's Global User ID (guid).
 *
 * @return {string}
 */
ViewerLocal.prototype.guid = function()
{
    return this['viewer_globalUserID'];
}
