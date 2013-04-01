#!/bin/bash
# This file is a batch script to create the appDev documentation locally.
# Documentation is created from code comments

#Check that the user has java installed:
if ! ( java -version >/dev/null 2>&1 ); then
    echo "Error: Java Runtime Environment (JRE) not present";
    exit;
fi;

STARTDATE=$(date)
echo "Start..."$STARTDATE

TARGET_FILE=$0

cd `dirname $TARGET_FILE`
TARGET_FILE=`basename $TARGET_FILE`

PHYS_DIR=`pwd -P`
SCRIPT=$PHYS_DIR/$TARGET_FILE

echo "	script file ["$SCRIPT"]"

# Absolute path this script is in.
BASE=`dirname $SCRIPT`/
echo "	path of script file ["$BASE"]"

# parent directory
PARENT=`basename $BASE`
echo "	parent directory of script file ["$PARENT"]"

# Keeps the executing directory as appdev root.
cd $BASE
rm -rf docs
rm -rf docs.html
cd ..

# Save AD root path
ADROOT_DIR=`pwd -P`

AD_BASE=`basename $ADROOT_DIR`

rm -rf ../documentjs/
rm -rf ../steal/
rm -rf ../ad_back/

mkdir ../ad_back
mv $ADROOT_DIR/server/node_modules ../ad_back/node_modules
mv $ADROOT_DIR/server/test ../ad_back/test 


echo "	copying current version of documentjs & steal.."
cp -r web/scripts/documentjs ../
cp -r web/scripts/steal ../
cp documentation/summary.ejs .

# call the documentjs script
cd ..
documentjs/doc $AD_BASE>$BASE/docs_output.txt&

echo "	rendering documentation for "$AD_BASE
echo "	on process "$!

for (( ; ; ))
do
	TESTDONE=`ps ax | grep -v grep | grep $!`
	
	if [ "$TESTDONE" = "" ]
	then
		break
	fi
	
	sleep 2
	echo -n "."	
done

echo

sed -e "s/\.\.\\//\.\.\\/web\\/scripts\\//" $ADROOT_DIR/docs.html > $BASE/docs2.html
rm -rf $ADROOT_DIR/docs.html
mv $BASE/docs2.html $BASE/docs.html
#mv $ADROOT_DIR/docs.html $BASE/docs.html
mv $ADROOT_DIR/docs $BASE/docs

echo "	clean up.."
rm -rf documentjs
rm -rf steal
rm -rf $ADROOT_DIR/summary.ejs

mv ad_back/node_modules $ADROOT_DIR/server/
mv ad_back/test $ADROOT_DIR/server/
rm -rf ad_back

echo "	documentjs output sent to docs_output.txt for debugging purposes.."
ENDDATE=$(date)
echo "Done. ("$ENDDATE")"
