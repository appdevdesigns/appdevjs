/*
 * @class Install.installerTools
 * @parent Install
 *
 * ###Installer Tools
 *  
 * This provides several utility functions used by the site installer.
 * These functions may also be used after site installation, whenever a new
 * module is added or removed.
 *
 */
 


/**
 * @function getPaths
 * 
 * Returns the standard locations where various appDev systems are expected
 * to be found.
 *
 * @return {object}
 */
var getPaths = function() {
    return {
        'module': __appdevPath + '/modules',
        'theme': __appdevPath + '/web/theme',
        'widget': __appdevPath + '/web/appDev/widgets'
    };
};
exports.getPaths = getPaths;



/**
 * @function recursiveFileScan
 *
 * Recursively scan a given directory, and fetches a list of paths that match
 * a pattern.
 *
 * Subdirectories beginning with a dot (.) will be ignored.
 * Synchronous.
 *
 * @param {String} path
 *   The base path to start scanning from.
 * @param {Array} listPaths
 *   The results will be added to this array.
 * @param {String} searchKey
 *   A string pattern to match against.
 */
var recursiveFileScan = function (path, listPaths, searchKey) {
    //console.log('recursiveFileScan:' + path + ', ' + searchKey);
    //console.log(listPaths);
    
    if (path == '.DS_Store') {
        return;
    }
    if (path == '.svn') {
        return;
    }
    var pathStat = fs.statSync(path);
    if (!pathStat.isDirectory()) {
        return;
    }
    
    // Recursively search for files that match the given 
    // searchKey.  Start in the directory given in path and 
    // search each sub directory.
    // All matches are added to the array listPaths.
    
    var listFiles = fs.readdirSync(path);
    for (var indx =0; indx < listFiles.length; indx++) {
    
        var fileName = listFiles[indx];
        
        // don't include .xxx files
        if (fileName.indexOf(".") == 0) {
            continue;
        }

        var filePath =  path + '/' + fileName;

        // don't repeat files already added
        if (listPaths.indexOf(filePath) > -1) {
            continue;
        }
        
        // if this file matches the search pattern,
        if (fileName.indexOf(searchKey) > -1) {
            
            // add to listPaths 
            listPaths.push(filePath );
            
        } else {
        
            // if this is a directory
            var stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
            
                // scan this directory too
                recursiveFileScan( filePath, listPaths, searchKey);
            }
        
        }
    
    }

};
exports.recursiveFileScan = recursiveFileScan;


/**
 * @function findSystems
 *
 * Searches the appDev framework tree to find modules, themes, and widgets.
 *
 * Asynchronous.
 *
 * @param {Function} callback
 *   callback(`allsystems`, `modules`, `themes`, `widgets`)
 *   where each of the three parameters is an array of objects.
 */
var findSystems = function(callback)
{
    var db = AD.Model.Datastore.DB;
    var dbName = AD.Defaults.dbName;

    var results = {
        module: [],
        theme: [],
        widget: []
    }

    var find = function(type, next) {
    
        // look for all subdirectories
        var systemDir = fs.readdirSync(getPaths()[type]);
        for (var i=0; i<systemDir.length; i++) {
            var systemName = systemDir[i];
            var systemPath = getPaths()[type]+'/'+systemName;
            // skip .xxxx entries
            if (systemName.indexOf('.') === 0) {
                continue;
            }
            // skip non-directories
            var stat = fs.statSync(systemPath);
            if (!stat.isDirectory()) {
                continue;
            }
            results[type].push({
                'type': type,
                'name': systemName,
                'path': systemPath,
                'installed': 0
            });
        }
        
        // check if it is already installed
        var sql = "SELECT * FROM " + dbName + ".`site_system` WHERE `system_type` = ?";
        db.query(sql, [type], function(err, values, fields) {
            if (err) {
                // If we are doing an initial install, we'll probably get
                // an error here.
                console.error( err );
                next();
                return;
            }
            for (var i=0; i<values.length; i++) {
                var systemName = values[i]['system_name'];
                // Compare each DB result with what we found in the directory
                for (j=0; j<results[type].length; j++) {
                    // Mark this one as installed.
                    if (results[type][j]['name'] == systemName) {
                        results[type][j]['installed'] = 1;
                    }
                }
            }
            next();
        });
    }
    
    // call find() for each system type
    async.forEach(['module', 'theme', 'widget'], find, function() {
        // create the combined result
        var combinedResults = results['module'].concat(results['theme'], results['widget']);
        
        // return the results in a callback
        callback(
            combinedResults,
            results['module'],
            results['theme'],
            results['widget']
        );
    });
    
}
exports.findSystems = findSystems;


/**
 * @function installSQL
 *
 * Looks for any "setup_xxxx.sql" files in a module's directory and installs
 * them.
 *
 * Asynchronous.
 *
 * @param {String} basePath
 * @param {Function} callback
 */
var installSQL = function(basePath, callback)
{
    var db = require(__appdevPath+'/install/db/db_'+AD.Defaults.dataStoreMethod+'.js');
    var sqlPaths = [];
    var fileName = 'setup_' + AD.Defaults.dataStoreMethod+'.sql';

    recursiveFileScan(basePath, sqlPaths, fileName);
    
    if (sqlPaths.length == 0) {
        callback();
        return;
    } 
    else {
        console.log('');
        console.log('Importing these SQL files:');
        console.log(sqlPaths);
        
        var dummyReq = {};
        var dummyRes = {
            send: function() {}
        };
        
        db.importSQL(dummyReq, dummyRes, callback, sqlPaths, AD.Defaults.dbName);
    }
}
exports.installSQL = installSQL;


/**
 * @function installLabels
 *
 * Looks for any .po files within a module's directory and installs them
 * to the database.
 *
 * Asynchronous.
 *
 * @param {String} basePath
 * @param {Function} callback
 * @param {Boolean} [skipExisting]
 *      Optional. Specify TRUE to prevent existing labels from being updated.
 */
var installLabels = function(basePath, callback, skipExisting)
{
	var db = require(__appdevPath+'/install/db/db_'+AD.Defaults.dataStoreMethod+'.js');
    var poPaths = [];
    var langList = [];
    var poContent = '';
    
    console.log('Installing labels within [' + basePath + ']');
    
    // Define several asynchronous functions which we will later execute all 
    // in sequence.
    
    var scanPoFiles = function(callback) {
        // scan all the subdirectories for possible .po files
        recursiveFileScan(basePath, poPaths, '.po');
        callback();
    }

    var getSiteLanguages = function(callback) {
        var db = AD.Model.Datastore.DB;
        var sql = "SELECT language_code FROM " + AD.Defaults.dbName + ".site_multilingual_language";
        db.query(sql, [], function(err, values, fields) {
            if (err) console.error(err);
            for (var i=0; i<values.length; i++) {
                langList.push(values[i]['language_code']);
            }
            callback();
        });
    }
    
    var readPoFiles = function(callback) {
        async.forEachSeries(poPaths, function(path, innerCallback) {
            for (i=0; i<langList.length; i++) {
                // Only read .po files that follow the right naming convention
                if (path.indexOf('labels_' + langList[i] + '.po') !== -1) {
                    fs.readFile(path, 'utf8', function(err, data) {
                        if (err) {
                            console.error(err);
                        }
                        else {
                            console.log('installLabel [' + path + ']');
                            poContent += '\n\n' + data;
                        }
                        innerCallback();
                    });
                    // only one possible language match per .po file
                    return;
                }
            }
            // no language matches for this .po file
            innerCallback();
            return;
        }, callback);
    }
    
    
    //// Ian's label import algorithm
    var importPoContent = function(callback) {
        
        var allcontentssplit = poContent.split(/\r?\n\s*\r?\n/);
            
        var alllabels = [];
        for (var i=0; i<allcontentssplit.length; i++)
        {						
            var newstr = allcontentssplit[i].trim();
            if (newstr != '') {
                var iscomment = false;
                var thepath = newstr.match(/path\: .*/) == null ? iscomment = true : newstr.match(/path\: .*/)[0].replace('path: ', '').trim() ;
                var thecode = newstr.match(/code\: .*/) == null ? iscomment = true : newstr.match(/code\: .*/)[0].replace('code: ', '').trim() ;
                var thekey = newstr.match(/key\: .*/) == null ? iscomment = true : newstr.match(/key\: .*/)[0].replace('key: ', '').trim() ;
                var thestr = newstr.match(/(?:msgstr ")(.*)(?:"$)/) == null ? iscomment = true : newstr.match(/(?:msgstr ")(.*)(?:"$)/)[1].trim() ;
                
                if (!iscomment)
                {
                    // Add/Update the label
                    db.dbLabelUpdate(thepath, thecode, thekey, thestr, skipExisting);
                    alllabels.push({
                            'path': thepath,
                            'lang': thecode,
                            'key': thekey,
                            'text': thestr
                    });
                }
            }
        }
        
        // Populate any missing languge labels with placeholders
        db.dbLabelExists(alllabels, callback);
    }
    
    
    // Execute the installLabels() stack
    async.series([
        scanPoFiles,
        getSiteLanguages,
        readPoFiles,
        importPoContent
    ], callback);
    
}
exports.installLabels = installLabels;


/**
 * @function initSystem
 *
 * Runs the init function stack(s) of a module/theme/widget, to perform any 
 * final installation steps. Then records it into the `site_system` DB table.
 *
 * In each module/theme/widget directory tree, an `initModule.js` script can be
 * placed. This script should export an `initStack` array of functions. These
 * functions will be called in sequence.
 *
 * Assumes a normal appDev runtime environment.
 * Asynchronous.
 *
 * @param {Object} sysObj
 *   An object containing `name`, `type`, and `path`. Such as an individual 
 *   system object from the results of `findSystems()`.
 * @param {Function} callback
 */
var initSystem = function(sysObj, callback)
{
    // scan all the subdirectories for possible init scripts
    var paths = [];
    recursiveFileScan(sysObj.path, paths, 'initModule.js');
    
    // Call each script to get the init function stack
    async.forEachSeries(
        paths, 
        // Run each script's function stack
        function(path, next) {
            var moduleInit = require(path);
            var initStack = moduleInit.initStack || [];
            async.series(initStack, next);
        }, 
        // After all init scripts are processed, register this system into the
        // database.
        function() {
            var db = AD.Model.Datastore.DB;
            var sql = " \
                INSERT INTO " + AD.Defaults.dbName + ".site_system \
                    (system_name, system_path, system_type) \
                VALUES \
                    (?, ?, ?) \
            ";
            db.query(sql, [sysObj.name, sysObj.path, sysObj.type], function(err, results, fields) {
                if (err) {
                    console.error(err);
                }
                
                // Notify the system that a new module/widget has been enabled.
                AD.Comm.Notification.publish('ad.'+ sysObj.type+'.enable', {
                    'key': sysObj.name.toLowerCase(),
                    'name': sysObj.name,
                    'path': sysObj.path
                });
                
                callback();
            });
        }
    );
}
exports.initSystem = initSystem;


/**
 * @function removeSystem
 *
 * Runs the uninstall function stack(s) of a module/theme/widget, to perform 
 * any final steps needed to uninstall. Then remove its entry from the 
 * `site_system` DB table.
 *
 * In each module/theme/widget directory tree, a `removeModule.js` script can be
 * placed. This script should export an `initStack` array of functions. These
 * functions will be called in sequence.
 *
 * Assumes a normal appDev runtime environment.
 * Asynchronous.
 *
 * @param {Object} sysObj
 *   An object containing `name`, `type`, and `path`. Such as an individual 
 *   system object from the results of `getSystems()`.
 * @param {Function} callback
 */
var removeSystem = function(sysObj, callback)
{
    // Notify the system that we are going to disable the module/theme
    AD.Comm.Notification.publish('ad.'+sysObj.type+'.disable', {
        'key': sysObj.name.toLowerCase(),
        'name': sysObj.name,
        'path': sysObj.path
    });
    
    // scan all the subdirectories for possible module init scripts
    var paths = [];
    recursiveFileScan(sysObj.path, paths, 'removeModule.js');
    
    // Call each script to get the init function stack
    async.forEachSeries(
        paths, 
        // Run each script's function stack
        function(path, callback) {
            var moduleRemove = require(path);
            var initStack = moduleRemove.initStack;
            if (initStack) {
                async.series(initStack, callback);
            } else {
                // Found a removeModule.js file but no initStack defined.
                callback();
            }
        }, 
        // After all the scripts have been run, deregister this from
        // the database.
        function() {
            var db = AD.Model.Datastore.DB;
            // Remove this system from the registry
            var sql = " \
                DELETE FROM " + AD.Defaults.dbName + ".site_system \
                WHERE system_name = ? AND system_type = ? \
            ";
            db.query(sql, [sysObj.name, sysObj.type], function(err, results, fields) {
                if (err) {
                    console.error(err);
                }
                
                callback();
            });
        }
    );
}
exports.removeSystem = removeSystem;
