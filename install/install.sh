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
    npm install

    chmod 777 ../web/scripts/js
    
    cd ../install
    echo "Starting install server..."
    echo "Please start your web browser and go to http://localhost:$PORT/appDevInstall"
    node app_install $PORT
    if [ $? == 0 ];
    then
        # app_install.js completed normally
        cd ..
        echo "Starting appDev server..."
        node app
    else
        echo "Installation error."
    fi

else
    echo "Please chdir to the install directory before running this."
fi