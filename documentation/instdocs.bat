@echo off



:: relative path to this script

set BASE=%~dps0

set CMD=%0


:: set path to script path

cd %~dps0


:: grab latest docjs steal
echo setup...

rd /Q/S ..\..\documentjs > nul
rd /Q/S ..\..\steal > nul
rd /Q/S ..\..\ad_back > nul

xcopy /Q/S/I ..\web\scripts\documentjs ..\..\documentjs
xcopy /Q/S/I ..\web\scripts\steal ..\..\steal
xcopy /Q/S/I summary.ejs ..\

md ..\..\ad_back
move /Y ..\server\node_modules ..\..\ad_back\
move /Y ..\server\test ..\..\ad_back\


del /Q docs.html > nul
rd /Q/S docs > nul


cd ..\..\

echo rendering docs...
call documentjs\doc.bat appdev > %~dps0\docs_output.txt


::path correction in docs

echo make path corrections
%~dps0\sed -e "s/\.\.\//\.\.\/web\/scripts\//" %~dps0\..\docs.html > %~dps0\docs.html
move %~dps0\..\docs %~dps0\docs


::cleanup

echo cleanup...
move /Y ad_back\node_modules appdev\server\
move /Y ad_back\test appdev\server\
rd /Q/S ad_back
rd /Q/S documentjs
rd /Q/S steal
del /Q appdev\summary.ejs > nul
