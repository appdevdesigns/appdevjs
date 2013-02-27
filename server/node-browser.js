var create = function(globals) {
    // The window is really a contextify object, so it supports window.run(...)
    var window = require('jsdom').jsdom().createWindow();
    
    for (var key in globals) {
        if (globals.hasOwnProperty(key)) {
            window[key] = globals[key];
        }
    }
    
    window.console = console;
    window.window = window;
    
    var sandbox = window.sandbox = window;
    // Execute the code in the specified file in the context of the emulated browser window
    sandbox.runFile = function(filename, callback) {
        var fs = require('fs');
        var content = fs.readFileSync(filename, 'utf8');
        sandbox.run(content, filename.split('/').pop());
        if (typeof callback === 'function') {
            callback();
        }
    };
    
    sandbox.runFile(__appdevPath +'/server/node-steal.js', function() {
        sandbox.run("steal('jquery', 'jquery/class', 'jquery/model', 'jquery/model/backup');");
    });
    
    return window;
};

module.exports = {
    create: create
};
