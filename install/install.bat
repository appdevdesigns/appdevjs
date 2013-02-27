@echo off
    cd ../server
    echo "Installing node modules..."
    call npm install ansi-color
    call npm install ejs
    call npm install express@2.5.9
    call npm install socket.io@0.9.0
    call npm install mysql@2.0.0-alpha3
    call npm install faye
    call npm install jquery-deferred
    call npm install temp
    call npm install eventemitter2
    call npm install async
    call npm install nodeunit
    call npm install request
    call npm install underscore 
    call npm install jsdom 
    call npm install mimelib-noiconv
