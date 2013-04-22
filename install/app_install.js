/**
 * 
 * @class Install
 * @parent Installed_Modules
 * 
 * ###
 *
 * This file catches server routes pertaining to the install process.
 * 
 */


//required to separate comment blocks for documentjs, please do not remove
var __filler;

/**
 * 
 * @class Install.app_install
 * @parent Install
 * 
 * ###
 *
 * This file contains functions pertaining to the install process.
 * 
 */

window = this;

//figure out path to the root directory
var currPath = __dirname;
var rootPath = __dirname.replace(/(\/|\\)install/,'');
// __appdevPathNode is the hard path to the node_modules directory
__appdevPathNode = rootPath+'/server/node_modules/';

var http = require('http');
//var io = require('socket.io');
fs = require('fs');
path = require('path');
ejs = require(__appdevPathNode + 'ejs');
async = require(__appdevPathNode + 'async');

Settings = require('./settings.js');
Values = require('./data/init_values.js').values;
// Port number can be passed in from the installer command line
if (parseInt(process.argv[2])) {
    Settings.sitePort = parseInt(process.argv[2]);
}



// Create our Express Server
express = require(__appdevPathNode + 'express');
app = express.createServer();

app.configure(function(){

    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({secret:'Th3reCanB0nly1'}));
    app.use(app.router);
});

app.configure('development', function (){

    app.use(express.static(__dirname+'/../web'));
    app.use(express.errorHandler({dumpExceptions:true, showStack:true}));
    
});



//---------------------------------------------------------
app.all('/', function(req, res) {

    res.writeHead(301, {
        'Location': '/appDevInstall',
        'Content-type': 'text/plain'
    });
    res.write('Go to /appDevInstall');
    res.end();

});


/**
 * @attribute path_appDevInstall /appDevInstall
 * ###Path: `/appDevInstall`
 *
 * This begins the installation routine by sending the installation wizard
 * document to the browser. The wizard will collect information from the user 
 * and eventually submit it to `/install/commit`.
 * 
 */
//---------------------------------------------------------
app.all('/appDevInstall', function(req, res) {

    res.sendfile(__dirname+'/data/install.html');

});


/**
 * @attribute path_data /data/*
 * ###Path: `/data/*`
 *
 * This serves up any secondary data files required by the initial wizard HTML
 * document.
 * 
 */
//---------------------------------------------------------
app.all('/data/*', function(req, res) {
    // this returns our initial page

    var rootPath = __dirname.replace(/(\/|\\)install/,''); // remove either '/install' or '\install'
    var filePath = rootPath + req.url;
    res.sendfile(filePath);

});



/**
 * @attribute path_js /*.js
 * ###Path: `/*.js`
 *
 * This serves up other .js files required by the initial wizard HTML
 * document.
 * 
 */
//---------------------------------------------------------
app.all('/:file.js', function(req, res) {
    // return our install javascript files:
    
    file = req.params.file.toLowerCase();
    res.sendfile(__dirname+'/data/'+file+'.js');

});



/**
 * @attribute path_images_js /images/*.js
 * ###Path: `/images/*.js`
 *
 * This serves up the image files required by the initial wizard HTML
 * document.
 * 
 */
//---------------------------------------------------------
app.all('/images/:file', function(req, res) {
    // return our install images
    
    file = req.params.file.toLowerCase();
    res.sendfile(__dirname+'/images/'+file);

});



/**
 * @attribute path_install_validateFile /install/validateFile
 * ###Path: `/install/validateFile`
 *
 * This accepts a GET parameter `pathToVerify` and checks to see if it exists
 * on the server. It returns a JSON response of either `true` or `false`.
 * 
 */
//---------------------------------------------------------
app.all('/install/validateFile', function(req, res, next) {
    // this verifies that a given file exists 
    // used mostly for finding mysql & mysqldump paths
    

    var pathToVerify = req.query.pathToVerify;
    if (typeof pathToVerify == 'undefined') {
        pathToVerify = req.body.pathToVerify
    }


    console.log('   - Validate File Path ['+pathToVerify+']');


    fs.exists(pathToVerify, function (isThere) {
    
        var response = {
            success:isThere
        };
        
        res.header('Content-type', 'application/json');
        res.send(JSON.stringify(response).replace('"false"', 'false').replace('"true"', 'true'));
        
    });

});




//----------------------------------------------------------------
require('./svc_initialValues.js');
require('./installStack.js');
// install the defaults routine.




//// Now start Listening on our Port:
app.listen(Settings.sitePort);
console.log( '');
console.log( '--------------------------------------');
console.log( 'appDev Install Server listening on port['+Settings.sitePort+']');
  

