   /**
    *
    * @class AD_Client.serviceModel
    * @parent AD_Client
    *
    * the serviceModel object manages the communications between our model
    * objects and the server, while communicating via our serviceJSON
    * object.
    *
    */

    AppDev.ServiceModel = {



        /**
         * @function findAll
         *
		 * findAll is the service request to return 1 or more objects
         * from the server.
         *
         * The resulting serviceJSON will return an array of objects in
         * obj.data[].
         *
         * The standard javascriptMVC knows to  look for embedded obj.data
         * and correctly utilize it.
         *
         * We don't really need to do any data conversion for this one.
         *
		 *
		 * @param {Object} opt The ServiceJSON setup object.
		 */

        findAll: function(opt){

            // we can enable certain error handling here
            // for when we need to reauthenticate.
            //
            // also explore local cached data, etc...
            var verb = this.verb(opt);

            return AD.ServiceJSON[verb]({
                url:  opt.url,
                params: opt.params,
                success: function (data) {
                    opt.success(AD.ServiceModel.returnDataAll(data) );
                },
                failure: opt.failure

            });

        },



        /**
         * @function findOne
         *
		 * findOne is the service request to return 1 object from the server
         *
         * Our standard model response functions on the server will return
         * that one entry as part of an array.  The javascriptMVC code
         * expects a single object, so we need to pull the first value and
         * return it as the data.
         *
         * The standard javascriptMVC knows to  look for embedded obj.data
         * and correctly utilize it. So we leave the returned message format
         * in tact.
         *
		 *
		 * @param {Object} opt The ServiceJSON setup object.
		 */
        findOne: function(opt){

        	var verb = this.verb(opt);

            return AD.ServiceJSON[verb]({
                url:  opt.url,
                params: opt.params,
                success: function (data) {
                            opt.success(AD.ServiceModel.returnFirst(data) );
                        },
                failure: opt.failure

            });


        },



        /**
         * @function create
         *
		 * create is the service request to create an instance on the server
         *
         * Our standard model response functions on the server will return
         * that one entry embedded in the serviceJSON message wrapper.  The
         * javascriptMVC code expects the call to success to be an object
         * with attributes to set on the current instance.  So in order to
         * prevent polluting the returned object with our message data as
         * well, we will simply pull out the returned data object and return
         * that to the success function.
         *
		 *
		 * @param {Object} opt The ServiceJSON setup object.
		 */
        create : function (opt) {

        	var verb = this.verb(opt);

            return AD.ServiceJSON[verb]({
                    url:  opt.url,
                    params: opt.params,
                    success: function (data) {
                            opt.success(AD.ServiceModel.returnData(data) );
                        },
                    failure: opt.failure

                });

        },



        /**
         * @function update
         *
		 * update is the service request to update an instance on the server
         *
         * The javascriptMVC tools expect an object that represents any
         * values that need to be updated on the current instance to be
         * returned.
         *
         * Our standard model response functions on the server will return
         * the object embedded in the serviceJSON message wrapper.
         *
         * Returning the message data as is will cause the javascriptMVC
         * code to update the instance with additional data related to the
         * serviceJSON message format.
         *
         * So here we simply make sure that just the data is returned to
         * the success function.
         *
		 *
		 * @param {Object} opt The ServiceJSON setup object.
		 */
        update: function (opt ) {


        	var verb = this.verb(opt);

            return AD.ServiceJSON[verb]({
                url:  opt.url,
                params: opt.params,
                success: function (data) {
                            opt.success(AD.ServiceModel.returnData(data) );
                        },
                failure: opt.failure

            });

        },



        /**
         * @function destroy
         *
		 * destroy is the service request to remove an instance from the
         * server
         *
         * The javascriptMVC tools expect an object that represents any
         * values that need to be updated on the current instance to be
         * returned.
         *
         * Our standard model response functions on the server will return
         * the object embedded in the serviceJSON message wrapper.
         *
         * Returning the message data as is will cause the javascriptMVC
         * code to update the instance with additional data related to the
         * serviceJSON message format.
         *
         * So here we simply make sure that just the data is returned to
         * the success function.
         *
		 *
		 * @param {Object} opt The ServiceJSON setup object.
		 */
        destroy: function (opt) {

        	var verb = this.verb(opt);

            return AD.ServiceJSON[verb]({
                url:  opt.url,
                params: opt.params,
                success: function (data) {
                            opt.success(AD.ServiceModel.returnData(data) );
                        },
                failure: opt.failure

            });

        },



        /**
         * @function returnFirst
         *
		 * returnFirst is a helper function used to take the first element
         * embedded in the data.data[] and return that as data.data
         *
         * See the findOne() method above to see how it is used.
         *
		 *
		 * @param {Object} data The ServiceJSON response object.
		 */
        returnFirst: function (data) {

            if (data.data && data.data[0]) {
                data = data.data[0];
            } else {
                data = null;
            }
            return data;

        },



        /**
         * @function returnData
         *
		 * returnData is a helper function used to return the embedded
         * data from the ServiceJSON message.
         *
         * See the create(), update(), destroy() methods above to see how
         * it issued.
         *
		 *
		 * @param {Object} data The ServiceJSON response object.
		 */
        returnData: function (data) {
            if (data.data) {
                data = data.data;
            }
            return data;
        },



        /**
         * @function returnDataAll
         *
		 * returnDataAll is a helper function used to return the embedded
         * data from the ServiceJSON message.
         *
         * This one is used by the findAll() methods.
         *
         * Note: our callbacks for findAll() expect an array to be sent back.
         * However, since v3 of javascriptMVC, they are using .apply() to make
         * the callback calls.  If we send back an empty array here, we will loose
         * the data and our findAll() callbacks will not be sent an array.
         * -> so make sure [ [] ] is sent back. with a [].__ad_warn_empty=true;
         *
		 *
		 * @param {Object} data The ServiceJSON response object.
		 */
        returnDataAll: function (data) {

            data = AD.ServiceModel.returnData(data);

            if (data.length == 0) {
                data = [data]; // so javascriptMVC will not loose this
                data.__ad_warn_empty = true;  // so our models() will not try to make a model out of this
            }

            return data;
        },



        verb: function(opt) {
        	var verb = 'post';
        	if ('undefined' != typeof opt.verb) verb = opt.verb;
        	return verb;
        }
    }