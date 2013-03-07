//// Template Replace:
//   site     : the name of this interface's module: (lowercase)
//   page       : the name of this service :  (lowercase)
//   Page   : the name of this service :  (Uppercase)
//   FindAll	  : the action for this service : (lowercase) (optional).
//    : a list of required parameters for this service ('param1', 'param2', 'param3')

/**
 * @class site.server.module_apis.page
 * @parent site.server.module_apis
 * 
 * Performs the actions for [resource].
 * @apprad resource:[resource] // @appradend (please leave)
 * @apprad action:findAll // @appradend (please leave)
 * @apprad url:[url] // @appradend
 */


////
//// sitePage
////
//// Performs the actions for [resource].
////
////    /[resource] 
////
////


var log = AD.Util.Log;
var logDump = AD.Util.LogDump;
var $ = AD.jQuery;


////Create our Validation object
var Validation = require('./objects/validation.js');
var validation = new Validation();


var sitePageFindAll = new AD.App.Service({});
module.exports = sitePageFindAll;






////---------------------------------------------------------------------
var hasPermission = function (req, res, next) {
    // Verify the current viewer has permission to perform this action.


    // if viewer has 'site.page.findAll' action/permission
        next();
    // else
        // var errorData = { errorID:55, errorMSG:'No Permission' }
        // AD.Comm.Service.sendError(req, res, errorData, AD.Const.HTTP.ERROR_FORBIDDEN ); // 403 : you don't have permission
    // end if

}



////---------------------------------------------------------------------
var verifyParams = function (req, res, next) {
    // Make sure all required parameters are given before continuing.
	
	var listRequiredParams = ['module']; // each param is a string
	AD.Util.Service.verifyParams(req, res, next, listRequiredParams);
};


////---------------------------------------------------------------------
var validateParams = function (req, res, next) {
    // Make sure provided parameters are valid.
    
    var module = req.param('module');
    if (module == '') {
        logDump(req, '  - error: No module name provided');

        AD.Comm.Service.sendError(req, res, {errorMSG:'module name not provided.'}, AD.Const.HTTP.ERROR_CLIENT ); // 400: your fault

        return;
    }
    if (validation.containsPath(module)) {
        logDump(req, '  - error: module name contains disallowed characters');

        AD.Comm.Service.sendError(req, res, {errorMSG:'module name contains disallowed characters.'}, AD.Const.HTTP.ERROR_CLIENT ); // 400: your fault

        return;
    }    
    var path = __appdevPath + '/modules/' + module;
    fs.exists(path, function(isThere) {

        if ((!isThere)) {

            // directory doesn't exist, this is a problem!
            var msg = 'provided Module Name ['+module+'] does not exist.';
            logDump(req, '  - error: ' + msg);

            AD.Comm.Service.sendError(req, res, {errorMSG:msg}, AD.Const.HTTP.ERROR_CLIENT ); // 400: your fault

        } else {

            // it's there so we can continue.
            next();
        }
    });
};

var gatherList = function (req, res, next) {
    var module = req.param('module');
    var path = __appdevPath + '/modules/' + module + '/web/pages';
    AD.Util.FS.directories(path, function(err, list) {
        if (err) {
            // return error message to browser
            AD.Comm.Service.sendError(req, res, {
                success: 'false',
                errorID:'150',
                errorMSG:'Error reading path['+path+']: '+err,
                data:{}
            }, AD.Const.HTTP.ERROR_NOTFOUND);
        } else { 
            // package the file info into an array of filenames
            req.aRad = {};
            req.aRad.listFiles = [];
            // Instead of a list of strings, we want a list of objects with
            // a name property that is a string
            for (var i = 0; i < list.length; i++) {
                req.aRad.listFiles[i] = {name: list[i]};
            }
            next();
        }
    });
};

// these are our publicly available /site/api/site/page  links:
// note: in below definitions, any value in [] is a templated value replaced with the instances value for that attribute: [id] = obj.id;
// note: params are defined like:  params:{ requiredParam1:'[requiredParam1]', requiredParam2: '[requiredParam2]'}
var publicLinks = {
//        findAll: { method:'GET',    uri:'/site/pages', params:{}, type:'resource' },
//        findOne: { method:'GET',    uri:'/site/page/[id]', params:{}, type:'resource' },
//        create:  { method:'POST',   uri:'/site/page', params:{}, type:'action' },
//        update:  { method:'PUT',    uri:'/site/page/[id]', params:{module:'site', page: '[page]'}, type:'action' },
//        destroy: { method:'DELETE', uri:'/site/page/[id]', params:{}, type:'action' },
        findAll: { method:'GET',    uri:'/site/pages', params:{module:'[module]'}, type:'resource' }, 
}

var serviceURL = publicLinks.findAll.uri.replace('[id]',':id');

var pageStack = [
        AD.App.Page.serviceStack,  // authenticates viewer, and prepares req.aRAD obj.
        hasPermission,		       // make sure we have permission to access this
        verifyParams,			   // make sure all required params are given
        validateParams,
        gatherList
    ];
        

sitePageFindAll.setup = function( app ) {

	
	////---------------------------------------------------------------------
	app.get(serviceURL, pageStack, function(req, res, next) {
	    // test using: http://localhost:8088/site/page
	
	
	    // By the time we get here, all the processing has taken place.
	    logDump(req, 'finished /site/page (findAll)');
	    
	    
	    // send a success message
	    AD.Comm.Service.sendSuccess(req, res, req.aRad.listFiles );  
	    
	});
	

    ////Register the public site/api
    this.setupSiteAPI('page', publicLinks);
} // end setup()

