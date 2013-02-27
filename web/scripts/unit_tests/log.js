////
//// Log
////
//// A simple log handler for our debugging
////
////    


//// TODO:  set req.aRAD.logging = false by default.
////        on development mode, set to true
////        logdump() will check for req.aRAD.loggging before printing
////        when you need to debug a given route LogEnabled(req)


var color = require('ansi-color').set;

var logFormat = 'cyan';
var errorFormat = 'red+bold';

//-----------------------------------------------------------------------
var myLog = function(req, message, prefix, format) {
    // Helper function to compile sequential log info for a specific req.

    if (typeof message == 'undefined') {
    
        
        console.log(color(prefix, format) + color(req, 'white'));
    } else {
    
        if (typeof req.aRAD == 'undefined') { 
//            console.log( req);  
            req.aRAD = {}; 
        }
    
        if (typeof req.aRAD.log == 'undefined') {
        
            req.aRAD.log = [];
        }
        
        var entry = {
            message:message,
            prefix:prefix,
            format:format
        }
        req.aRAD.log.push(entry);
    
    }

}
var log = function(req, message) {
    myLog(req, message, ' info  - ', logFormat);
}
var error = function( req, message) {
    myLog(req, message, '*error - ', errorFormat);
}
exports.log = log;
exports.error = error;


//-----------------------------------------------------------------------
var myDump = function (req, message, prefix, format ) {
    // displays the stored log file to the console.

    if (typeof req.aRAD.log == 'undefined') {
        req.aRAD.log = [];
    }
    
    
    for (var i=0; i< req.aRAD.log.length; i++) {
        
        var entry = req.aRAD.log[i];
        
        if (entry.message != '') {
            if (entry.format == logFormat) {
                console.log(color(entry.prefix, entry.format) + color(entry.message, 'white'));
            } else {
                console.log(color(entry.prefix + entry.message, entry.format));
            }
            
//            console.log(color('   info  - ', format)+entry.message);
        } else {
            console.log();
        }
    }
    
    
    if (typeof message != 'undefined') {
        console.log(color(' info  - ', format)+color(message,'white'));
    }
    
    console.log('');
    console.log('');
    
    req.aRAD.log = [];  // clear entries now that they are dumped ...
}

var logDump = function(req, message) {
    myDump(req, message, ' info  - ', logFormat);
}

var errorDump= function(req, message){
    myDump(req, message, '*error - ', errorFormat);
}
exports.logDump = logDump;
exports.errorDump = errorDump;






