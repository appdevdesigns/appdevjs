////
//// dataManager
////
//// A generic object for receiving client data object CRUD operations.
////
//// This object maintains the data structure for a given data unit
//// (db table) and any necessary connectivity info for it's DataStore 
//// object.
//// 
//// 

var log = AD.Util.Log;
var $ = AD.jQuery;

var DataStore = AD.Model.Datastore;


module.exports = $.Model('AD.Model.ModelSQL', {
	init: function(options) {
	},
	
    // Constructor function aliases
    _new: function(attrs) {
        return new this(attrs);
    },
    _model: function(attrs) {
        return new this(attrs);
    },
    
    // return the this.__hub.publish(key, data)  key for this model object.
    // all Model objects will define a default key as [Module].[Model]
    // each CRUD operation then appends a verb to the end: [Module].[Model].verb
    _notificationKey: function() {
        return this.__adModule + '.' + this.__adModel;
    },
    
    // Checks whether the viewer has the right permissions to request the
    // model query.
    //
    // This will be based on the `permittedRoles` and/or the `permittedTasks`
    // properties listed in the model definition.
    //
    // Currently, this is an all or nothing check. The viewer will either have 
    // full access to the model, or none at all. If finer grained access is 
    // needed for your model, please implement this function in its model 
    // definition.
    hasPermission: function(req) {
        // By default if no roles or tasks specified by the model, then
        // it is open to all.
        var isValid = true;

        if (this.permittedRoles) {
            isValid = false;
            // Viewer must at least one permitted role
            for (var i=0; i<this.permittedRoles.length; i++) {
                if (req.aRAD.viewer.hasRole(this.permittedRoles[i])) {
                    isValid = true;
                }
            }
        }
        
        if (isValid && this.permittedTasks) {
            isValid = false;
            // Viewer must at least one permitted task
            for (var i=0; i<this.permittedTasks.length; i++) {
                if (req.aRAD.viewer.hasTask(this.permittedTasks[i])) {
                    isValid = true;
                }
            }
        }
        
        return isValid;
    },
    
    // Return an object representing the model of the Table we are managing:
    //  key:value pairs of all table entries.
    getModel: function() {
        return this.modelData;
    },
    
    // Return an object representing the current request for this table
    //  key:value pairs of all table entries
    getCurrentDataMgr: function(currModel, otherParams) {
        return AD.jQuery.extend({
            dbName: this.dbName ||  AD.Defaults.dbName,
            dbTable: this.dbTable,
            model: currModel,
            tableInfo: this.modelFields
            //tableInfo: this.
        }, otherParams);
    },
    
    // Evaluates whether or not the given keyName is the primary key for this table.
    isAPrimaryKey: function(name) {
        return this.primaryKey === name;
    },
    
    condFromReq: function(req) {
        // get a reference to the data from the submission:
        var providedData = AD.jQuery.extend({}, req.body, req.query);
        return providedData.dbCond || '';
    },
    
    loadFromReq: function(req, allowFilters) {
        var curModel = {};

        if (req == null)  return curModel;

        var providedData = AD.jQuery.extend({}, req.body, req.query);
        
        // search each body value for Model info and store them:
        for (var key in providedData) {
        
            //if modelKey is in this.modelFields then store it:
            if ( (typeof this.modelFields[key] != 'undefined')
                || (key == 'language_code')
                || (allowFilters && this.filters && (typeof this.filters[key] != 'undefined')) ) {

                // store the value
                curModel[key] = providedData[key];
            }
        }
        
        return curModel;
    },
    
    langFromReq: function(req) {
        var curModel = {};

        if (req == null)  return curModel;

        var providedData = AD.jQuery.extend({}, req.body, req.query);
        
        // search for language
        var key = 'language_code';
        if (typeof providedData[key] != 'undefined') {
            // store the value
            curModel[key] = providedData[key];
        }
        
        return curModel;
    },
    
    
    create: function (attr, onSuccess, onError ) {
        ////  mimic the create() behavior just like the Client Side code.
        ////
        
        var dfd = $.Deferred();
        this.createFromReq({
            id:-1,
            req:{
                query:attr
            },
            callback:function(err, data) {
                if (err) { 
                    if (typeof onError != 'undefined')  onError( err ); 
                    dfd.reject(err);
                }
                else {
                    // must return { id: new ID value }
                    if (typeof onSuccess != 'undefined') onSuccess(data);
                    dfd.resolve(data);
                }
            }
        });
        return dfd;
    },
    createFromReq: function (params) {

        var req = params.req;
        var callback = params.callback;


        // create a temporary obj for this transaction:
        var currModel = this.loadFromReq(req);

        var curDataMgr = this.getCurrentDataMgr(currModel);

        // if this.isDataValid() 
        
        var primaryKey = this.primaryKey;
        
        var returnObj = { };
        returnObj[primaryKey] = '-1';
        
        var _self = this;
        return DataStore.create( curDataMgr, function( err, data) {   
        
            // if we have a notification hub defined:
            if (_self.__hub != null) {
                
                // Publish a .created notification for this Model:
                // published data:  { id: [newPrimaryKeyValue] }
                var subscriptionKey = _self._notificationKey() + '.created';
                _self.__hub.publish(subscriptionKey, {id:data});
            } 
            
            
            
            // the mysql obj returns the insertID of the new row.
            // here we package it in an obj that reflects this object's 
            // primaryKey field
            returnObj[primaryKey] = data;
            
            callback(err, returnObj);
            
        });  // returns True|False
    },
    
    
    
    update: function (id, attr, onSuccess, onError ) {
        ////  mimic the create() behavior just like the Client Side code.
        ////
//console.log('model_SQL.update();');
 
        var dfd = $.Deferred();
        this.updateFromReq({
            id:id,
            req:{
                query:attr
            },
            callback:function(err, data) {
                if (err) { 
                    if (typeof onError != 'undefined') onError( err ); 
                    dfd.reject(err);
                } else {
                    // must return { id: new ID value }
                    if (typeof onSuccess != 'undefined') onSuccess(data);
                    dfd.resolve(data);
                }
            }
        });
        return dfd;
    },
    
    
    
    updateFromReq: function (params) {
//console.log('model_SQL.updateFromReq()');
        if (typeof params.req == 'undefined') {
            console.log('invalid parameters provided:');
            console.log(params);
        }
        var req = params.req;
        var id = params.id;
        var callback = params.callback;
        

        // create a temporary obj for this transaction:
        var currModel = this.loadFromReq(req);
        
        var condition = this.condFromReq(req);

        var otherParams= {
                primaryKey:this.primaryKey,
                id:id,
                cond:condition
                };
        var curDataMgr = this.getCurrentDataMgr(currModel, otherParams);
            
    // if this.isDataValid() 

        var returnObj = { };
        
        var _self = this;
        
        DataStore.update( curDataMgr, function( err, data) {   
        
            // if we have a notification hub defined:
            if (_self.__hub != null) {
                
                // Publish an .updated notification for this Model:
                // published data:  { id: [newPrimaryKeyValue] }
                var subscriptionKey = _self._notificationKey() + '.updated';
                _self.__hub.publish(subscriptionKey, {id:id});
            }

            
            callback(err, returnObj);
            
        });  
    },
    
    
    
    destroy: function (id, onSuccess, onError ) {
        ////  mimic the create() behavior just like the Client Side code.
        ////
        
        var dfd = $.Deferred();
        this.destroyFromReq({
            id:id,
            req:{
                query:{}
            },
            callback:function(err, data) {
                if (err) { 
                    if (typeof onError != 'undefined') onError( err ); 
                    dfd.reject(err);
                }else {
                    
                    if (typeof onSuccess != 'undefined') onSuccess(data);
                    dfd.resolve(data);
                }
            }
        });
        return dfd;
    },
    
    
    
    destroyFromReq: function (params) {

        var req = params.req;
        var id = params.id;
        var callback = params.callback;

        // create a temporary obj for this transaction:
        var currModel = {};
        currModel[this.primaryKey] = id;
        

        var curDataMgr = this.getCurrentDataMgr(currModel);
            
    // if this.isDataValid() 

        var returnObj = { };
        var _self = this;
        
        DataStore.destroy( curDataMgr, function( err, data) {   
        

            // if we have a notification hub defined:
            if (_self.__hub != null) {
                
                // Publish a .destroyed notification for this Model:
                // published data:  { id: [newPrimaryKeyValue] }
                var subscriptionKey = _self._notificationKey() + '.destroyed';
                _self.__hub.publish(subscriptionKey, {id:id});
            }
            
            callback(err, returnObj);
            
        });  
    },
    
    
    
    findOne: function (attr, onSuccess, onError ) {
        ////  mimic the create() behavior just like the Client Side code.
        ////
        var query = {};
        var id = -1;
        if (typeof attr.id != 'undefined') id = attr.id;
        if (typeof attr[this.primaryKey] != 'undefined') id = attr[this.primaryKey];
    
        // Add in language code to query
        var key = 'language_code';
        if (typeof attr[key] != 'undefined') query[key] = attr[key];
    
        var _self = this;
        var dfd = $.Deferred();
        this.findoneFromReq({
            id:id,
            req:{
                query:query
            },
            callback:function(err, data) {
                if (err) { 
                    if (typeof onError != 'undefined') onError( err ); 
                    dfd.reject(err);
                }else {
                    // must return { id: new ID value }
                    
                    // we are returned an array of objects
                    // need to take the first and turn it into an Instance:
                    var instance = null;
                    if (typeof data[0] != 'undefined') {
                        instance = _self._new(data[0]);
                    }
                    
                    if (typeof onSuccess != 'undefined') onSuccess(instance);
                    dfd.resolve(instance);
                }
            }
        });
        return dfd;
    },
    
    
    
    // read a single entry from the DB (by ID)
    findoneFromReq: function (params) {

        var req = params.req;
        var id = params.id;
        var callback = params.callback;

        // create a temporary obj for this transaction:
        var currModel = this.langFromReq(req);
        currModel[this.primaryKey] = id;  // setup the pk=>id key=>value pair
        

        var curDataMgr = this.getCurrentDataMgr(currModel, {joinedTables: []});

        this.read(req, curDataMgr, callback);
    },
    
    
    
    findAll: function (attr, onSuccess, onError ) {
    ////mimic the create() behavior just like the Client Side code.
    ////
        var _self = this;
        
        var dfd = $.Deferred();
        this.findallFromReq({
            id:-1,
            req:{
                query:attr
            },
            callback:function(err, data) {
                if (err) { 
                    if (typeof onError != 'undefined') onError( err ); 
                    dfd.reject(err);
                }else {
                    
                    // we are returned an array of objects
                    // need to turn these into an array of Instances:
                    var listInstances =  [];
                    for(var i=0; i<data.length; i++) {
                        listInstances.push( _self._new(data[i]));
                    }

                    if (typeof onSuccess != 'undefined') onSuccess(listInstances);
                    dfd.resolve(listInstances);
                }
            }
        });
        return dfd;
    },

    
    
    // read multiple entries (can be conditioned by passed in parameters)
    findallFromReq: function (params) {

        var req = params.req;
        var callback = params.callback;
        
        
        // create a temporary obj for this transaction:
        var currModel = this.loadFromReq(req, true);

        var condition = this.condFromReq(req);

        // Take care of extra filter keys, if provided
        var joinedTables = this.getFilterJoins(currModel);

        var otherParams= {
            cond:condition,
            joinedTables: joinedTables
        };
        var curDataMgr = this.getCurrentDataMgr(currModel, otherParams);
        
        this.read(req, curDataMgr, callback);
    },
    
    
    
    read: function (req, curDataMgr, callback) {

        // First, do final preparation of the Data Manager.
        curDataMgr.selectedFields = { _empty: true };
        this.addLookupLabels(req, curDataMgr);
        this.prepForRead(req, curDataMgr);
        var selectedFields = (curDataMgr.selectedFields._empty) ? this.modelFields : curDataMgr.selectedFields;
        
        // Now, execute the read
        DataStore.read( curDataMgr, function(err, results, fields) { 
        
            // now return an object with all our key=>values set:
            var returnArray = [];
            
            var returnObj = {};
            
            if (err) {
            
                console.log(err);
            
            } else {
            
                if (results.length < 1) {
                
                    log(req,' returned results < 1  length['+results.length+']');
                    
                    //hope this doesn't break anything but how come we are returning an array with 1 empty object?
                    //array length with be zero now if no results
                    //returnArray.push(returnObj);
                
                } else {
                
                    for (var ri=0; ri < results.length; ri++) {

                        returnObj = {};
                        
                        for (var key in selectedFields) {
                        
                            if (typeof results[ri][key] != 'undefined') {
                            
                                returnObj[key] = results[ri][key];
                                
                            } else {
                            
                                log(req,' *** key['+key+'] not part of resultSet');
                            }
                            
                        }
                        
                        returnArray.push(returnObj);
                    
                    }
                }
                
            }
//            log(req, 'returnedData :');
//            log(req, returnArray);

    if (typeof callback == 'undefined') {
        LogDump(req, 'here is an error.');
        throw ('someone didnt include a req in the params to this fn()');
    }

            callback(err, returnArray);
            
        });  // returns True|False

    },
    
    
    
    getFilterJoins: function (currModel) {
        var joinedTables = [];
        if (this.filters) {
            for (var key in this.filters) {
                var filterTref = 1;
                if (typeof currModel[key] != 'undefined') {
                    // This key really belongs to another table; prepare the JOIN
                    var value = currModel[key];
                    
                    var keyArray = [];
                    
                    var joinKey = key;
                    var failure = false;
                    do {
                        keyArray.push(joinKey);
                        // problems!!!
                        if (typeof this.filters[joinKey] == 'undefined') {
                            failure = true;
                            break;
                        }
                        joinKey = this.filters[joinKey].foreignKey;
                    } while (typeof this.modelFields[joinKey] == 'undefined');
                    
                    var tref = ''
                    var joinToTref = 'p';
                    while (!failure && (keyArray.length > 0)) {
                        joinKey = keyArray.pop();
                        var joinedTable = copyTableInfo(this.filters[joinKey]);
                        tref = "f" + filterTref++;
                        joinedTable.tref = tref;
                        joinedTable.type = 'INNER';
                        joinedTable.joinToTref = joinToTref;
                        joinedTables.push(joinedTable);
                        joinToTref = joinedTable.tref;
                    }

                    if (!failure) {
                        // Remark the field in the current model (with tref)
                        currModel[key] = { tref: tref, value: value };
                    }
                }
            }
        }
        return joinedTables;
    },
    
    
    
    addLookupLabels: function (req, curDataMgr) {
        // Determine which fields need to be selected
        var tref;
        // Add any lookup labels to the selected fields
        if (typeof this.lookupLabels != 'undefined') {
            var lookupTref = 1;
            var langCode = curDataMgr.model['language_code'] || req.aRAD.viewer.languageKey;

            for (var key in this.lookupLabels) {
                // This key really belongs to another table; prepare the JOIN
                tref = "t" + lookupTref++;

                var joinedTable = copyTableInfo(this.lookupLabels[key]);
                joinedTable.tref = tref;
                joinedTable.type = 'LEFT';
                joinedTable.joinToTref = 'p';
                // Add the field's language code to the current model (with tref)
                joinedTable.condition = [{ tref: tref, key: 'language_code', value: langCode }];
                curDataMgr.selectedFields[joinedTable.label] = { tref: tref };
                curDataMgr.joinedTables.push(joinedTable);
                
            }
            curDataMgr.selectedFields._empty = false;
        }
    },
    
    
    prepForRead: function (req, curDataMgr) {
        // Get rid of the language code field, if it exists
//        delete curDataMgr.model['language_code'];
        
        // Add all server model fields if there are any JOINs to prevent duplicate fields in response
        if (curDataMgr.joinedTables.length > 0) {
            for (var key in this.modelFields) {
                // Set the tref for the primary table
                var tref = "p";
                curDataMgr.selectedFields[key] = { tref: tref };
                
                if (typeof curDataMgr.model[key] != 'undefined') {
                    // Remark the field in the current model (with tref)
                    var value = curDataMgr.model[key];
                    curDataMgr.model[key] = { tref: tref, value: value };
                }
            }
            curDataMgr.selectedFields._empty = false;
        }
    }
}, {});



var copyTableInfo = function(tableInfo) {
    var copiedInfo = {};
    copiedInfo.tableName = tableInfo.tableName;
    copiedInfo.foreignKey = tableInfo.foreignKey;
    if (typeof tableInfo.referencedKey != 'undefined') {
        copiedInfo.referencedKey = tableInfo.referencedKey;
    }
    if (typeof tableInfo.label != 'undefined') {
        copiedInfo.label = tableInfo.label;
    }
    return copiedInfo;
};
