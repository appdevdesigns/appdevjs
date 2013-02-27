//// Template Replace:
//   site     : the name of this interface's module: (lowercase)
//   unitTesting    : the name of this service :  (lowercase)
//   UnitTesting    : the name of this service :  (Uppercase)
//   findScripts	  : the action for this service : (lowercase) (optional).
//    : a list of required parameters for this service ('param1', 'param2', 'param3')


////
//// UnitTesting
////
//// Performs the actions for unitTesting.
////
////    /site/unitTesting/findScripts 
////
////


var log = AD.Util.Log;
var logDump = AD.Util.LogDump;



var siteUnitTesting = new AD.App.Service({});
module.exports = siteUnitTesting;


var siteHub = null;   // Module's Notification Center (note: be sure not to use this until setup() is called)
var siteDispatch = null;  // Module's Dispatch Center (for sending messages among Clients)


////---------------------------------------------------------------------
var hasPermission = function (req, res, next) {
    // Verify the current viewer has permission to perform this action.


    // if viewer has 'site.unitTesting.findScripts' action/permission
        next();
    // else
        // var errorData = { message:'No Permission' }
        // AD.Comm.Service.sendError(req, res, errorData );
    // end if

}



////---------------------------------------------------------------------
var verifyParams = function (req, res, next) {
    // Make sure all required parameters are given before continuing.
	
	var listRequiredParams = []; // each param is a string
	AD.Util.Service.verifyParams(req, res, next, listRequiredParams);
};

var findDirectories = function(req, res, next){
	
    directoryPath = __appdevPath + '/modules'; 
    
    var list = [];

    var directories = AD.Util.FS.directoriesSync(directoryPath);
    
    for (var item in directories) {
    	
    	var arrInitList = [];
    	
    	pageDirectoryPath = directoryPath + '/' + directories[item] +'/web/pages';
    	
    	var pagesPath = AD.Util.FS.directoriesSync(pageDirectoryPath);
    	
    	for (var path in pagesPath){
    		initParams = {
    				moduleName: directories[item],
    				pageName:	pagesPath[path]
    		}
    		arrInitList.push(AD.App.Url.getUrl('urlPageInit',initParams));
    	}
    	var obj ={
             name:directories[item],
             id:directories[item],
             initList: arrInitList  
    	};
    	list.push(obj);
    }
    
    req.aRad = {};
    req.aRad.listDirectories = [];
    req.aRad.listDirectories = list;
    
    next();
};

//these are our publicly available /site/api/[moduleName]/module  links;
var publicLinks = {
        findAll: { method:'GET', uri:'/[moduleName]/unitTests/module', params:{}, type:'resource' }
        //findOne: { method:'GET',  uri:'/[moduleName]/unitTests/module/[id]', params:{module:'[module]'}, type:'resource' }
}


var unitTestingStack = [
        AD.App.Page.serviceStack,  // authenticates viewer, and prepares req.aRAD obj.
        hasPermission,      // make sure we have permission to access this
        verifyParams,		// make sure all required params are given
        findDirectories     // get a list of all directories
//        step3		// update each viewer's entry
    ];
        
var totalCount = 0;


siteUnitTesting.setup = function( app ) {
	
	var data = {moduleName:this.module.name()};
	for (var a in publicLinks){
		var entry = publicLinks[a];
		publicLinks[a].uri = AD.Util.String.render(entry.uri, data); //entry.uri.replace('[moduleName]', this.module.name());
	}
	
	
	////---------------------------------------------------------------------
	app.all('/site/unitTests/module', unitTestingStack, function(req, res, next) {
	    // test using: http://localhost:8088/site/unitTesting/findScripts
	
	
	    // By the time we get here, all the processing has taken place.
		totalCount++;
		
	    logDump(req, 'finished unitTesting/find_modules ['+totalCount+']');
	    
	    AD.Comm.Service.sendSuccess(req, res, req.aRad.listDirectories );
	    
	    
	    
	});

	//// Register the public site/api
	var definition = { 
        module:this.module.name(),
        resource:'unitTestModules'
    }
    AD.Util.Service.registerAPI(definition, publicLinks);

} // end setup()

