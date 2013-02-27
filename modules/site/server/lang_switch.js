
////
//// Lang
////
//// Performs the actions for lang.
////
////    /site/lang/switch 
////
////


var log = AD.Util.Log;
var logDump = AD.Util.LogDump;



var siteLang = new AD.App.Service({});
module.exports = siteLang;


var siteHub = null;   // Module's Notification Center (note: be sure not to use this until setup() is called)
var siteDispatch = null;  // Module's Dispatch Center (for sending messages among Clients)


//-----------------------------------------------------------------------------
siteLang.initMessaging = function( app ) {
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


    // I think everyone should have this ability
    next();
}



////---------------------------------------------------------------------
var verifyParams = function (req, res, next) {
	// Make sure all required parameters are given before continuing.
	
	var listRequiredParams = ['lang']; // each param is a string
	AD.Util.Service.verifyParams(req, res, next, listRequiredParams);
}



////---------------------------------------------------------------------
var storeLanguage = function (req, res, next) {
	// Store this value in our session.viewer so it is remembered between 
	// calls.
	
	// NOTE: viewer.languageKey is what is referenced by our multilingual system
	//       not viewer.language_code
	var langCode = req.param('lang');
	req.session.viewer.languageKey = langCode;
	
	next();
}



var langStack = [
        AD.App.Page.serviceStack,  // authenticates viewer, and prepares req.aRAD obj.
        hasPermission,      // make sure we have permission to access this
        verifyParams,		// make sure all required params are given
        storeLanguage		// store the language code in the current viewer's viewer object
    ];
        
var totalCount = 0;


siteLang.setup = function( app ) {
	
	// make sure any messaging routines are setup.
	siteLang.initMessaging(app);
	
	
	
	////---------------------------------------------------------------------
	app.get('/site/lang/switch', langStack, function(req, res, next) {
	    // test using: http://localhost:8088/site/lang/switch
	
	
	    // By the time we get here, all the processing has taken place.
		totalCount++;
		
	    logDump(req, 'finished lang/switch ['+totalCount+']');
	    
	    console.log(req.session);
	    
	    // publish a notification
//	    if (siteHub != null) siteHub.publish('test.ping', {});
	    
	    // send a success message
	    var successStub = {
	            message:'done.' 
	    }
	    AD.Comm.Service.sendSuccess(req, res, successStub );
	    
	    
	    
	});

} // end setup()

