/**
 * @class AD_Server.App.Module
 * @parent AD_Server.App
 * 
 * A class that provides utility functions for Module objects to perform 
 * their common tasks. The main exported object in every "node_[xxxx].js" 
 * module source file should instantiate from this class.
 *
 * The module automatically keeps track of any HTTP routes that it provides.
 * So if the module gets turned off by the admin, all its routes will be
 * disabled gracefully. For this to work, use the provided `this.app` object
 * when initializing routes, and not the global `app` object. See the 
 * `app.get()` function documentation for more information.
 *
 * Similarly, all .js files that are loaded in the module are tracked. They
 * will be cleared from the global code cache when the module is turned off.
 * Use `this.require()` instead of the global `require()` to allow proper
 * tracking.
 *
 * If any other resources are loaded by the module, they should be released
 * manually in the optional `destructor()` function of the implemented module.
 */


var log = AD.Util.Log;
var error = AD.Util.Error;
var relativePathFromRoot = AD.App.Page.relativePathFromRoot;
var relativePath = AD.App.Page.relativePath;
var $ = AD.jQuery;
var fs = require('fs');

function Module( opt ) {

    this.nameModule     = '';
    this.pathModule     = '';
    
    this.interfaces     = {};
    this.pathInterfaces = '';
    
    this.listModels   = {};      // list of model Objects 
    this.listModelPaths   = [];  // returned to client to load
    this.pathModels = '';
    
    this.listServices = {};
    this.pathServices = '';
    this.serviceLoadOrder = [];

    this.moduleScripts   = [];
    this.pathModuleScripts = '';
    
    this.moduleCSS = [];		// list of common .css files for this module
    this.pathModuleCSS = '';	// path to our shared .css files
    
    this.listRoutes = {}; // { get: { ... }, post: { ... }, ... }
    this.app = new FakeApp(this); // mimics the Express `app` object
    this.initDFD = null;
    
    // This will store a list of all paths that get automatically included
    // by the module.
    this.listIncludedFiles = [];
    
    
    for(var i in opt) {
        if (i != 'hub') this[i] = opt[i];
    }
    
    this.pathModule = AD.Util.String.normalizePath(this.pathModule);
    
    var hubOpt = opt.hub || {};
    
    // create a private notification hub
    this.hub = AD.Comm.Notification.sandbox(hubOpt); 
    
    // create a private dispatcher
    this.dispatch = AD.Comm.Dispatch.sandbox(this.nameModule);
    
    
    if (this.nameModule == '') {
        console.log( ' *** Error: no moduleName provided ['+this.pathInterfaces+']');
        throw 'Rework child object to include the moduleName!!!';
    }
    if (this.pathModule == '') {
        console.log(' *** Error: no pathModule provided ');
        throw 'Rework child object to include the pathModule!!!';
    }
    
    
    this.type = 'ad.module';
    
};
//util.inherits(Client, EventEmitter);
module.exports = Module;



/**
 * @function app.get
 * Allows a module to register a route with the appDev framework. Works with
 * all common HTTP verb, just use the verb name in place of `get`.
 *
 * Usage: 
 * @codestart
 * this.app.get('/page/foo/bar', function(req, res, next) { ... });
 * this.app.post('/service/foo/:bar', function(req, res, next) { ... });
 * this.app.put('/service/a/b/c', [fn, fn, fn], function(req, res, next) { ... });
 * @codeend
 *
 * Basically just add `this.` in front of your normal global `app` call,
 * when you are within the scope of a `Module` object.
 *
 * The registered route will be stored in the Module's `listRoutes` object,
 * and read by the real Express `app` object there.
 */
 
var FakeApp = function(context) {
    this.context = context;
};

var routeVerbs = require('express/lib/router/methods.js').concat(['all']);
//['all', 'get', 'post', 'put', 'delete', 'head', ...];
for (var i=0; i<routeVerbs.length; i++) {
    // Create a closure so `verb` remains the same when the function evaluates
    (function(verb) {
        FakeApp.prototype[verb] = function(routePath, routeFn) {
            
            var self = this.context;
            if (!self.listRoutes[verb]) {
                self.listRoutes[verb] = {};
            }
            if (arguments.length == 2) {
                // Basic route callback was given.
                self.listRoutes[verb][routePath] = routeFn;
            } else {
                // Multple callback arguments were given. Convert the 
                // arguments list into an array.
                var params = Array.prototype.slice.call(arguments);
                params.shift();
                self.listRoutes[verb][routePath] = params;
            }

        }
    })(routeVerbs[i]);
}


/**
 * @function require
 *
 * A wrapper for the core Node.js require() function. This will 
 * additionally keep track of the path so it can be properly unloaded
 * when the module gets disabled.
 *
 * @param {String} filePath
 * @param {String} basePath
 * @return {Object}
 */
Module.prototype.require = function(filePath, basePath)
{
    // Determine the absolute path
    if (typeof basePath == 'string') {
        filePath = basePath + '/' + filePath
    }
    if (filePath[0] != '/') {
        filePath = fs.realpathSync(filePath);
    }
    this.listIncludedFiles.push(filePath);
    
    return require(filePath);
}


/**
 * @function createRoutes
 * Create standard routes for common Module actions.
 */
Module.prototype.createRoutes = function() 
{

    var self = this;
    
    
    ////
    //// On any /init/[ModuleName]/... route, we make sure our Client Models are 
    //// loaded:
    //// 
    this.app.get('/init/' + this.nameModule + '/*', function(req, res, next) {

        log(req,'   - init/' + self.nameModule + '/*  : adding model dependencies.');

        AD.App.Page.addJavascripts( req, self.moduleScripts );	// add any given .js scripts
        AD.App.Page.addJavascripts( req, self.listModelPaths ); // add any models 

        next();
    });



    ////
    //// Return any Module defined resources
    ////
/*
    var localFile = function(req, res, next, url, modulePath) {

        log(req,'   - /' + self.nameModule + '/web/ being processed.');
        var parts = req.url.split(url);
console.log('url['+url+']  req.url['+req.url+']');
console.log(parts);

        var urlParts = parts[1].split('?');
        var path = urlParts[0]; // without any additional params

        res.sendfile( self.pathModule+modulePath+path);
    }
    
    // gather the default set of urls to tailor
    var urlKeys = ['Script','CSS','Images','Models'];
    var urlValues = {};
    for (var uk=0; uk<urlKeys.length; uk++ ) {
    	urlValues[urlKeys[uk]] = AD.App.Url.getUrl('urlModule'+urlKeys[uk], {moduleName:this.name(), fileName:''} );
    }

    // create a map from the url reference to the filesystem path
    var moduleResources = [
							{ url:urlValues.Scripts, 	path:'/web/resources/scripts/'},
							{ url:urlValues.CSS, 		path:'/web/resources/css/'},
							{ url:urlValues.Images, 	path:'/web/resources/images/'},
							{ url:urlValues.Models, 	path:'/models/'}
                           ];
    
    // use closure to keep values persistent
    var createFileRoute = function (url, path) {
    	this.app.get(url+'*', function(req, res, next) {localFile(req, res, next, url, path)});
    }
    
    for (var mi=0; mi<moduleResources.length; mi++) {
    	createFileRoute(moduleResources[mi].url, moduleResources[mi].path)
    }
    
*/
    var routes = {
    		'urlModuleScript' : '/web/resources/scripts/',
    		'urlModuleCSS'	  : '/web/resources/css/',
    		'urlModuleImages' : '/web/resources/images/', 
    		'urlModuleModels' : '/models/'
    }
    var values = { moduleName:this.name(), fileName:'' };
    var rootPath = this.pathModule;
    AD.App.Url.setupFileRoutes(this.app, routes, values, rootPath);
    
 //   this.app.get('/' + this.nameModule + '/web/*', localFile);
 //   this.app.get('/scripts/' + this.nameModule + '/data/*', localFile);
    
    
    ////
    //// Be sure to add any Module .css files to any of our page/ requests
    ////
    this.app.get('/page/' + this.nameModule + '/*', function(req, res, next) {

    	AD.App.Page.addCSS( req, self.moduleCSS );  // add any module .css files
    	next();
    });

}



/**
 * @function initialize
 * Performs the typical Module setup steps.
 *
 * @return {Deferred}
 *    A jQuery Deferred that will be resolved after all interfaces, models,
 *    services, and scripts have been loaded.
 */
Module.prototype.initialize = function() 
{
    var self = this;
    
    var dfd = $.Deferred();
    this.initDFD = dfd;
    
    var dI  = this.loadInterfaces();
    var dM  = this.loadModels();
    var dMS = this.loadModuleScripts();
    var dS  = this.loadServices();
    var dCSS = this.loadModuleCSS();
    
    $.when(dI, dM, dMS, dS, dCSS).then(function (dataDI, dataDM, dataDMS, dataS, dataCSS) {
        
        // send notification to our resources/services that we are ready
        // and by 'ready' I mean all our resources are loaded
        self.hub.publish(AD.Const.Notifications.MODULE_READY,{});
        
        // all our sub resources have been loaded, so indicate we are ready!
        dfd.resolve({});
    });
    
    return dfd;
    
}



/**
 * @function destructor
 * This function is meant to be overrided by the implemented Module object.
 * Any resources loaded by the module should be released here. This function
 * will be called when an admin turns off the module.
 */
Module.prototype.destructor = function()
{}



//We expect an Interface to conform to this:
var interfaceObjDefinition = {
        version:-1,     // v1 : which version of Interface this is
        getCSS:function() {return []}, // v1 : list of all CSS dependencies
        getJavascripts: function () {return[]},
        getLabels: function(){return[]},
        loadContainers:function(){},
        loadCSS:function(){},
        loadJavascripts:function(){},
        loadLabels:function(){},
        loadServices:function(){}
};


// this function allows us to verify the given interfaceObj conforms to our
// current Interface API.
var prepareInterface = function(interfaceObj) 
{
    for (var a in interfaceObjDefinition) {
        
        if (typeof interfaceObj[a] == 'undefined') {
            interfaceObj[a] = interfaceObjDefinition[a];
        } 
    }
    
    //// We can now make sure we support older versions of our Interfaces.
    //// (once we have some)
//    if (interfaceObj.version >= 1) {
//        
//    }
    
    return interfaceObj;
}


/**
 * @function loadPages
 * Scans the defined `pathInterfaces` directory for any interfaces that need
 * to be loaded.
 *
 * @return {Deferred}
 *    A jQuery Deferred that will be resolved after all interfaces have been loaded.
 */
Module.prototype.loadInterfaces = function( onError ) 
{

    var self = this;
    var dfd = $.Deferred();
    
    // set default path to interface directory if not already set:
    if (this.pathInterfaces == '') {
        this.pathInterfaces = this.pathModule + '/web/pages/';
    }
    

    fs.readdir(this.pathInterfaces, function (err, files) {

        if (err) { 
            
            if (typeof onError != 'undefined') {
            
                onError(err);
                
            } else {
                error(' ');
                error('   **** path['+relativePathFromRoot(self.pathInterfaces)+']');
                error('   **** error['+err.message+']');
            }
            
            // No interfaces. So we're done.
            dfd.resolve({});
            
        } else {
            
            // A list of child Deferreds
            var dfdList = [];

            log(' ');
            log('   --- Loading Pages ['+relativePathFromRoot(self.pathInterfaces)+']');
            for (var fi in files) {
                
                // ignore files that begin with '.'
                if (files[fi].indexOf(".") != 0) {
                    
                    var modulePath = self.pathInterfaces +'/'+files[fi]+'/node_'+files[fi]+'.js';
                    if (fs.existsSync(modulePath)) {
                    
                        log('        - ['+relativePathFromRoot(modulePath)+']');
                        
                        var interfacePath = relativePathFromRoot(modulePath);
                        var currInterface = prepareInterface(self.require(interfacePath,__appdevPath));

                        // only process this if it is a Page
                        if (currInterface.type && currInterface.type == 'ad.page') {
                        	
                       
	                        // pass a reference to our private hub to our Interfaces:
	                        currInterface.module = self;    
	if (typeof currInterface.setup == 'undefined') {
	    error('Interface['+currInterface.pathInterface+'] doesnt implement .setup()');
	    console.log(currInterface);
	}
	                        
	                        
	                        self.interfaces[files[fi]] = currInterface;
	                        var thisDFD = currInterface.setup();
	                        
	                        (function(currInterface) {
	                        $.when(thisDFD).then(function() {
	                        
	                            // Merge all the interface's routes into the Module's 
	                            // own listRoutes.
	                            for (var routeVerb in currInterface.listRoutes) {
	                                if (!self.listRoutes[routeVerb]) {
	                                    self.listRoutes[routeVerb] = {};
	                                }
	                                for (var routePath in currInterface.listRoutes[routeVerb]) {
	                                    self.listRoutes[routeVerb][routePath] =
	                                        currInterface.listRoutes[routeVerb][routePath];
	                                }
	                            }
	                            
	                        });
	                        })(currInterface);
	                        
	                        dfdList.push(thisDFD);
                        
                        }
                    }
                
                } // end if ! begin with '.'
                
            } // end for fi in files
            
        
            // now we are finished with our interfaces:
            if (dfdList.length == 0) {
                dfd.resolve({});
            }
            else {
                // wait for all the deferreds in dfdList to finish
                $.when.apply($, dfdList).then(function() {
                    dfd.resolve({});
                });
            }
            
        }
        
        
    });
    
    return dfd;
}



/**
 * @function loadFilePaths
 * 
 * Helper function used by loadModuleScripts, loadModuleCSS, loadModels, etc.
 * 
 * @param {String} dirPath
 * @param {String} varKey
 *    The `Module` property variable to store the results in.
 * @param {Function} onError
 *    Callback function to be called when an error occurs.
 * @param {String} fromPath
 *    (optional) Base path to use. Default is the appDev root.
 * @param {String} pathPrefix
 *    (optional)
 * @return {Deferred}
 *    A jQuery Deferred that will be resolved after all paths have been loaded.
 */
Module.prototype.loadFilePaths = function (dirPath, varKey, onError, fromPath, pathPrefix) 
{
    var self = this;
    var dfd = $.Deferred();
  
    
    fromPath = fromPath || __appdevPath;
    pathPrefix = pathPrefix || '';
    
    fs.readdir( dirPath, function (err, files) {
        
        if (err) { 
            
            if (typeof onError != 'undefined') {
            
                onError(err);
                
            } else {
                error(' ');
                error('**** path['+relativePathFromRoot(dirPath)+']');
                error('**** error['+err.message+']');
            }
            
        } else {
      
            for(var fi in files) {
            
                // ignore files that begin with '.'
                if (files[fi].indexOf(".") != 0) {
                
                    var scriptPath = dirPath + '/' +files[fi];
                                
                    if (fs.existsSync(scriptPath)) {
                                         
                        // if name is a file then (must be a script)
                        var pathStat = fs.statSync(scriptPath);
                        if (pathStat.isFile()) {
                        
                            self[varKey].push( pathPrefix+relativePath(fromPath, scriptPath) );
                        
                        } 
                    }
                
                } // end if ! '.xxx' file
                
            } // next file
        }
        
        // Indicate we are finished.
        dfd.resolve({});

    });
    
    return dfd;
}


/**
 * @function loadModuleScripts
 *
 * Module scripts are shared among all the interfaces of a Module. They are
 * stored in `/[Module]/data/scripts`.
 *
 * This method scans the `/data/scripts/*` directory and loads the scripts
 * found there.
 *
 * @param {Function} onError
 * @return {Deferred}
 */
Module.prototype.loadModuleScripts = function( onError ) 
{
    if (this.pathModuleScripts == '') {
        this.pathModuleScripts = this.pathModule + '/web/resources/scripts';
    }

//	return this.loadFilePaths(this.pathModuleScripts, 'moduleScripts',  onError, __appdevPath+'/modules', '');
	return this.loadFilePaths(this.pathModuleScripts, 'moduleScripts',  onError, this.pathModuleScripts, '/'+this.nameModule+'/scripts');
}


/**
 * @function loadModuleCSS
 * 
 * @param {Function} onError
 * @return {Deferred}
 */
Module.prototype.loadModuleCSS = function( onError ) 
{
    if (this.pathModuleCSS == '') {
        this.pathModuleCSS = this.pathModule + '/web/resources/css';
    }

	//return this.loadFilePaths(this.pathModuleCSS, 'moduleCSS', onError, this.pathModule, '/'+this.nameModule);
	return this.loadFilePaths(this.pathModuleCSS, 'moduleCSS', onError, this.pathModuleCSS, '/'+this.nameModule+'/css');
}



/**
 * @function loadModels
 *
 * Modles handle the interaction with the DB or storage mechanism. They
 * receive the calls from the client and perform the proper actions on the
 * server side.
 *
 * This method scans the `/models/*` directory and loads the model descriptions
 * found there.
 *
 * @param {Function} onError
 * @return {Deferred}
 */
Module.prototype.loadModels = function( onError ) 
{

    var self = this;
    var dfd = $.Deferred();
    
    if (this.pathModels == '') {
        this.pathModels = this.pathModule + '/models';
    }
    
    
    fs.readdir( this.pathModels, function (err, files) {
    
        if (err) { 
            
            if (typeof onError != 'undefined') {
            
                onError(err);
                
            } else {
                error(' ');
                error('**** loadModels: path['+relativePathFromRoot(self.pathModels)+']');
                error('**** error['+err.message+']');
            }
            
        } else {
    
            for(var fi in files) {
                
                // ignore files that begin with '.'
                if (files[fi].indexOf(".") != 0) {
                
                    var modelPath = self.pathModels+'/'+files[fi];                               
                    if (fs.existsSync(modelPath)) {
                                         
                        // if name is a file then (must be a model definition)
                        var pathStat = fs.statSync(modelPath);
                        if (pathStat.isFile()) {
                        
                            var key = files[fi].split('.');
                            var currModel = self.require(modelPath);
                            currModel.__hub = self.hub;
                            self.listModels[key[0].toLowerCase()] = currModel;
                            
                            // now get the url for this model to allow UI clients to load it:
                            // url format for a page/script:  
                        	var vars = {
                        			moduleName:self.name(),
                        			fileName:files[fi]
                        	}
                        	var url = AD.App.Url.getUrl('urlModuleModels', vars);
                            self.listModelPaths.push( url );
                            
                        } 
                    }
                
                } // end if ! '.xxx' file
                
            } // next file
        }
        
        // indicate we are finished loading our Models
        dfd.resolve({});

    });
    
    return dfd;
}



/**
 * @function loadServices
 *
 * Services offer unique actions in the system. They are commonly used to
 * repond to a given Web Service, but can also be used to implement
 * responses to pub/sub messages via a Notification Hub.
 *
 * This method scans the `/services/*` directory and loads the services found
 * there.
 *
 * @param {Function} onError
 * @return {Deferred}
 */
Module.prototype.loadServices = function( onError ) 
{

    var self = this;
    var dfd = $.Deferred();
    
    if (this.pathServices == '') {
       this.pathServices = this.pathModule + '/server';
    }
    
    
    var importService = function(key, servicePath) {
    	
    	// load the file
        var currService = self.require(servicePath);
        
        // only process it if it is a 'service'
        if (currService.type && currService.type == 'ad.service') {
   
        	// store our module reference
	        currService.module = self;
	        

	        // Services can have a setup() function exported. 
	        // Pass the `Module.app` object into it so they
	        // can declare their routes that way if desired.
	        currService.setup(self.app);
	        
	        
	        // Or maybe the service exports a `listRoutes` 
	        // object.
	        if (currService.listRoutes) {
	            // Merge the service listRoutes into this 
	            // interface.
	            for (var verb in currService.listRoutes) {
	                if (!self.listRoutes[verb]) {
	                    self.listRoutes[verb] = {};
	                }
	                for (var routePath in currService.listRoutes[verb]) {
	                    self.listRoutes[verb][routePath] = 
	                        currService.listRoutes[verb][routePath];
	                }
	            }
	        }
	         
	        
	        // store the service in our list
	        self.listServices[key.toLowerCase()] = currService;
        }
    }
    
    var existsInArray = function(file){
    	
    	// file will be in /root/.../appDev/module/service/folder/file.js format
    	// but our serviceLoadOrder is /folder/file.js format.
   	
    	// so remove this.pathServices from file name:
    	file = file.replace(self.pathServices, ''); 
    	return (self.serviceLoadOrder.indexOf(file) !== -1);
    }
    
    
    var recursiveCount = 0;
    
    var recursiveFileScan = function( path ) {
    	
    
    	recursiveCount ++;
    	
	    fs.readdir( path, function (err, files) {
	    
	       if (err) { 
	           
	           if (typeof onError != 'undefined') {
	           
	               onError(err);
	               
	           } else {
	               error(' ');
	               error('**** loadServices: path['+relativePathFromRoot(path)+']');
	               error('**** error['+err.message+']');
	           }
	           
	       } else {
	 
	           for(var fi in files) {
	               
	               // ignore files that begin with '.'
	               if (files[fi].indexOf(".") != 0) {
	               
	                   var servicePath = path+'/'+files[fi];                               
	                   if (fs.existsSync(servicePath)) {
	                                        
	                       // if name is a file then (must be a model definition)
	                       var pathStat = fs.statSync(servicePath);
	//// TODO: make this recursive and import all .js files in subdirectories
	                       if (pathStat.isFile()) {
	                       
	                    	   // make sure file is not already in our serviceLoadOrder
	                    	   if (!existsInArray(servicePath)) {
		                           var key = files[fi].split('.');
		                           importService(key[0], servicePath);
	                    	   }
	                       } else {
	                    	   
	                    	   if (pathStat.isDirectory()) {
	                    		   recursiveFileScan(servicePath);
	                    	   }
	                       }
	                   }
	               
	               } // end if ! '.xxx' file
	               
	           } // next file
	           
	       } // end if (err) 
	    
	       // if all recursions are completed, then resolve the dfd
	       recursiveCount --;
	       if (recursiveCount <=0) dfd.resolve({});
	    }); // end readdir()
    
    } // end recursiveFileScan
    
    
    for(var a=0; a < this.serviceLoadOrder.length;a++){
    	var key = this.serviceLoadOrder[a].split('.')[0];
    	var servicePath = this.pathServices+'/'+this.serviceLoadOrder[a]; 
    	importService(key,servicePath);
    }
    
    recursiveFileScan(this.pathServices);

    return dfd;

}



/**
 * @function name
 * 
 * Return the name of this Module
 * 
 * @return {String}
 *    the name (directory name) of this module.
 */
Module.prototype.name = function () 
{
	return this.nameModule;
}



/**
 * @function path
 * 
 * Return the path of this Module
 * 
 * @return {String}
 *    the file path (directory) of this module.
 */
Module.prototype.path = function () 
{
	return this.pathModule;
}

