// StealJS for NodeJS, inspired by JavascriptMVC
steal = function() {
    // Convert the arguments object to an arguments array
    var args = Array.prototype.slice.call(arguments);
    var lastArg = args[args.length - 1];
    var onDone = null;
    if (typeof lastArg === "function") {
        onDone = lastArg;
        args.pop();
    }
    
    args.forEach(function(arg) {
        var filepath = arg;
        
        if (steal.includedFiles.indexOf(filepath) !== -1) {
            // This file has already been included
            return;
        }
        steal.includedFiles.push(filepath);
        
        var filename = arg.split('/').pop();
        if (!filename.match(/\.js$/)) {
            // Filename does not contain an extension, so assume path/to/folder/folder.js style
            filepath += '/'+filename+'.js';
        }
        
        console.log('Stealing ['+filepath+']');
        sandbox.runFile(__appdevPath+'/web/scripts/'+filepath);
    });
    
    if (onDone) {
        onDone($);
    }
    
    // Return steal for chaining
    return steal;
};

// then() does the same thing as steal()
steal.then = steal;

steal.dev = {
    log: console.info,
    warn: console.warn
};

// The list of included file paths
steal.includedFiles = [];
