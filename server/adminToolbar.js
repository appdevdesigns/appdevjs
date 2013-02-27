/**
 * @parent AD_Server
 * @class AD_Server.AdminToolbar
 * ###Admin Toolbar
 *
 * Server side code for the Admin Toolbar.
 * 
 * This controls which users will see the admin toolbar, and what toolbar
 * components will appear.
 *
 * Admin Toolbar modular components will be loaded from:
 * "[appdev]/modules/sites/adminToolbar/..."
 *
 */



/**
 * Used internally by getToolbarData().
 */
var adminToolbarCache = {
/*
    "guid_1": {
        timestamp: 1234,
        data: [ ... ],
        drivers: [ ... ]
    },
    "guid_2": {
        timestamp: 2345,
        data: [ ... ],
        drivers: [ ... ]
    },
    ...
*/
};

// Garbage collection for toolbar cache
// once every 60 minutes
setInterval(function() {
    //console.log('\nAdmin Toolbar Cache - garbage collection\n');
    var now = process.uptime();
    for (var guid in adminToolbarCache) {
        var timestamp = adminToolbarCache[guid].timestamp;
        if (now - timestamp > 60 * 60) {
            delete adminToolbarCache[guid];
        }
    }
}, 1000 * 60 * 60);


/**
 * @function clearCache
 *
 * Reset the cache and force a reload of the toolbar data the next time it is
 * requested.
 */
exports.clearCache = function()
{
    adminToolbarCache = {};
}


/**
 * @function createRoutes
 *
 * This function will be called by the `site` module to register routes 
 * with Express.
 *
 * @param {ExpressServer} app
 * @param {Function} callback
 */
exports.createRoutes = function(app, callback)
{
    // This serves up all static client side content within the "data"
    // subdirectories of each toolbar sub-module.
    // 
    // Example:
    //   GET /adminToolbar/core/toolbar.css
    //   actual file --> [appdev]/modules/sites/adminToolbar/core/data/toolbar.css
    //
    app.get('/adminToolbar/:tool/*', function(req, res) {
        var toolFolder = req.params.tool;
        var filePath = __appdevPath+'/modules/site/web/adminToolbar/'+toolFolder+'/data/'+req.params[0];
        res.sendfile(filePath);
    });
    
    // Allow toolbar sub-modules to register their own routes.
    // (good or bad idea?)
    getToolDrivers(function(err, drivers) {
        if (!err) {
            for (var i=0; i<drivers.length; i++) {
                var driver = drivers[i];
                if (typeof driver.createRoutes == 'function') {
                    driver.createRoutes(app);
                }
            }
        }
        callback && callback(err);
    });
    
}


/**
 * @function includeDependencies
 *
 * Add the required CSS and Javascript files to the req.aRAD object so they
 * will be included when the page renders.
 *
 * @param {HttpRequest} req
 * @param {Function} callback
 */
exports.includeDependencies = function(req, callback)
{
    var isBlankTheme = (req.aRAD.response.themePageStyle == 'empty');
    if (req.aRAD.viewer.hasRole('admin') && !isBlankTheme) {
        // Get toolbar's modular components
        getToolbarData(req, function(err, req, toolbarItems, toolbarDrivers) {
            // For "Steal" requests
            if (req.url.indexOf('/init/') == 0) {
                // Javascript files to add to the Steal dependency list.
                // These scripts will run after jQuery is loaded.
                AD.App.Page.addJavascripts(req, [
                    '//bootstrap/js/bootstrap-tooltip.js',
                    '<then>',
                    '/adminToolbar/core/adminToolbar.js'
                ]);
                // Add component JS dependencies
                for (var i=0; i<toolbarDrivers.length; i++) {
                    var tool = toolbarDrivers[i];
                    if (typeof tool.listJavascripts == 'object' && tool.listJavascripts.length) {
                        AD.App.Page.addJavascripts(req, tool.listJavascripts);
                    }
                }
            }
            // For normal HTML page requests
            else {
                // Add main CSS dependencies
                AD.App.Page.addCSS(req, [
                    '/adminToolbar/core/toolbar.css'
                ]);
                // Add component CSS dependencies
                for (var i=0; i<toolbarDrivers.length; i++) {
                    var tool = toolbarDrivers[i];
                    if (typeof tool.listCSS == 'object' && tool.listCSS.length) {
                        AD.App.Page.addCSS(req, tool.listCSS);
                    }
                }
                // Javascript files to add to the header of the HTML page.
                // These scripts will run before jQuery is loaded.
                AD.App.Page.addJavascripts(req, [
                    // ...
                ]);
            }
            callback()
        });
    }
    
    // No admin access, so no toolbar dependencies
    else {
        callback();
    }
}


/**
 * @function includeHTML
 *
 * Add the toolbar HTML to the req.aRAD object so it will be included when the
 * page renders.
 *
 * @param {HttpRequest} req
 * @param {Function} callback
 */
exports.includeHTML = function(req, callback)
{
    var isBlankTheme = (req.aRAD.response.themePageStyle == 'empty');
    if (req.aRAD.viewer.hasRole('admin') && !isBlankTheme) {
        
        // This function is used to bring the `req` object
        // into the waterfall() below.
        var processReq = function(next) {
            next(null, req);
        }
        
        // Call all these functions in series, with each one
        // passing arguments to the next.
        async.waterfall([
            processReq,
            getToolbarData,
            renderHTML
        ], function(err) {
        
            if (err) {
                req.aRAD.response.adminToolbar = 
                    "<!-- admin toolbar error: " + err.message + " -->\n";
            }
            
            callback();
        });

    } 
    
    // No admin privilleges, so skip the toolbar.
    else {
        callback();
    }
}


/**
 * @function getToolDrivers
 *
 * Fetches the list of *ALL* toolbar submodule drivers, without regard to the 
 * current viewer's identity. In fact, a current viewer is not required for 
 * this.
 * This is an internal function.
 * 
 * @param {Function} callback
 *      function(err, drivers)
 */
var getToolDrivers = function(callback)
{
    // Process every subdirectory in the adminToolbar folder.
    // Look for folders containing a "tool.js" file, which defines a tool
    // submodule for the admin toolbar.
    fs.readdir(__appdevPath+'/modules/site/web/adminToolbar', function(err, paths) {
        if (err) {
            // Could not read the directory
            console.error(err);
            return callback(err);
        }

        var drivers = [];
        async.forEach(paths, 
            //// Do this for each path...
            function(pathName, next) {
                var toolFile = __appdevPath+'/modules/site/web/adminToolbar/'+pathName+'/tool.js';
                // Node.js API changed in recent versions. Use `fs` instead of `path`.
                var exists = fs.exists;
                exists(toolFile, function(exists) {
                    if (exists) {
                        var toolDriver = require(toolFile);
                        toolDriver.path = pathName;
                        toolDriver.fullPath = toolFile;
                        drivers.push(toolDriver);
                    }
                    next();
                });
            },
            //// ...after all paths done
            function() {
                callback(null, drivers);
            }
        );
    });
}


/**
 * @function getToolbarData
 *
 * Assemble the data of the toolbar items that are relevant to the current user.
 * This is an internal function.
 *
 * @param {HttpRequest} req
 * @param {Function} next
 *      next(err, req, toolbarItems, toolbarDrivers)
 */
var getToolbarData = function(req, next)
{
    var $ = AD.jQuery;
    var dfd = $.Deferred();
    var viewerGUID = req.aRAD.viewer['viewer_globalUserID'];
    var toolbarItems = [];
    var toolbarDrivers = [];

    // Use the cache if available
    if (adminToolbarCache[viewerGUID]) {
        if (adminToolbarCache[viewerGUID]['data']) {
            // Cached data is now available.
            toolbarItems = adminToolbarCache[viewerGUID]['data'];
            toolbarDrivers = adminToolbarCache[viewerGUID]['drivers'];
            next(null, req, toolbarItems, toolbarDrivers);
        }
        else {
            // Cached data is currently being generated by a parallel request.
            // Wait for it to finish...
            dfd = adminToolbarCache[viewerGUID];
            $.when(dfd).then(function() {
                // ...then return the cached data.
                toolbarItems = adminToolbarCache[viewerGUID]['data'];
                toolbarDrivers = adminToolbarCache[viewerGUID]['drivers'];
                next(null, req, toolbarItems, toolbarDrivers);
            });
        }
        return;
    } 
    
    // Flag this viewerGUID so any concurrent requests will know to wait
    // for the cached data to finish.
    adminToolbarCache[viewerGUID] = dfd;
    
    getToolDrivers(function(err, drivers) {
        if (err) {
            dfd.fail();
            next(err);
        }
        
        async.forEach (drivers, function(toolDriver, callback) {
            var hasPermission = true;
            if (typeof toolDriver.hasPermissions == 'function') {
                // Allow each tool to determine if they should be 
                // visible to the current viewer.
                hasPermission = toolDriver.hasPermissions(req);
            }
            if (hasPermission) {
                // Tool driver was found, and the current viewer has 
                // permissions to use this tool.
                toolbarDrivers.push(toolDriver);
                if (typeof toolDriver.toolDefinition == 'function') {
                    // Dynamic async tool definition based on the `req`
                    toolDriver.toolDefinition(req, function(definition) {
                        definition.fullPath = toolDriver.fullPath;
                        definition.path = toolDriver.path;
                        toolbarItems.push(definition);
                        callback();
                    });
                    return;
                } else if (typeof toolDriver.toolDefinition == 'object') {
                    // Static tool definition
                    var tool = toolDriver.toolDefinition;
                    tool.fullPath = toolDriver.fullPath;
                    tool.path = toolDriver.path;
                    toolbarItems.push(tool);
                    return callback();
                }
            }
            // No permissions
            return callback();
        },
        //// After all toolbar items loaded
        function() {
            var usedNames = [];
            // Validate the tool properties
            for (var i=0; i<toolbarItems.length; i++) {
                var tool = toolbarItems[i];
                // Make sure `name` property is valid and unique
                if (!tool.name || (usedNames.indexOf[tool.name] >= 0)) { 
                    tool.name = tool.path;
                }
                usedNames.push(tool.name);
                // Add default values in case the tool itself missed anything
                tool.quickMenuHTML = tool.quickMenuHTML || tool.name + ' QuickMenu';
                tool.workAreaHTML = tool.workAreaHTML || tool.name + ' WorkArea';
                tool.image = tool.image || 'about:blank';
            }
            // Proceed to next step
            next(null, req, toolbarItems, toolbarDrivers);
            
            // Save results to cache
            adminToolbarCache[viewerGUID] = {
                timestamp: process.uptime(),
                data: toolbarItems,
                drivers: toolbarDrivers
            }
            dfd.resolve();
        });
    });
    
}


/**
 * @function renderHTML
 *
 * Generate the overall HTML of the toolbar.
 * This is an internal function.
 *
 * @param {HttpRequest} req
 * @param {Array} toolbarItems
 * @param {Array} toolbarDrivers
 * @param {Function} next
 */
var renderHTML = function(req, toolbarItems, toolbarDrivers, next)
{
    ejs.renderFile(
        __appdevPath+'/server/views/adminToolbar.ejs',
        { locals: {
            title: 'adminToolbar',
            gearImage: '/adminToolbar/core/images/small-gear.png',
            toolbar: toolbarItems
        } },
        function(err, html) {
            req.aRAD.response.adminToolbar = html;
            next(err);
        }
    );
}


/**
 * @function loadLabels
 */
exports.loadLabels = function(req, res, next)
{
    if (req.aRAD.viewer.hasRole('admin')) {
        AD.Lang.loadLabelsByPath(req, res, next, '/page/site/adminToolbar');
    } else {
        next();
    }
}