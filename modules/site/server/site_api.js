//// Template Replace:
//   site     : the name of this interface's module: (lowercase)
//   site    : the name of this service :  (lowercase)
//   Site    : the name of this service :  (Uppercase)
//   api	  : the action for this service : (lowercase) (optional).
//    : a list of required parameters for this service ('param1', 'param2', 'param3')


////
//// Site
////
//// This is the interface for our Models and Services to request their links
//// for their respective web service operations (findAll, findOne, create, update, destroy);
////
//// In order to register a link that is provided to these objects, the implementing service
//// needs to AD.Comm.Notification.publish(AD.Const.Notifications.SITE_API_NEWLINK, { action:'findAll', link: {method:'POST', uri:'/[moduleName]/module/[id]', params:{}, type:'action' } }); 
////


var log = AD.Util.Log;
var logDump = AD.Util.LogDump;



var siteSite = new AD.App.Service({});
module.exports = siteSite;


var siteHub = null;   // Module's Notification Center (note: be sure not to use this until setup() is called)
var siteDispatch = null;  // Module's Dispatch Center (for sending messages among Clients)


//-----------------------------------------------------------------------------
siteSite.initMessaging = function( app ) {
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


var Links = {};

AD.Comm.Notification.subscribe(AD.Const.Notifications.SITE_API_NEWLINK, function(event, data){
	
	// data should be packaged as follows:
	// { 
	//  module:'module',
	//  resource:'resource', 
	//	action:'findAll', 
	//	link: {method:'POST', uri:'/[moduleName]/module/[id]', params:{}, type:'action' } 
	// }

//console.log('::::::: Site API New Link ::::::');
//console.log(event);
//console.log(data);
//console.log('::::::::::::::::::::::::::::::::');
	
	if ('undefined' == typeof Links[data.module]) { Links[data.module] = {}; }
	if ('undefined' == typeof Links[data.module][data.resource]) { Links[data.module][data.resource] = {}; }
	
	Links[data.module][data.resource][data.action] = data.link;

});










////---------------------------------------------------------------------
var hasPermission = function (req, res, next) {
    // Verify the current viewer has permission to perform this action.


    // if viewer has 'site.site.api' action/permission
        next();
    // else
        // var errorData = { message:'No Permission' }
        // AD.Comm.Service.sendError(req, res, errorData, AD.Const.HTTP.ERROR_FORBIDDEN ); // 403 : you don't have permission
    // end if

}


var listRequiredParams = [ 'module', 'resource', 'action'];

////---------------------------------------------------------------------
var verifyParams = function (req, res, next) {
	// Make sure all required parameters are given before continuing.
	
	 // each param is a string
	AD.Util.Service.verifyParams(req, res, next, listRequiredParams);
};



////---------------------------------------------------------------------
var isFound = function (req, res, next) {
// Make sure all required parameters are given before continuing.

	var allGood = true;
	var p = {};
	for (var i=0; i<listRequiredParams.length; i++) {
		p[listRequiredParams[i]] = req.param(listRequiredParams[i]);
	}
	var module = req.param('module');
	var resource = req.param('resource');
	var action = req.param('action');
	
	if (('undefined' != typeof Links[p.module])
		&& ('undefined' != typeof Links[p.module][p.resource])
		&& ('undefined' != typeof Links[p.module][p.resource][p.action])) {
		
		// we've found the requested resource
		req.aRAD.link = Links[p.module][p.resource][p.action];
		next();
		
	} else {
	
		// that resource wasn't found so send an error back:
		var tmpl = 'Requested Link not found. module[[module]] resource[[resource]] action[[action]]'; //TODO: make this multilingual
		var msg = AD.Util.String.render(tmpl, p);
		var errorData = { errorMSG: msg};
		AD.Comm.Service.sendError(req, res, errorData, AD.Const.HTTP.ERROR_NOTFOUND ); // 404 : that link isn't found ??
	}
};









var siteStack = [
        AD.App.Page.serviceStack,  // authenticates viewer, and prepares req.aRAD obj.
        hasPermission,      // make sure we have permission to access this
        verifyParams,		// make sure all required params are given
        isFound, 			// is the requested module/resource/action listed?
//        step3		// update each viewer's entry
    ];
        


siteSite.setup = function( app ) {
	
	// make sure any messaging routines are setup.
	siteSite.initMessaging(app);
	
	
	
	////---------------------------------------------------------------------
	app.get('/'+this.module.name()+'/api/:module/:resource/:action', siteStack, function(req, res, next) {
	    // test using: http://localhost:8088/site/api/appRAD/module/findAll
	
	
	    // By the time we get here, all the processing has taken place.
	    logDump(req, 'finished site/api/module/resource/action ');
	    

	    AD.Comm.Service.sendSuccess(req, res, req.aRAD.link );
	    
	    
	    
	});

} // end setup()

//// TODO: error messages multilingual
