/**
 * @class Permissions
 * @parent AD.Auth
 *
 * ###appDev Permissions System
 *
 * An individual permission in the system is in the form of a _task_.
 *
 * ###Tasks
 *
 * A _task_ represents a use case in the system. It's `task_key` should be
 * in the format of:
 * _[appKey].[subKey1].[subKey2].[...].[subKeyN].[verb]_
 *
 * The _verb_ signifies what kind of action is involved in the task. If 
 * nothing is specified, "view" is the implied verb. This standard is for
 * the purpose of human readability and organization. The system itself does
 * not try to interpret or enforce task verbs.
 *
 * A few example tasks:
 *
 * * _create new User Accounts_: `site.admin.accounts.create`
 * * _approve HRIS Personal Information Updates_: `hris.manageothers.piu.approve`
 * * _impersonate other accounts_: `site.admin.switcheroo`
 *
 * Tasks can inherently imply dependencies. If a user has permission for a
 * task with a long `task_key`, he or she automatically also has permissions
 * for all the shorter versions of the task. Even if they have not been
 * granted explicitly.
 *
 * For example, having the first permission in this list implies also having
 * permissions to all the others:
 * 
 * * hris.manageothers.piu.approve
 * * hris.manageothers.piu
 * * hris.manageothers
 * * hris
 *
 * ###Roles
 * 
 * A role is a collection of tasks. Each user can be assigned one or more roles.
 * 
 * ###Super User
 *
 * There is a special role called `root` that automatically grants permission
 * to all tasks, even if they are not explicity assigned. This is intended only
 * for trusted administrators who know what they are doing.
 *
 * In addition, the user with `viewer_id` == 1 also has permissions to 
 * everything. This is the admin user who originally installed the system.
 *
 *
 * ###The Permissions Object (server side)
 *
 * @codestart
 * var permissions = require('permissions.js');
 * @codeend
 * This object provides an interface to the site's permissions system. For
 * permissions that relate to specific users, see `viewer.js` instead.
 *
 * For the client side, you may use the Models to access the various 
 * permissions related tables.
 * 
 */


var async = require('async');
var myDB = AD.Model.Datastore.DB;
var dbName = AD.Defaults.dbName;


// The models that provide some interface to the various permissions table.
var rolesModel = require(__appdevPath+'/modules/site/models/PermissionsRoles.js');
var tasksModel = require(__appdevPath+'/modules/site/models/PermissionsTasks.js');
var roleTasksModel = require(__appdevPath+'/modules/site/models/PermissionsRoleTasks.js');
var viewerRolesModel = require(__appdevPath+'/modules/site/models/PermissionsViewerRoles.js');


/**
 * @function createRole
 *
 * Creates one entry in the `site_perm_roles` table.
 *
 * @param {String} roleLabel
 * @param {Function} callback
 */
var createRole = function(roleLabel, callback)
{
    /*
    return rolesModel.create(
        { 'role_label': roleLabel },
        callback
    );
    */
    var sql = " \
        INSERT INTO "+dbName+".site_perm_roles \
        SET role_label = ? \
    ";
    return myDB.query(sql, [roleLabel], function(err, results, fields) {
        if (err) console.error(err);
        callback && callback();
    });
}
exports.createRole = createRole;


/**
 * @function createRoles
 *
 * Creates multiple entries in the `site_perm_roles` table.
 *
 * @param {Array} roleLabels
 * @param {Function} callback
 */
var createRoles = function(roleLabels, callback)
{
    return async.forEach(roleLabels, createRole, callback);
}
exports.createRoles = createRoles;


/**
 * @function createTask
 *
 * Creates one entry in the `site_perm_tasks` table.
 *
 * @param {String} taskKey
 * @param {String} taskLabel
 * @param {String} langCode
 * @param {Function} callback
 */
var createTask = function(taskKey, taskLabel, langCode, callback)
{
    /*
    return tasksModel.create(
        { 
            'task_key': taskKey,
            'task_label': taskLabel,
            'language_code': langCode
        },
        callback
    );
    */
    var sql = " \
        INSERT INTO "+dbName+".site_perm_tasks_data \
        (task_key) \
        VALUES (?) \
    ";
    return myDB.query(sql, [taskKey], function(err, results, fields) {
        
        var taskID = results.insertId;
        var sql = " \
            INSERT INTO "+dbName+".site_perm_tasks_trans \
            (task_id, task_label, language_code) \
            VALUES (?, ?, ?) \
        ";
        return myDB.query(sql, [taskID, taskLabel, langCode], function(err, results, fields) {
            if (err) console.error(err);
            callback && callback();
        });

    });


}
exports.createTask = createTask;


/**
 * @function createTasks
 *
 * Creates multiple entries in the `site_perm_tasks` table.
 *
 * @param {Array} taskObjects
 *     An array of objects, each with the following properties:
 *     - task_key
 *     - task_label
 *     - language_code
 * @param {Function} callback
 */
var createTasks = function(taskObjects, callback)
{
    return async.forEach(
        taskObjects, 
        function(data, callback) {
            return createTask(data.task_key, data.task_label, data.language_code, callback);
        },
        callback
    );
}
exports.createTasks = createTasks;



/**
 * @function assignTasksToRole
 *
 * Associates one or more existing tasks with an existing role.
 * 
 * @param {Array} taskKeys
 * @param {String} roleLabel
 * @param {Function} callback
 */
var assignTasksToRole = function(taskKeys, roleLabel, callback)
{
    return async.forEach(
        taskKeys, 
        // Execute this SQL for every task key
        function(taskKey, callback) {
            var sql = " \
                INSERT INTO "+dbName+".`site_perm_role_tasks` \
                (`role_id`, `task_id`) \
                VALUES ( \
                    (SELECT `role_id` FROM "+dbName+".`site_perm_roles` WHERE `role_label` = ? LIMIT 1), \
                    (SELECT `task_id` FROM "+dbName+".`site_perm_tasks_data` WHERE `task_key` = ? LIMIT 1) \
                ) \
            ";
            return myDB.query(sql, [roleLabel, taskKey], function(err, results, fields) {
                if (err) console.error(err);
                callback && callback();
            });
        },
        callback
    );
}
exports.assignTasksToRole = assignTasksToRole;



/**
 * @function unassignTasksFromRole
 *
 * Disassociates one or more existing tasks from an existing role.
 * 
 * @param {Array} taskKeys
 * @param {String} roleLabel
 * @param {Function} callback
 */
var unassignTasksFromRole = function(taskKeys, roleLabel, callback)
{
    return async.forEach(
        taskKeys, 
        // Execute this SQL for every task key
        function(taskKey, callback) {
            var sql = " \
                DELETE FROM `"+dbName+".site_perm_role_tasks` \
                WHERE `role_id` IN (SELECT `role_id` FROM "+dbName+".`site_perm_roles` WHERE `role_label` = ?) \
                AND `task_id` IN (SELECT `task_id` FROM "+dbName+".`site_perm_tasks_data` WHERE `task_key` = ?) \
            ";
            return myDB.query(sql, [roleLabel, taskKey], function(err, results, fields) {
                if (err) console.error(err);
                callback && callback();
            });
        },
        callback
    );
}
exports.unassignTasksFromRole = unassignTasksFromRole;


/**
 * @function roleExists
 *
 * Tests for the presence of a role by its role_label.
 * 
 * @param {String} roleLabel
 * @param {Function} presentCallback
 * @param {Function} absentCallback
 */
var roleExists = function(roleLabel, presentCallback, absentCallback)
{
    return rolesModel.findAll(
        { 'role_label': roleLabel },
        function(list) {
            if (list && list.length > 0) {
                presentCallback && presentCallback();
            } else {
                absentCallback && absentCallback();
            }
        },
        function(err) {
            absentCallback && absentCallback(err);
        }
    );
}
exports.roleExists = roleExists;


/**
 * @function taskExists
 *
 * Tests for the presence of a given task_key.
 * 
 * @param {String} taskKey
 * @param {Function} presentCallback
 * @param {Function} absentCallback
 */
var taskExists = function(taskKey, presentCallback, absentCallback)
{
    return tasksModel.findAll(
        { 'task_key': taskKey },
        function(list) {
            if (list && list.length > 0) {
                presentCallback && presentCallback();
            } else {
                absentCallback && absentCallback();
            }
        },
        function(err) {
            absentCallback && absentCallback(err);
        }
    );
}
exports.taskExists = taskExists;


/**
 * @function roleHasTask
 *
 * Tests whether a role is assigned a given task.
 * 
 * @param {String} roleLabel
 * @param {String} taskKey
 * @param {Function} presentCallback
 * @param {Function} absentCallback
 */
var roleHasTask = function(roleLabel, taskKey, presentCallback, absentCallback)
{
    return roleTasksModel.findAll(
        { 'role_label': roleLabel, 'task_key': taskKey },
        function(list) {
            if (list && list.length > 0) {
                presentCallback && presentCallback();
            } else {
                absentCallback && absentCallback();
            }
        },
        function(err) {
            absentCallback && absentCallback(err);
        }
    );
}
exports.roleHasTask = roleHasTask;


/**
 * @function deleteTask
 *
 * Deletes a task by its task_key.
 * 
 * @param {String} taskKey
 * @param {Function} callback
 */
var deleteTask = function(taskKey, callback)
{
    var sql = " \
        DELETE d, t \
        FROM "+dbName+".`site_perm_tasks_data` AS d \
        JOIN "+dbName+".`site_perm_tasks_trans` AS t \
            ON d.task_id = t.task_id \
        WHERE `task_key` = ? \
    ";
    return myDB.query(sql, [taskKey], function(err, results, fields) {
        if (err) console.error(err);
        callback && callback();
    });
}
exports.deleteTask = deleteTask;


/**
 * @function deleteTasks
 *
 * Deletes multiple tasks by their task_key values.
 * 
 * @param {Array} taskKeys
 * @param {Function} callback
 */
var deleteTasks = function(taskKeys, callback)
{
    return async.forEach(
        taskKeys,
        deleteTask,
        callback
    );
}
exports.deleteTasks = deleteTasks;


/**
 * @function deleteRole
 *
 * Deletes a role by its role_label.
 * 
 * @param {String} roleLabel
 * @param {Function} callback
 */
var deleteRole = function(roleLabel, callback)
{
    var sql = "DELETE FROM "+dbName+".`site_perm_roles` WHERE `role_label` = ?";
    return myDB.query(sql, [roleLabel], function(err, results, fields) {
        if (err) console.error(err);
        callback && callback();
    });
}
exports.deleteRole = deleteRole;


/**
 * @function deleteRoles
 *
 * Deletes multiple roles by their role_label values.
 * 
 * @param {Array} roleLabels
 * @param {Function} callback
 */
var deleteRoles = function(roleLabels, callback)
{
    return async.forEach(
        roleLabels,
        deleteRole,
        callback
    );
}
exports.deleteRoles = deleteRoles;


