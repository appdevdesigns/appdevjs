////
//// dataManagerMultilingual
////
//// A generic object for receiving client data object CRUD operations for
//// Multilingual Tables.
////
//// This object maintains the data structure for a given data unit
//// (db table) and any necessary connectivity info for it's DataStore
//// object.
////
////

var log = AD.Util.Log;

var DataStore = {};


if (AD.Defaults.dataStoreMethod == AD.Defaults.DATASTORE_MYSQL) {
    DataStore = require('./dataStore/dataStore_MySQL');
}

// Inherit from AD.Model.ModelSQL
module.exports = AD.Model.ModelSQL('AD.Model.ModelSQLMultilingual', {
	extend: function() {
		var DerivedClass = this._super.apply(this, arguments);

		// Whenever a class is created that derives from this class, after creating the class...
		DerivedClass.dbTable = (DerivedClass.tables && DerivedClass.tables.data) || '';
        DerivedClass.createModel();

        return DerivedClass;
	},

    //Evaluates whether or not the given keyName is the primary key for this table.
    isAPrimaryKey: function( name ) {
        return ((this.primaryKey === name) || (this.primaryKey === 'Trans_id'));
    },

    createModel: function () {
        // Merge this.fields.data and this.fields.trans
        this.modelFields = AD.jQuery.extend({}, this.fields.data, this.fields.trans);
    },

    fromTable: function () {
        var dbName = this.dbName || AD.Defaults.dbName;
        return dbName+'.'+this.tables.data+' as d  INNER JOIN ' + dbName + '.' + this.tables.trans + ' as t ON d.' + this.primaryKey + '=t.' + this.primaryKey;

    },

    createFromReq: function (params) {

        var req = params.req;
        var callback = params.callback;


 //       req.query.language_code = req.query.language_code || 'en'; /// TODO: should be site default


        // create a temporary obj for this transaction:
        var currModel = this.loadFromReq(req);


        // perform Data Table creation:
        var fields = {};
        for (var fieldI in this.fields.data) {
            if (typeof currModel[fieldI] != 'undefined') {
                fields[fieldI] = currModel[fieldI];
            }
        }
        var curDataMgr = this.getCurrentDataMgr(fields);


        // if this.isDataValid(create, data)

        var primaryKey = this.primaryKey;

        var returnObj = { };
        returnObj[primaryKey] = '-1';


        // keep track of DataManagerMultilingual obj as 'self'
        var self = this;


        // this is data table update, so no language_code
        if (typeof curDataMgr.model['language_code'] != 'undefined'){
            delete curDataMgr.model['language_code'];
        }

        return DataStore.create( curDataMgr, function( err, data) {


            // the mysql obj returns the insertID of the new row.
            // here we package it in an obj that reflects this object's
            // primaryKey field
            returnObj[primaryKey] = data;


            // list of all the remaining updates to perform
            var listUpdates = [];


            // this is a multilingual entry: so make sure language_code is set:
            currModel['language_code'] = currModel['language_code'] || 'en'; /// TODO: should be site default

            //// Now that our data update worked,
            //// create the corresponding Trans Entries
            var fields = {};
            for (var fieldI in self.fields.trans) {
                if (typeof currModel[fieldI] != 'undefined') {
                    fields[fieldI] = currModel[fieldI];
                }
            }
            fields[primaryKey] = data;
            var curDataMgr = self.getCurrentDataMgr(fields, {dbTable:self.tables.trans});


            listUpdates.push( curDataMgr );


            // this was for the provided language code
            var providedLangCode = fields.language_code;


            // all the remaining language codes need entries as well:
            var listAllLanguages = AD.Lang.listLanguages; //req.aRAD.response.listLanguages;
            for (var langI=0; langI<listAllLanguages.length; langI++) {

                // if this is not the provided language code
                var curLangCode = listAllLanguages[langI].language_code;
                if (curLangCode != providedLangCode) {


                    //// create a new data manager for this new language

                    // new copy of the fields
                    var newFields = {};
                    for(var fieldI in fields) {
                        newFields[fieldI] = fields[fieldI];
                    }
                    newFields['language_code'] = curLangCode;


                    // for each of our multilingual fields
                    for(var mlI=0; mlI< self.multilingualFields.length; mlI++) {

                        if (typeof fields[fieldKey] != 'undefined') {
                            var fieldKey = self.multilingualFields[mlI];
                            newFields[fieldKey] = '['+curLangCode+']'+fields[fieldKey];
                        }
                    }

                    var newLangMgr = {
                        dbTable: self.tables.trans, //tableName,
                        model:newFields
                    };

                    listUpdates.push( newLangMgr );

                }

            }


            // now we have a list of all the Trans updates that need to happen
            //
            // we are going to fire off all of them at once
            // when they all complete successfully, we'll send our result to
            // the client.
            //
            // even though they are Async, it is all still deterministic, so
            // use the following data structure to help us:
            if (undefined === req.aRAD) req.aRAD = {};
            req.aRAD[self.tables.data] = {
                total:listUpdates.length,
                curr:0,
                hadError:false
            };

//console.log('------');
//console.log('listUpdates:');
//console.log(listUpdates);

            for(var luI=0; luI<listUpdates.length; luI++) {

                DataStore.create( listUpdates[luI], function( err, data) {

                    if (req.aRAD[self.tables.data].hadError) {

                        // there was a previous error in another Async result,
                        // so do nothing.

                    } else {


                        if (err) {


                            // warn other Async Results we had an error
                            req.aRAD[self.tables.data].hadError = true;

                            // fire the callback with our error
                            callback(err, returnObj);


                        } else {


                            // mark this Async result as done:
                            req.aRAD[self.tables.data].curr ++;

                            // if this was the last one then
                            if (req.aRAD[self.tables.data].curr >= req.aRAD[self.tables.data].total) {

                                // if we have a notification hub defined:
                                if (self.__hub != null) {

                                    // Publish an .created notification for this Model:
                                    // published data:  { id: [newPrimaryKeyValue] }
                                    var subscriptionKey = self._notificationKey() + '.created';
                                    self.__hub.publish(subscriptionKey, {id:returnObj[primaryKey]});
                                }

                                // all finished successfully, so return
                                callback(err, returnObj);
                            }

                        }

                    }
                });  // end create()


            }


        });  // end create() for dataTable
    },



    updateFromReq: function (params) {
//console.log('model_SQLMultilingual.updateFromReq()');
        var req = params.req;
        var id = params.id;
        var callback = params.callback;

        var values = [];
        var fieldValues = '';

        // gather any defined field values for this transaction:
        var currModel = this.loadFromReq(req);

        var langCond = null;
        var langValue = null;
        for(var fI in currModel) {

            // language_code isn't somethign that is updated.
            if (fI != 'language_code') {

                if (fieldValues != '') fieldValues += ', ';

                var tableID = 'd';

                // if field is in trans model switch to t.
                if (typeof this.fields.trans[fI] != 'undefined') {
                    tableID = 't';
                }
                fieldValues += tableID+'.'+fI + '=?';
                values.push( currModel[fI] );
            } else {

                langCond = 'language_code=?';
                langValue = currModel[fI];
            }
        }


        //// compile Condition statement:
        var condition =  [ ];
        var condReq =  this.condFromReq(req);
        if (condReq != '') condition.push(condReq);

        if ((id != '-1') && (AD.Util.String.isNumeric(id))) {


            condition.push( '( d.' + this.primaryKey+'='+id + ')' );
        }

        if (langCond) {
            condition.push( langCond );
            values.push(langValue)
        }
        //// table name
        var tableName = this.fromTable();


        var sql = 'UPDATE '+tableName + ' SET ' + fieldValues;
        if (condition.length > 0) {
            sql += ' WHERE '+condition.join(' AND ');
        }

//console.log('sql:'+sql);
//log(req, '      sql:['+sql+']');
//log(req, values);
        var self = this;
        var returnObj = {};

        DataStore.runSQL( sql, values, function(err, results, fields) {

            // if we have a notification hub defined:
            if (self.__hub != null) {

                // Publish an .updated notification for this Model:
                // published data:  { id: [newPrimaryKeyValue] }
                var subscriptionKey = self._notificationKey() + '.updated';
                self.__hub.publish(subscriptionKey, {id:id});
            }

            callback(err, returnObj);

        });

    },

    destroyFromReq: function (params) {

        var req = params.req;
        var id = params.id;
        var callback = params.callback;

        //// create SQL for Data table

        //// compile Condition statement:
        var condition = this.condFromReq(req);
        if (id != '-1') {

            if (condition != '') {
                condition += ' AND ';
            }
            condition += '(' + this.primaryKey+'='+id + ')';
        }


        var dbName = this.dbName || AD.Defaults.dbName;
        var sql = 'DELETE FROM '+dbName+'.'+this.tables.data + ' WHERE ' + condition;


        // run data sql
        log(req, 'sql:['+sql+']');
        var self = this;
        var returnObj = {};
        var values = [];
        DataStore.runSQL( sql, values, function(err, results, fields) {


            if (err) {

                callback(err, returnObj);

            } else {



            // on success
                // create sql for trans table
                var sql = 'DELETE FROM '+dbName+'.'+self.tables.trans + ' WHERE ' + condition;

                // run trans sql
                DataStore.runSQL( sql, values, function(err, results, fields) {

                    // if we have a notification hub defined:
                    if (self.__hub != null) {

                        // Publish a .destroyed notification for this Model:
                        // published data:  { id: [newPrimaryKeyValue] }
                        var subscriptionKey = self._notificationKey() + '.destroyed';
                        self.__hub.publish(subscriptionKey, {id:id});
                    }

                    // return either error or success
                    callback(err, returnObj);

                });

            }

        });

    },

    prepForRead: function (req, curDataMgr) {
        // Add the translation table in as a join
        var tref = 't';
        var joinedTable = {};
        joinedTable.tableName = this.tables.trans;
        joinedTable.foreignKey = this.primaryKey;
        joinedTable.tref = tref;
        joinedTable.type = 'LEFT';
        joinedTable.joinToTref = 'p';

        // Take care of language code, too
        var key = 'language_code';
        var viewer = AD.Viewer.currentViewer(req);
        var langCode = curDataMgr.model[key] || viewer.languageKey;
        joinedTable.condition = [{ tref: tref, key: key, value: langCode }];
        delete curDataMgr.model[key];

        curDataMgr.joinedTables.push(joinedTable);

        // Select all data table fields
        for (var key in this.fields.data) {
            // Set the tref for the primary table
            tref = 'p';
            curDataMgr.selectedFields[key] = { tref: tref };

            if (typeof curDataMgr.model[key] != 'undefined') {
                // Remark the field in the current model (with tref)
                var value = curDataMgr.model[key];
                curDataMgr.model[key] = { tref: tref, value: value };
            }
        }

        // Select all multilingual fields
        for (var i = 0; i < this.multilingualFields.length; i++) {
            // Set the tref for the primary table
            var key = this.multilingualFields[i];
            tref = 't';
            curDataMgr.selectedFields[key] = { tref: tref };

            if (typeof curDataMgr.model[key] != 'undefined') {
                // Remark the field in the current model (with tref)
                var value = curDataMgr.model[key];
                curDataMgr.model[key] = { tref: tref, value: value };
            }
        }

        curDataMgr.selectedFields._empty = false;
    }
}, {});
