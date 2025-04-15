@echo off
cd /d "%~dp0"
start "" node.exe config-server.js
timeout /t 2 >nul
start "" electron\electron.exe .
exit
