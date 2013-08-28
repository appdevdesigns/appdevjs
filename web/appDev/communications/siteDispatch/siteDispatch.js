/**
 * @class AD_Client.SiteDispatch
 * @parent AD_Client
 *
 * This is the client-side implementation of the site dispatch system and allows
 * information to be sent from a client to the server, or between clients.
 *
 * ## Usage
 *
 * The client-side and server-side interface of the site dispatch system are virtually identical.
 *
 * @codestart
 * // Server-side: send a message to the client
 * AD.Comm.Dispatch.publish(AD.Comm.Dispatch.Mechanisms.Push, {message: 'Hello client!'});
 *
 * // Client-side: receive messages from the server
 * AD.Comm.Dispatch.subscribe(AD.Comm.Dispatch.Mechanisms.Push, function(data) {
 *     console.log('Message received from server: ['+data.message+']');
 * });
 * @codeend
 *
 * ## Example
 *
 * Here is the source code necessary to create a controller that sends and receives messages
 * to the server and all other clients.
 *
 * @codestart
 * var $container = null;
 * $.Controller("Messages", {}, {
 *     init: function(el, options) {
 *         $container = this.element;
 *
 *         var $message = $container.find(":input.message-text");
 *         $container.find(":button.send").click(function() {
 *             // Send the message to the server and the other clients
 *             sendMessage({text: $message.val()});
 *             $message.val('');
 *         });
 *
 *         var $messageList = $container.find(".received-messages ul.message-list");
 *
 *         var sendMessage = function(message) {
 *             AD.Comm.Dispatch.publish(AD.Comm.Dispatch.Mechanisms.Pull, {text: message.text});
 *             AD.Comm.Dispatch.publish(AD.Comm.Dispatch.Mechanisms.Chat, {text: message.text});
 *         };
 *
 *         // Allow messages to be received from the server
 *         AD.Comm.Dispatch.subscribe(AD.Comm.Dispatch.Mechanisms.Push, function(message) {
 *             var $newItem = $("&lt;li&gt;&lt;/li&gt;").addClass("from-server").text(message.text);
 *             $messageList.append($newItem);
 *         });
 *         // Allow messages to be received from the other clients
 *         AD.Comm.Dispatch.subscribe(AD.Comm.Dispatch.Mechanisms.Chat, function(message) {
 *             var $newItem = $("&lt;li&gt;&lt;/li&gt;").addClass("from-client").text(message.text);
 *             $messageList.append($newItem);
 *         });
 *
 *         sendMessage({text: 'New client!'});
 *     }
 * });
 * @codeend
 *
 * Here is the necessary HTML.
 *
 * @codestart
 * &lt;h1&gt;Messages&lt;/h1&gt;
 * &lt;div id="message-controller"&gt;
 *   &lt;div class="received-messages"&gt;
 *     &lt;h3&gt;Received messages&lt;/h3&gt;
 *     &lt;ul class="message-list"&gt;&lt;/ul&gt;
 *   &lt;/div&gt;
 *
 *   &lt;div id="message-send"&gt;
 *     &lt;h3&gt;Send message&lt;/h3&gt;
 *     Message: &lt;input type="text" class="message-text" style="width:500px" /&gt;&lt;input type="button" class="send" value="Send" /&gt;
 *   &lt;/div&gt;
 * &lt;/div&gt;
 * @codeend
 *
 * Now, simply create the controller.
 *
 * @codestart
 * $('#message-controller').messages({});
 * @codeend
 *
 */
$(document).ready(function() {
steal('/siteDispatch.js').then(function() {
    var client = new Faye.Client('/siteDispatch');

    // Extract the module name from the URL
    // This is a hack and should be changed to something cleaner!
    var matches = window.location.pathname.match(/\/page\/(\w*)\/.+/);
    var nameModule = matches ? matches[1] : 'dummy';

    if (typeof AD.Comm == "undefined") {
        AD.Comm = {};
    }

    var dispatch = AD.Comm.Dispatch = {};

    /**
     * @class AD_Client.SiteDispatch.Mechanisms
     * @parent AD_Client.SiteDispatch
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
         * AD.Comm.Dispatch.subscribe(AD.Comm.Dispatch.Mechanisms.Pull, function(data) {
         *     console.log('Message received from server: ['+data.message+']');
         * });
         * @codeend
         */
        Push: 'out', // server to client

        /**
         * @function Pull
         *
         * AD.Comm.Dispatch.Mechanisms.Pull is used for sending data from clients to the server.
         *
         * @codestart
         * AD.Comm.Dispatch.publish(AD.Comm.Dispatch.Mechanisms.Push, {message: 'Hello server!'});
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
     * Publish data from the client to the server or other clients.
     * @codestart
     * AD.Comm.Dispatch.publish(AD.Comm.Dispatch.Mechanisms.Pull, {some: 'data'});
     *
     * AD.Comm.Dispatch.publish(AD.Comm.Dispatch.Mechanisms.Pull, '/more/specific/channel', {some: 'data'});
     * @codeend
     * @param {String} mechanism Resolves to a channel that should be used for this publication; one of AD.Comm.Dispatch.Mechanisms
     * @param {String} [path] Optional path that will be appended to the channel to further refine the channel
     * @param {Object} data The data that should be published to the specified channel
     * @return {Object} The Faye publication object that was generated
     */
    dispatch.publish = function(mechanism, path, data) {
        if (typeof data === 'undefined') {
            // The path parameter was omitted
            data = path;
            path = '';
        }
        var channel = '/'+nameModule+'/'+mechanism+path;
        var publication = client.publish(channel, data);
        publication.errback(function(error) {
            alert('There was a problem with the publication: ' + error.message);
        });
        return publication;
    };

    /**
     * @function subscribe
     * Subscribe to data sent from the server or other clients.
     * @codestart
     * AD.Comm.Dispatch.subscribe(AD.Comm.Dispatch.Mechanisms.Push, function(data) {
     *     console.log('Received data:');
     *     console.log(data);
     * });
     *
     * AD.Comm.Dispatch.subscribe(AD.Comm.Dispatch.Mechanisms.Push, '/more/specific/channel', function(data) {
     *     console.log('Received data:');
     *     console.log(data);
     * });
     * @codeend
     * @param {String} mechanism Resolves to a channel that should be used for this subscription; one of AD.Comm.Dispatch.Mechanisms
     * @param {String} [path] Optional path that will be appended to the channel to further refine the channel
     * @param {Function} fn The function that should be called whenever data is published to the specified channel
     * @return {Object} The Faye subscription object that was generated
     */
    dispatch.subscribe = function(mechanism, path, fn) {
        if (typeof fn === 'undefined') {
            // The fn parameter was omitted
            fn = path;
            path = '';
        }
        var channel = '/'+nameModule+'/'+mechanism+path;
        var subscription = client.subscribe(channel, fn);
        subscription.errback(function(error) {
            alert('There was a problem with the subscription: ' + error.message);
        });
        return subscription;
    };
});

})
