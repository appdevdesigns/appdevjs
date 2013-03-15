#!/bin/bash

PWD=`pwd`
BASE=`basename $PWD`

# AppDev HTTP server port can be specified on command line
PORT=$1
if [ "$PORT" == "" ];
then
    # default port
    PORT=8088
fi


if [ "$BASE" == "install" ];
then

    cd ../server
    echo "Installing node modules..."
    npm install ansi-color
    npm install ejs
    npm install express@2.5.9
    npm install express-params
    npm install socket.io@0.9.0
    npm install mysql@2.0.0-alpha3
	npm install faye
    npm install jquery-deferred
    npm install temp
    npm install eventemitter2
    npm install async
    npm install nodeunit
    npm install request # For node-mandrill
    npm install underscore # For node-mandrill
    npm install jsdom # For node-browser
    npm install mimelib-noiconv

    #npm install cas # <-- this won't work until the module maintainer merges my code on github (Mantis 2272)
    # http://appdev.appdevdesigns.net/mantis/view.php?id=2272#c8390
    git clone https://github.com/joshchan/node-cas.git node_modules/cas
    
    chmod 777 ../web/scripts/js
    
    cd ../install
    echo "Starting install server..."
    echo "Please start your web browser and go to http://localhost:$PORT/appDevInstall"
    node app_install.js $PORT
    if [ $? == 0 ];
    then
        # app_install.js completed normally
        cd ..
        echo "Starting appDev server..."
        node app.js
    else
        echo "Installation error."
    fi

else
    echo "Please chdir to the install directory before running this."
fi