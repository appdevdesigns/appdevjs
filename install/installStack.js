////
////  Install Routine:
////
var installer = require(__appdevPathNode + '../installerTools.js');


/**
 * @function copyTemplate
 * 
 * ###copyTemplate
 *
 * This function is used by 3 other functions below to copy templates to the correct directory
 * 
 * @param req {object}
 * @param res {object}
 * @param next {function}
 * @param path {string}
 * @param destDir {string}
 * 
 */
//---------------------------------------------------------
var copyTemplate = function (req, res, next, path, destDir) {
    
    fs.readFile( path, 'utf8', function (err, data) {
        if (err) {
            
            throw err;
            
            next(); // ?? do this here?
            
        } else {
            
            var backslash = new RegExp('\\\\', 'g'); // match a single backslash
            // foreach template tag
            for (var tagi in Values) {
            
                // replace tag with value
                // embedded tag is "[tagi]" 
                var tag = new RegExp("\\["+tagi+"\\]", "g");
                var val = Values[tagi];
                if (val !== undefined) {
                    val = val.replace(backslash,'\\\\'); // replace it with two backslashes
                }
                data = data.replace(tag, val);
                
            } // next tag
            
            
            // store template data into proper directory
            fs.writeFile( destDir, data, 'utf8', function(err) { 
            
                if (err) {
                
                    console.log( '  - error writing file:['+err.message+']');
                    throw err;
                }
                
                // ready to continue on to next step
                next();
            
            });  // end file Write
        
        }
        
    });

}


/**
 * @function trim
 * 
 * ###trim
 *
 * This functions performs a trim on an input function
 * 
 * @param str {string}
 * 
 */
//---------------------------------------------------------
var trim = function (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};



/**
 * @function createLink
 * 
 * ###createLink
 *
 * Create Symbolic Link from '/data/scripts/modules' -> '/modules'
 * 
 */
//---------------------------------------------------------
var createLink = function (req, res, next) {
/*    
    fs.symlink('../modules', '../data/scripts/modules', function (err) {
    
        if (err) {
        
            if (err.code == 'EEXIST') {
                // path already exists.  No problem. Must be a reinstall.
                console.log( '  - modules directory already exists ['+err.message+']');
            } else {
                console.log( '  - error creating modules/ directory:');
                console.log(err);
            }
            
        }
        
        // continue to next operation.
        next();
        
    });

*/
	next();

}



/**
 * @function initData
 * 
 * ###initData
 *
 * Initializes the standard placeholder object.
 * 
 * @param req {object}
 * @param res {object}
 * @param next {function}
 * 
 */
//---------------------------------------------------------
var initData = function (req, res, next) {
    
    req.aRAD = {};      // standard placeholder obj.
    
    next();
}



/**
 * @function pullValues
 * 
 * ###pullValues
 *
 * Pull the input form values read in during the installation process into a global 'Values' object
 * 
 * @param req {object}
 * @param res {object}
 * @param next {function}
 * 
 */
//---------------------------------------------------------
var pullValues = function (req, res, next) {
    console.log('=== pullValues start ===');
    // Pull the form values into global 'Values' object
    
    for (var key in Values) {
        if (typeof req.query[key] != 'undefined') {
            Values[key] = req.query[key];
        } else {
            Values[key] = req.body[key];
        }
    
    }
    
    
    ////
    //// Condition any values here:
    ////
    
    // Make default settings == 'http://localhost:8088';
    Values['siteUrl'] = 'localhost';
    Values['sitePort'] = Settings.sitePort;
    		
    var hostport = req.headers.host;
    if (hostport.split(":").length == 2)
    {
        Values['siteUrl'] = hostport.split(":")[0];
        Values['sitePort'] = hostport.split(":")[1];
    
    }
    
    
    // Make sure Values[dbPath] has "'" around it if not 'null';
    // Make sure Values[dbType] is converted to CONSTANT definitions.
    if (Values['connectType'] == 'url') {
    
            // setup path and port
            Values['dbPathRaw'] = Values['dbPath'];
            Values['dbPath'] = "'" + Values['dbPath'] + "'";
    
    } else {
    
        // setup socket
        Values['dbPath'] = "''";
        Values['dbPathRaw'] = "''";
        Values['dbPort'] = Values['dbSocketPath'];
    }
    
    Values['dbTypeSetupFile'] = Values['dbType'];
    switch( Values['dbType']) {
    
        case 'mysql':
            Values['dbType'] = 'DATASTORE_MYSQL';
            break;
            
        case 'memory':
            Values['dbType'] = 'DATASTORE_MEMORY';
            break;
    }
    
    
    // admin pWord = md5(value)
    var crypto = require('crypto');
    var md5 = crypto.createHash('md5');
    Values['adminPWordRaw'] = Values['adminPWord'];
    md5.update(Values['adminPWord']);
    Values['adminPWord'] = md5.digest('hex');
    
    // langList in format:  (1,'en','English'),(2,'zh-Hans','??')
    if (!Values['langList']) {
        Values['langList'] = "(1,'en','English'),(2,'zh-hans','??')";
    } else {
        var languagelist = Values['langList'].split(',');
        var new_langlist = '';
        var short_langlist = '';
    
        for (var i=0; i< languagelist.length; i++)
        {
            var language_parts = languagelist[i].split(':');
            new_langlist += "(" + i + ",'" + language_parts[0] + "','" + language_parts[1] + "') ";
            short_langlist += language_parts[0] + " ";
        }

        Values['langList'] = (new_langlist.trim()).replace(/ /g, ',');
        Values['shortlangList'] = short_langlist.trim();
        console.log(Values['langList']);
    }

    console.log('Values:');
    console.log(Values);
    
    // continue on to the next one:
    next();

}



/**
 * @function copyDefaults
 * 
 * ###copyDefaults
 *
 * Copy `/install/data/defaults.js`  to `/server/defaults.js`
 * 
 */
//---------------------------------------------------------
var copyDefaults = function (req, res, next) {
    // Copy data/defaults.js  to /node_modules/defaults.js    
    
    var path = __dirname + '/data/defaults.tpl';
    var destDir = __dirname + '/../server/defaults.js';
    
    copyTemplate(req, res, next, path, destDir);

}



/**
 * @function copyIndex
 * 
 * ###copyIndex
 *
 * Copy `/install/data/index.tpl'  to `index.html`
 * 
 */
//---------------------------------------------------------
var copyIndex = function (req, res, next) {
    // Copy data/index.tmpl  to index.html    
    
    var path = __dirname + '/data/index.tpl';
    var destDir = __dirname + '/../index.html';

    copyTemplate(req, res, next, path, destDir);

}



/**
 * @function copySetup
 * 
 * ###copySetup
 *
 * Copy `/data/appDev_setup_xxxx.tpl`  to `/data/appDev_setup_xxxx.sql`
 * 
 */
//---------------------------------------------------------
var copySetup = function (req, res, next) {
    // Copy data/index.tmpl  to index.html    
    
    var path = __dirname + '/data/appDev_setup_'+Values['dbTypeSetupFile']+'.tpl';
    var destDir = __dirname + '/../modules/site/install/data/appDev_setup_'+Values['dbTypeSetupFile']+'.sql';

    copyTemplate(req, res, next, path, destDir);

}



/**
 * @function chooseDB
 * 
 * ###chooseDB
 *
 * Based upon the installed DB value, import the right DB library.
 * 
 */
//---------------------------------------------------------
var chooseDB = function (req, res, next) {
    
    // Values['dbTypeSetupFile'] should be set already
    var db = require(__dirname + '/db/db_'+Values['dbTypeSetupFile']+'.js');
    
    req.aRAD.db = db;

    req.aRAD.db.connect({
        user:       Values['dbUser'],
        password:   Values['dbPword'],
        host:       Values['dbPathRaw'],
        port:       Values['dbPort']
    });
    
    next();

}



/**
 * @function setEnvironment
 *
 * Now that the `defaults.js` file is ready, try and resemble a normal appDev
 * runtime environment.
 *
 * This declares the global `__appdevPath` variable, and initializes 
 * the `AD` object.
 *
 */
//---------------------------------------------------------
var setEnvironment = function(req, res, next) {

    process.chdir(__dirname + '/../');
    __appdevPath = process.cwd();
    __appdevPathNode = __appdevPath+'/server/node_modules/';
    AD = require(__appdevPath+'/server/'+'AD.js');
    
    // Find all systems within the appDev tree:
    // - modules
    // - themes
    // - widgets
    installer.findSystems(function(results) {
        
        // Make sure the `site` module is on top of the list so it gets
        // priority during installation. Disable all the other modules by
        // default.
        var resultsCopy =[];
        var siteModule = null;
        for (var i=0; i<results.length; i++) {
            var sysObj = results[i];
            if (sysObj.name == 'site' && sysObj.type == 'module') {
                // save this one
                siteModule = sysObj;
            } else if (sysObj.type != 'module') {
                resultsCopy.push(sysObj);
            }
        }
        // Add the site module to the top of the list
        resultsCopy.unshift(siteModule);

        // Combined list of all systems
        req.aRAD.systems = resultsCopy;
        
        // List of just the systems paths
        req.aRAD.systemsPaths = [];
        for (var i=0; i<resultsCopy.length; i++) {
            req.aRAD.systemsPaths.push( resultsCopy[i]['path'] );
        }
        
        next();
    });

}



/**
 * @function sqlInstall
 * 
 * ###sqlInstall
 *
 * Scan all the directories for possible labels and install them.
 * 
 * @param req {object}
 * @param res {object}
 * @param next {function}
 * 
 */
//---------------------------------------------------------
var sqlInstall = function (req, res, next) {
    console.log('=== sqlInstall start ===');

    // This is a list of all the module/theme/widget paths
    // with the "install/data" path at the top of the list.
    var listPaths = [__appdevPath+'/install/data'];
    listPaths = listPaths.concat(req.aRAD.systemsPaths);

    async.forEachSeries(listPaths, installer.installSQL, next);
}



/**
 * @function labelInstall
 * 
 * ###labelInstall
 *
 * Installs labels from .po files into the database
 * 
 * @param req {object}
 * @param res {object}
 * @param next {function}
 * 
 */
//---------------------------------------------------------
var labelInstall = function (req, res, next) {
    console.log('=== labelInstall start ===');

    // This is a list of all the module/theme/widget paths
    var listPaths = req.aRAD.systemsPaths;
        
    async.forEachSeries(listPaths, installer.installLabels, next);
};



/**
 * @function initModules
 * 
 * ###initModules
 *
 * Scan all the directories for possible module init scripts
 * 
 * @param req {object}
 * @param res {object}
 * @param next {function}
 * 
 */
//---------------------------------------------------------
var initModules = function (req, res, next) {
    console.log('=== initModules start ===');
    
    // This is a list of all the module/theme/widget
    var sysObjs = req.aRAD.systems;

    // Run each module's init script
    async.forEachSeries(sysObjs, installer.initSystem, next);
}



var installStack = [
                        initData,       // initialize our data passing obj
                        createLink,     // create link: /data/modules => /modules
                        pullValues,     // prepare the submitted Form data
                        copyDefaults,   // copy the defaults template
                        copyIndex,      // copy the index.html template
                        copySetup,      // copy the setup.sql template
                        chooseDB,       // choose which DB to use
                        setEnvironment, // establish the normal runtime environment
                        sqlInstall,     // process all setup.sql files
                        labelInstall,   // import all labels_xx.yy files
                        initModules     // run each module's own init code
                       
                    ]; // an array of functions to call in order





////
//// Install Paths:
////

/**
 * @attribute path_install_commit /install/commit
 * ###Path: `/install/commit`
 *
 * This accepts data submitted from the installation wizard and does the actual
 * setup of the system.
 *
 * Once it has successfully completed, this will terminate the installer, 
 * allowing the parent `install.sh` script to launch the main appDev server.
 */
//---------------------------------------------------------
app.all('/install/commit', installStack, function(req, res, next) {
    // By the time we reach here, our install stack should have 
    // completed all the setup steps.
    
    console.log('=== finished install stack ===');
    
    // Redirect Page to site login
    //var appdevDefaults = require('defaults.js');
    var loginPage = 'http://' + req.headers.host + '/page/site/welcome'; //appdevDefaults.siteURL
    res.contentType('application/json');
    res.send('{ "data": { "url": "'+loginPage+'" } }');

    // Terminate with code 0, so the parent shell script can launch the main
    // appdev server
    setTimeout(function() {
        process.exit(0);
    }, 2000);

});