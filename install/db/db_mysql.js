/**
 * 
 * @class Install.db_mysql
 * @parent Install
 * 
 * ###SQL Installation Routines
 *
 * This file contains SQL routines for the installation process;
 * 
 */

var mysql = require(__appdevPathNode +'mysql');
var path = require('path');
var fs = require('fs');
var myDB =  {};


var connect = function (options) {
    
    if ((typeof AD != 'undefined') && AD.Model && AD.Model.Datastore) {
        // Use the common DB connection if it exists
        myDB = AD.Model.Datastore.DB;
    } else {
        // Otherwise create a new one
        console.log('Creating new MySQL DB connection');
        myDB = mysql.createConnection(options);
    }
    
}
exports.connect = connect;




/**
 * @function importSQL
 * 
 * ###importSQL
 *
 * This function loads the sql import files 
 */
var importSQL = function (req, res, next, paths, dbName) {
    // run this DB's command line import of the appropriate sql import
    // file.
    
    
    var exec = require('child_process').exec;
    var children = {};
    var finishedCount = 0;

    var dbClientPath = fetchKey('dbPathMySQL');
    if (fs.existsSync(dbClientPath)) {
        
        // skip this if there is nothing to init
        if (paths.length == 0) {
            //console.log(' --- no sql to init');
            next();
            return;
        }
        
        // this imports one SQL file at a time
        var i = 0;
        var runImport = function() 
        {
            var sqlFile = path.normalize(paths[i]);
            console.log('initializing sql [' + sqlFile + ']');
            
            var hostInfo = '';
            if (fetchKey('connectType') == 'url') {
                hostInfo = 
                    '-h' + fetchKey('dbPathRaw') + ' ' +
                    '-P' + fetchKey('dbPort');
            }
            
            var shellCommand = 
                dbClientPath + ' ' +
                hostInfo + ' ' +
                '-u' + fetchKey('dbUser') + ' ' +
                '-p' + fetchKey('dbPword') + ' ' +
                (dbName + ' ' || '') + // optional DB name
                '< ' + sqlFile;
            console.log('executing [' + shellCommand + ']');
            children[paths[i]] = exec(shellCommand, function (error, stdout, stderr) {
        
                console.log('error:');
                console.log(error);
                console.log('');
                
                console.log('stdout:');
                console.log(stdout);
                console.log('');
                
                console.log('stderr:');
                console.log(stderr);
                console.log('');
                
                // Next
                if (i < paths.length-1) {
                    i += 1;
                    runImport();
                } else {
                	
                	// wait until all sql files are imported before continuing:
                	next();
                }
            });
        };
        runImport();

    } else {
        console.log('DB client executable path is invalid');
        res.send('DB client executable path is invalid');
    }


} 
exports.importSQL = importSQL;



/**
 * @function fetchKey
 *
 * Helper function for importSQL. Fetch a key. If the installer is being run, we fetch it
 * from the Values array. If not, it should be defined in Ad.Defaults.
 *
 * @param {String} key
 */
var fetchKey = function(key) {
    var value;
    if (typeof Values == 'undefined') {
        value = AD.Defaults[key];
    } else {
        value = Values[key];
    }
    return value;
}


/**
 * @function dbLabelUpdate
 * 
 * ###dbLabelUpdate
 *
 * This function tests if a label exists and updates it if it does, inserts it if it doesn't 
 * 
 * @param {String} path
 * @param {String} lang
 * @param {String} key
 * @param {String} text
 * @param {Boolean} [skipExisting]
 *      Optional. Specify TRUE to avoid updating existing labels. Default is FALSE.
 * @param {Function} [callback]
 *      Optional.
 */
var dbLabelUpdate = function(path, lang, key, text, skipExisting, callback) {
    
    if (typeof skipExisting == 'function') {
        callback = skipExisting;
        skipExisting = false;
    }
    if (typeof callback != 'function') {
        callback = null;
    }

    // Insert/Update a label definition into the db.
    // If the label already exists, then update the text.
    
    var dbName;
    
    if (typeof Values == 'undefined') {
        // during normal runtime
        dbName = AD.Defaults.dbName;
        connect({
            user:       AD.Defaults.dbUser,
            password:   AD.Defaults.dbPword,
            host:       AD.Defaults.dbPath,
            port:       AD.Defaults.dbPort
        });
    } else {
        // during site installation
        dbName = Values['dbName'];
    }
    
    // see if current label already exists
    var sqlThere = 'SELECT * FROM '+dbName+'.site_multilingual_label WHERE language_code=? AND label_path=? AND label_key=?';
    var sqlThereValues = [
        lang,
        path,
        key
        ];
        
    myDB.query(sqlThere, sqlThereValues, function(err, results, fields) {
        
    	if (err) {
    		console.log( '**** Error:'+err);      
    		console.log(err);
    		throw new Error('whoah!');
    	} else {
    	
	        if (results.length > 0 && !skipExisting) {
	        
                console.log( '     - updating label path:'+path+' key:'+ key + '  label:'+text);        
	            // Update existing labels
	            var sqlUpdate = "\
	               UPDATE "+dbName+".site_multilingual_label \
	               SET label_label=?, label_lastMod=now() \
	               WHERE label_key=? AND language_code=? AND label_path = ? \
	            ";
	            var sqlUpdateValues = [
	                    text,
	                    key, lang, path
	                ];
	            
	            myDB.query(sqlUpdate, sqlUpdateValues, function (err, results, fields) {
	                if (err) {  }
	                callback && callback();
	            });
	            
	        } 
	        else if (results.length > 0 && skipExisting) {
                console.log( '     - not updating existing label path:'+path+' key:'+ key + '  label:'+text);
	            // Skip existing labels
	            callback && callback();
	        }
	        else {
	        
                console.log( '     - installing label path:'+path+' key:'+ key + '  label:'+text);
	            // Install labels that don't exist yet
	            var sqlInsert = "\
	               INSERT INTO "+dbName+".site_multilingual_label \
	               SET \
	                   label_label=?, label_key=?, language_code=?, \
	                   label_path = ?, label_needs_translation=0, \
	                   label_lastMod=now() \
	            ";
	            var sqlInsertValues = [
	                    text, key, lang,
	                    path
	                ];
	            
	            myDB.query(sqlInsert, sqlInsertValues, function (err, results, fields) {
	                if (err) { console.log(err); }
	                callback && callback();
	            });
	            
	        }
        
    	}
    
    });

}
exports.dbLabelUpdate = dbLabelUpdate;


/**
 * @function dbLabelExists
 * 
 * ###dbLabelExists
 *
 * This function ensures all necessary labels exist in the database. 
 * We can specify any number of languages on the installer page. However 
 * we only import the label translations that we find in the file system.
 * The last step of the installer should be to make sure that each label 
 * has a copy of itself in each installed language.
 * 
 * @param {key} allLabels 
 * @param {key} callback
 */
var dbLabelExists = function (allLabels, callback) {
	// get all distinct label keys
	// for each key
	// for each language
	// if key+language doesn't exist then create it
	
	if (allLabels.length == 0) {
	   callback && callback();
	   return;
	}
	
	var dbName;
	if (typeof Values == 'undefined') {
	    dbName = AD.Defaults.dbName;
	} else {
        dbName = Values['dbName'];
    }

	var sqllang = ' SELECT * FROM '+dbName+'.site_multilingual_language';
    myDB.query(sqllang, [], function (langerr, langresults, langfields) {
    
	    var labelkeys = [];
	
	    for (var i=0; i<allLabels.length; i++) {
	    
	        var labelKey = allLabels[i].key;
	        var labelpath = allLabels[i].path;
	        var keypath = labelKey + labelpath;	  
	        
	        if (!(keypath in labelkeys) ) {
	        	labelkeys[keypath] = labelKey;
	        	//console.log(keypath +' : '+ labelKey);
	        }
	        
	    }
    	
    	// Total number of labels to process
    	var numLabels = Object.keys(labelkeys).length * Object.keys(langresults).length;
    	
    	for (var li in langresults) {

    		var lang = langresults[li].language_code;    		
            for (var lk in labelkeys) {

                var key = labelkeys[lk];
                var path = lk.replace(labelkeys[lk], '');
                
                //console.log( '     - testing label path:'+path+' key:'+ key + '  lang:'+lang);

                var found = false;
                for (var lc=0; lc<allLabels.length; lc++) {
                    if ((allLabels[lc].lang == lang) && (allLabels[lc].key == key) && (allLabels[lc].path == path))
                        found = true;
                }
                
                if (!found) {		                    	
                    var text = '';
                    dbLabelUpdate(path, lang, key, text, function() {
                        numLabels -= 1;
                        // Execute the callback after the last label update
                        if (numLabels <= 0) {
                            callback && callback();
                        }
                    });
                } else {
                    numLabels -= 1;
                    // Execute the callback after the last label update
                    if (numLabels <= 0) {
                        callback && callback();
                    }
                }
                
            }
    	}
    	
    });
    
}
exports.dbLabelExists = dbLabelExists;
