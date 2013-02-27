/**
 * @class  AD_Server.Comm.HTTP
 * @parent AD_Server.Comm
 *
 * ###HTTP
 *
 * This module facilitates sending HTTP and HTTPS requests.  It is a small
 * wrapper around the nodeJS request module and uses virtually the same syntax.
 * 
 * The generic HTTP.request() function can be used, but shortcut functions
 * for all common HTTP verbs (GET, POST, PUT, DELETE, and HEAD) are also
 * available. e.g. HTTP.get(...), HTTP.post(...), HTTP.put(...), HTTP.del(...), HTTP.head(...)
 * 
 * See the <a href="https://github.com/mikeal/request">request module</a> on
 * github for more documentation.
 */

var request = require('request');
var $ = AD.jQuery;

var HTTP = {};

/**
 * @function request
 * 
 * This function sends an HTTP request (or HTTPS or another protocol).  It returns a
 * deferred promise that will resolve to the data returned from the request.  If the
 * request fails it will be rejected with an object whose 'error' property equals the
 * returned error object and whose 'body' property equals the returned data.  You can
 * also use the traditional onSuccess and onError callback functions which will receive
 * the same parameters of their resolved/rejected counterparts.
 * 
 * The 'options' parameter specifies options for the request.  See the
 * <a href="https://github.com/mikeal/request#requestoptions-callback">request module</a> on github for more documentation.
 * In addition you may also specify `casAuth` as an option, which will have the
 * same effect as calling casRequest().
 * 
 * @param {Object} options The options object
 * @param {Function} [onSuccess] Success callback
 * @param {Function} [onError] Error callback 
 * @return {Deferred} The deferred promise that will resolve to the data returned from the request
 */
HTTP.request = function(options, onSuccess, onError) {
    // Check for the `casAuth` option
    if (options['casAuth']) {
        return HTTP.casRequest(options['casAuth'], options, onSuccess, onError);
    }
    if (options['pgtIOU']) {
        return HTTP.casProxyRequest(options['pgtIOU'], options, onSuccess, onError);
    }

    // Create the deferred and attach the provided handlers (this still works even if the handlers are not passed in)
    var dfd = $.Deferred().then(onSuccess).fail(onError);
    request(options, function(error, response, body) {
        if (error) {
            dfd.reject({
                error: error,
                body: body
            });
        }
        else {
            // Attempt to parse the response as JSON, which might fail if the response is XML or some other format
            var data = body;
            try {
                data = JSON.parse(body);
            }
            catch(error) {}
            dfd.resolve(data);
        }
    });
    return dfd.promise();
};

// Expose a few functions in the request module
HTTP.defaults = request.defaults;
HTTP.cookie = request.cookie;
HTTP.jar = request.jar;

// Create shortcuts for each of the HTTP verbs
var verbs = {
    get: 'GET',
    post: 'POST',
    put: 'PUT',
    del: 'DELETE',
    head: 'HEAD'
};
$.each(verbs, function(funcName, methodName) {
    HTTP[funcName] = function(options) {
        // Modify the options parameter to include the HTTP method
        arguments[0] = $.extend({}, options, {method: methodName});
        return HTTP.request.apply(this, arguments);
    };
});


/**
 * @function casRequest
 * 
 * Make an HTTP request from a CAS-enabled site. This will automatically 
 * authenticate with the CAS server using the RESTful API.
 *
 * You need to specify both the URL of the CAS server, and the URL of your
 * desired service.
 *
 * Once you have successfully authenticated, you can use the 
 * normal HTTP.request() function to make further requests because the cookie
 * jar should retain your credentials.
 *
 * To be clear, this function is for when you want the Node.js server to make a
 * request directly to a CAS-enabled service on another server. There is no CAS
 * proxy or user interaction involved in this scenario.
 *
 * @param {Object} casOptions
 *    {
 *      "url": Fully qualified URI for the CAS server (e.g. "https://signin.appdevdesigns.net/cas/") ,
 *      "username": Username of the CAS account you want to authenticate as ,
 *      "password": Password of the CAS account you want to authenticate as ,
 *      "jar": [optional] You may specify your own cookie jar to use instead of
 *             the default global jar that is shared among everyone using 
 *             this function.
 *             SECURITY IMPLICATION: If you don't use a separate cookie jar, 
 *             then the next call to this function, even if by a different user,
 *             will retain the CAS credentials you just authenticated with.
 *    }
 * @param {Object} requestOptions
 *      The same `options` object as in HTTP.request().
 *      This specifies the target page to fetch after authenticating.
 *      The `url` property is required.
 *      If `jar` was specified in the `casOptions`, it will be reused here.
 * @param {Function} [optional] onSuccess
 * @param {Function} [optional] onError
 * @return {Deferred}
 */
HTTP.casRequest = function(casOptions, requestOptions, onSuccess, onError)
{
    var dfd = $.Deferred().then(onSuccess).fail(onError);
    
    async.waterfall([
        // Step 1: Get the TGT (ticket-granting ticket) from the CAS server.
        function(next) {
            request(
                {
                    method: 'POST',
                    url: casOptions['url']+'v1/tickets',
                    form: {
                        'username': casOptions['username'],
                        'password': casOptions['password']
                    },
                    followRedirect: false,
                    jar: casOptions['jar'] || false
                },
                function(error, response, body) {
                    if (error) {
                        dfd.reject({
                            error: error,
                            body: body,
                            cas: 'Unable to obtain TGT'
                        });
                        next(error);
                    }
                    else {
                        // Look for TGT location in the header
                        var location = response.headers.location || response.headers.Location;
                        next(null, location);
                    }
                }
            );
        },
        // Step 2: Get the ST (service ticket) from the CAS server for 
        // the target service.
        function(location, next) {
            request(
                {
                    method: 'POST',
                    url: location,
                    form: { service: requestOptions['url'] },
                    jar: casOptions['jar'] || false
                },
                function(error, response, body) {
                    if (error) {
                        dfd.reject({
                            error: error,
                            body: body,
                            cas: 'Unable to obtain ST'
                        });
                        next(error);
                    }
                    else {
                        var ST = body;
                        next(null, ST);
                    }
                }
            );
        },
        // Step 3: Request the target service using our CAS credentials.
        function(ST, next) {
            if (requestOptions['url'].indexOf('?') >= 0) {
                requestOptions['url'] += '&ticket=' + ST;
            } else {
                requestOptions['url'] += '?ticket=' + ST;
            }
            if (casOptions['jar']) {
                requestOptions['jar'] = casOptions['jar'];
            }
            HTTP.request(requestOptions)
                .then(function(data) {
                    dfd.resolve(data);
                })
                .fail(function(err, response, body) {
                    dfd.reject({
                        error: err,
                        body: body
                    });
                });
        }
    ]);
    
    return dfd.promise();
}



/**
 * @function casProxyRequest
 *
 * Make an HTTP request from an external CAS-enabled site, on behalf of a user
 * who has an existing session on _this_ site. The external site should behave
 * as if the user himself was accessing it directly.
 *
 * These conditions must be met for this to work:
 * * This site uses CAS authentication.
 * * CAS proxying is enabled for this site.
 * * The external site allows proxying from this site.
 *
 * @param {String} pgtIOU
 *     When a user authenticates with CAS, and proxying is enabled, the user's
 *     session object will have a `CAS-PGTIOU` property. Use that here.
 * @param {Object} requestOptions
 * @param {Function} [optional] onSuccess
 * @param {Function} [optional] onError
 * @return {jQuery Deferred}
 */
HTTP.casProxyRequest = function(pgtIOU, requestOptions, onSuccess, onError)
{
    var dfd = $.Deferred().then(onSuccess).fail(onError);
    
    // see auth-cas.js
    console.log(AD.Defaults.authCAS);
    
    AD.Defaults.authCAS.getProxyTicket(pgtIOU, requestOptions['url'], function(err, pt) {
        if (err) {
            dfd.reject({
                error: err,
                body: err.message,
                cas: 'Unable to obtain proxy ticket'
            });
        }
        else {
            // Add proxy ticket to the final request URL
            if (requestOptions['url'].indexOf('?') >= 0) {
                requestOptions['url'] += '&ticket=' + pt;
            } else {
                requestOptions['url'] += '?ticket=' + pt;
            }
            HTTP.request(requestOptions)
                .then(function(data) {
                    dfd.resolve(data);
                })
                .fail(function(err, response, body) {
                    dfd.reject({
                        error: err,
                        body: body
                    });
                });
        }
    });
    
    return dfd.promise();
}

module.exports = HTTP;
