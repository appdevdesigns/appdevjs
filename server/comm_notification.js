
/**
 * @class  AD_Server.Comm.Notification
 * @parent AD_Server.Comm
 * 
 * The Notification object provides a Publish/Subscribe notification system for
 * use by server side modules to communicate and respond to system wide events.
 * 
 * A common example of this would be when a new viewer account is added to the 
 * site.  An installed module might want the ability to create some default
 * content for this new user.
 * 
 * 
 * ## Usage
 * 
 * In order to alert the system of an event, you would publish a message:
 * @codestart
 * AD.Comm.Notification.publish('site.viewer.created', {id:1, guid:'Neo'});
 * @codeend
 * 
 * 
 * If you want to write a routine to respond to new viewers in the system 
 * then you would need to subscribe to the event:
 * @codestart
 * var updateInitialAccessTable = function(event, viewerInfo) {
 *    // here event == 'site.viewer.created'
 *    // take viewerInfo and update my DB
 * }
 * AD.Comm.Notification.subscribe('site.viewer.created', updateInitialAccessTable);
 * @codeend
 * 
 * Now every time the system posts a 'site.viewer.created' event, the 
 * updateInitialAccessTable() is called.
 * 
 * ## Wildcards
 * 
 * Suppose you want to write a method that catches multiple types of events, you
 * can use a wildcard ('*') to represent those events.  For example, if you 
 * want to catch all the site related events and log them to the console:
 * @codestart
 * var logEmAll = function( event, data ) {
 *     console.log(' received event['+event+']');
 * }
 * AD.Comm.Notification.subscribe('site.*', logEmAll);
 * @codeend
 * 
 * This would then catch 'site.viewer.created' as well as 'site.module.added'. 
 * 
 * ## Sandbox
 * 
 * The AD.Comm.Notification messaging system is open to all modules and code 
 * on the system. There might be times when you don't want the whole system 
 * to know about individual events but want to implement a notification system
 * for just a specific module or scope.  
 * 
 * In this case you can create a sandbox for that use.  The sandbox is isolated
 * from all other instances of the notification hubs, so messages within the 
 * sandbox are private.
 * 
 * A module could implement it's own sandbox like so:
 * @codestart
 * var TopSecretHub = AD.Comm.Notification.sandbox();
 * 
 * var myReponder = function( event, data) {
 * 
 *    // this does not respond to the system 'site.viewer.created'
 * }
 * 
 * TopSecretHub.subscribe('site.viewer.created', myResponder);
 * 
 * ....
 * 
 * TopSecretHub.publish('site.viewer.created', { some:'data' });
 * @codeend
 * 
 * ## Removing your subscriptions
 * 
 * It is possible you only want to receive an event one time and then remove 
 * the listener from the queue.  Use the unsubscribe method:
 * 
 * @codestart
 * var responder = function( event, data ) {
 *     console.log(' received event['+event+']');
 *     AD.Comm.Notification.unsubscribe(key);
 * }
 * var key = AD.Comm.Notification.subscribe('site.*', responder);
 * 
 * AD.Comm.Notification.publish('site.test', { id:1 });
 * AD.Comm.Notification.publish('site.test', { id:1 }); // <- does not call responder.
 * @codeend
 * 
 * 
 * ## A Module's Public and Private API's
 * 
 * As a designer you should think through carefully what events you want to expose
 * to the rest of the system and what events should be considered private.
 * 
 * To implement a public event API, simply include a 'subscription_publicAPI.js' module 
 * in your appDev/modules/[module]/services/ folder and do something like:
 * 
 * @codestart
 * var publicAPIs = function(event, data) {
 * 
 *  if (event == 'site.viewer.created') {
 *      var publicData = { id: data.viewer_id, guid:data.viewer_guid};
 *      AD.Comm.Notification.publish('site.viewer.created', publicData);
 *  } 
 *  
 *  if (event == 'site.module.added') {
 *      var publicData = { key:data.module_key , version:data.module_version};
 *      AD.Comm.Notification.publish('site.module.new', publicData);
 *  }
 *  
 * }
 *
 * ModuleHub.subscribe('site.*', publicAPIs);
 * 
 * @codeend
 * 
 */

// OK, using EventEmitter2 object for server side notifications.
// however we are attempting to maintain a common API with the client side
// notification center that is based upon OpenAjax.js.  So
// we have to implement a few hoops to keep the exposed API similar:
//
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var newSandbox = function( options ) {
	
	var defaults = {
		  wildcard: true, // should the event emitter use wildcards.
		  delimiter: '.', // the delimiter used to segment namespaces.
		  maxListeners: 0, // the max number of listeners that can be assigned to an event (defautl:10;  0:unlimited).
		};
	
	for (var a in options) {
		defaults[a] = options[a];
	}

	var server = new EventEmitter2(defaults);
	
	// get rid of warning:
	server.setMaxListeners(defaults.maxListeners);
	
	
	var obj = {};
	obj.hub = server;
	obj.allSubscriptions = {};
	obj.countSubscriptions = 0;
	
	/**
     *   @function publish 
     *   Publish an event on the current Hub.  
     *   @codestart
     *   AD.Comm.Notification.publish('event.name', {some:'data'});
     *   @codeend
     *   @param {String} event the event name 
     *   @param {Object} message the data being passed in conjuction with this event.
     *   @return {nil} 
     */
	obj.publish = function (event, message) {
	    
		server.emit(event, message);
	}
	
	
	
	/**
     *   @function subscribe 
     *   Register an event handler for a given event.  
     *   @codestart
     *   var responder = function( event, data ) {
     *     console.log(' received event['+event+']');
     *     AD.Comm.Notification.unsubscribe(key);
     *   }
     *   var key = AD.Comm.Notification.subscribe('site.*', responder);
     *   @codeend
     *   @param {String} event the event name 
     *   @param {Function} callback the handler for this event.
     *   @return {String} a unique subscription Key for this hub
     */
	obj.subscribe = function(event, callback, scope, subscriberData, filter) {
		
	    // create a temp callback that prepares the data to pass to the given callback
	    var tempCB = function(data) {
            
            // we specify our callback('event', data)
            callback(this.event, data);
        }
	    
	    // link our temp callback with the given eventName
		server.on(event, tempCB);
		
		// in order to simulate the OpenAjax unsubscribe api we need to return a 
		// unique subscription key for this new addition:
		
		// our unique Key for this new name->tempCallback combo:
        var subKey = '*'+event+'*'+obj.countSubscriptions;
        
		// now store our name->tempCallback combo
		var listSubObj = {name:event, callback:tempCB};
		obj.allSubscriptions[subKey] = listSubObj;
		
		obj.countSubscriptions ++;
		
		return subKey;
		
	}
    
    
    
    /**
     *   @function unsubscribe 
     *   Remove this subscription.  
     *   @codestart
     *   var responder = function( event, data ) {
     *     console.log(' received event['+event+']');
     *     AD.Comm.Notification.unsubscribe(key);
     *   }
     *   var key = AD.Comm.Notification.subscribe('site.*', responder);
     *   @codeend
     *   @param {String} subKey the unique subscription key provided from the subscribe() method 
     *   @return {nil} 
     */
	obj.unsubscribe = function(subKey) {
	    
	    // if the given subKey exists
	    if (typeof obj.allSubscriptions[subKey] != 'undefined') {
	       
    	    // look up our subscription info by our subKey
    	    var subscription = obj.allSubscriptions[subKey];
    	    
    	    // remove from hub
    		server.off(subscription.name, subscription.callback);
    		
    		// remove subKey from our list
    		delete obj.allSubscriptions[subKey];
    		
	    } else {
// @TODO How do we handle this error?
	        
	    }
	}
	
	return obj;
}
var Hub = newSandbox();



/**
 *   @function sandbox 
 *   Create a private Notification Hub.  
 *   @codestart
 *   var myHub = AD.Comm.Notification.sandbox({maxListeners:50});
 *   @codeend
 *   @param {Object} options options for the eventemitter2 server
 *   @return {Object} a new Notification Hub
 */
Hub.sandbox = function (options) {
	return newSandbox(options);
}

module.exports = Hub;


