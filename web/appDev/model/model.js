   /**
    *
    * @class AD_Client.Model
    * @parent AD_Client
    *
    * the Model object defines a standard way of how our client side Models
    * communicate with the server side models.
    *
    * How to use:
    *  to make a new Viewer Model obj:
    *  @codestart
    *        AD.Model.extend("Viewer",
    *        {
    *            _adModule:'test',
    *            _adModel:'viewer',
    *            id:'viewer_id',
    *            labelKey:'viewer_guid',
    *            _isMultilingual:false
    *
    *        },
    *        {});
    *  @codeend
    *
    * to use instance of Viewer:
    *  @codestart
    *      var skipper = new Viewer({viewer_guid:'skipper'}); // creates a local copy in client
    *      (or:  var skipper = Viewer._new({viewer_guid:'skipper'});  )
    *
    *      skipper.save();  // <-- creates a copy on the server
    *
    *      skipper.attr('viewer_guid', 'sk1pp3r'); // sets value
    *      var guid = skipper.attr('viewer_guid'); // gets value
    *
    *      skipper.save();  // <-- updates the copy on the server
    *
    *      skipper.destroy();  // <-- deletes copy on the server
    *
    *      skipper.findAll( {}, function (data) {
    *              // data is an array of object instances of Viewer
    *              var html = '';
    *              for(var dI=0; dI<data.length; dI++) {
    *                  html += '<li>'+data[dI].attr('viewer_guid')+'</li>';
    *              }
    *              $('#'+data[dI].attr('viewer_guid')).html( html);
    *
    *          }, function (data) {
    *              // error handling routine
    *      });
    *  @codeend
    *
    */
    $.Model.extend("AppDev.Model",
    {
        ////
        //// Class Methods
        //// These methods are defined as part of the Object/Class.  So you
        //// can do Object.findAll();
        ////
        //// the children will also be able to access these.  However
        //// when calling  skipper.findAll(), the 'this' inside the fn()
        //// doesn't necessarally point to skipper.

/*
        findAll: function(params, onSuccess, onError ){

            if (this._isMultilingual) {
                params = this.verifyLangCode(params);
            }

            var self = this;

            return AD.ServiceModel.findAll({

                url:  '/query/findall/'+this._adModule+'/'+this._adModel+'.json' ,
                params: params,
                success: this.proxy(['wrapMany',onSuccess]),
                failure: onError,

            });

        },

*/

//// Question: do we like allowing the given onSuccess fn() to
//// modify what is passed to the defered.resolve() ?
////
//// if not, we could do:
////
////    success: function (data) {
////        var wrapped = this.wrapMany(data);
////        onSuccess(wrapped);
////        dfd.resolve(wrapped);
////    }
////        (or maybe this is passed by ref and wont work too...)


        findAll: function(params, onSuccess, onError ){

            params = this.verifyLangCode(params);

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
            AD.ServiceModel.findAll({

                url:  '/query/findall/'+this._adModule+'/'+this._adModel+'.json' ,
                params: params,
                success: this.proxy(['models',mySuccess, dfd.resolve]),
                failure: this.proxy([myError, dfd.reject])

            });
            return dfd;

        },



        findOne : function(params, onSuccess, onError){

            var id = params[this.id];
            delete params[this.id];


            params = this.verifyLangCode(params);


            //// see notes on findAll() ...
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
            AD.ServiceModel.findOne({
                url:  '/query/findone/'+this._adModule+'/'+this._adModel+'/'+id+'.json',
                params: params,
                success: this.proxy(['model',mySuccess, dfd.resolve]),
                failure: this.proxy([myError, dfd.reject])
            });
            return dfd;

        },



        verifyLangCode: function( param ) {

            // Multilingual Tables require a language_code
            // to be submitted.  if none provided, then
            // get currentLangKey from our Multilingual System:
            //
        	if (this._isMultilingual) {
	            if (typeof param.language_code == 'undefined') {
	                param.language_code = AD.Lang.Labels.getCurrLangKey();
	            }
        	}

            return param;
        },



        create : function (attr, onSuccess, onError ) {

            if (this._isMultilingual) {
                attr = this.verifyLangCode(attr);
            }


//// TODO: should probably make sure attr doesn't include this.id

            //// see notes on findAll() ...
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
            AD.ServiceModel.create({
                url:  '/query/create/'+this._adModule+'/'+this._adModel+'.json',
                params: attr,
                success: this.proxy([mySuccess, dfd.resolve]),
                failure: this.proxy([myError, dfd.reject])
            });
            return dfd;

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

            //// see notes on findAll() ...
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
                success: this.proxy([mySuccess, dfd.resolve]),
                failure: this.proxy([myError, dfd.reject])
            });
            return dfd;

        },



        destroy: function (id, onSuccess, onError ) {

            var params = {};


            //// see notes on findAll() ...
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


            if (typeof id != 'undefined') {

                if (isNaN(id)) {

                    // ok we're assuming this is a db condition here:
                    params.dbCond = id;
                    id = -1;

                }


                var dfd = $.Deferred();
                AD.ServiceModel.destroy({
                    url:  '/query/destroy/'+this._adModule+'/'+this._adModel+'/'+id+'.json',
                    params: params,
                    success: this.proxy([mySuccess, dfd.resolve]),
                    failure: this.proxy([myError, dfd.reject])
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



        model: function (data) {
            if (data === null) {
                return data;
            }
            return new this(data);
        },



        models : function(data){
            // new changes in javascriptMVC v3 : uses .apply to call our callbacks!
            // we now need to indicate that we need to ._use_call instead:

            // if we returned an empty data set, but we did our little [ [] ] fix
            // undo that here so we don't actually get an empty model back!
            if ('undefined' != typeof data.__ad_warn_empty) {
                data = [];
                data._use_call = true;
                return data;
            }

            // this is normal call with data
            var data = this._super(data);
            data._use_call = true;

            return data;
        },



        ////--------------------------------------------------------------
        _new: function (data) {
            //// in order to make the client side model operate like the
            //// serverside version, we're including this method.
            return this.model(data);
        }

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

                // This is handled differently for different elements
                if (element.is(':checkbox')) {
                    if (value == '1' || value == 1 || value == true)
                        element.prop('checked', true);
                    else
                        element.prop('checked', false);
                } else if (element.is(':input')) {
                    // Not tested for radios
                    element.val(value).trigger('AD.bindToForm');
                } else {
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

                // This is handled differently for different elements
                var value;
                if (element.is(':checkbox')) {
                    // Returns a boolean
                    // But server side expects 1 or 0, so we'll pass that
                    // TODO: Server should also allow true or false
                    value = element.prop('checked') ? 1 : 0;
                } else if (element.is(':input')) {
                    // Untested for radios
                    value = element.val();
                } else {
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
