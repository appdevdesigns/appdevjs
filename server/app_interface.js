////
//// Page
////
//// An object that provides utility functions for Page objects to 
//// perform their common tasks.
//// 
//// 

var log = AD.Util.Log;
var error = AD.Util.Error;
var relativePathFromRoot = AD.App.Page.relativePathFromRoot;
var relativePath = AD.App.Page.relativePath;
var fs = require('fs');
var $ = AD.jQuery;

/**
 * @class AD_Server.App.Interface
 * @parent AD_Server.App
 * 
 * A class that provides utility functions for Page objects to perform 
 * their common tasks. The main exported object in every "node_[xxxx].js" 
 * interface source file should instantiate from this class.
 *
 * Use the provided `this.app` object when initializing routes, and not the 
 * global `app` object. See the `app.get()` function documentation for more 
 * information.
 *
 * Similarly, all .js files that are loaded in the interface are tracked.
 * Use `this.module.require()` instead of the global `require()` to allow 
 * proper tracking.
 */

function Page( opt ) {

    this.version        = 1;    // v1 of our Page definition
    this.hub            = null; // placeholder for Module's Notification Hub
    
    
    this.pathPage  = '';
    this.namePage  = '';
    
    this.containers     = {};
    this.pathModules    = '';
    
    
    this.pathServices   = '';
    this.services       = {};
    
    this.pathLabels     = '';
    
    this.pathScripts    = '';
    this.myListJS       = [];
    this.myListJSLoaded = false;
    
    this.pathCSS		= '';	// path to interface css directory
    this.myListLocalCSS = [];	// array of paths to currently installed css files
    
    this.myListCSS       = [];	  // list of all CSS files required by this Page (including sub Containers)
    this.myListCSSLoaded = false; // bool: has list been loaded?
    
    this.listWidgets     = [];  // list of widgets used at interface level
    
    this.listLabels      = [];	// list of label_path(s) to be loaded by this Page
    this.listLabelsLoaded = false; // have my label_paths been loaded?
    this.listLoadedLabels = null;  // {JSON} loaded copy of labels loaded from DB
    
    for(var i in opt) {
        this[i] = opt[i];
    }
   
    this.pathPage = AD.Util.String.normalizePath(this.pathPage);
    
    var parts = this.pathPage.split(/\/|\\/);
    
    this.namePage = parts[parts.length -1];
    
    this.listRoutes = {};
    this.app = new FakeApp(this); // mimics the Express `app` object
    
    
    var self = this;
    var flushLabels = function() {
    	self.flushLabels();
    }
    AD.Comm.Notification.subscribe('site.label.changed', flushLabels);

    this.type = 'ad.page';
};
//util.inherits(Client, EventEmitter);
module.exports = Page;









/**
 * @function app.get
 * Allows a module to register a route with the appDev framework. Works with
 * all common HTTP verbs, just use the verb name in place of `get`.
 *
 * Usage: 
 * @codestart
 * this.app.get('/page/foo/bar', function(req, res, next) { ... });
 * this.app.post('/service/foo/:bar', function(req, res, next) { ... });
 * this.app.put('/service/a/b/c', [fn, fn, fn], function(req, res, next) { ... });
 * @codeend
 *
 * Basically just add `this.` in front of your normal global `app` call,
 * when you are within the scope of an `Page` object.
 */

var FakeApp = function(context) {
    this.context = context;
};

var routeVerbs = require(__appdevPathNode+'express/lib/router/methods.js').concat(['all']);
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
                // basic route callback was given.
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
 * @function flushLabels
 *
 * Flush our label cache when there has been a change to the Labels in the DB:
 *
 * @param {Array} list
 * @return {Array}
 */
Page.prototype.flushLabels = function(  ) 
{
	console.log('Page ['+this.namePage +'] flushing label store ...');
	this.listLoadedLabels = null;
}



/**
 * @function getCSS
 *
 * Return the list of our CSS source files that need to be loaded by the 
 * client.
 *
 * This method is usually called from the interface's page load route and
 * incorporated back into the initial page build.
 *
 * @param {Array} list
 * @return {Array}
 */
Page.prototype.getCSS = function( list ) 
{
    if (typeof list == 'undefined') {list = []};
    
    if (!this.myListCSSLoaded) { 
    
        this.loadCSS();
    
    } 
    
    for (var iL in this.myListCSS) {
        list.push(this.myListCSS[iL]);
    }
    
    return list;
}




/**
 * @function getJavascripts
 *
 * Return the list of our javascripts that need to be loaded by the client.
 *
 * This method is usually called from the steal() dependency
 * route: `/init/module/interface/interface.js`
 *
 * @param {Array} list
 * @return {Array}
 */
Page.prototype.getJavascripts = function( list ) 
{

    list = list || [];
    
    if (!this.myListJSLoaded) { 
    
        this.loadJavascripts();
       
    } 
    
    
    for (var iL in this.myListJS) {
        list.push(this.myListJS[iL]);
    }
    
    return list;
}




//------------------------------------------------------------------------
/**
 * @function getLabels
 *
 * Return the labels associated with this interface.
 * These labels are used by the client side Multilingual object to display
 * information in various languages.
 *
 * This method is usually called from the steal() dependency
 * route: `/labels/module/interface/labels.js`
 *
 * @return {Array?}
 */
Page.prototype.getLabels = function() 
{
    if (!this.listLabelsLoaded) { 
    
        this.loadLabels();
       
    } 
    
    return this.listLabels;
}




/**
 * @function loadContainers
 * 
 * Scans the defined `pathModules` directory to see if there are any sub 
 * containers for this interface to load.
 *
 * Sub containers can define their own javascripts, routes, and actions.
 *
 * @param {Function} onError
 * @return {Deferred}
 *    A jQuery Deferred that will be resolved after all containers have been
 *    loaded.
 */
Page.prototype.loadContainers = function( onError ) 
{
    // set default path to interface directory if not already set:
    if (this.pathModules == '') {
        this.pathModules = this.pathPage + '/containers';
    }
    
    var self = this;
    var dfd = $.Deferred();
    
    fs.readdir(this.pathModules, function (err, files) {


        if (err) { 
        
            if (typeof onError != 'undefined') {
                onError(err); 
            } else {
                error(' ');
                error('**** path['+relativePathFromRoot(self.pathModules)+']');
                error('**** error['+err.message+']');
            }
            
        } else {
        
            log(' ');
            log('      ... Loading Containers ['+relativePathFromRoot(self.pathModules)+']');
            for(var fi in files) {
                
                var modulePath = self.pathModules + '/'+files[fi]+'/node_'+files[fi]+'.js';
                
                if (fs.existsSync(modulePath)) {
                
                    log('          - ['+relativePathFromRoot(modulePath)+']');
                    self.containers[files[fi]] = self.module.require('./containers/'+files[fi]+'/node_'+files[fi]+'.js');
                    
                }
                    
            }
            
            
            this.myListJSLoaded = false;

        }
        
        // Finished the async operation
        dfd.resolve({});
        
    });
    
    return dfd;
}





/**
 * @function loadCSS
 *
 * Compile a list of all the .css files that need to be loaded by the client.
 * The resulting list will be stored internally within the Page object.
 *
 * All our sub containers are called to return their CSS lists as well.
 *
 * @param {String} scriptPath
 */
Page.prototype.loadCSS = function( scriptPath ) 
{

	// for each .css in our list
    for (var wi =0; wi < this.myListLocalCSS.length; wi++) {
    
        this.myListCSS.push( this.myListLocalCSS[wi]);
       
    } // next css
	
	
    
    // for each widget in our dependency list
    for (var wi =0; wi < this.listWidgets.length; wi++) {
    
        var widgetKey = this.listWidgets[wi];
        
        
        this.widgetImport(this.myListCSS, widgetKey, 'listCSS' );
        
        
//else {
//error('!!!Couldnt find widget['+widgetKey+'] in ListWidgets:');
//console.log(ListWidgets);

//}
    } // next widget
    
    
    
    // get all our container's css dependencies as well:
    for(var i in this.containers) {
    
        var curList = this.containers[i].getCSS(list);
        for (var iCL in curList) {
            this.myListCSS.push(curList[iCL]);
        }
        
    }
    
    this.myListCSSLoaded = true;
}



Page.prototype.widgetImport = function( listPaths, widgetKey, attribute  ) {
	
	// ListWidgets is a global defined by root app.js
    if (typeof ListWidgets[widgetKey] != 'undefined') {
    
    	// if attribute is defined for this entry
    	if (typeof ListWidgets[widgetKey][attribute] != 'undefined') {
    		
    	
	        var widgetsList = ListWidgets[widgetKey][attribute];
	        
	        // for each path listed in widget list
	        for (var ci =0; ci < widgetsList.length; ci++) {
	        
	            // add to my currListCSS
	        	listPaths.push( widgetsList[ci] );
	            
	        } // next css
        
    	}
    	
    	
    	// if this widget depends on another widget
    	if ( typeof ListWidgets[widgetKey].listWidgets != 'undefined') {
    		var listWidgets = ListWidgets[widgetKey].listWidgets;
    		for (var wi=0; wi < listWidgets.length; wi++ ) {
    			
    			// repeat this import for the specified widget
    			this.widgetImport(listPaths, listWidgets[wi], attribute);
    		}
    	}
    }
	
}



/**
 * @function registerDependency
 *
 * Allows you to add JavaScript of CSS dependencies needed by the interface
 * but are not located in the default folders. 
 * 
 * No effect if this is used after loadCSS() and loadJavascripts() have 
 * already been called.
 *
 * @param {Array|String} dependency
 *     Either the full path to the dependency, or an array of full paths.
 * @param {String} type
 *     [optional] "js" or "css". Default is to auto detect based on the 
 *     extension.
 */
Page.prototype.registerDependency = function( dependency, type )
{
    if (typeof dependency == 'string') {
        dependency = [dependency];
    }
    
    for (var i=0; i<dependency.length; i++) {
        var pathName = dependency[i];
        var thisType = type;
        if (!type) {
            // Auto-detect type
            if (pathName.match(/\.js$/i)) {
                thisType = 'js';
            } else if (pathName.match(/\.css$/i)) {
                thisType = 'css';
            } else {
                // Skip unrecognized files
                continue;
            }
        }
        
        switch(thisType.toLowerCase()) {
            case 'css':
                this.myListCSS.push(pathName);
                break;
                
            case 'js':
                this.myListJS.push(pathName);
                break;
        }
    
    }
}


/**
 * @function loadJavascripts
 *
 * Compile a list of all the javascripts that need to be loaded by the client.
 * (Usually during their steal() dependency action)
 *
 * All our sub containers are called to return their javascripts as well.
 *
 * @param {String} scriptPath
 */
Page.prototype.loadJavascripts = function( scriptPath ) 
{

    // set default path to interface directory if not already set:
    if (this.pathScripts == '') {
        this.pathScripts = this.pathPage + '/scripts';
    }
console.log();
console.log('::::');
console.log('module['+this.nameModule+'] page['+this.namePage+'] attempting to load javascripts');    
    var localFiles =  fs.readdirSync(this.pathScripts);
    for (var iLF in localFiles) {
    
        // ignore files that begin with '.'
        if (localFiles[iLF].indexOf(".") != 0) {
        
            var filePath = this.pathScripts + '/' + localFiles[iLF];
            var pathStat = fs.statSync(filePath);
            if (pathStat.isFile()) {

            	// url format for a page/script:  
            	var url = '/'+this.nameModule+'/'+this.namePage+'/scripts/'+localFiles[iLF];
//                this.myListJS.push(relativePathFromRoot(filePath));
                this.myListJS.push(url);
            
console.log('module['+this.nameModule+'] page['+this.namePage+'] url: '+url);
            }
        
         } 
        
    }
    
    //// now add in any javascripts from any dependent widgets:
    // for each widget in our dependency list
    for (var wi =0; wi < this.listWidgets.length; wi++) {
    
        var widgetKey = this.listWidgets[wi];
        
        this.widgetImport(this.myListJS, widgetKey, 'listJS' );

    } // next widget
    
    
    
    for(var i in this.containers) {
    
        var curList = this.containers[i].getJavascripts(list);
        for (var iCL in curList) {
            this.myListJS.push(curList[iCL]);
        }
        
    }
    
    this.myListJSLoaded = true;
}





//------------------------------------------------------------------------
/**
 * @function loadLabels
 * Pull the data from the DB for the labels associated with this interface.
 */
Page.prototype.loadLabels = function() 
{
	if (this.pathLabels == '') this.pathLabels = '/page/'+this.module.nameModule+'/'+this.namePage;
		
	this.listLabels = [ this.pathLabels ];
	
    
    // for each included widget, make sure those labels are also loaded:
    for (var wi =0; wi < this.listWidgets.length; wi++) {
        
        var widgetKey = this.listWidgets[wi];
        
        this.widgetImport(this.listLabels, widgetKey, 'listLabelPaths' ); 
     
    }
    
//    console.log('::: interface ['+this.namePage+'] loaded listLabels:');
//    console.log(this.listLabels); 
    
    this.listLabelsLoaded = true;
}





/**
 * @functions loadServices
 * Scans the defined `pathSevices` directory to see if there are any services
 * for this interface to load.
 *
 * Services are unique actions that an interface can generate.
 *
 * @param {Function} onError
 * @return {Deferred}
 *    A jQuery Deferred that will be resolved after all services have been
 *    loaded.
 */
Page.prototype.loadServices = function( onError ) 
{
    // set default path to interface directory if not already set:
    if (this.pathServices == '') {
        this.pathServices = this.pathPage + '/services';
    }

    var self = this;
    var dfd = $.Deferred();
    
    fs.readdir(this.pathServices, function (err, files) {

        if (err) { 
        
            if (typeof onError != 'undefined') {
                onError(err); 
            } else {            
                error(' ');
                error('**** path['+relativePathFromRoot(self.pathServices)+']');
                error('**** error['+err.message+']');
            }
            
        } else {

            log(' ');
            log('      ... Loading Services ['+relativePathFromRoot(self.pathServices)+']');
            for (var fi in files) {
                
                
                // ignore files that begin with '.'
                if (files[fi].indexOf(".") != 0) {
                
                    var servicePath = self.pathServices + '/' + files[fi];
                    
                    var pathStat = fs.statSync(servicePath);
                    if (pathStat.isFile()) {
                        
                        if (fs.existsSync(servicePath)) {
                        
                            log('         - services/'+files[fi]);
                            
                            var service = self.module.require(servicePath);
                            service.module = self.module;
                            
                            // Services can have a setup() function exported. 
                            // Pass the `Page.app` object into it so they
                            // can declare their routes that way if desired.
                            if (service.setup) {
                                service.setup(self.app);
                            }
                            
                            // Or maybe the service exports a `listRoutes` 
                            // object.
                            if (service.listRoutes) {
                                // Merge the service listRoutes into this 
                                // interface.
                                for (var verb in service.listRoutes) {
                                    if (!self.listRoutes[verb]) {
                                        self.listRoutes[verb] = {};
                                    }
                                    for (var routePath in service.listRoutes[verb]) {
                                        self.listRoutes[verb][routePath] = 
                                            service.listRoutes[verb][routePath];
                                    }
                                }
                            }
                            
                            self.services[files[fi]] = service;
                        
                        } // end if exists
                    
                    } // end if file
                        
                } // end if not '.' 
            
            } // next file


        }
        
        // finished the async operation
        dfd.resolve({});
        
    });

    return dfd;
}



Page.prototype.createRoutes = function() {
	
    // define our Page css file return
    var _self = this;
    var localFile = function(req, res, next) {

        log(req,'   - /' + _self.namePage + '/css/ being processed.');
        var parts = req.url.split('/'+_self.namePage+'/');
        var urlParts = parts[parts.length-1].split('?');
        var path = urlParts[0]; // without any additional params

        res.sendfile( _self.pathPage+'/'+path);
    }

    var myPath = relativePathFromRoot(this.pathPage).replace("modules","");
//    this.app.get( myPath + '/css/*', localFile);
    // css routes:  /[moduleName]/[pageName]/css/fileName.css
    this.app.get(_self.module.nameModule+'/'+_self.namePage+'/css/*', localFile);
	
    
    ////
    //// Create the default steal init route for this interface
    ////    this route is for returning the javascript dependencies for this page
    ////
    var init = function(req, res, next) {

        //// We are returning our dependencies to our dependency manager (steal)
        //// We need to return 
    	////    pathLabels: the url to return the labels for this page...
        ////    
        ////    nameSetupFunction: the name of our client side javascript setup
        ////                      function.  (usually :  ad.[module].[page].radsetup
        //// 
        req.aRAD.response.pathLabels = 'labels/'+_self.module.nameModule+'/'+_self.namePage+'/labels.js';
        req.aRAD.response.nameSetupFunction = 'ad.'+_self.module.nameModule+'.'+_self.namePage+'.radsetup';
        AD.App.Page.addJavascripts( req, _self.getJavascripts() );
        
        next();
    };
    
    //// Now piece together the function stack that should be executed when this url is called. 
    var initStack = [AD.AdminToolbar.loadLabels, init]; // these steps must ALWAYS be first
    if (this.initStack) {
        // Add the custom steps to the stack if present
        initStack = this.initStack.concat(initStack);
    }
    initStack.push(AD.App.Page.returnStealData); // this step must ALWAYS be last
    
    //// Now the URL:  /init/[moduleName]/[pageName]/[pageName].js
    this.app.get('/init/'+this.module.nameModule+'/'+this.namePage+'/'+this.namePage+'.js', initStack);
    
    
    
    //// 
    //// Create the Default label route for this interface
	////    this route is for returning the labels for this page	
    ////
    
    var prepLabels = function(req, res, next) {

    	req.aRAD.response.listLabelPaths = _self.getLabels();  // listLabelPaths;
    	
    	// if we haven't already stored a copy of our labels
    	if (_self.listLoadedLabels == null) {
 //console.log('prepLabels: loading labels from DB!');
 //console.log(req.aRAD.response.listLabelPaths);
    		// we need to load our labels then ... 
    		AD.Lang.loadLabelsByPath(req, res, next);
    		
    	} else {
 //console.log('prepLabels: Reusing Labels!'); 
 //console.log(_self.listLoadedLabels);
    		// we have a copy of our labels, so skip the lookup
    		req.aRAD.response.labels = _self.listLoadedLabels;
    		next();
    	}
        
    };
    
    var labels = function(req, res, next) {

        //// We are initializing a set of labels associated with this 
        //// Page.
        ////
        //// load the req object with this interface's path
        //// and let the app.js -> returnLabelData() handle the response.
        //// 
        req.aRAD.response.pathPage = _self.module.nameModule+'/'+_self.namePage+'/';
        
        
        // Store a copy of our loaded labels to reduce DB lookups.
        if (_self.listLoadedLabels == null) {
        	if (typeof req.aRAD.response.labels != 'undefined') {
        		_self.listLoadedLabels = req.aRAD.response.labels;
        	}
        }
        
        next();
    };
    
    ////  Now piece together the labelsStack that should be executed when this url is called. 
	var labelsStack = [AD.AdminToolbar.loadLabels, prepLabels, labels]; // these steps must ALWAYS be first
    if (this.labelsStack) {
        // Add the custom steps to the stack if present
        labelsStack = this.labelsStack.concat(labelsStack);
    }
    labelsStack.push(AD.App.Page.returnLabelData); // this step must ALWAYS be last
    
    //// Now the URL:  /labels/[moduleName]/[pageName]/labels.js
    this.app.get('/labels/'+this.module.nameModule+'/'+this.namePage+'/labels.js', labelsStack);
    
    
    
    //// 
    //// Create the Default page route for this interface
	////    this route is for returning the initial HTML for this page	
    ////
    var page = function (req, res, next) {

        //// We are displaying our interface page.  We need to define the 
        //// following:
        ////    pathTemplate : the template to display in the 'content' portion
        ////                   of our siteContent.ejs template
        ////    templateData : any data to send to our template.
        ////                   {
        ////                        key1:value1,
        ////                        key2:value2,
        ////                        ....
        ////                        keyN:valueN
        ////                    }
        ////                    can be referenced in our pathTemplate.ejs file 
        ////                    as <%= data.keyN %>
        ////    listJavascripts : list any javascripts that can be loaded 
        ////                    outside of the steal dependency manager.  
        ////                    (eg only javascripts that do not need to be 
        ////                    loaded before your sitePageRADSetup() is 
        ////                    called.)
        ////    listCSS :       list any css files that can be loaded outside of
        ////                    the steal dependency manager.
        ////    pathSteal:      the url to use for the steal dependency manager.
        ////                    the data returned should be a list of all the 
        ////                    javascript files necessary to load before your
        ////                    setup() routine is called.
        
        req.aRAD.response.pathTemplate = _self.pathPage+'/views/'+_self.namePage+'.ejs';
        req.aRAD.response.themePageStyle = _self.themePageStyle;  // 'default': default Template Style, 'empty':empty Template Style   
        
        var viewer = AD.Viewer.currentViewer(req);
        req.aRAD.response.labels.langKey = viewer.languageKey;
        
        
        req.aRAD.response.templateData = { title:_self.namePage, labels:req.aRAD.response.labels };
        
        
        // if we need to add javascripts to the page 
        // (that don't already get included via the steal system)
        // then do: 
        // req.aRAD.response.listJavascripts.push('path/to/script.js');
        req.aRAD.response.pathSteal = '/init/'+_self.module.nameModule+'/'+_self.namePage;
        if (req.session.stealSession) {
            req.aRAD.response.pathSteal = '/steal/'+req.session.stealSession.key+req.aRAD.response.pathSteal;
        }
        
        
        // make sure we load our CSS information
        AD.App.Page.addCSS( req, _self.getCSS() );
        
        //// The AD.js -> AD.App.Page.returnPage() routine is responsible for  
        //// taking this interface's data and wrapping it in our Site Template. The 
        //// response is returned there.
        next();
    };
    
    //// Now piece together the function stack that should be executed when this url is called.
    var pageStack = [AD.AdminToolbar.loadLabels, AD.Lang.loadLabelsByPath, page]; // these steps must ALWAYS be first
    if (this.pageStack) {
        // Add the custom steps to the stack if present
        pageStack = pageStack.concat(this.pageStack);
    }
    pageStack.push(AD.App.Page.returnPage); // this step must ALWAYS be last
    
    //// Now the URL:  /page/[moduleName]/[pageName]
    this.app.get('/page/'+this.module.nameModule+'/'+this.namePage, pageStack);
}


/**
 * @function setup
 * Called from app_module.js loadIPage().
 * @param {Function} callback
 *     Optional callback function to be executed just before resolving the
 *     deferred.
 * @return {Deferred} 
 *     A jQuery Deferred object that will resolve when the interface and all
 *     of its services + containers have been initialized.
 */
Page.prototype.setup = function( callback ) 
{
    var dfd = $.Deferred();
    
    //// Scan any sub containers to gather their routes
    var dfdContainers = this.loadContainers();

    //// Scan for any services and load them
    var dfdServices = this.loadServices();
    
    // Scan for any .css files registered for this interface
    this.loadPageCSS();
    
    // Create our routes : interface/css
    this.createRoutes();
    
      
    $.when(dfdContainers, dfdServices).then(function() {
        callback && callback();
        dfd.resolve();
    });
    
    return dfd;
}




/**
 * @function loadFilePaths
 * 
 * Helper function used by loadPageCSS, etc.
 * 
 * @param {String} dirPath
 * @param {String} varKey
 *    The `Module` property variable to store the results in.
 * @param {Function} onError
      Callback function to be called when an error occurs.
 * @param {String} fromPath
 *    (optional) Base path to use. Default is the appDev root.
 * @param {String} pathPrefix
 *    (optional)
 */
Page.prototype.loadFilePaths = function (dirPath, varKey, onError, fromPath, pathPrefix) 
{
    var self = this;
    
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

            for (var fi in files) {
            
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

    });
}



/**
 * @function loadPageCSS
 *
 * @param {Function} onError
 */
Page.prototype.loadPageCSS = function( onError ) 
{
    if (this.pathCSS == '') {
        this.pathCSS = this.pathPage + '/css';
    }

	var relPath = relativePathFromRoot(this.pathPage).replace('modules', '');

	this.loadFilePaths(this.pathCSS, 'myListLocalCSS', onError, this.pathPage, relPath);
}
