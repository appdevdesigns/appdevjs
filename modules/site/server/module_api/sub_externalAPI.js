//// Template Replace:
//   site     : the name of this interface's module: (lowercase)
//   [serviceName]    : the name of this service :  (lowercase)
//   ExternalAPI    : the name of this service :  (Uppercase)
//   [actionName]	  : the action for this service : (lowercase) (optional).


////
//// ExternalAPI
////
//// Performs the actions for [serviceName].
////
////    /site/[serviceName]/[actionName] 
////
////


var log = AD.Util.Log;
var logDump = AD.Util.LogDump;



var siteExternalAPI = new AD.App.Service({});
module.exports = siteExternalAPI;


var siteHub = null;   // Module's Notification Center (note: be sure not to use this until setup() is called)



//-----------------------------------------------------------------------------
siteExternalAPI.setup = function() {
    // setup any handlers, subscriptions, etc... that need to have passed in 
    // private resources from the Module:
    //  this.hub = the module's Notification Hub
    //  this.listModels = the list of Model objects in the current Module
    // 
    
    siteHub = this.module.hub;  // <-- should have a reference to our Module
     
  
    // Here we expose a 'site.user.created' event to any installed module:
    //  data: { id:#, guid:'string', isActive:[true,false] }
    var newViewer = function(event, data) {

        // data only contains the { id:xx } but we want to provide a guid
        // to modules as well, so we manually look it up:
        var Viewer = AD.Model.List['site.Viewer'];
        
        Viewer.findOne({id:data.id}, function(viewer) {
            
            var externalData = { 
                    id: viewer.viewer_id,
                    guid:viewer.viewer_guid,
                    isActive: ((viewer.viewer_isActive == 1)||(viewer.viewer_isActive == '1'))
            }
            
            // add to our cache:
            cacheViewer[data.id] = externalData;
            
            AD.Comm.Notification.publish('site.user.created', externalData);  
        });
         
    }
    siteHub.subscribe('site.Viewer.created', newViewer);
    
    
    
    // OK, default Model objects simply return a data = {id:xx} on a 
    // destroyed notification.  However we will want to provide 
    // {id:xx, guid:'string'} to our modules.  So we manage a cache of our
    // viewers here to provide that:
    var cacheViewer = null;
    
    // Viewer model isn't loaded yet, so wait until the site.ready message
    // has been published.
    var initViewerCache = function(event, data) {
        
        cacheViewer = {};
        
        var Viewer = AD.Model.List['site.Viewer'];
        Viewer.findAll({}, function(viewers) {
           
            for (var i in viewers) {
                var viewer = viewers[i];
                var cache = {
                        id:viewer.viewer_id,
                        guid: viewer.viewer_globalUserID
                }
                cacheViewer[viewer.viewer_id] = cache;
            }
//console.log(viewers);
//console.log('!!! initViewerCache !!!');
//console.log(cacheViewer);
        });
    }
    AD.Comm.Notification.subscribe('site.ready', initViewerCache);
    
    
    
    
    // Here we expose a 'site.user.destroyed' event to any installed module:
    //  data: { id:#, guid:'string' }
    var deleteViewer = function(event, data) {

        
        var cache = cacheViewer[data.id];
        AD.Comm.Notification.publish('site.user.destroyed', cache);  
 
    }
    siteHub.subscribe('site.Viewer.destroyed', deleteViewer);
    
   
    
    
    // Changes in the Labels contents should cause different modules/interfaces
    // to clear their cache of labels:
    var labelChanged = function(event, data) {
    	
    	AD.Comm.Notification.publish('site.label.changed', data);
    }
    siteHub.subscribe('site.Labels.*',labelChanged);
    

} // end setup()




