// Module responsible for the procedures necessary for serving up the files used by steal.build

var exec = require('child_process').exec;
var os = require('os');
var fs = require('fs');
var crypto = require('crypto');
var async = require('async');
var $ = AD.jQuery;
var Steal = module.exports = {};
var Auth = Steal.Auth = {};

// Load the steal viewer
var stealViewer = {};
AD.Viewer.viewerFromLogin('steal', crypto.createHash('md5').update('steal', 'binary').digest('hex'), function(err, viewer) {
    if (err) {
        console.error('Could not load steal viewer!');
        console.error(err);
    }
    else {
        stealViewer = viewer;
    }
});


var jsPath = os.platform() === 'win32' ? 'js' : './js';
var scriptsRootDir = __appdevPath+'/data/scripts';
var scriptsCommonDir = scriptsRootDir+'/common';

// Create the production directory specified by params.productionDir
var setupDirs = function(params, next) {
    fs.mkdir(params.productionDir, function(err) {
        if (err) {
            console.log('Production directory could not be created:');
            console.log(err);
        }
        next(null, params);
    });
};

// Execute the StealJS build script
var build = function(params, next) {
    var command = jsPath+' steal/buildjs '+params.pageURL+' -to '+params.productionDir;
    console.log('Executing: ');
    console.log(command);
    exec(command, {cwd: scriptsRootDir}, function(err, stdout, stderr) {
        if (err !== null) {
            console.log('exec error:');
            console.log(err);
        }
        console.log('stdout:');
        console.log(stdout);
        console.log('stderr:');
        console.log(stderr);
        
        next(err, params);
    });
};

// Rename the production.js and production.css scripts
var renameScripts = function(params, next) {
    if (!params.name) { 
        next(null, params);
        return;
    }
    async.parallel({
        renameJS: function(callback) {
            fs.rename(params.productionDir+'/production.js', params.productionDir+'/'+params.name+'.js', function(err) {
                // Ignore non-existent file errors
                callback((!err || err.errno === 34) ? null : err);
            });
        },
        renameCSS: function(callback) {
            fs.rename(params.productionDir+'/production.css', params.productionDir+'/'+params.name+'.css', function(err) {
                // Ignore non-existent file errors
                callback((!err || err.errno === 34) ? null : err);
            });
        }
    }, function(err, results) {
        next(err, params);
    });
};

// Build a single production script for an interface
Steal.buildInterface = function(params) {
    var dfd = $.Deferred();
    async.waterfall([function(next) {
        var stealSession = AD.Steal.Auth.requestSession();
        params.pageURL = AD.Defaults.siteURL+'/page/'+params.module+'/'+params.interface+'?stealSession='+stealSession.key;
        params.productionDir = __appdevPath+'/modules/'+params.module+'/interfaces/'+params.interface+'/production';
        next(null, params);
    }, setupDirs, build, renameScripts], function(err, result) {
        if (err) {
            dfd.reject(err);
        }
        else {
            dfd.resolve(result);
        }
    });
    return dfd.promise();
};

// Build an collection of scripts into a single production script
Steal.buildScripts = function(params) {
    var dfd = $.Deferred();
    async.waterfall([function(next) {
        var stealSession = AD.Steal.Auth.requestSession();
        stealSession.listScripts = params.listScripts;
        params.pageURL = AD.Defaults.siteURL+'/page/steal/build?stealSession='+stealSession.key;
        params.productionDir = params.module ? __appdevPath+'/modules/'+params.module+'/production' : scriptsCommonDir;
        next(null, params);
    }, setupDirs, build, renameScripts], function(err, result) {
        if (err) {
            dfd.reject(err);
        }
        else {
            dfd.resolve(result);
        }
    });
    return dfd.promise();
};

// Create the routes used by steal
var createRoutes = function(app) {
    app.get('/init/steal/build/build.js', function(req, res, next) {
        var templateData = {layout: false, listJavascripts: req.session.stealSession.listScripts};
        res.header('Content-type', 'application/javascript');
        res.render('siteContentStealData.ejs', templateData);
        AD.Util.LogDump(req, '   - /init/steal/build');
    });
    app.get('/page/steal/build', function(req, res, next) {
        var stealSession = req.session.stealSession;
        var templateData = {layout: false, siteURL: AD.Defaults.siteURL, initScript: '/steal/'+stealSession.key+'/init/steal/build'};
        res.render('stealBuildPage.ejs', templateData);
        AD.Util.LogDump(req, '   - /page/steal/build');
    });
    app.get('/steal/:key/login.js', Auth.authenticate, function(req, res, next) {
        res.header('Content-type', 'application/javascript');
        res.send(req.session.stealSession ? '// Login successful' : '// Login unsuccessful');
    });
    app.get('/steal/:key/init/:module/:interface/:interface.js', Auth.authenticate, function(req, res, next) {
        // Return a script that will login using the given steal session key, THEN load the init script
        var initScript = /^\/steal\/[^\/]+(\/.+)$/.exec(req.url)[1];
        var scriptContent = 'steal({src: \'/steal/'+req.params.key+'/login.js\', packaged: false}).then({src: \''+initScript+'\', packaged: false});';
        res.header('Content-type', 'application/javascript');
        res.send(scriptContent);
    });
};
// Create the routes after the express app is created
AD.App.appDfd.done(createRoutes);

var listScripts = [
    '//jquery/jquery.js',
    '//jquery/lang/string/string.js',
    '//jquery/controller/subscribe/subscribe.js',
    '//jquery/view/ejs/ejs.js',
    '//jquery/controller/view/view.js',
    '//jquery/model/model.js',
    '//jquery/dom/fixture/fixture.js',
    '//jquery/dom/form_params/form_params.js',
    '//jquery/event/event.js',
    '//jquery/event/destroyed/destroyed.js',
    '//jquery/lang/object/object.js',
    '//jquery/lang/string/rsplit/rsplit.js',
    '//jquery/dom/dom.js',
    '//jquery/class/class.js',
    '//jquery/controller/controller.js',
    '//jquery/view/view.js',
    '//jquery/lang/openajax/openajax.js',
    '//base.min.js',
    '//async.js',
    '<then>',
    '//kendoui/js/kendo.web.min.js',
//    '//bootstrap/js/bootstrap-tab.js',
    '<then>',
    '/appDev/appDev.js'
];
// Session object dictionary
// Format:
// key: {
//     key: 'abcdef1234567890' // unique key identifying this session, generated by Auth.requestSession
//     expires: 0987654321 // timestamp for expiration time, generated by Date.now
// }
var sessions = {
    'secret': {key: 'secret', listScripts: listScripts} // this special session never expires
};

// Garbage collect expired sessions every ten seconds
setInterval(function() {
    var currTimestamp = Date.now();
    $.each(sessions, function(key, session) {
        if (typeof session.expires !== 'undefined' && session.expires <= currTimestamp) {
            delete sessions[key];
        }
    });
}, 10*1000);

// Ensure that the request is properly authenticated before advancing to the next step
Auth.authenticate = function(req, res, next) {
    var currTimestamp = Date.now();
    var sessionKey = req.query.stealSession || req.params.key;
    console.log('Steal session key: '+sessionKey);
    if (req.session.stealSession) {
        console.log('Already logged in!');
        next();
        return;
    }
    var session = sessions[sessionKey];
    if (session && (typeof session.expires === 'undefined' || session.expires > currTimestamp)) {
        // Session is valid
        // Login as the special steal viewer
        console.log('Steal authentication complete.  Logging in as the steal viewer.');
        req.session.viewer = stealViewer;
        req.session.stealSession = session;
        
        // Expire the session so that it cannot be reused
        Auth.expireSession(sessionKey);
    }
    else {
        console.log('Steal login failed!');
    }
    // In any case, advance to the next step
    next();
};

// Add a new session to the session list
Auth.requestSession = function() {
    // MD5 hash a random buffer to generate the key
    var buf = crypto.randomBytes(64);
    var arr = Array.prototype.slice.call(buf);
    var str = String.fromCharCode.apply(String, arr);
    var key = crypto.createHash('md5').update(str, 'binary').digest('hex');
    var session = {
        key: key,
        expires: Date.now() + 1000*60 // expires in one minute
    };
    sessions[key] = session;
    return session;
};

// Expire the session with the specified key
Auth.expireSession = function(key) {
    delete sessions[key];
};

module.exports = Steal;
