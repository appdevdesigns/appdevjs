var AppInstall = require('./app_install.js');
http = require('http');
var options = {
    port: 8088,
    path: '/appDevInstall'
    };
var req = http.request(options, function(res) {
    if(res.statusCode == 200) {
        // success
        process.exit(0);
    }
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});
req.end();

// No response received, failure
setTimeout(function() {
    process.exit(1);
}, 2000);
