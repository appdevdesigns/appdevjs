//// Template Replace:
//   site     : the name of this interface's module: (lowercase)
//   module       : the name of this service :  (lowercase)
//   Module   : the name of this service :  (Uppercase)
//   FindAll	  : the action for this service : (lowercase) (optional).
//    : a list of required parameters for this service ('param1', 'param2', 'param3')

/**
 * @class site.server.module_apis.module
 * @parent site.server.module_apis
 * 
 * Performs the actions for [resource].
 * @apprad resource:[resource] // @appradend (please leave)
 * @apprad action:findAll // @appradend (please leave)
 * @apprad url:[url] // @appradend
 */


////
//// siteModule
////
//// Performs the actions for [resource].
////
////    /[resource] 
////
////


var log = AD.Util.Log;
var logDump = AD.Util.LogDump;
var $ = AD.jQuery;


var siteModuleFindAll = new AD.App.Service({});
module.exports = siteModuleFindAll;






////---------------------------------------------------------------------
var hasPermission = function (req, res, next) {
    // Verify the current viewer has permission to perform this action.


    // if viewer has 'site.module.findAll' action/permission
        next();
    // else
        // var errorData = { errorID:55, errorMSG:'No Permission' }
        // AD.Comm.Service.sendError(req, res, errorData, AD.Const.HTTP.ERROR_FORBIDDEN ); // 403 : you don't have permission
    // end if

}



////---------------------------------------------------------------------
var gatherList = function (req, res, next) {
    // get a list of all the directory names under appdev/modules/*

    var path = __appdevPath+'/modules';
    AD.Util.FS.directories(path, function(err, list) {
        // if err then
        if (err) {
            // return error message to browser
            AD.Comm.Service.sendError(req, res, { 
                success: 'false',
                errorID:'150',
                errorMSG:'Error reading path['+path+']: '+err,
                data:{}
            }, AD.Const.HTTP.ERROR_NOTFOUND);
        } else{ 
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

}

// these are our publicly available /site/api/site/module  links:
// note: in below definitions, any value in [] is a templated value replaced with the instances value for that attribute: [id] = obj.id;
// note: params are defined like:  params:{ requiredParam1:'[requiredParam1]', requiredParam2: '[requiredParam2]'}
var publicLinks = {
//        findAll: { method:'GET',    uri:'/site/modules', params:{}, type:'resource' },
//        findOne: { method:'GET',    uri:'/site/module/[id]', params:{}, type:'resource' },
//        create:  { method:'POST',   uri:'/site/module', params:{}, type:'action' },
//        update:  { method:'PUT',    uri:'/site/module/[id]', params:{module:'site', page: '[page]'}, type:'action' },
//        destroy: { method:'DELETE', uri:'/site/module/[id]', params:{}, type:'action' },
        findAll: { method:'GET',    uri:'/site/modules', params:{}, type:'resource' }, 
}

var serviceURL = publicLinks.findAll.uri.replace('[id]',':id');

var moduleStack = [
        AD.App.Page.serviceStack,  // authenticates viewer, and prepares req.aRAD obj.
        hasPermission,		       // make sure we have permission to access this
        gatherList                 // get a list of all modules
    ];
        

siteModuleFindAll.setup = function( app ) {

	
	////---------------------------------------------------------------------
	app.get(serviceURL, moduleStack, function(req, res, next) {
	    // test using: http://localhost:8088/site/module
	
	
	    // By the time we get here, all the processing has taken place.
	    logDump(req, 'finished /site/module (findAll)');
	    
	    
	    // send a success message
	    AD.Comm.Service.sendSuccess(req, res, req.aRad.listFiles );  
	    
	});
	

    ////Register the public site/api
    this.setupSiteAPI('module', publicLinks);
} // end setup()

