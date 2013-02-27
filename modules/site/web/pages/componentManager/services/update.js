/**
 * @class update
 * @parent componentManager
 * 
 * ###Service: Update Component Manager
 *
 * This service registers new modules, themes, and widgets. Or uninstalls
 * existing ones.
 *
 * It expects data POSTed from the /page/site/componentManager interface:
 *
 * @codestart
 * {
 *   "modules": [
 *      { "name": "foo", "installed": 1 },
 *      { "name": "bar", "installed": 0 },
 *      ...
 *   ],
 *   "themes": [
 *      ...
 *   ],
 *   "widgets": [
 *      ...
 *   ]
 * }
 * @codeend
 */


var installer = require(__appdevPath + '/server/installerTools.js');

var db = AD.Model.Datastore.DB;



////---------------------------------------------------------------------
/**
 * @function hasPermission
 *
 * Verifies that the current viewer has permission to perform this action.
 */
var hasPermission = function(req, res, next) 
{
    // if viewer has 'site.admin.registerSystem' action
        next();
    // else
        // var errorData = { message:'No Permission' }
        // ResponseService.sendError(req, res, errorData );
    // end if

}


////---------------------------------------------------------------------
/**
 * @function initData
 *
 * Initializes the data needed to respond to this service request.
 */
var initData = function(req, res, next) 
{
    //// Gather the required data for this operation.
    
    req.aRAD.installGroup = [];
    req.aRAD.uninstallGroup = [];
    
    // Get the submitted modules, themes, and widgets
    var submitState = {
        'module': req.body['modules'],
        'theme': req.body['themes'],
        'widget': req.body['widgets']
    };
    
    // Combine them into a single array
    var all = [];
    for (var systemType in submitState) {
        var systems = submitState[systemType];
        for (var i=0; i<systems.length; i++) {
            // Widgets are always installed
            if (systemType == 'widget') {
                systems[i]['installed'] = 1;
            }
            
            // "Site" module is always installed
            if (systemType == 'module' && systems[i]['name'] == 'site') {
                systems[i]['installed'] = 1;
            }
            
            all.push({
                type: systemType,
                name: systems[i]['name'],
                installed: systems[i]['installed']
            });
        }
    }
    submitState['all'] = all;
    
    
    // Get a fresh list of the actual systems present in the framework
    installer.findSystems(function(all, modules, themes, widgets) {
        
        var actualState = {
            'all': all,
            'module': modules,
            'theme': themes,
            'widget': widgets
        };
        
        var numThemes = themes.length;
                
        // Determine whether any old systems need to be uninstalled
        for (var i=0; i<actualState.all.length; i++) {
            var system = actualState.all[i];
            // Is the system currently already installed?
            if (parseInt(system['installed']) == 1) {
                var type = system['type'];
                var name = system['name'];

                // If there is only one theme left, then don't try to 
                // uninstall it.
                if (type == 'theme' && numThemes <= 1) {
                    continue;
                }
                
                // Search the submitted list for a match
                for (var j=0; j<submitState[type].length; j++) {
                    if (submitState[type][j]['name'] == name) {
                        if (parseInt(submitState[type][j]['installed']) != 1) {
                            // System is currently installed, but submitted
                            // as "uninstalled".
                            // Queue for uninstallation.
                            req.aRAD.uninstallGroup.push(system);
                            if (type == 'theme') {
                                numThemes -= 1;
                            }
                        }
                        break;
                    }
                }
            }
        }
        
        
        // Determine whether any new systems need to be installed
        for (var i=0; i<submitState.all.length; i++) {
            var system = submitState.all[i];
            // Is the system submitted as "installed"?
            if (parseInt(system['installed']) == 1) {
                var type = system['type'];
                var name = system['name'];
                // Search the actual list for a match
                for (var j=0; j<actualState[type].length; j++) {
                    if (actualState[type][j]['name'] == name) {
                        if (parseInt(actualState[type][j]['installed']) != 1) {
                            // System is not yet installed, but submitted
                            // as "installed".
                            // Queue for installation.
                            req.aRAD.installGroup.push(actualState[type][j]);
                        }
                        break;
                    }
                }
            }
        }
        
        next();
    
    });
    
}


////---------------------------------------------------------------------
/**
 * @function doInstall
 *
 * Adds new components to the system registry.
 */
var doInstall = function(req, res, next) 
{
    
    async.forEach(req.aRAD.installGroup, function(sysObj, callback) {
        // Install new labels, but don't update existing labels
        installer.installLabels(sysObj.path, function() {
            // Run the 'initModule.js' script if available
            // and register the module in the DB.
            installer.initSystem(sysObj, callback);
        }, true);
    }, next);
    
}



////---------------------------------------------------------------------
/**
 * @function doUninstall
 *
 * Removes old components from the system registry.
 */
var doUninstall = function(req, res, next) 
{
    
    // For each item in the uninstall group,
    // run its 'removeModule.js' scripts,
    // and deregister it from the DB.
    
    
    async.forEach(req.aRAD.uninstallGroup, installer.removeSystem, next);
    
}



//// perform these actions in sequence:
var moduleStack = [
    hasPermission,
    initData,
    doInstall,
    doUninstall
];


exports.setup = function(app) {

    ////---------------------------------------------------------------------
    /**
     * @attribute service_site_componentManager_update
     *
     * ###route: /service/site/componentManager/update
     */
    app.post('/service/site/componentManager/update', moduleStack, 
    function(req, res, next) 
    {
        
        // by the time we enter this, we should have done all our steps
        // for this operation.
        AD.Util.LogDump(req,'  - finished');
        
        // send a success message
        AD.Comm.Service.sendSuccess(req, res, {message:'Update completed!' } );
        
    });

}