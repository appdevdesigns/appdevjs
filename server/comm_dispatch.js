/**
 * @class  AD_Server.Comm.Dispatch
 * @parent AD_Server.Comm
 * 
 * The Dispatch object provides a publish/subscribe notification system for
 * communication between the server and the clients and between clients.
 * 
 * For example, when a user logs into the site, a message might be sent to
 * the other clients to notify them of the new user.
 * 
 * ## Usage
 * 
 * To notify the other clients that a user has logged out you would publish a message:
 * @codestart
 * AD.Comm.Dispatch.publish('/userNotifications/logout', {id: 53, name: 'John Doe'});
 * @codeend
 * 
 * 
 * To respond to the logout, you would to subscribe to the logout channel:
 * @codestart
 * var userLogout = function(user) {
 *     alert(user.name+' just logged out.');
 * };
 * AD.Comm.Dispatch.subscribe('/userNotifications/logout', userLogout);
 * @codeend
 * 
 * Now every time a user logs out, the userLogout function is called with the user's information.
 * 
 * ## Wildcards
 * 
 * From the Faye website:
 * 
 * Channel names must be formatted as absolute path names whose segments may contain only letters,
 * numbers, and the symbols -, _, !, ~, (, ), $ and @.  Channel names may also end with wildcards:
 * 
 * * The * wildcard matches any channel segment. So /foo/* matches /foo/bar and /foo/thing but not /foo/bar/thing.
 * * The ** wildcard matches any channel name recursively. So /foo/** matches /foo/bar, /foo/thing and /foo/bar/thing.
 * 
 * So for example if you subscribe to /foo/* and someone sends a message to /foo/bar, you will receive that message.
 * 
 * ## Canceling subscriptions
 * 
 * If at some point it is no longer necessary to listen for certain messages, you can
 * cancel your subscription at any time.
 * 
 * @codestart
 * var callback = function(message) {
 *     if (message.stopListening) {
 *         subscription.cancel();
 *     }
 *     alert('Message received: '+message.text);
 * };
 * var subscription = AD.Comm.Dispatch.subscribe('/message', callback);
 * 
 * AD.Comm.Notification.publish('/message', {text: 'You will receive this', stopListening: true});
 * AD.Comm.Notification.publish('/message', {text: 'But you will not receive this'});
 * @codeend
 * 
 */

// Setup the Faye server
var faye = require('faye');
var dispatch = {};
dispatch.obj = new faye.NodeAdapter({mount: '/siteDispatch', timeout: 45});

/**
 * @class  AD_Server.Comm.Dispatch.Mechanisms
 * @parent AD_Server.Comm.Dispatch
 * 
 * A few pre-defined channels for sending data between the server and the clients.
 */
dispatch.Mechanisms = {
    /**
     * @function Push
     * 
     * AD.Comm.Dispatch.Mechanisms.Push is used for sending data from the server to the client.
     * 
     * @codestart
     * AD.Comm.Dispatch.publish(AD.Comm.Dispatch.Mechanisms.Push, {message: 'Hello client!'});
     * @codeend
     */
    Push: 'out', // server to client
        
    /**
     * @function Pull
     * 
     * AD.Comm.Dispatch.Mechanisms.Pull is used for sending data from clients to the server.
     * 
     * @codestart
     * AD.Comm.Dispatch.subscribe(AD.Comm.Dispatch.Mechanisms.Pull, function(data) {
     *     console.log('Message received from client: ['+data.message+']');
     * });
     * @codeend
     */
    Pull: 'in',  // client to server
    
    /**
     * @function Chat
     * 
     * AD.Comm.Dispatch.Mechanisms.Chat is used for sending data between clients.
     * 
     * @codestart
     * AD.Comm.Dispatch.publish(AD.Comm.Dispatch.Mechanisms.Chat, {message: 'Which browser are you using?'});
     * @codeend
     */
    Chat: 'chat' // client to client
};

/**
 * @function publish 
 * Publish data from the server to the clients.
 * @codestart
 * AD.Comm.Dispatch.publish('/this/is/my/channel', {some: 'data'});
 * @codeend
 * @param {String} channel The channel that the data should be published to
 * @param {Object} data The data being published
 * @return {Object} The Faye publication object that was generated
 */
dispatch.publish = function(channel, data) {
    var publication = this.obj.getClient().publish(channel, data);
    publication.errback(function(error) {
        console.log('There was a problem with the publication: ' + error.message);
    });
    return publication;
};

/**
 * @function subscribe 
 * Subscribe to data sent from the clients.
 * @codestart
 * AD.Comm.Dispatch.subscribe('/this/is/my/channel', function(data) {
 *     console.log('Received data:');
 *     console.log(data);
 * });
 * @codeend
 * @param {String} channel The channel that the data should be published using
 * @param {Function} fn The function that should be called whenever data is published to the specified channel
 * @return {Object} The Faye subscription object that was generated
 */
dispatch.subscribe = function(channel, fn) {
    var subscription = this.obj.getClient().subscribe(channel, fn);
    subscription.errback(function(error) {
        console.log('There was a problem with the subscription: ' + error.message);
    });
    return subscription;
};

/**
 * @function sandbox
 * Create a new dispatch sandbox that always publishes/subscribes to a specific base route  
 * @codestart
 * var dispatch = AD.Comm.Dispatch.sandbox('/custom/route');
 * @codeend
 * @param {String} route Base route of the new dispatch object 
 * @return {Object}
 */
dispatch.sandbox = function(route) {
    return new Dispatch(route);
};

/**
 * @function attach
 * Start the site dispatch server.  
 * @codestart
 * AD.Comm.Dispatch.attach();
 * @codeend
 * @return {nil}
 */
dispatch.attach = function() {
    this.obj.attach(app);
};

module.exports = dispatch;


/**
 * @class  AD_Server.App.Module.Dispatch
 * @parent AD_Server.App.Module
 * @prototype
 * 
 * The dispatch object is attached to each module via the Module prototype and provides an
 * extra layer of abstraction from the AD.Comm.Dispatch interface.  It should be used in preference
 * to the raw AD.Comm.Dispatch functions wherever possible.  It assigns a unique channel to each
 * module so that publications and subcriptions are confined within modules, preventing communication
 * and conflict between modules. 
 * 
 */
var Dispatch = function(route) {
    this.route = route;
};

/**
 * @function publish
 *
 * Publish data from the server to the clients.
 * @codestart
 * thisModule.dispatch.publish(AD.Comm.Dispatch.Mechanisms.Push, {some: 'data'});
 * 
 * thisModule.dispatch.publish(AD.Comm.Dispatch.Mechanisms.Push, '/more/specific/channel', {some: 'data'});
 * @codeend
 * @param {String} mechanism Resolves to a channel that should be used for this publication; one of AD.Comm.Dispatch.Mechanisms
 * @param {String} [path] Optional path that will be appended to the channel to further refine the channel
 * @param {Object} data The data that should be published to the specified channel 
 * @return {Object} The Faye publication object that was generated
 */
Dispatch.prototype.publish = function(mechanism, path, data) {
    if (typeof data === 'undefined') {
        // The path parameter was omitted
        data = path;
        path = '';
    }
    var channel = '/'+this.route+'/'+mechanism+path;
    return AD.Comm.Dispatch.publish(channel, data);
};


/**
 * @function subscribe
 *
 * Subscribe to data sent from the clients.
 * @codestart
 * thisModule.dispatch.subscribe(AD.Comm.Dispatch.Mechanisms.Pull, function(data) {
 *     console.log('Received data:');
 *     console.log(data);
 * });
 * 
 * thisModule.dispatch.subscribe(AD.Comm.Dispatch.Mechanisms.Pull, '/more/specific/channel', function(data) {
 *     console.log('Received data:');
 *     console.log(data);
 * });
 * @codeend
 * @param {String} mechanism Resolves to a channel that should be used for this subscription; one of AD.Comm.Dispatch.Mechanisms
 * @param {String} [path] Optional path that will be appended to the channel to further refine the channel
 * @param {Function} fn The function that should be called whenever data is published to the specified channel
 * @return {Object} The Faye subscription object that was generated
 */
Dispatch.prototype.subscribe = function(mechanism, path, fn) {
    if (typeof fn === 'undefined') {
        // The fn parameter was omitted
        fn = path;
        path = '';
    }
    var channel = '/'+this.route+'/'+mechanism+path;
    return AD.Comm.Dispatch.subscribe(channel, fn);
};
