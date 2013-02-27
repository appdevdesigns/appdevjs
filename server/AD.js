/**
 * @class AD_Server
 * @parent index 5
 *
 * ###Server side global AD namespace. 
 *  
 * This is our global AppDev object that provides shared resources among all our scripts.
 * We namespace them under AD.[Catagory].[resource] 
 *  
 * * AD = { Util:{}, Page:{}, Data:{}, Comm:{} }; // create logical organization of data here
 * * AD.Page.return = function (){}  // instead of returnPage();
 * * AD.Page.addCSS = function (){}  // instead of addCSS();
 * * AD.Page.addJavascripts = function(){} // instead of addJavascripts();
 * * AD.Viewer  = require('viewer.js'); // instead of Viewer = require...
 * * AD.Data.DataManager = require('dataManager');
 * * AD.Data.DataMultilingual = ...
 * * AD.Comm.ResponseService = 
 * * AD.Defaults
 * * AD.Util.__appdevPath = ... 
 */
AD = { App:{}, Comm:{}, Defaults:{}, Lang:{}, Model:{},  Util:{}  };


/**
 * @class AD_Server.AdminToolbar
 * @parent AD_Server
 *
 * Used internally for rendering the admin toolbar for page requests 
 * by admin users.
 */
var adminToolbar = require('./adminToolbar.js');
AD.AdminToolbar = adminToolbar;



/**
 * @class AD_Server.jQuery
 * @parent AD_Server
 * 
 * A copy of jQuery for node.  Enables us to utilize jQuery library tools in
 * our scripts.
 */
var window = require('./node-browser').create({ AppDev: AD, AD: AD, __appdevPath: __appdevPath });
var $ = AD.jQuery = window.jQuery;
//$ = AD.jQuery;



/**
 * @class AD_Server.Util
 * @parent AD_Server
 * 
 * A collection of resources to perform various tasks.
 */

AD.Util.Log = require('./log.js').log;
AD.Util.LogDump = require('./log.js').logDump;
AD.Util.Error = require('./log.js').error;
AD.Util.ErrorDump = require('./log.js').errorDump;
AD.Util.Timestamp = function() {
    var now = new Date();
    return now.getFullYear()
        + '-' + String(now.getMonth()).replace(/^(.)$/, '0$1')
        + '-' + String(now.getDate()).replace(/^(.)$/, '0$1')
        + ' ' + now.toLocaleTimeString();
}




/**
 * @class AD_Server.Util.FS
 * @parent AD_Server.Util
 * 
 * Reusable functions for scanning the File System
 */
AD.Util.FS={};



/**
 * @function files
 * 
 * Return the files from a given path. (Asynchronously)
 * 
 * @param {string} path  the fs path of the files to return
 * @param {string} opt   options :
 * @param {function} cb  a callback to use when files are finished
 * @return {deferred} a deferred indicating the list is complete
 */

//// walk() was a fn that originally was found at:
//// http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
var _walk = function(dir, options, done, dbg) {
    dbg = dbg || '';
    var results = options.listObj || [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function(file) {
//console.log(dbg+'file:['+file+']  pending['+pending+']');                
            if ((options.skipDot && file.indexOf(".") != 0) || (!options.skipDot)) {
            
                file = dir + '/' + file;
                fs.stat(file, function(err, stat) {
//console.log(dbg+'  -- statted!!  file:['+file+']  pending['+pending+']');
                    if (err)  {
                        console.warn('error in trying to stat file['+file+']');
                        return done(err);
                    }
                    
                    if (stat && stat.isDirectory()) {
//console.log(dbg+'  -- directory');                            
                        if (!options.skipDir) results.push(options.onFile(file));
                        
                        if (options.recurseDir) {
//console.log(dbg+'    -- recursing():');
//console.log();
                            walk(file, options, function(err, res) {
                                results = results.concat(res);
                                if (!--pending) done(null, results);
                            }, dbg+'    ');
                        } else {
                            if (!--pending) done(null, results);
                        }
                    } else {
//console.log(dbg+'  -- file (!directory)');
                        if (!options.skipFile) results.push(options.onFile(file));
                        if (!--pending) done(null, results);
                    }
                });
                
            } else {
//console.log(dbg+'  -- file:['+file+']  skipping dot');
                if (!--pending) done(null, results);
            }
        });
    });
};



AD.Util.FS.files = function(path, opt,  cb) {
    
    var listFiles = [];
    
    // options (opt) are optional so if not given, readjust params:
    if (typeof opt == 'function') {
        cb = opt;
        opt = {};
    }
    
    // setup our default options values
    var options = {
            fullPaths:false,
            skipDot:true,
            skipDir:true,
            skipFile:false,
            recurseDir:false,
            relPath: false,     // returns filenames with a path relative to the given path.
            listObj:null,
            onFile:function(file){return file;}   // returns a modified filename that gets stored in list
    }
    options = $.extend(options, opt);


    var dfd = $.Deferred();
    _walk(path, options, function(err, results) {
        if (err) {
            
            if (cb) cb(err);
            dfd.reject(err);
            
        } else {

//console.log();
//console.log(' final results ... ');
            // _walk() gives us names with full paths on them.
            if (!options.fullPaths) {
                
                // if we don't want them then remove the given path
                // from each entry
                var newResults = [];
                results.forEach(function(file){
                    newResults.push( file.replace(path+'/',''));
                });
                results = newResults;
            }
            
            if (cb) cb(results);
            dfd.resolve(results);
        }
    });
    
    return dfd;
    
}



/**
 * @function filesSync
 * 
 * Return the files from a given path. (Synchronously)
 * @param {string} path  the fs path of the files to return
 * @param {string} opt   options :
 * @param {function} cb  a callback to use when files are finished
 */

AD.Util.FS.filesSync = function(path, opt,  cb) {
	
	var listFiles = [];
	
	// options (opt) are optional so if not given, readjust params:
	if (typeof opt == 'function') {
		cb = opt;
		opt = {};
	}
	
	// setup our default options values
	var options = {
			skipDot:true,
			skipDir:true,
			skipFile:false,
			recurseDir:false,
			relPath: false,		// returns filenames with a path relative to the given path.
			listObj:null,
			onFile:null			// returns a modified filename that gets stored in list
	}
	options = $.extend(options, opt);
	
	
	// if a listObj is provided, then insert into that instead:
	if (options.listObj != null) listFiles = options.listObj;
	
	var processPath = function(cPath, relPath) {
		
		// relPath: is a reference path that all included files
		//          are to be linked to.  (useful during recursion)
		if ('undefined' == typeof relPath) relPath = '';
	
		var localFiles = [];
		if (fs.existsSync(cPath)) {
	    	localFiles =  fs.readdirSync(cPath);
	    }
	    
	    for (var iLF in localFiles) {
	    
	        // ignore files that begin with '.'
	        if ((options.skipDot && localFiles[iLF].indexOf(".") != 0) || (!options.skipDot)) {
	        
	        	var fileName = localFiles[iLF];
	        	if (options.relPath) fileName = relPath + fileName;
        		
	            var filePath = cPath + '/' + localFiles[iLF];
	            var pathStat = fs.statSync(filePath);
	            if (pathStat.isDirectory()) {
	            	// if we allow directories
	            	if (!options.skipDir) {
	            		
	            		
	            		
	            		// add to list
	            		if (options.onFile != null) {
		            		listFiles.push(options.onFile(fileName));
		            	} else {
		            		listFiles.push(fileName);
		            	}
	            	}
	            	
	            	// if we recurse directories
	            	if (options.recurseDir) {

	            		// recurse this path :
	            		processPath(filePath, relPath + localFiles[iLF]+'/' );
//console.log(':::: TODO: implement the recursive Directory option of fileSync()');
	                }
	            		
	            	
	            }
	            
	            if (pathStat.isFile()) {
	            	
	            	// if files allowed
	            	if (!options.skipFile) {
	            		
	            		// add to list
		            	if (options.onFile != null) {
		            		listFiles.push(options.onFile(fileName));
		            	} else {
		            		listFiles.push(fileName);
		            	}
	            	}
	            }
	        
	         } 
	        
	    } // next localFile
    
	} // end process Path
    processPath(path);
    return listFiles;
}



/** 
 * @function directoriesSync
 * 
 * Return the directories from a given path. (Synchronously)
 * @param {string} path  the fs path of the files to return
 * @param {string} opt   options :
 * @param {function} cb  a callback to use when files are finished
 */
AD.Util.FS.directoriesSync = function(path, opt,  cb) {
	
	if ('undefined' == typeof opt) opt = {};
	opt.skipDir = false;
	opt.skipFile = true;
	
	return AD.Util.FS.filesSync(path, opt, cb);
}



/** 
 * @class  AD_Server.Util.Temp
 * @parent AD_Server.Util
 * 
 * Temporary File and Directory support  (see https://github.com/bruce/node-temp)
 */
AD.Util.Temp = require(__appdevPathNode + 'temp');


/**
 * @class  AD_Server.Util.String
 * @parent AD_Server.Util
 * 
 * Reusable functions for string manipulation
 */
// after trying to find a good global string replace, yet again:
AD.Util.String = {};
AD.Util.String.replaceAll = function (origString, replaceThis, withThis) {
    var re = new RegExp(RegExpQuote(replaceThis),"g"); 
    return origString.replace(re, withThis);
};
// Convert backslashes to slashes for cross-platform compatability
AD.Util.String.normalizePath = function(path) {
    if (/^\w\:/.test(path)) {
        // This is an absolute Windows-style path in the format X:\...
        
        // Capitalize the drive letter
        path = path[0].toUpperCase()+path.slice(1);
    }
    return AD.Util.String.replaceAll(path, '\\', '/');
};



/**
 * @function render
 * 
 * Treat the given string as a template, that has placeholders to be filled
 * by the given obj properties.
 * 
 * NOTE: place holders will be the obj properties with a '[' & ']' around it.
 * @codestart
 * var data = { name:'myModule', id:1 };
 * var template = '/module/[name]/[id]';
 * var actual = AD.Util.String.render(template, data);
 * // actual == '/module/myModule/1'  
 * @codeend
 * 
 * @param {string} template string with placeholders
 * @param {object} obj  template data
 * @param {string} tagOpen  the template tag opening (default: '[')
 * @param {string} tagClose the closing template tag (default: ']')
 * @return {string} template with given data replaced
 */
AD.Util.String.render = function(template, obj, tagOpen, tagClose) {
	
	if (tagOpen === undefined) tagOpen = '[';
	if (tagClose === undefined) tagClose = ']';
	
	for (var o in obj) {
		var key = tagOpen+o+tagClose;
		template = AD.Util.String.replaceAll(template, key, obj[o]); //orig.replace('['+o+']', obj[o]);
	}
	return template;
}



RegExpQuote = function(str) {
     return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
};


/**
 * @class  AD_Server.Util.Object
 * @parent AD_Server.Util
 * 
 * AD.Util.Object
 */
AD.Util.Object = {};

/**
 * @function getAttrs
 * 
 * Provide a copy of the attributes of an object.  No functions allowed.
 * Differs from JavascriptMVC Model::attrs() because this function will return
 * attributes which belong to the model as well as properties that got tacked on later
 * @param {object} source object
 * @return object
 */
AD.Util.Object.getAttrs = function (data) {
    var attrs = {};
    $.each(data, function(index, value){
        if (!$.isFunction(value)) {
            attrs[index] = value;
        }
    });
    return attrs;
};



/**
 * @function clone
 * 
 * Make a simplistic clone of an object.
 * 
 * Source taken from :  http://stackoverflow.com/questions/728360/copying-an-object-in-javascript
 * @param {object} obj source object
 * @return {object} a new copy
 */
AD.Util.Object.clone = function (obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0; i < obj.length; ++i) {
            copy[i] = AD.Util.Object.clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = AD.Util.Object.clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}



AD.App.app = null;
AD.App.appDfd = AD.jQuery.Deferred();
AD.App.setApp = function(app) {
    AD.App.app = app;
    AD.App.appDfd.resolve(app);
};



AD.Util.Service = require('./util_service.js');  //{};



/*
 * @class AD_Server.Defaults
 * @parent AD_Server
 * 
 * The default site settings from our configuration file (appDev/node_modules/defaults.js).
 */
AD.Defaults = require('./defaults.js');


 

/*
 * @class AD_Server.Model
 * @parent AD_Server
 * 
 * Shared resources related to our Model objects.
 */

//required to separate comment blocks for documentjs, please do not remove
var __filler;

/* @class AD_Server.Model.Datastore
 * @parent AD_Server.Model
 * 
 * the implementation of the model datastore
 */
AD.Model.Datastore = {};
if (AD.Defaults.dataStoreMethod == AD.Defaults.DATASTORE_MYSQL) { 
    AD.Model.Datastore = require('./dataStore/dataStore_MySQL');
}



/*
 * @class AD_Server.Comm
 * @parent AD_Server
 * 
 * A collection of Communications resources.
 */

//required to separate comment blocks for documentjs, please do not remove
var __filler;

/* @class AD_Server.Comm.Dispatch 
 * @parent AD_Server.Comm
 * 
 * A Pub/Sub messaging capability among Server and Clients.
 */ 
AD.Comm.Dispatch = require('./comm_dispatch.js');

/* @class AD_Server.Comm.Notification 
 * @parent AD_Server.Comm
 *
 * A NotificationCenter for message passing (server side)
 */
AD.Comm.Notification = require('./comm_notification.js');


/* @class AD_Server.Comm.Service
 * @parent AD_Server.Comm
 * 
 * A standard response object for our Service requests.
 */
AD.Comm.Service = require('./comm_service.js');

/* @class AD_Server.Comm.Email 
 * @parent AD_Server.Comm
 * 
 * An object to send email.
 */
AD.Comm.Email = require('./comm_email.js');


/* @class AD_Server.Comm.HTTP
 * @parent AD_Server.Comm
 * 
 * An object to send HTTP requests.
 */
AD.Comm.HTTP = require('./comm_HTTP.js');
AD.Comm.HTML = AD.Comm.HTTP; // <-- for backwards compatibility




/*
 * @class AD_Server.Const
 * @parent AD_Server
 * 
 * A collection of constants.
 */
AD.Const = {};

/* @class AD_Server.Const.HTTP 
 * @parent AD_Server.Const
 * 
 * Constants related to HTTP status codes
 */ 
AD.Const.HTTP = {};

AD.Const.HTTP.OK = 200;
AD.Const.HTTP.ERROR_CLIENT = 400;  // Generic 'Your Fault' error
AD.Const.HTTP.ERROR_UNAUTHORIZED = 401; // You aren't authorized 
AD.Const.HTTP.ERROR_FORBIDDEN = 403; // You don't have permission
AD.Const.HTTP.ERROR_NOTFOUND = 404;  // Requested resource not found
AD.Const.HTTP.ERROR_SERVER = 500;  // Generic 'My Fault' error (Server Error)



AD.Const.Notifications = {};
AD.Const.Notifications.SITE_API_NEWLINK = 'ad.site.api.newlink';


/*
 * @class AD_Server.Lang
 * @parent AD_Server
 * 
 * Shared resources related to Language.
 * 
 * AD.Lang : our multilingual tools.
 */
//// NOTE: (needs to come after AD.Model.Datastore and AD.Comm.Notification)
AD.Lang = require('./multilingual.js');


/* @class AD_Server.Model.List
 * @parent AD_Server.Model
 * 
 * list of all our created Model objects.
 */
AD.Model.List = {};
/* @class AD_Server.Model.extend 
 * @parent AD_Server.Model
 * @function extend
 * @param {object} name
 * @param {object} definition
 * @param {object} instanceMethods 
 * 
 * method to create a Model object.
 */ 
AD.Model.extend = function (name, definition, instanceMethods ) {
	var properties = definition;
	var staticProperties = AD.jQuery.extend({
		__adModule: definition._adModule,
		__adModel: definition._adModel,
		__hub: null  // placeholder for a module's notification hub
	}, properties);
	
	// if provided definition is not Multilingual
	var baseModel = null;
    if (properties.type == 'single') {
        baseModel = AD.Model.ModelSQL;
    } else if (properties.type == 'multilingual') {
        baseModel = AD.Model.ModelSQLMultilingual;
    } else {
        // don't know; use the standard model
        baseModel = AD.Model.ModelSQL;
    }
    
// @TODO what if instead of 'single'/'multilingual' we provide 'ModelSQL' / 'ModelSQLMultilingual'?
// this way we could have an installed module add a AD.Model[ModelHRIS] = {} definition.
// these dynamic model definitions could then subclass ModelSQL and provide additional 
// features (like db row level permission checking)
// -- framework would need to protect AD.Model.ModelSQL & ModelSQLMultilingual from being overwritten
	
    var newModel = baseModel.extend('AD.Model.List.'+name, staticProperties, instanceMethods);
	/*
	// carry forward the Module.Model definitions from client:
	newObj.__adModule = definition._adModule;
	newObj.__adModel  = definition._adModel;
	
	newObj.__hub = null;  // placeholder for a module's notification hub
	*/
	
	// now save to our List of Models.
	AD.Model.List[name] = newModel;
	
	// could also save as global object so we can look identical to client:
	// global[name] = newObj;
	
	return newModel;
}

/* @class AD_Server.Model.ModelSQL
 * @parent AD_Server.Model
 * 
 * the definition of an SQL based Model
 */
AD.Model.ModelSQL = require('./model_SQL.js');
/* @class AD_Server.Model.ModelSQLMultilingual
 * @parent AD_Server.Model
 * 
 * the definition of an SQL based Multilingual Model 
 */
AD.Model.ModelSQLMultilingual = require('./model_SQLMultilingual.js');


AD.Defaults.refresh(); // because of dependencies, keep this after Model Loading


/*
 * @class AD_Server.Viewer
 * @parent AD_Server
 * 
 * This is not the actual viewer making the request, but a set of functions
 * that allow us to discover the current viewer.
 * 
 * The current viewer can differ on each request, so refer to `req.aRAD.viewer`
 * for that information.
 */
AD.Viewer = require('./viewer.js');



/*
 * @class AD_Server.Auth
 * @parent AD_Server
 * 
 * The Authentication interface for the framework.
 *  
 */
AD.Auth = require('./authentication.js');



/*
 * @class AD_Server.Steal
 * @parent AD_Server
 * 
 * The steal build service interface for the framework.
 *  
 */
AD.Steal = require('./steal.js');










AD.Permissions = require('./permissions.js');


/*
 * @class AD_Server.App
 * @parent AD_Server
 * 
 * Resources specifically for an Application to plug into our framework.
 */
AD.App.Req = {};
AD.App.Req.Key = 'aRAD';
AD.App.Req.object = function (req) {
	if (typeof req[AD.App.Req.Key] == 'undefined') req[AD.App.Req.Key] = {};
	return req[AD.App.Req.Key];
}


/*
 * @class AD_Server.App.Page
 * @parent AD_Server.App
 * 
 * Resources specifically for returning an HTML page to the browser.
 */
AD.App.Page = {};



/*
 * @class AD_Server.App.Page.listFrameworkScripts
 * @parent AD_Server.App.Page
 * 
 * An array of javascripts required by every page in the framework.
 */
AD.App.Page.listFrameworkScripts = [
    '//jquery/jquery.js',
    '//jquery/lang/string/string.js',
    '//jquery/controller/subscribe/subscribe.js',
    '//jquery/view/ejs/ejs.js',
    '//jquery/controller/view/view.js',
    '//jquery/model/model.js',
    '//jquery/dom/fixture/fixture.js',
    '//jquery/dom/form_params/form_params.js',
    '//jquery/event/event.js',
    '//jquery/event/destroyed/destroyed.js',
    '//jquery/lang/object/object.js',
    '//jquery/lang/string/rsplit/rsplit.js',
    '//jquery/dom/dom.js',
    '//jquery/class/class.js',
    '//jquery/controller/controller.js',
    '//jquery/view/view.js',
    '//jquery/lang/openajax/openajax.js',
    '//base.min.js',
    '<then>',
//    '//kendoui/js/kendo.web.min.js',
    '//bootstrap/js/bootstrap.min.js',
    '<then>',
    '/appDev/appDev.js',
    function(ejsData) {
        var viewer = ejsData.aRAD.viewer;
        if (!viewer) {
            // The viewer does not exist
            return 'AD.Viewer = null;';
        }
        // Only return some of the fields for security reasons
        var returnedFields = ['viewer_globalUserID']; 
        var filteredViewer = {};
        returnedFields.forEach(function(field) {
            filteredViewer[field] = viewer[field];
        });
        return 'AD.Viewer = '+JSON.stringify(filteredViewer)+';';
    },
    '<then>'
    // page specific scripts will come here
];



/* @class AD_Server.App.Page.addCSS : add an array of CSS file paths required by the current page.
 * @parent AD_Server.App.Page
 * 
 * ##addCSS
 * This function adds a list of CSS definitions to be included on a new HTML
 * page request.  It is intended to be called by an app_interface object 
 * as it prepares the data to be returned by the Page.
 * 
 * ### Paths:
 * For CSS files provided by the system:  theme/[themeName]/css/[fileName].css
 * For CSS files provided by a Module  :  [moduleName]/data/css/[fileName].css
 * For CSS files provided by an Interface : [moduleName]/interfaces/[interfaceName]/css/[fileName].css
 * 
 * @param {Object} req      The Express supplied request object
 * @param {Array} listCSS   An array of paths to required css files
 */
AD.App.Page.addCSS = function( req, listCSS ) {
    // Helper function to compile required css for a page:
	var adObj = AD.App.Req.object(req);
    if (typeof adObj.response.listCSS == 'undefined') {
    	adObj.response.listCSS = [];
    }
        
    var defaultThemePath = 'theme/default/';  // the path for the default theme files
    var pathToTheme = 'theme/default/';		  // the path to the theme we should use 

//// TODO: get viewer's theme info and update pathToTheme with 
//// correct theme. 
    // pathToTheme = 'theme/'+ viewer.settings['theme] + '/';

    
    for (var indx = 0; indx < listCSS.length; indx++) {
    	adObj.response.listCSS.push(AD.Util.String.normalizePath(listCSS[indx]).replace(defaultThemePath, pathToTheme));
    }
}
AD.App.Page.defaultResources = {bootstrap:true, kendo:true, jqueryui:true};


/* @class AD_Server.App.Page.addJavascripts 
 * @parent AD_Server.App.Page
 *
 * A utility function to add our required javascript files to our
 * Interface's response.
 */
AD.App.Page.addJavascripts = function( req, listJS ) {
    // Helper function to compile required Javascripts for a page:

    if (typeof req.aRAD.response.listJavascripts == 'undefined') {
        req.aRAD.response.listJavascripts = [];
    }

//console.log(':::: incoming listJS :');
//console.log(listJS);

    for (var indx = 0; indx < listJS.length; indx++) {
        req.aRAD.response.listJavascripts.push(AD.Util.String.normalizePath(listJS[indx]));
    }
}









var renderEJS = function(fileName, tmplData, success, error) {
    // use ejs templating to render a fileName with data 
    
    fs.readFile(fileName, 'utf8', function(err,data) {
        
        if (err) {
            if (typeof error != 'undefined')  error(err);
        } else {
            // grab the js template for the interface and render it into
            // content
            var content = ejs.render(data, tmplData );
            if (typeof success != 'undefined') success(content);
        }
    });
}



var defaultResources = function(req) {
    // The Framework can offer several resources which are included by default.
    // add those resources here if allowed:
    
    var adObj = AD.App.Req.object(req);
    adObj.response.listDefaultCSS = [];
    
    // our framework offers some default resources: check to make sure those should be included:
    var shouldInclude = AD.App.Page.defaultResources;
    if ('undefined' != typeof adObj.page.resources) {
        shouldInclude = adObj.page.resources;
    }


    if (shouldInclude.kendo) {
        adObj.response.listDefaultCSS.unshift(AD.Defaults.siteURL+'/scripts/kendoui/styles/kendo.common.min.css');
        adObj.response.listDefaultCSS.unshift(AD.Defaults.siteURL+'/scripts/kendoui/styles/kendo.blueopal.min.css');
    }
    if (shouldInclude.bootstrap) {adObj.response.listDefaultCSS.unshift(AD.Defaults.siteURL+'/scripts/bootstrap/css/bootstrap.min.css');}
    if (shouldInclude.jqueryui) {adObj.response.listDefaultCSS.unshift(AD.Defaults.siteURL+'/theme/default/jquery-ui/jquery-ui.css');}
    
//console.log('listCSS:');
//console.log(adObj.response.listDefaultCSS);
//console.trace('how I got here:');

}


var compileSiteTheme = function(req, content) {

    
    // Default Theme and Page Style settings:
    var keyTheme = 'default'; // can be requested by a Site Admin/ or a User
    var keyPageStyle = 'default'; // requested by an application (default page, empty page, etc...)
    
////TODO:  a viewer might have a site Theme chosen, we would select
////the 'siteContent.ejs' version for the Theme and send that here:
////  
////  - keyTheme = Viewer.preferences[theme]
    
    // if current request specifies a pageStyle
    if (req.aRAD.response.themePageStyle != null) {
        
        // use requested pageStyle
        keyPageStyle = req.aRAD.response.themePageStyle;
    }
        
    // verify requested Theme is valid
    if (typeof listThemes[keyTheme] == 'undefined') {
        
        AD.Util.Error('requested Theme['+keyTheme+'] not found! --> using Theme[default]');
        keyTheme = 'default';  // couldn't find requested Theme do default to default
    }
    
    // verify requested pageStyle is valid
    if (typeof listThemes[keyTheme][keyPageStyle] == 'undefined') {
        var errMsg = 'requested Style['+keyPageStyle+'] not found in Theme['+keyTheme+'] --> ';
        
        if (typeof listThemes['default'][keyPageStyle] != 'undefined') {
            errMsg += ' But Theme[default] does so using that!';
            keyTheme = 'default';
        } else {
            errMsg += ' So using Style[default] instead.';
            keyPageStyle = 'default';
        }
        AD.Util.Error(errMsg);
    }
    
    
    // by the time I get here, keyTheme and keyPageStyle should be valid, so now get 
    // detailed template info:
    var currentThemePath = __appdevPath+'/web/theme/'+keyTheme+'/';
    var themeFile = listThemes[keyTheme][keyPageStyle].pathTemplate; // /view/template.ejs
    

    // chosen  Theme might also define some css and javascripts to be loaded.  Add them here:
    var listCSS = listThemes[keyTheme][keyPageStyle].listCSS;
    for (var a in listCSS) {
        // NOTE: make sure theme related .css files get loaded before the 
        // provided css from the page.  This allows the page css to override 
        // theme defined css, and not the other way around.
        // => so use .unshift() here:
        req.aRAD.response.listCSS.unshift('/theme/'+keyTheme+'/'+listCSS[a]);
    }
    
    
    var listJS = listThemes[keyTheme][keyPageStyle].listJavascripts;
    for (var a in listJS) {
        req.aRAD.response.listCSS.push(currentThemePath+keyTheme+'/'+listJS[a]);
    }

////TODO: also check to see if theme includes a 'layout.ejs' file, if so 
////then req.aRAD.response.layout= currentThemePath+'/views/layout.ejs'
////J: current thinking: don't need this.  appDev defines it's own layout.ejs, and templates tell it what they need.

    req.aRAD.response.Labels = req.aRAD.response.templateData.labels;
    req.aRAD._resPath = currentThemePath+themeFile;
}



//------------------------------------------------------------------------
var renderPage_compileContent = function(req, res, next) {
    
    AD.Util.Log(req,'   - renderPage_compileContent: getting content template['+req.aRAD.response.pathTemplate+']');
    
    var fileName = req.aRAD.response.pathTemplate;
    var tmplData = { locals: { data: req.aRAD.response.templateData} };
    renderEJS(fileName, tmplData, function(content) {
        
        // content is now the rendered content of our page:
        AD.Util.Log(req,'     renderPage_compileContent : content received ... ');
        req.aRAD.response.content = content;
        next();
         
        
     }, function(err){
         
        AD.Util.Error(req,'    * Error getting template:'+err);
        next(err);
         
     });
}



//------------------------------------------------------------------------
var renderPage_compileBody = function(req, res, next) {

    // now figure out all page details:
    compileSiteTheme(req);
    
    AD.Util.Log(req,'   - renderPage_compileBody: getting content template['+req.aRAD._resPath+']');
    // now req.aRAD._resPath = fileName
    // now req.aRAD.response = templateData
    var tmplData = { locals: req.aRAD.response  }; // <-- note undocumented EJS format!!!  had to look in code for this!
    renderEJS(req.aRAD._resPath, tmplData, function(content) {
        
        AD.Util.Log(req,'     renderPage_compileBody : content received ... ');
        req.aRAD._renderedBody = content;
        next();
        
    }, function(err){
        
        AD.Util.Error(req,'    * Error compiling Body:'+err);
        next(err);
    });
}



//------------------------------------------------------------------------
var renderPage_compilePage = function(req, res, next) {

    // now take the body and render to our layout:
    req.aRAD.response.body = req.aRAD._renderedBody;
  
    var fileName = __appdevPath+'/server/views/layout.ejs';
    AD.Util.Log(req,'   - renderPage_compilePage: getting content template['+fileName+']');
    // now req.aRAD._resPath = fileName
    // now req.aRAD.response = templateData
    req.aRAD.body = req.aRAD._renderedBody;
req.aRAD._renderedBody = '';
    var tmplData = { locals: req.aRAD.response  };  // <-- NOTE: undocumented EJS format!!!  had to look in code for this!
    renderEJS(fileName, tmplData, function(content) {
      
        AD.Util.Log(req,'     renderPage_compilePage : content received ... ');
        req.aRAD._renderedPage = content;
req.aRAD.body = '';
        next();
      
    }, function(err){
      
        AD.Util.Error(req,'    * Error compiling Body:'+err);
        next(err);
    });
}



//------------------------------------------------------------------------
// provide a function stack that will render the full page to req.aRAD._renderedPage
AD.App.Page.renderPageStack = [
    renderPage_compileContent,  // compile the content of the current app
    renderPage_compileBody,     // compile the Theme related Body (around the content)
    renderPage_compilePage      // now compile final layout with css & javascript requirements
];



AD.App.Page.returnPage = function(req, res ) {
  // Return a New Page based on our site layout
  
  if (req.aRAD.response) {

      // Include admin toolbar if needed
      async.parallel([
        function(callback) {
          adminToolbar.includeDependencies(req, callback);
        },
        function(callback) {
          adminToolbar.includeHTML(req, callback);
        }
      ], 
      // After the above have completed...
      function() {
      
          // Proceed if adminToolbar is ready or not needed
    
          AD.Util.Log(req,'   - returnPage: getting template['+req.aRAD.response.pathTemplate+']');
          fs.readFile(req.aRAD.response.pathTemplate, 'utf8', function(err,data) {
              
              // NOTE: another annoying EJS issue:
              // documentation says that any passed in param shows up as a local,
              // but in the code it is looking for a { locals:{} } object to hold your local variables.
              // sheesh!
              var tmplData = { locals: { data: req.aRAD.response.templateData} };
    
    
              // NOTE: in case I forget once again: 
              // express looks for a default 'layout.ejs' (or .xxx) in the 
              // view/ directory.  If there, then everything currently 
              // rendered will show up in that template as <%- body %>
              //
              // to overwrite that, you can do:
              // req.aRAD.response.layout: 'newLayout.ejs';
              // res.render('templatename.ejs', req.aRAD.response);
              
              // with the new layout changes: express needs to know where our site layout is located
              req.aRAD.response.layout = __appdevPath +'/server/views/layout.ejs';
    
    
              // grab the js template for the interface and render it into
              // content
              var content = ejs.render(data, tmplData );
              req.aRAD.response.content = content;
              
              AD.Util.Log(req,'     content received ... ');
              
              // now figure out all page details:
              compileSiteTheme(req);
              
              // include default resources
              defaultResources(req);
    
              AD.Util.LogDump(req,'   - rendering to browser');

              res.render( req.aRAD._resPath, req.aRAD.response ); 
              
          });
      }); // end async.parallel
      
  } else {
      res.send('<h1>HeLLo WorLd!</h1>Thats all you get since I didnt have a req.aRAD.response object defined... ');
  }
  
}



//------------------------------------------------------------------------
AD.App.Page.returnLabelData = function(req, res ) {
  // respond to a label.js request
  //
  // steal data is part of our dependency checking system, it makes sure 
  // required javascript libraries are loaded and available before it 
  // runs your code.  
  //
  // The steal.js data is pulled from the 'siteContentStealData.ejs' 
  // template file.
  
  
  if (req.aRAD.response) {
      
      // our label data needs to know the current language_code:
      req.aRAD.response.lang= {
          language_code: req.aRAD.viewer.languageKey
      };


      // make sure we don't generate the outer layout for this one
      req.aRAD.response.layout = false;


      AD.Util.LogDump(req, '   - returnLabelData');
      
      res.header('Content-type', 'text/javascript');
      res.render( __appdevPath+'/server/views/siteReturnLabelData.ejs', req.aRAD.response );
      // Note: res.render() ends execution
  } else {
      res.send('Error: in AD.Page.returnLabelData(): req.aRAD.response object defined... ');
  }
  
}




//------------------------------------------------------------------------
AD.App.Page.returnStealData = function(req, res ) {
  // respond to the steal.js request
  //
  // steal data is part of our dependency checking system, it makes sure 
  // required javascript libraries are loaded and available before it 
  // runs your code.  
  //
  // The steal.js data is pulled from the 'siteContentStealData.ejs' 
  // template file.
  
  
  if (req.aRAD.response) {
      
      // make sure we don't generate the outer layout for this one
      req.aRAD.response.layout = false;

      AD.Util.LogDump(req, '   - returnStealData');

      // Include admin toolbar if needed
      adminToolbar.includeDependencies(req, function() {
          // This will run if toolbar is ready, or skipped
          res.header('Content-type', 'text/javascript');
          res.render( __appdevPath+'/server/views/siteContentStealData.ejs', req.aRAD.response );
      });
      
  }
  
}



//------------------------------------------------------------------------
AD.App.Page.returnTemplate = function( req, res, template) {
// return a template to the response obj:


	var defaults = {
			path:'',
			data:{},
			useLayout:false,
			'Content-type':'text/javascript'
	}
	var options = $.extend(defaults, template);
	
	
	if (options.path != '') {
	    
	    // our label data needs to know the current language_code:

	    // make sure we don't generate the outer layout for this one
	    if (!options.useLayout) options.data.layout=false;
	
	    AD.Util.LogDump(req, '   - returnTemplate');
	    
	    res.header('Content-type', options['Content-type']);
	    res.render( options.path, options.data);
	    // Note: res.render() ends execution
	    
	} else {
	    res.send('Error: in AD.Page.returnTemplate(): no path provided ');
	}

}



AD.App.Page.relativePath = function(pathFrom, path) {
	return path.replace(AD.Util.String.normalizePath(pathFrom), '');
}



//------------------------------------------------------------------------
AD.App.Page.relativePathFromRoot = function(givenPath) {
    // Return the given path as if it were from our Root dir/ 

    return AD.App.Page.relativePath(AD.Util.String.normalizePath(__appdevPath+'/'), givenPath); //givenPath.replace(__appdevPath+'/', '');
}





/*
 * AD.App
 * 
 * Resources necessary for an application to plug into the framework.
 * 
 * AD.App.Interface : The interface object.
 * AD.App.Module : The Module object
 *  
 */
AD.App.Interface = require('./app_page.js'); // yes we name this 'Interface' for now.
//AD.App.Page =  require('./app_page.js');
AD.App.Module = require('./app_module.js');
AD.App.Service = require('./app_service.js');
AD.App.Themes = {};  // placeholder for our Theme info.



/*
 * @class AD_Server.App.Url
 * @parent AD_Server.App
 * 
 * URL definitions for our Modules & Pages
 */
AD.App.Url = {};



/*
 * @class AD_Server.App.Url.formats
 * @parent AD_Server.App.Url
 * 
 * A json definition of the url formats used by our modules/pages/... 
 */
AD.App.Url.formats = {
		urlModuleScript:    '/[moduleName]/scripts/[fileName]',
		urlModuleCSS:       '/[moduleName]/css/[fileName]',
		urlModuleImages:    '/[moduleName]/images/[fileName]',
		urlModuleModels:    '/[moduleName]/models/[fileName]',
		urlPageCSS:         '/[moduleName]/[pageName]/css/[fileName]',
		urlPageImage:      '/[moduleName]/[pageName]/image/[fileName]',
		urlPageScript:      '/[moduleName]/[pageName]/scripts/[fileName]',
		urlPageView:        '/[moduleName]/[pageName]/view/[fileName]',
		urlPageTest:        '/[moduleName]/[pageName]/tests/[fileName]',
		urlPageInit:        '/init/[moduleName]/[pageName]/[pageName].js'
}

AD.App.Url.getUrl = function(key, vars) {
	var url = '';
	if( AD.App.Url.formats[key] ) {
		url = AD.App.Url.formats[key];
		for(var v in vars) {
			url = AD.Util.String.replaceAll(url,'['+v+']', vars[v]);
		}
	}
	return url;
}


AD.App.Url.setupFileRoutes = function(app, routes, values, rootPath ) {
	
	
    
    // convert resources into {url & path}
    var resources = [];
    for(var r in routes) {
    	
    	var key = r;
    	var path = routes[r];
    	
    	var url = AD.App.Url.getUrl(key, values);
    	resources.push({url:url, path:path});
    }
    
    
    // here is the actual route definition
    var localFile = function(req, res, next, url, rootPath, relativePath) {

        var parts = req.url.split(url);
//console.log('url['+url+']  req.url['+req.url+']');
//console.log(parts);

       var urlParts = parts[1].split('?');
       var path = urlParts[0]; // without any additional params
//console.log('finalPath:'+rootPath + relativePath + path);
       res.sendfile( rootPath + relativePath + path);
   }
    
    
 // use closure to keep values persistent
    var createFileRoute = function (url, path, rootPath) {
    	app.get(url+'*', function(req, res, next) { localFile(req, res, next, url, rootPath, path)});
    }
    
    for (var mi=0; mi<resources.length; mi++) {
    	createFileRoute(resources[mi].url, resources[mi].path, rootPath);
    }
    
}

module.exports = AD;






////----------------------------------------------------------------------
////Load any of our Themes now
////
////Each module is responsible for defining any routes for their content
////
////The themes are defined as a directory in the /root/data/theme/ folder.
////
var pathThemes = './web/theme/';
var listThemes = {};
fs.readdir(pathThemes, function (err, files) {

    if (err) { 
        AD.Util.Log('');
        AD.Util.Error('*** Error Loading Themes ***');
        AD.Util.Error(err); 
        
    } else {
    
        AD.Util.Log('');
        AD.Util.Log('::: Loading Themes :::');
        for(var fi in files) {
        
            var dirName = files[fi];
        
            // don't include .xxx files
            if (dirName.indexOf(".") == 0) {
                continue;
            }
            
            var configPath = pathThemes + '/'+dirName+'/config.js';
            if (fs.existsSync(configPath)) {
           
                AD.Util.Log('   - loading theme [ '+configPath+']');
                var modelObj = require('.'+configPath); // <-- stupid Path issue.  fs works from app.js dir/ require is local to this file.
        
                listThemes[dirName] = modelObj;
                
            } else {
                
                AD.Util.Error('   - theme [ '+configPath+'] has no config.js!');
            }
           
        } // next file[fi]
    
    } // end if err

});