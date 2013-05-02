

var log = AD.Util.Log;

exports.production = false;
exports.authMethod = 'local';
exports.authRequired = true;

var authCAS = {
    'host': '-',
    'port': '-',
    'path': '-',
    'pgtCallbackURL': '',
    'submodule': ''
};
exports.authCAS = authCAS;


var sitePort = '8088';
exports.sitePort = sitePort;

var siteURL = 'http://localhost';
if (sitePort != '') siteURL += ':'+sitePort;
exports.siteURL = siteURL;



//// Setup which storage options we have:
var DATASTORE_MYSQL = 'mysql';
var DATASTORE_MEMORY = 'memory';
exports.DATASTORE_MYSQL = DATASTORE_MYSQL;
exports.DATASTORE_MEMORY = DATASTORE_MEMORY;



// Now indicate which method we are using on this site:
exports.dataStoreMethod = DATASTORE_MYSQL;



//// Session
exports.sessionSecret = 'th3re is n0 sPo0n';


//// DB specific info setup:
exports.dbName = 'appdevjs';
exports.dbUser = 'root';
exports.dbPword = '';
exports.dbPath = 'localhost';  // '127.0.0.1'
exports.dbPort = '3306'; // 3306
exports.dbPathMySQL = '/usr/bin/mysql';
exports.dbPathMySQLDump = '/usr/bin/mysqldump';



exports.emailHost = 'securemail.example.com';
exports.emailPort = 25;  // 25
exports.emailDomain = 'localhost'; // 'localhost'
exports.emailMethod = 'smtp'; // 'smtp' or 'mandrill'
exports.emailKey = 'undefined'; // for Mandrill only


exports.setup = function (req, res, next) {
/// simply make sure our req.aRAD.* data structures are created

log(req, '   - defaults.setup()');
log(req, '     req.url['+req.originalUrl+']');

    if (typeof req.aRAD == 'undefined') req.aRAD = {};
    if (typeof req.aRAD.response == 'undefined') {
        req.aRAD.response = {};
        req.aRAD.response.aRAD = req.aRAD;
        req.aRAD.response.ejsData = req.aRAD.response;
        req.aRAD.response.listFrameworkScripts = AD.App.Page.listFrameworkScripts;
        req.aRAD.response.listJavascripts = [];
        req.aRAD.response.siteURL = siteURL;
        req.aRAD.response.themePageStyle = 'default';
        req.aRAD.response.production = exports.production;
    }
    req.aRAD.returnPage = AD.App.Page.returnPage;
    req.aRAD.defaults = defaults;
    req.aRAD.page = {};     // page specific data. page.resources: which framework resources should be included 
//// TODO: get rid of $_REQUEST.  It's express equivalent  is in req.params('varname');
    req.aRAD.$_REQUEST = parseReqParams(req);
    next();
}




// The site_settings default values:
// these can be used by services to find default language and
// other values easily.
var defaults = { siteDefaultLanguage : 'en'};
var Settings = null;
exports.refresh = function() {

    if (Settings == null) {
        Settings = require(__appdevPath + '/modules/site/models/Settings.js');
    }
    
   Settings.findAll({  }, function(resultArray) {
            for (var i=0; i<resultArray.length; i++) {
                var setting = resultArray[i];
                
                defaults[setting.settings_key] = setting.settings_value;
                
            }
        });
}



// Supposed to be like the PHP isset()
var isset = function(thing) {
    if (typeof thing == 'undefined') {
        return false;
    }
    return true;
}

/**
 * Go through an Express req object and return a PHP $_REQUEST style
 * assosiative array.
 *
 * Priority:
 *  1. req.params -- from the path
 *  2. req.body   -- from POST
 *  3. req.query  -- from GET
 *
 * @param {object} req
 * @return object
 *      Associative array like $_REQUEST
 */
var parseReqParams = function(req) {
    
    var $_REQUEST = {};
    var sets = [ 'params', 'body', 'query' ];
    for (var i=0; i<sets.length; i++) {
        for (var paramName in req[ sets[i] ]) {
            if (!isset($_REQUEST[ paramName ])) {
                $_REQUEST[ paramName ] = req[ sets[i] ][ paramName ];
            }
        }
    }
    
    return $_REQUEST;
}