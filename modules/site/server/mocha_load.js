//// Template Replace:
//   site     : the name of this interface's module: (lowercase)
//   mocha    : the name of this service :  (lowercase)
//   Mocha    : the name of this service :  (Uppercase)
//   load	  : the action for this service : (lowercase) (optional).
//    : a list of required parameters for this service ('param1', 'param2', 'param3')


////
//// Mocha
////
//// Performs the actions for mocha.
////
////    /site/mocha/load 
////
////


var log = AD.Util.Log;
var logDump = AD.Util.LogDump;



var siteMocha = new AD.App.Service({});
module.exports = siteMocha;


var siteHub = null;   // Module's Notification Center (note: be sure not to use this until setup() is called)
var siteDispatch = null;  // Module's Dispatch Center (for sending messages among Clients)


//-----------------------------------------------------------------------------
siteMocha.initMessaging = function( app ) {
	// @param  app :  a link to the given module/interface's app object. 
	//                can be used to setup routes.
	
    // setup any handlers, subscriptions, etc... that need to have passed in 
    // private resources from the Module:
    //  this.hub = the module's Notification Hub
    //  this.listModels = the list of Model objects in the current Module
    // 
    
    siteHub = this.module.hub;
    siteDispatch = this.module.dispatch;
    
/*    
    var multiHandler = function(event, data) {
        console.log('multiHandler! event received['+event+']' );
    }
    siteHub.subscribe('test.ping', multiHandler);
    AD.Comm.Notification.subscribe('test.ping', multiHandler);
*/    
    

} // end initMessaging()








////---------------------------------------------------------------------
var hasPermission = function (req, res, next) {
    // Verify the current viewer has permission to perform this action.


    // if viewer has 'site.mocha.load' action/permission
        next();
    // else
        // var errorData = { message:'No Permission' }
        // AD.Comm.Service.sendError(req, res, errorData );
    // end if

}



////---------------------------------------------------------------------
var verifyParams = function (req, res, next) {
    // Make sure all required parameters are given before continuing.
	
	var listRequiredParams = ['scriptList']; // each param is a string
	AD.Util.Service.verifyParams(req, res, next, listRequiredParams);
	next();
};


var createContent = function(req, res, next){
	
	var scriptList =  req.param('scriptList');
	if (typeof scriptList !== 'undefined'){
		var items = scriptList.split(',');
		var listParams = {
				path:__appdevPath + '/modules/site/web/pages/unitTests/views/loadMocha.ejs',
				data:{script: {names: items}},
				useLayout:false,
				'Content-type':'text/html'	
		};
	
		//log(listParams);
		AD.App.Page.returnTemplate(req, res, listParams);
	}else{
		next();
	}
    
};


var mochaStack = [
        AD.App.Page.serviceStack,  // authenticates viewer, and prepares req.aRAD obj.
        hasPermission,      // make sure we have permission to access this
        verifyParams,		// make sure all required params are given
        createContent 	   // create the content for the iframe
//        step3		      // update each viewer's entry
    ];
        
var totalCount = 0;


siteMocha.setup = function( app ) {
	
	// make sure any messaging routines are setup.
	siteMocha.initMessaging(app);
	
	
	
	////---------------------------------------------------------------------
	app.all('/site/mocha/load', mochaStack, function(req, res, next) {
	    // test using: http://localhost:8088/site/mocha/load
	
	
	    // By the time we get here, all the processing has taken place.
		totalCount++;
		
	    logDump(req, 'finished mocha/load ['+totalCount+']');
	    
	    
	    // publish a notification
//	    if (siteHub != null) siteHub.publish('test.ping', {});
	    
	    //AD.Comm.Service.sendSuccess(req, res, req.aRad.resultsPage );
	    
	    
	    
	});

} // end setup()

