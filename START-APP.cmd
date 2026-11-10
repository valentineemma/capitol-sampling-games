@echo off
cd /d "%~dp0"
if not exist node_modules call npm install
if errorlevel 1 goto failed
echo Open http://127.0.0.1:5173/ in your browser. Stop with Ctrl+C.
call npm run dev
goto :eof
:failed
echo Dependency installation failed. Check your internet connection and Node.js installation.
pause
