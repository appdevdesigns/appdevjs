
// we depend on the AD.Lang.Key.LANGUAGE_SWITCH being set:
steal('/appDev/lang/multilingual.js').then(function($) {

   /**
    * @class AD_Client.ListIterator
    * @parent AD_Client
    *
    * the ListManager object provides an interface to manage a collection (0 or 
    * more) of Model instances.  A single ListManager can be shared among several
    * widgets to provide them their data.
    * 
    * How to use:
    * -----------
    *
    *  get a ListManager from a Model object:
    *  @codestart
    *        var listViewers = Viewer.listManager({ viewer_isActive:1 });
    *              (the provided param object is used as param to findAll();)
    *  @codeend
    *
    *  pass the ListManager to your widgets:
    *  @codestart
    *        $('#someDiv').appDev_nifty_widget({
    *              dataManager:listViewer
    *              });
    *  @codeend
    *
    *  if you want to be alerted when the data in the list changes:
    *  @codestart
    *        listViewers.bind('change', function () {  // do stuff });
    *  @codeend
    *
    *  To reload the data in the ListManager using bind/trigger
    *  @codestart
    *      listViewers.refresh();
    *      listViewers.findAll({ attrib:value });
    *  @codeend
    *          (when these complete, listViewers.trigger('change') will fire)
    *
    *
    *  To reload the data in the ListManager using deferreds:
    *  @codestart
    *      var loaded = listViewers.refresh();
    *      var loaded = listViewers.findAll({ attrib:value });
    *
    *      $.when(loaded).then(function () { // do stuff });
    *  @codeend
    *
    *
    *  These are intended to be use with 1 driver and many listeners.  If  
    *  you have numerous drivers, expect some confusion ...   
    *  
    *  
    *  Notes on the lookup parameters:
    *  
    *  When creating a list manager, you can provide it an optional set of
    *  lookup parameters.  In the example, lookup parameter filters the list
    *  of viewers to only provide active viewers:
    *  @codestart
    *        var listViewers = Viewer.listManager({ viewer_isActive:1 });
    *  @codeend
    *  
    *  The lookup parameters can be changed after creation using setLookupParams().
    *  @codestart
    *        listViewers.setLookupParams({ viewer_isActive:1 });
    *  @codeend
    *  
    *  The lookup parameters remain active as a filter until they are changed.
    *  For example, when a findAll() is performed, the parameters provided
    *  to the findAll() are combined with the lookup parameters.  The following
    *  will find active viewers with the given userID
    *  @codestart
    *        listViewers.findAll({ viewer_userID:'jdoe' });
    *  @codeend
    *  
    *  However the lookup parameters can be temporarily overridden with:
    *  @codestart
    *        listViewers.findAll({ viewer_userID:'jdoe', viewer_isActive:0 });
    *  @codeend
    *  
    */
    AD.ListIterator = Base.extend({
    
    
        constructor : function ( settings ) {


            this.dataMgr = null;        // the Model Object we are managing
            this.lookupParams = null;   // params for this.dataMgr.findAll(this.lookupParams);
            
            for(var s in settings) {
                this[s] = settings[s];
            }
            
            this.listData = [];         // raw array of Models returned
            this.idLookup = {};         // id look up:  this.idLookup[ModelObj.primaryKeyValue] = ModelObj;
            this._events = {};          // Our Event Triggering object
            
            
            this.defID = null;          // Deferred Obj
            
            if (this.lookupParams != null) {
            
                this.findAll(this.lookupParams);
            }
        
        },
        
        
        
        //------------------------------------------------------------------
        clear: function ( ) {
            // clear the entries in this list.
            
            // set ourselves to an empty array
            this.setEntries([]);
        },
        
        
        
        //------------------------------------------------------------------
        create: function ( data, onSuccess, onError ) {
            // use the ListIterator to create a new entry
            
            return this.dataMgr.create(data, onSuccess, onError);
        },
        
        
        
        //------------------------------------------------------------------
        destroy: function ( data, onSuccess, onError ) {
            // use the ListIterator to destroy an entry
            
            return this.dataMgr.destroy(data, onSuccess, onError);
        },


        
        //------------------------------------------------------------------
        each: function ( callback ) {
            // call callback with each of our data objects
            //
            // 
            if (typeof callback != 'undefined') {
                for (var indx=0; indx< this.listData.length; indx++) {
                
                    callback(this.listData[indx]);
                }
            }

        },

        
        
        //------------------------------------------------------------------
        /**
         * @function entryByID
         * Returns the model object with the given id
         * @codestart
         * var entry = listManager.entryByID(4); // NOTE: this is not the index.
         * @codeend
         * @param {Int} id The id of the entry we want returned. (same as entry.getID() )
         * @return {Object} The model object that has the given id.  if not found, null;
         */
        entryByID: function( id) {
            
            // if no entry is found -> null
            var entry = null;
            
            // if our data contains the given id
            if ( typeof this.idLookup[id] != 'undefined') {
                
                // get that entry
                entry = this.idLookup[id];
                
            }
            
            return entry;
        },
        
        // Force the list to a desired set of values.
        // Provide an array of appropriate model objects
        setEntries: function(data) {
            this.updateEntries(data);

            // trigger 'change'
            this.trigger('change');
        },

        updateEntries: function(data) {
            this.listData = data;
            this.idLookup = {};
            var id = this.dataMgr.id;
            for (var indx =0; indx<data.length; indx++) {
                
                this.idLookup[data[indx][id]] = data[indx];
            }
        },
        
        
        //------------------------------------------------------------------
        findAll: function ( param, onSuccess, onError ) {
            // initiate a load using the dataMgr.
            //
            //  param : (object) parameter definition for dataMgr.findAll()
            
            var defID = $.Deferred();
            // save off the most recent deferred object for loaded()
            // must use the local variable for resolve/reject due to race conditions
            this.defID = defID;
                
            var self = this;

            param = $.extend({}, this.lookupParams, param || {});
            var dataMgrDef = this.dataMgr.findAll(param, null, null);


            $.when(dataMgrDef).done(function (data) {
                
                self.lookupParams = param;  // store the last successful set of parameters.
                
                // Update our list
                self.updateEntries(data);
                
                // Call onSuccess if provided
                if (typeof onSuccess != 'undefined') {
                    onSuccess(data);
                }
            
                // trigger 'change'
                self.trigger('change');
                defID.resolve(data); 
            
            })
            .fail(function (data){
                // Call onError if provided
                if (typeof onError != 'undefined') {
                    onError(data);
                }
            
                // trigger 'error'
                self.trigger('error');
                defID.reject(data); 
            });
            
            return defID.promise();
                
        },

        
        
        //------------------------------------------------------------------
        /**
         * @function instance
         * Return an instance of the dataManager.  
         */
        instance: function(attr) {
            return new this.dataManager(attr);
        },


        
        
        //------------------------------------------------------------------
        /**
         * @function setLookupParams
         * Provide a set of attributes to filter the lookup.  
         */
        setLookupParams: function(lookupParams) {
            this.lookupParams = lookupParams;
        },
        
        
        
        //------------------------------------------------------------------
        /**
         * @function length
         * Returns the number of entries currently in this list
         * @codestart
         * if (listManager.length() > this.pageSize) {
         *     this.showPager();
         * }
         * @codeend
         * @return {Integer} The number of items in this list
         */
        length: function() {
            
            return this.listData.length;
        },
        
        
        
        //------------------------------------------------------------------
        loaded: function () {
            // returns the deferred obj. for use in widgets to know when
            // to load data from this list
            //
            if (this.defID == null) {
            	// if no deferred obj has been created, then go ahead and 
            	// create one, resolve it with empty data, so the attached 
            	// widgets can get on with displaying empty data...
            	this.defID = $.Deferred();
            	this.defID.resolve([]);
            }
            return this.defID.promise();

        },
        
        
        
        //------------------------------------------------------------------
        /**
         * @function _new
         * Returns an empty instance of the associated data manager
         * @codestart
         * var newRen = renList._new({ surname:'Anderson', givenname:'Neo' });
         * @codeend
         * @param {Object} An object with the initial values for the new instance
         * @return {Object} A new unsaved instance
         */
        _new: function (params) {
            // returns the deferred obj. for use in widgets to know when
            // to load data from this list
            //
            params = $.extend({}, this.lookupParams, params || {});
            
            return new this.dataMgr(params);

        },
        
        
        
        bind: function(eventKey, handler, context) {
        
        
            if (typeof this._events[eventKey] == 'undefined') {
            
                this._events[eventKey] = [];
            
            }
            
            var obj = {
                handler: handler,
                context: context
                }
            this._events[eventKey].push(obj);
        
        },
        
        
        
        unbind: function( eventKey, handler) {
        
            if (typeof this._events[eventKey] != 'undefined') {
            
                var handlers = this._events[eventKey];
                for(var indx=0; indx< handlers.length; indx++) {
                
                    if ( handler == handlers[indx].handler) {
                        this._events[eventKey].splice(indx, 1);
                    }
                }
            
            }
        
        },
        
        
        
        trigger: function (eventKey) {
        
            if (typeof this._events[eventKey] != 'undefined') {
            
                var handlers = this._events[eventKey];
                for(var indx=0; indx< handlers.length; indx++) {
                
                    handlers[indx].handler.call(handlers[indx].context);
                }
            
            }
        
        },
        
        
        
        
        refresh: function (onSuccess, onError) {
            return this.findAll(null, onSuccess, onError);
        }

        
    });
    
    
});

//// TODO:
////    - if provided this.dataManager.isMultilingual == true then listen 
////        for language setting (AD.Lang.Key.LANGUAGE_SWITCH) notifications
////        and then spawn a refresh() action.