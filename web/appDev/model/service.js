   /**
    *
    * @class AD_Client.Service
    * @parent AD_Client
    *
    * the Service object defines a standard way of how our client
    * communicate with our server side service calls.
    *
    * This is expected to be used with services that expose their urls
    * using the AD.API(module, resource, action); utility.
    *
    * How to use:
    *  to make a new Service  obj:
    *  @codestart
	*    AD.Service.extend("UnassignedViewers",
	*    {
	*        _adModule:'test',		// what module is this under
	*        _adResource:'viewer',	// what resource are we working with
	*        _adModel: null         // are the returned objects a type of Model? (null = no)
	*    },
	*    {});
    *  @codeend
    *
    * to use instance of a Service object:
    * @codestart
    *      UnassignedViewers.findAll( {}, function (data) {
    *              // data is an array of json objects
    *              var html = '';
    *              for(var dI=0; dI<data.length; dI++) {
    *                  html += '<li>'+data[dI].viewer_guid+'</li>';
    *              }
    *              $('#'+data[dI].viewer_guid).html( html);
    *
    *          }, function (data) {
    *              // error handling routine
    *      });
    * @codeend
    *
    */
    $.Model.extend("AppDev.Service",
    {
        ////
        //// Class Methods
        //// These methods are defined as part of the Object/Class.  So you
        //// can do Object.findAll();
        ////
        //// the children will also be able to access these.  However
        //// when calling  skipper.findAll(), the 'this' inside the fn()
        //// doesn't necessarily   point to skipper.

    	/**
    	 * @function _url
    	 * @parent AD.Service
    	 *
    	 * Internal fn() to return our url for a specific action.
    	 *
    	 * @codestart
    	 * this._url('findAll', function(linkObj) {
    	 * 		var uriTemplate = linkObj.uri;
    	 * 		var paramTemplate = linkObj.params;
    	 * });
    	 * @codeend
    	 *
    	 * @param {string} action
    	 * 				One of the default javascriptMVC model methods:
    	 *              'findAll', 'findOne', 'create', 'update', 'destroy'
    	 * @param {function} cbSuccess
    	 * 				SuccessCallback: It is possible this will require a
    	 *              network lookup, so provide an async callback.  The
    	 *              requested url is provided as a parameter: cbSuccess(link)
    	 * @param {function} cbErr
    	 * 				Error Callback: an optional callback when there is an error.
    	 * @return {object} deferred
    	 */
    	_url: function(action, cbSuccess, cbErr) {

    		var dfdURL = $.Deferred();

    		// make sure our __url is defined!
    		if ('undefined' == typeof this.__url) this.__url = {};

    		var _self = this;
    		var processURL = function( link) {

    			// save url:
    			_self.__url[action] = link;

    			// callbacks get processed first:
    			if (cbSuccess) {  cbSuccess(link); }

    			dfdURL.resolve(link);
    		}


    		// if we already have our __url.action then just return it:
    		if ('undefined' != typeof this.__url[action]) {

    			processURL(this.__url[action]);

    		} else {

    			// so we need to look up our url.action
    			var urlFound = AD.Comm.API.link(this._adModule, this._adResource, action);
    			$.when(urlFound)
    				.then(function(link){
    					processURL(link);
    				})
    				.fail(function(err){
    					if (cbErr) {  cbErr(err); }

    	    			dfdURL.reject(err);
    				})
    		}

            return dfdURL;


/*

    	    if (typeof this._url == 'undefined') {

    	        if (typeof this._adUrl != 'undefined') {
    	            this._url = this._adUrl;
    	        }
    	        else {
            		// service calls in format:
                	//		/[moduleName]/[serviceName]
                	//		/[moduleName]/[serviceName]/[actionName]

            		var url = '/'+this._adModule+'/'+this._adService;

                	// if ActionName provided:
                	if (this._adAction != '') url += '/'+this._adAction;
                	this._url = url;
    	        }
    	    }

        	return this._url;
*/
    	},



        __action: function(urlKey, attrib, onSuccess, onError ){

            var thisModel = this;

        	//// To properly propagate the data through this process, each method must return the
            //// data to be passed on to the next step.
            //// Instead of counting on the programmers to remember to return a copy of the data, we
            //// default to passing the data along if nothing was returned.
            var mySuccess = function(data) {
            	if(onSuccess) {
	            	var tData = onSuccess(data);
	            	if (tData) return tData;  // if they did pass back data, return that.
            	}
            	return data; // otherwise return the original data
            }

            var myError = function(data) {
            	if (onError) {
	            	var tData = onError(data);
	            	if (tData) return tData;
            	}
            	return data;
            }


            var dfd = $.Deferred();

            // verify urlKey
            if ('undefined' == typeof AD.ServiceModel[urlKey]) {
            	var error = { id:55, message:'unrecognized action['+urlKey+'] module['+this._adModule+'] resource['+this_adResource+']'};
            	console.error(error.message);
            	dfd.reject(error);
            	return dfd;
            }

            // lookup URL
            var self = this;
            var urlFound = this._url(urlKey);
            $.when(urlFound)
            	.then(function(link){

            		// url is a template, so fill it out:
            		var uri = AD.Comm.API.uri(link, attrib);
            		uri = uri.replace('[id]', attrib[thisModel.id]);

            		// check for required parameters:
            		var goodParams = true;
            		var params = AD.Comm.API.params(link, attrib);
            		for (var p in params) {
            		    var value = params[p];
            		    if (value == '['+p+']') {
            		        goodParams = false;
            		        console.err(' required parameter missing! : ['+p+']');
            		    }
            		}

            		if (!goodParams) {
            		    // Hey!  we didn't get a required parameter!
            		    // so do we fail here?
            		}

            		params = attrib;  // make sure to send all given values back.

            		var verb = link.method.toLowerCase();
            		AD.ServiceModel[urlKey]({
            			verb: verb,
            			url:  uri ,
            			params: params,
            			success: self.callback(['_returnModels', mySuccess, dfd.resolve]),
            			failure: self.callback([myError, dfd.reject])
                    });
            	});



            return dfd;

        },


 /*
        find: function(params, onSuccess, onError ){

        	var url = this.url(params);
            return this.__find(url, params, onSuccess, onError);

        },

*/

        findAll: function(params, onSuccess, onError ){

            return this.__action('findAll', params, onSuccess, onError);

        },



        findOne : function(params, onSuccess, onError){

            return this.__action('findOne', params, onSuccess, onError);

        },



        create : function (attr, onSuccess, onError ) {

            return this.__action('create', attr, onSuccess, onError);

        },


        // javascriptMVC API: $.Model.destroy(id, success, error)
        destroy : function (id, onSuccess, onError ) {

            var attr = {
                    id: id
            };
//  TODO:          attr[]  // also put in the Obj.primaryKey attr[pkey]=id;
            return this.__action('destroy', attr, onSuccess, onError);

        },


        // javascriptMVC API: $.Model.update(id, attrs, success(attrs), error)
        update : function(id, params, onSuccess, onError){

            return this.__action('update', params, onSuccess, onError);

        },



        ////--------------------------------------------------------------
        listIterator: function (param) {
            //// return a ListIterator object that is based upon this Model
            ////
            //// param : (object) Key=>Value conditional lookup values

            return new AD.ListIterator({
                dataMgr:this,
                lookupParams: param
                });

        },



        listManager: function(param) {

        	console.warn('using listManager is deprecated!');
        	return this.listIterator(param);
        },




        _returnModels: function(list) {

        	var newList = list;

        	if (newList == null) return newList;

        	if (typeof newList.length != 'undefined'){
        		// if a Model Object was given, then convert each entry
        		// to an instance of that Object.
        		if (this._adModel != null) {
        			var convertedList = [];
        			var length = list.length;
        			for (var i=0; i< list.length; i++) {

        				var obj = new this._adModel(list[i]);
        				convertedList.push(obj);
        			}
        			newList = convertedList;

        		} else if (typeof this.labelKey != 'undefined') {


        			// make sure this list contains instances of this
        			// Service object
        			var convertedList = [];
        			for (var i=0; i< list.length; i++) {
        				var obj = new this(list[i]);
        				convertedList.push(obj);
        			}
        			newList = convertedList;


        		} else {

        			console.error('instances of ['+this._adModule+']/['+this._adService+']/['+this._adAction+'] have no getLabel()/getID().  This is bound to break something!');

        		}
        	}

        	// new changes in javascriptMVC v3 : uses .apply to call our callbacks!
            // we now need to indicate that we need to ._use_call instead:
            newList._use_call = true;
        	return newList;
        },





/*
        verifyLangCode: function( param ) {

            // Multilingual Tables require a language_code
            // to be submitted.  if none provided, then
            // get currentLangKey from our Multilingual System:
            //
            if (typeof param.language_code == 'undefined') {
                param.language_code = AD.Lang.Labels.getCurrLangKey();
            }

            return param;
        },







        update: function (id, attr, onSuccess, onError ) {

            if (this._isMultilingual) {

                attr = this.verifyLangCode(attr);

                // multilingual tables don't allow you to set the
                // language_code directly.
                var langCode = attr.language_code;
                delete attr.language_code;

                attr.dbCond = 'language_code="'+langCode+'"';

            }


//// TODO: should probably make sure attr doesn't include this.id

            //// See note on _find() method
            var mySuccess = function(data) {
            	if(onSuccess) {
	            	var tData = onSuccess(data);
	            	if (tData) return tData;  // if they did pass back data, return that.
            	}
            	return data; // otherwise return the original data
            }

            var myError = function(data) {
            	if (onError) {
	            	var tData = onError(data);
	            	if (tData) return tData;
            	}
            	return data;
            }


            var dfd = $.Deferred();
            AD.ServiceModel.update({
                url:  '/query/update/'+this._adModule+'/'+this._adModel+'/'+id+'.json',
                params: attr,
                success: this.callback([mySuccess, dfd.resolve]),
                failure: this.callback([myError, dfd.reject])
            });
            return dfd;

        },



        destroy: function (id, onSuccess, onError ) {

            var params = {};

            if (typeof id != 'undefined') {

                if (isNaN(id)) {

                    // ok we're assuming this is a db condition here:
                    params.dbCond = id;
                    id = -1;

                }

                //// See note on _find() method
	            var mySuccess = function(data) {
	            	if(onSuccess) {
		            	var tData = onSuccess(data);
		            	if (tData) return tData;  // if they did pass back data, return that.
	            	}
	            	return data; // otherwise return the original data
	            }

	            var myError = function(data) {
	            	if (onError) {
		            	var tData = onError(data);
		            	if (tData) return tData;
	            	}
	            	return data;
	            }


                var dfd = $.Deferred();
                AD.ServiceModel.destroy({
                    url:  '/query/destroy/'+this._adModule+'/'+this._adModel+'/'+id+'.json',
                    params: params,
                    success: this.callback([mySuccess, dfd.resolve]),
                    failure: this.callback([myError, dfd.reject])
                });
                return dfd;

            } else {

                var dfd = $.Deferred();

                var error = {
                    success:false,
                    errorMsg:'id is undefined ... why!?!'
                    }

                if (typeof onError != 'undefined') {
                    onError(error);
                }

                dfd.reject(error);

                return dfd;

            }

        },

*/




/*
        model: function (data) {
//            var model = new this(data);
//            model.getLabel = function() { return this._super() };
//            return model;
              return new this(data);
        },



        ////--------------------------------------------------------------
        _new: function (data) {
            //// in order to make the client side model operate like the
            //// serverside version, we're including this method.
            return this.model(data);
        }
*/

    },
    {

        ////
        //// Instance Methods:
        //// each instance of this object will have these methods defined.
        ////
        //// inside these fn() the this refers to the instanced object.


    	////--------------------------------------------------------------
    	bindToForm: function( el ) {
    		// initialize any data elements in the given el object with
    		// the default values of this instance

    		var _self = this;

    		// data elements will have attributes of 'data-bind="[attributeName]"'
    		// so for each element that has a 'data-bind' attribute:
    		el.find('[data-bind]').each(function(a1, a2){


        		var element = $(this);
        		var key = element.attr('data-bind');
        		var value = '';
        		if (typeof _self[key] == 'function') {
        			value = _self[key]();
        		} else {
        			value = _self.attr(key);
        		}

        		// Use .val() on inputs and .text() on other elements
                if (element.is(':input')) {
                    element.val(value).trigger('AD.bindToForm');
                }
                else {
                    element.text(value);
                }

        	});

    	},



    	clear: function() {
    	    // clear out our values

    	    var fields = this.attrs();
    	    for (var f in fields) {
    	        this.attr(f,''); // [Q]: should this be null ?
    	    }

    	},



    	loadFromDOM: function( el ) {

    		var _self = this;

    		// data elements will have attributes of 'data-bind="[attributeName]"'
            // so for each element that has a 'data-bind' attribute:
            el.find('[data-bind]').each(function(){

                var element = $(this);
                var key = element.attr('data-bind');

                // Use .val() on inputs and .text() on other elements
                var value;
                if (element.is(':checkbox')){
                	if (element.attr('checked')){
                		value = true;
                	}
                }
                else if (element.is(':input')) {
                    value = element.val();
                }
                else {
                    value = element.text();
                }

                if (value !== undefined) {
                    _self.attr(key, value);
                }

            });

    	},



        ////--------------------------------------------------------------
        getID: function () {
            // return the current primary key value of this instance.
            // if the pk value is not defined, return -1

            if (typeof this[this.Class.id] != 'undefined') {
                return this[this.Class.id];
            }
            return -1;

        },



        ////--------------------------------------------------------------
        getLabel: function() {
            // return the current value of the defined label field.
            // if the label value is not defined, return the primarykey

            if (typeof this.Class.labelKey == 'undefined') {
                this.Class.labelKey = this.Class.id; // better have this one!
            }

            return this[this.Class.labelKey];
        }

    });
