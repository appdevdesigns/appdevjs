
// Global variable of the appDev base filesystem path
__appdevPath = __dirname;
__appdevPathNode = __appdevPath + '/server/node_modules/';
var http = require('http');
//var io = require('socket.io');
fs = require('fs');
path = require('path');
ejs = require(__appdevPathNode + 'ejs');
async = require(__appdevPathNode + 'async');




//// Our AppDev framework provided resources:
AD = {};
AD = require('./server/AD.js');

var $ = AD.jQuery;



// I'm lazy so create a local version of log() utilities.
var log = AD.Util.Log;
var logDump = AD.Util.LogDump;
var error = AD.Util.Error;



////
//// Create our Express Server
////


//Express server
express = require(__appdevPathNode + 'express');
var params = require(__appdevPathNode + 'express-params');
app = express.createServer();
params.extend(app);


//Session store
AD.SessionStore = new express.session.MemoryStore;

app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        store: AD.SessionStore,
        secret: AD.Defaults.sessionSecret
    }));
    app.use(app.router);
});

app.configure('development', function (){
    // Any file inside of [appdev]/web/... can be requested directly
    app.use(express.static(__dirname+'/web'));
    app.use(express.errorHandler({dumpExceptions:true, showStack:true}));

});

// jQuery Deferreds to be used within the main app.js routine will go here.
var DFDs = {
    'preModules': $.Deferred(),
    'modules': {
        'site': $.Deferred()
    },
    'preWidgets': $.Deferred(),
    'widgets': {}
};


////
////  Before any submodule gets their routing set
////  we should add some app.all() commands to add in a
////  viewer object to the req.viewer ... this allows us to
////  then determine viewer language/permission/etc...
////

// Our favicon.ico is named "favicon.png"
app.all('/favicon.ico', function(req, res) {
    res.sendfile(__dirname+'/web/favicon.png');
});


/*
// requests from our steal scripts will default to looking for modules
// under the steal root dir (/data/scripts).  So we need to take those
// and simply return them from our /modules directory:
app.all('/scripts/modules/*', function(req, res) {

    // *** SECURITY NOTE ***
    // This route allows anyone to fetch any file from the [appdev]/modules/...
    // tree. 'defaults.js' is safe from this. But still be careful not to leave
    // any sensitive info like passwords hard coded into files there.

    // Also note that there may be a symbolic link [appdev]/data/scripts/modules
    // that pretty much does the same thing as this.

    log(req,'   - App.js: catching scripts/modules/ reference and returning file.');
    loadFileDirect(req, res, 'modules');
});

*/

// for all /page/  requests, make sure we do our pageStack:
var pageStack = [
        AD.Defaults.setup,         // setup our data structures in req object
        AD.Steal.Auth.authenticate, // allow authentication as the special steal viewer
        AD.Auth.preAuthentication,
        AD.Auth.authenticatePage,  // make sure viewer is authenticated
        AD.Auth.switcheroo,     // allow viewer to impersonate another (developers)
        AD.Lang.loadLanguages   // any multilingual feature needs this
        ];


// for all /service/ or /query/ requests, make sure we do our serviceStack:
var serviceStack = [
        AD.Defaults.setup,
        AD.Auth.preAuthentication,
        AD.Auth.authenticateService,
        AD.Auth.switcheroo,
        AD.Lang.loadLanguages   // any multilingual feature needs this
        ];
AD.App.Page.serviceStack = serviceStack;

app.all('/*',  function (req, res, next) {

    log(req,' ');
    log(req,' ');
    log(req,'new request['+req.method+' '+req.originalUrl+']');

    next();

});


//// NOTE: due to dependencies, we declare this after AD.App.Page.serviceStack
////
AD.Resource = require('./server/resource_controller.js');


// workaround for incompatibility of Express with latest Node.js version
app.all('*', function(req, res, next) {
    var oldSendfile = res.sendfile;
    // Add a wrapper that initializes the `root` option if needed.
    res.sendfile = function(path, options, fn) {
        options = options || {}
        if (!options.root) {
            if (path[0] == '/') {
                options.root = '/';
            } else {
                options.root = './';
            }
        }
        return oldSendfile.apply(res, [path, options, fn]);
    };
    next();
});


// page:     any request that is attempting to load a full page.  These
//           requests need to redirect to the login page if the user's
//           authentication is not valid.
app.all('/page/*', pageStack, function(req, res, next) { log(req,'   - progressing through pageStack! /page/*'); next(); });


app.all('/api/*', serviceStack, function (req, res, next) { log(req,'   - progressing through serviceStack! /service/* '); next(); });


// service:  usually any of our ajax based requests will start with /
//           service/*.  These calls need to be able to conform to our
//           message formats that respond with success:true|false
app.all('/service/*', serviceStack, function (req, res, next) { log(req,'   - progressing through serviceStack! /service/* '); next(); });


app.all('/query/*', serviceStack, function (req, res, next) { log(req,'   - progressing through serviceStack! /query/* '); next(); });


// init:    this is a special request for the javascript initialization data
//          (used by steal) to load all the javascripts for a page.  These
//          routes are defined by the node_[interface].js files.
app.all('/init/*', serviceStack, function (req, res, next) { log(req,'   - progressing through serviceStack! /init/* '); next(); });


// labels:    these requests are for labels from a given path
app.all('/labels/*', serviceStack, function (req, res, next) { log(req,'   - progressing through serviceStack! /labels/*'); next(); });


// Serve up production files from each module's and each interface's production directory
app.get('/production/*', serviceStack, function(req, res, next) { log(req,'   - progressing through serviceStack! /production/* '); next(); });
app.get('/production/:module/:file', function(req, res, next) {
    res.sendfile(__appdevPath+'/modules/'+req.params.module+'/web/production/'+req.params.file);
});
app.get('/production/:module/:interface/:file', function(req, res, next) {
    res.sendfile(__appdevPath+'/modules/'+req.params.module+'/web/pages/'+req.params.interface+'/production/'+req.params.file);
});

// Creates the routes that are waiting for the express app to be created
AD.App.setApp(app);


// Set up any additional routes needed by the site authentication handler
if (AD.Auth.routes) {
    for (var routePath in AD.Auth.routes) {
        var routeHandler = AD.Auth.routes[routePath];
        app.all(routePath, routeHandler);
    }
}




// Lower level database interface for use within this local scope
var db = AD.Model.Datastore.DB;




/**
 * @attribute {object} listModules
 *
 * Global variable that keeps track of all modules currently active within
 * appDev. The object keys here should be all lowercase.
 */
listModules = {};


// We expect a Module to conform to this:
var moduleObjDefinition = {
        version:-1,     // v1 : which version of Module this is
        listModels:{},  // v1 : list of all Models defined by this Module
        listRoutes:{},  // { get: { 'page/route/foo': fn, ... }, post: { 'service/route/bar': [array, fn], ... }, delete: { ... }, ... }
        destructor: null
};


/**
 * @function registerModule
 * @param {string} key
 * @param {object} module
 *
 * Take the raw module object and store it in our list of modules.
 */
var registerModule = function(key, module)
{
    // we create our own interface object and make sure the given module
    // conforms to our expected interface:

    for (var a in moduleObjDefinition) {

        if (typeof module[a] == 'undefined') {
            module[a] = moduleObjDefinition[a];
        }

    }

    //// We can now make sure we support older versions of our Models.
    //// (once we have some)
//    if (module.version >= 1) {
//
//    }


    listModules[key] = module;


    // This will initialize the module's routes
    var initModuleRoutes = function()
    {
        // Each module should have its own `listRoutes` which contains all
        // the routes used by its interfaces.
        // Take the module's routes and pass them on to our Express app.
        for (var routeMethod in module.listRoutes) {
            for (var routePath in module.listRoutes[routeMethod]) {
                // First remove any prior routes that were assigned to the
                // same verb+path combo.
                app.routes.lookup(routeMethod, routePath).remove();

                var routeCallback = module.listRoutes[routeMethod][routePath];
                if (typeof routeCallback == 'function') {
                    // callback is an actual function
                    app[routeMethod](routePath, routeCallback);
                }
                else {
                    // "routeCallback" is an array of function arguments
                    var params = [routePath].concat(routeCallback);
                    app[routeMethod].apply(app, params);
                }
            }
        }

        // Resolve this module's jQuery Deferred
        if (DFDs.modules[key]) {
            DFDs.modules[key].resolve();
        }
    }


    // Wait for the module to fully load before initializing the routes.
    if (module.initDFD) {
        $.when(module.initDFD).then(initModuleRoutes);
    }
    else {
        var initDFD = module.initialize();
        $.when(initDFD).then(initModuleRoutes);
    }
}




//// Handle server side notifications for disabling and enabling modules.


// This will be assigned to any routes that get disabled during runtime.
var disabledRouteHandler = function(req, res, next)
{
    res.send('This page is currently not available. Please try again later.');
}


// Module disable
//  - event name: "ad.module.disable"
//  - event data: {
//      key: {String} case insensitive key
//      name: {String} (optional) case sensitive name
//      path: {String} (optional) module location in filesystem
//      }
AD.Comm.Notification.subscribe('ad.module.disable', function(event, data) {
    var key = data['key'].toLowerCase(); // case insensitive
    if (key == 'site') return;

    // Can only disable modules if they are currently enabled
    if (listModules[key]) {
        var module = listModules[key];
        // Remove this module's routes from the Express server
        for (var routeVerb in module.listRoutes) {
            for (var routePath in module.listRoutes[routeVerb]) {
                app.routes.lookup(routeVerb, routePath).remove();
                app[routeVerb](routePath, disabledRouteHandler);
            }
        }

        // Call the module's destructor
        if (module.destructor) {
            module.destructor();
        }

        // Remove the module from the Node.js code cache
        db.query(
            "SELECT * FROM "+AD.Defaults.dbName+".site_system WHERE system_type = ? AND system_name LIKE ?",
            [ 'module', key ],
            function(err, results, fields) {
                if (err) {
                    console.error(err);
                }
                else if (results[0]) {
                    var moduleName = results[0]['system_name']; // case sensitive
                    var modulePath = results[0]['system_path'] + '/node_' + moduleName + '.js';
                    delete require.cache[modulePath];
                }
            }
        );

        // Clear the module's components from the Node.js code cache
        for (var i=0; i<listModules[key].listIncludedFiles.length; i++) {
            var componentPath = listModules[key].listIncludedFiles[i];
            //if (!require.cache[componentPath]) {
            //    console.log('not found in cache: ' + componentPath);
            //} else {
            //    console.log('removing from cache: ' + componentPath);
            //}
            delete require.cache[componentPath];
        }

        delete listModules[key];
    }
});


// Module enable
//  - event name: "ad.module.enable"
//  - event data: {
//      key: {String} case insensitive key
//      name: {String} (optional) case sensitive name
//      path: {String} (optional) module location in filesystem
//      }
AD.Comm.Notification.subscribe('ad.module.enable', function(event, data) {
    var key = data['key'].toLowerCase(); // case insensitive
    if (key == 'site') return;

    var doEnable = function(moduleName, modulePath) {
        if (fs.existsSync(modulePath)) {
            var moduleObj = require(modulePath + '/def_' + moduleName + '.js');
            registerModule(moduleName.toLowerCase(), moduleObj);
        }
    }

    // Can only enable modules that are not already enabled
    if (!listModules[key]) {
        // Module case-sensitive name and path can be provided...
        if (data['name'] && data['path']) {
            doEnable(data['name'], data['path']);
            return;
        }

        // ...otherwise we have to get it from the DB.
        db.query(
            "SELECT * FROM "+AD.Defaults.dbName+".site_system WHERE system_type = ? AND system_name LIKE ?",
            [ 'module', key ],
            function(err, results, fields) {
                if (err) {
                    console.error(err);
                }
                else if (results[0]) {
                    var moduleName = results[0]['system_name']; // case sensitive
                    var modulePath = results[0]['system_path'];
                    doEnable(moduleName, modulePath);
                }
            }
        );
        return;
    }
});



////----------------------------------------------------------------------
////  Load our default 'site' module
////
var sitePath = './modules/site/def_site.js';
log('  ');
log('::: Loading Site Module :::');
log('   - loading ['+sitePath+']');
if (fs.existsSync(sitePath)) {
log('::: path existed:::');
    var moduleObj = require(sitePath);
    registerModule('site', moduleObj);
}


////----------------------------------------------------------------------
//// Load the rest of our enabled modules now
////
//// Each module is responsible for defining any routes for their content
////
//// The modules are defined as a directory in the /root/modules/ folder.
////
db.query(
    " \
        SELECT * \
        FROM "+AD.Defaults.dbName+".site_system \
        WHERE system_type = ? \
        AND system_name != ? \
    ",
    ['module', 'site'],
    function(err, values, fields) {
        if (err) {
            console.error(err);
            return;
        }

        for (var i=0; i<values.length; i++) {
            var thisName = values[i]['system_name'];
            var thisPath = values[i]['system_path'];
            var thisKey = thisName.toLowerCase();
            log('   - loading module ['+thisPath+']');

            DFDs.modules[thisKey] = $.Deferred();

            AD.Comm.Notification.publish('ad.module.enable', {
                'key': thisKey,
                'name': thisName,
                'path': thisPath
            });
        }

        DFDs.preModules.resolve();
    }
);



/**
 * @attribute {object} ListWidgets
 *
 * Global variable that keeps track of all widgets currently active
 * within appDev. The object keys should be all lowercase.
 */
ListWidgets = {};


////----------------------------------------------------------------------
//// Load our AppDev/widgets here:
////
//// These entries tell us of any dependency information required by a
//// site widget.
////

// This does the actual widget activation
AD.Comm.Notification.subscribe('ad.widget.enable', function(event, data) {

    var widgetPath = data.path + '/dep_' + data.name + '.js';
    if (fs.existsSync(widgetPath)) {
        log('   - loading widget [ '+data.path+']');
        ListWidgets[data.name.toLowerCase()] = require(widgetPath);
    }
    else {
        log('   - widget path not found [' + widgetPath + ']');
    }

    if (DFDs.widgets[data.key]) {
        DFDs.widgets[data.key].resolve();
    }

});

// Load all enabled widgets and queue them for activation
db.query(
    " \
        SELECT * \
        FROM "+AD.Defaults.dbName+".site_system \
        WHERE system_type = ? \
    ",
    ['widget'],
    function(err, values, fields) {
        if (err) {
            console.error(err);
            return;
        }

        log('  ');
        log('::: Loading Site Widgets :::');

        for (var i=0; i<values.length; i++) {
            var thisName = values[i]['system_name'];
            var thisPath = values[i]['system_path'];
            var thisKey = thisName.toLowerCase();

            DFDs.widgets[thisKey] = $.Deferred();

            AD.Comm.Notification.publish('ad.widget.enable', {
                'key': thisKey,
                'name': thisName,
                'path': thisPath
            });
        }

        DFDs.preWidgets.resolve();
    }
);





////----------------------------------------------------------------------
//// setup generic module-data requests:
////----------------------------------------------------------------------


//// A common handler for our Model Operations:
var appModelHandler = function (req, res, next, p ) {

    if (canHandle(p.moduleKey, p.modelKey)) {

        // handle request here
        log(req,'   - QUERY: a['+p.actionKey+'] app['+p.moduleKey+'] + db['+p.modelKey+']');

        var id = req.params.id || -1;

        var params = {
            req: req,
            id:id,
            callback:function (err, data) {

                if (err) {
                    logDump(req, '   *** a['+p.actionKey+'] error ' );
                    AD.Comm.Service.sendError(req, res, {
                        success:false,
                        errorID:100,
                        errorMSG:err
                        }, AD.Const.HTTP.ERROR_NOTFOUND); // 404: they are asking for an action that isn't here (?)

                } else {
                    logDump(req, '     a['+p.actionKey+'] success :: end ' );
                    AD.Comm.Service.sendSuccess(req, res, data);
                }
            }

        }

        var model = listModules[p.moduleKey].listModels[p.modelKey];
        if (typeof model.hasPermission != 'function') {
            model[p.actionKey](params);
        }
        // Permissions checking for model access.
        // The basic procedure is defined in model_SQL.js, but finer grained
        // checking may be implemented in the individual models themselves.
        else if (model.hasPermission(req)) {
            model[p.actionKey](params);
        } else {
            logDump(req,'   *** No permission to ['+p.actionKey+'] request for app['+p.moduleKey+'] db['+p.modelKey+'] ***');
            AD.Comm.Service.sendError(req, res, {
            	errorMSG: "Insufficient permissions"
            }, AD.Const.HTTP.ERROR_FORBIDDEN); // 403: authorized but not allowed
        }

    } else {

        log(req,'   *** Not able to handle a['+p.actionKey+'] request for app['+p.moduleKey+'] db['+p.modelKey+'] ***');
        log(req,'    --- listModules ---');
        logDump(req,listModules);
        next();

    }

}



//// Incoming Requests for Create/FindAll actions have this format:
// /query/create/:module/:model.:format?
// /query/findall/:module/:model.:format?
app.all('/query/:action/:module/:model.:format?',  serviceStack, function( req, res, next) {

    var params = {};
    params.actionKey = req.params.action.toLowerCase()+'FromReq';
    params.moduleKey = req.params.module.toLowerCase();
    params.modelKey = req.params.model.toLowerCase();

    appModelHandler(req, res, next, params );

});



//// Incoming Requests for findone/update/destroy actions have this format:
// /query/findone/:module/:model/:id.:format?
// /query/update/:module/:model/:id.:format?
// /query/destroy/:module/:model/:id.:format?
app.all('/query/:action/:module/:model/:id.:format?', serviceStack, function( req, res, next) {

    var params = {};
    params.actionKey = req.params.action.toLowerCase()+'FromReq';
    params.moduleKey = req.params.module.toLowerCase();
    params.modelKey = req.params.model.toLowerCase();

    appModelHandler(req, res, next, params );

});





//------------------------------------------------------------------------
var canHandle = function( moduleKey, modelKey ) {
    //  determine if we can handle the data request given the
    //  module and model keys
    //

    var canHandle = false;

    if (typeof listModules[moduleKey] != 'undefined') {

        if (typeof listModules[moduleKey].listModels[modelKey] != 'undefined') {

            canHandle = true;
        }
    }

    return canHandle;

}




//------------------------------------------------------------------------
var loadFileDirect = function(req, res, dirName) {
//  This routine will return the contents of a file based upon
//  the request/dirName.  This is usually for the files based in our
//  root directory that aren't in our default data path: /data/...
//
//  In format:  /dirName/path/to/file.js
//              /dirName/path/to/file.js?additonal/params/here
//

	var parts = req.url.split('/'+dirName+'/');
	var urlParts = parts[1].split('?');
	var path = urlParts[0]; // without any additional params

    // Express may already be filtering out ".." from the url.
    // But just to be on the safe side...

    var filePath = __appdevPath+'/'+dirName+'/'+path;

    if (filePath.indexOf('../') >= 0) {
        // Requested path contains "../"
        // Don't allow breaking out of the AppDev base path.
        fs.realpath(filePath, function(resolvedPath) {
            if (resolvedPath.indexOf(__appdevPath) == 0) {
                // Still within base path. Safe.
                log(req, '   - returningFile['+dirName+'/'+path+']');
                log(req, '   - ".." was used');
                logDump(req);
                res.sendfile(filePath);
            }
            else {
                // HaX0r alert!!
                log(req, '  - requested file is outside of AppDev root!');
                log(req, '  - ' + filePath);
                log(req, '  - ' + resolvedPath);
                logDump(req);
                res.end('oops');
            }
        });
    }
    else {
        log(req, '   - returningFile['+dirName+'/'+path+']');
        //log(req, 'requested File Path['+__dirname+'/'+dirName+'/'+path+']');
        //logDump(req, '- done');
        res.sendfile(filePath);
    }

	/*
// explore a non blocking method:
// not sure if sendfile() is blocking or not.  initial tests with steal seem like
// i'm getting sequential return of files, rather than parallel returns ... steal.js issue or
// express?

// JC:
// Express' sendfile() seems to be asynchronous. I traced it to
// connect.static.send(), which uses fs.createReadStream().
// But even though it is non-blocking, there is still the bottleneck of
// the OS disk I/O. Maybe files from the same server can only truly be served
// up in parallel if it has a RAID set up.

var fs = require('fs');
var stream = fs.createWriteStream("my_file.txt");
stream.once('open', function(fd) {
  stream.write("My first row\n");
  stream.write("My second row\n");
});

	 */

}




//// Start the messaging system
AD.Comm.Dispatch.attach();


// Wait for all the modules and widgets to fully load
$.when(DFDs.preModules, DFDs.preWidgets).then(function() {

    // Convert the DFDs sub-objects into an array
    var subDFDs = [];
    for (var i in DFDs.modules) {
        subDFDs.push(DFDs.modules[i]);
    }
    for (var i in DFDs.widgets) {
        subDFDs.push(DFDs.widgets[i]);
    }

    // Apply the array contents as arguments to the $.when() function
    $.when.apply($, subDFDs).then(function() {

        //// Now start Listening on our Port:
        app.listen(AD.Defaults.sitePort);
        log( '');
        log( '============================================');
        log( 'express server listening on port['+AD.Defaults.sitePort+']');
        AD.Comm.Notification.publish('site.online', {});

        if (process.send) {
            process.send('listening');
          }
    	
    });
});

/*
// Disable socket.io because it conflicts with the Faye websocket implementation used by AD.Comm.Dispatch
// socket.io
var socket = io.listen(app);
socket.on('connection', function(client){
  // new client is here!
  client.on('message', function(){  })
  client.on('disconnect', function(){ })
});
*/

app.all('/test', function(req, res, next) {
	
	res.setHeader('Content-Type', 'text/plain');
    res.end('Test');

    log('sent test');
    //console.log(jQuery.fn.trigger);
    //console.log(jQuery);
    //global.jQuery();
    //.trigger('test', {});
});
