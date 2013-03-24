appDev
======

Prerequisites
-------------

Before installing appDev, set up your environment. You will need to **install NodeJS** version 0.8.* [available here](http://nodejs.org/dist/v0.8.22/). After installing, verify that node and npm are working from your terminal:

    node -v
    npm -v
    
You will also need to [install MAMP](http://www.mamp.info/en/index.html) (on Mac) or [install XAMPP](http://www.apachefriends.org/en/xampp-windows.html) (on Windows. Use the "Installer" version). Take note of the mysql server port (default values are typically 3306 or 8889). Also take note of the path to the mysql executable. When installing appDev, you will need to give the path to `mysql` and `mysqldump`. On Windows this is:

    C:\xampp\mysql\bin\mysql.exe
    C:\xampp\mysql\bin\mysqldump.exe
    
On Mac it is:

    /Applications/MAMP/Library/bin/mysql
    /Applications/MAMP/Library/bin/mysqldump

Finally, **create a new sql database** for appDev to use. 

On Windows, you will need a Unix style shell to execute the install shell script `install.sh`. Git Bash (which is part of Windows git) or Cygwin should work. Alternately, you can manually install the npm packages from the windows command line and then run `node app_install.js`.

Installing
----------

After cloning the repository or unpacking the zip file, change to the install directory and run `install.sh`. On Windows you can run install.sh from Git Bash.

    ./install.sh
    
You should see a series of NPM install commands. These are installing the 3rd party components used by AppDev. (Note that some node packages require a compiler to complete their install, so e.g. on Ubuntu, the package `build-essentials` should be installed.) When the process is done, you should see the following:

    Starting install server...
    Please start your web browser and go to http://localhost:8088/appDevInstall

    --------------------------------------
    appDev Install Server listening on port[8088]

(Note: if the default port 8088 isn't available on your system, you can specify the port as an argument to `install.sh` )

Web installer wizard
--------------------

Access the web installer wizard by going to [http://localhost:8088/appDevInstall](http://localhost:8088/appDevInstall). On most pages, you can copy the suggested values into the text boxes.

*   Step 1: Database Setup

    Enter the name of an **existing database**.

*   Step 2: Authentication

    The default is okay.

*   Step 3: Email Setup
 
    Keep SMTP selected and enter the defaults shown there.

*   Step 4: Languages

    Accept the defaults.
   
*   Step 5: Administrator setup

    Fill in the admin account password.

*   Step 6: Install
    
    Just press **Done** if everything looks right. Check the terminal to see if there were errors.

After this, you will be redirected to a login screen. Enter the admin userid and password you created in step 5.