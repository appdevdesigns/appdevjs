////
//// Database
////
//// A generic interface for our site DB
////
//// This is responsible for returning an instance of the currently
//// defined DB.
////

var dbInstanceCounter = 0;

/**
 * return a new instance of our DB.
 */
var newDB = function()
{
    var dbIndex = dbInstanceCounter++;

    var dbOptions = {
        //debug:      true,
        user:       AD.Defaults.dbUser,
        password:   AD.Defaults.dbPword,
        host:       AD.Defaults.dbPath,
        port:       AD.Defaults.dbPort
    };

    var db = require('mysql');

    var connection = db.createConnection(dbOptions);
    connection.connect(function(err) {
        if (err) {
            AD.Util.Error('['+dbIndex+'] DB connection failed');
            throw err;
        } else {
            AD.Util.Log('['+dbIndex+'] DB connection established');
        }
    });

    var handleConnectionError = function(err)
    {
        var req = {}; // fake req object for AD.Util.Log()

        // Log and ignore non-fatal errors
        if (!err.fatal) {
            AD.Util.Error(req, '-['+dbIndex+'] Non-fatal DB error');
            AD.Util.ErrorDump(req, err);
        }
        // Automatically re-connect to DB if the connection drops
        else if (err.code == 'PROTOCOL_CONNECTION_LOST') {
            AD.Util.Error(req, '['+dbIndex+'] ' + err.message);
            AD.Util.ErrorDump(req, '['+dbIndex+'] Attempting to re-connect lost DB connection...');
            var newConnection = db.createConnection(dbOptions);

            var connTimeout = setTimeout(function() {
                // Connection not successful and there is no explicit error
                // after the timeout period. Assume failure.
                newConnection.destroy();
                var err = new Error("DB re-connection timed out");
                err.fatal = true;
                err.code = 'PROTOCOL_CONNECTION_LOST';
                handleConnectionError(err);
            }, 15000);
            // Try re-connecting
            newConnection.connect(function(err) {
                clearTimeout(connTimeout);
                if (err) {
                    AD.Util.ErrorDump(req, '['+dbIndex+'] -- could not re-connect.');
                    handleConnectionError(err);
                } else {
                    // Success
                    connection.removeListener('error', handleConnectionError);
                    newConnection.on('error', handleConnectionError);

                    AD.Util.LogDump(req, '['+dbIndex+'] -- reconnected.');

                    // Replace the original connection's internal objects with
                    // those from the new connection.
                    // (may need to update this if the MySQL module changes)
                    // https://github.com/felixge/node-mysql/blob/master/lib/Connection.js
                    connection._socket = newConnection._socket;
                    connection._protocol = newConnection._protocol;
                }
            });
        }
        // All other fatal errors
        else {
            AD.Util.Error(req, '['+dbIndex+'] Fatal DB error');
            AD.Util.ErrorDump(req, err);
            throw err;
        }
    };
    connection.on('error', handleConnectionError);

    return connection;
}
exports.newDB = newDB;


// siteDB : a shared DB interface to be reused
var siteDB = {}

/**
 * return our shared DB
 */
var sharedDB = function ()
{
    if (!siteDB.connected) {
        siteDB = newDB();
    }
    return siteDB;
}
exports.sharedDB = sharedDB;


