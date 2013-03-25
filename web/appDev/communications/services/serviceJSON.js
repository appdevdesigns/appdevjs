    // v1.0
    //
    // serviceJSON.js
    //
    // our Service JSON objects provide a mechanism for determinining if a
    // viewer's login authentication has expired and then requiring them to
    // re-authenticate before continuing on with the request.
    //
    //

    AppDev.ServiceJSON = {

        /**
         * @class AD.serviceJSON
         * @parent services
         * Post an Ajax request synchronously.
         */
        postSync: function(options) {
            options['sync'] = true;
            return AppDev.ServiceJSON.post(options);
        },

        /**
         * Shortcuts for common HTTP verbs
         */
        post: function(options) {
            options['method'] = 'POST';
            return AppDev.ServiceJSON.request(options);
        },
        get: function(options) {
            options['method'] = 'GET';
            return AppDev.ServiceJSON.request(options);
        },
        delete: function(options) {
            options['method'] = 'DELETE';
            return AppDev.ServiceJSON.request(options);
        },
        put: function(options) {
            options['method'] = 'PUT';
            return AppDev.ServiceJSON.request(options);
        },

        /**
         * @class AppDev.ServiceJSON.post()
         * @parent AD.serviceJSON
         * Make an HTTP request asynchronously.
         *
         * @param {String} options.method
         *    [optional] The HTTP verb to use. Default is POST.
         * @param {String} options.url
         *    The URL to post the request to.
         * @param {Object} options.params
         *    An associative array of field names and values to post.
         * @param {Function} options.complete
         *    The callback function to execute after the request is completed,
         *    before checking whether or not it succeeded or failed.
         * @param {Function} options.success
         *    The callback function to execute if the request is successful.
         * @param {Function} options.failure
         *    The callback function to execute if the request failed.
         * @param {jQuery} options.messageBox
         *    jQuery selection of the message box to display any error messages
         *    in. If not specified, then a dialog box will be used.
         * @param {String} options.showErrors
         *    "ON", "OFF", or "AUTO". Default is AUTO.
         *    Auto means errors will be shown unless a failure callback is
         *    provided.
         */
        request: function(options) {
            // Default is async, but you can specify 'sync: true' in the options
            // to change to sync mode instead.
            var asyncMode = true;
            if (options.sync) {
                asyncMode = false;
            }
            if (!options.method) {
                options.method = 'POST';
            }

            // Automatically fail if the login window is visible
            if ((typeof AD.winLogin.isVisible != 'undefined')
                && (AppDev.winLogin.isVisible())) {

                if ($.isFunction(options['complete'])) {
                    options.complete();
                }
                if ($.isFunction(options['failure'])) {
                    options.failure();
                }
                return;
            }


            // responds to a { success =false;  .... } responses.
            var _handleAppdevError = function( data ) {

            	var errorID = data.errorID;
                // Authentication failure (i.e. session timeout)
                if (errorID == 55) {
                    // Reauthenticate
                    AppDev.winLogin.show(
                        // Re-send the service request
                        function() {
                            AppDev.ServiceJSON.request(options);
                        }
                    );
                    return;
                }
                // Some other error
                else {
                    var showErrors = options['showErrors'];

                    // Execute the optional failure callback
                    if ($.isFunction(options['failure'])) {
                        options.failure(data);
                        // Turn off showErrors if it wasn't enabled
                        // explicitly.
                        if (!showErrors || showErrors == 'AUTO') {
                            showErrors = 'OFF';
                        }
                    }
                    // No failure callback given
                    else if (!showErrors || showErrors == 'AUTO') {
                      // Turn on showErrors if it wasn't disabled
                      // explicitly.
                      showErrors = 'ON';
                    }

                    // Display error message if needed
                    if (showErrors == 'ON') {
                        var errorMSG = data.error
                            || data.errorMSG
                            || data.errorMessage
                            || data.message;
                        if (!errorMSG) { errorMSG = "Error"; }
                        AppDev.displayMessage(
                            errorMSG,
                            options['messageBox']
                        );
                    }
                    return;
                }
            }


            return $.ajax({
                async: asyncMode,
                url: options['url'],
                type: options['method'],
                contentType: options['contentType'],
                dataType: 'json',
                data: options['params'],
                cache: false,
                error: function(req, status, statusText) {

                	// check to see if responseText is our json response
                	var data = $.parseJSON(req.responseText);
                	if (('object' == typeof data) && (data != null)) {

                		if ('undefined' != typeof data.success) {

                			// this could very well be one of our messages:
                			_handleAppdevError( data );
                			return;
                		}
                	}

                    // Serious error where we did not even get a JSON response
                    AppDev.displayMessage(
                        "Error:<br/>"+req.responseText,
                        options['messageBox']
                    );
                    // Execute failure callback
                    if ($.isFunction(options['failure'])) {
                        options.failure(req.responseText);
                    }
                },
                success: function(data) {
                    if ($.isFunction(options['complete'])) {
                        options.complete();
                    }

                    // Got a JSON response but was the service action a success?
                    if (data.success && (data.success != 'false')) {
                        // SUCCESS!
                        if ($.isFunction(options['success'])) {
                            // Execute the optional success callback
                            options.success(data);
                        }
                        return;
                    }
                    // FAILED
                    else {
                         _handleAppdevError(data);
                    } // failed
                }

            }); // ajax()

        } // post

    } // AppDev.ServiceJSON



    if ("undefined" == typeof AD.Comm) {
        AD.Comm = {};
    }



    /*
     * @class AD.Comm.Error
     * @parent AD.Comm
     *
     *  resources related to our Error responces.
     *
     */
    AppDev.Comm.Error = {};



    /*
     * @function AD.Comm.Error.message
     * @parent AD.Comm.Error
     *
     * return a standard error message from a given error response object.
     *
     * @codestart
     * module.Resource.create({name:name}, function(data) {
     *    this.displaySuccess(data);
     * }, function(err) {
     *    $('#errorMsg').html( AD.Comm.Error.message(err) ).show();
     * });
     * @codeend
     *
     * @param {object} err  the error returned from a standard serviceJSON call.
     * @return {string}
     */
    AppDev.Comm.Error.message = function(err) {
        // return an appropriate Error Message from an Error Response
        var errorMsg = 'invalid Format';
        if (err.errorID)  errorMsg = err.errorID;
        if (err.errorMSG) errorMsg += ': ' + err.errorMSG;
        return errorMsg;
    }
