#!/bin/sh
# remove generated files from the installation
# see also .gitignore in the project root, "generated files" section

rm -v ../server/defaults.js
rm -v ../index.html
rm -v ../modules/site/install/data/appDev_setup_*.sql

