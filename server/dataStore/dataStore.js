/* @class  AD_Server.Model.Datastore
 * @parent AD_Server.Model
 * 
 * A datastore is an abstract storage object that provides a common interface
 * for our AD.Model objects to interact with.
 * 
 * Datastores provide the following CRUD methods: create, update, read, destroy 
 */
var __doc;  // for documentjs to work?


/**
 * @function create
 * 
 * this method creates a new instance of the model in the storage 
 * mechanism.
 * 
 * @param {object} dataMgr a dataMgr object that defines the data to be saved.
 * @param {fn} callback  the callback fn to call once the operation is complete.  The format 
 *                of the callback is callback(err, newID);
 * @return {deferred} should offer a deferred obj to indicate the operation completion.
 */
var create = function (dataMgr, callback) {
    
}
//exports.create = create;



/**
 * @function read
 * 
 * this method returns a model instance from the storage mechanism.
 * 
 *
 * 
 * @param {object} dataMgr a dataMgr object that defines the data to be saved.
 * @param {fn} callback  the callback fn to call once the operation is complete. 
 *                The format of the callback is: callback( err, results, fields );
 * @return {deferred} should offer a deferred obj to indicate the operation completion.
 */
var read = function (dataMgr, callback) {

}
//exports.read = read;



/**
 * @function update
 * 
 * this method updates a model instance in the storage mechanism.
 * 
 * @param {object} dataMgr a dataMgr object that defines the data to be updated.
 * @param {fn} callback the callback fn to call once the operation is complete. 
 *                The format of the callback is: callback( err, results);
 * @return {deferred} should offer a deferred obj to indicate the operation completion.
 */
var update = function (dataMgr, callback) {

}
//exports.update=update;



/**
 * @function destroy
 * 
 * this method removes a model instance from the storage mechanism.
 * 
 * @param {object} dataMgr a dataMgr object that defines the data to be updated.
 * @param {fn} callback  the callback fn to call once the operation is complete. 
 *                The format of the callback is: callback( err, results);
 * @return {deferred} should offer a deferred obj to indicate the operation completion.
 */
var destroy = function(dataMgr, callback) {

}
//exports.destroy = destroy;



/**
 * @class  AD_Server.Model.Datastore.DB
 * @parent AD_Server.Model.Datastore
 * 
 * The Datastore can expose the underlying DB interface for access to more complex SQL operations.
 * 
 */
var DB;

////
//// The Installation Routine will define which datastore type is used.
//// We return the proper datastore instance here:
////
var Datastore = null;

if (AD.Defaults.dataStoreMethod == AD.Defaults.DATASTORE_MYSQL) { 
    Datastore = require('./dataStore_MySQL');
}


module.exports = exports = Datastore;


