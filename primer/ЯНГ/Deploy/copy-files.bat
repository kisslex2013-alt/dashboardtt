@echo off
chcp 65001 >nul
echo Copying files...
copy /Y "..\tasks-page.html" "tasks-page.html"
copy /Y "..\accruals-page.html" "accruals-page.html"
echo.
echo Done! All files copied.
pause

