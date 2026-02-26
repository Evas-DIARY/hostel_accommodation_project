@echo off
echo ========================================
echo AU Hostel Accommodation System Launcher
echo ========================================
echo.
echo Checking for http-server...
echo.

where npx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    echo.
    echo Alternatively, use LAUNCH.bat with Python
    pause
    exit
)

echo Starting server with npx http-server...
echo.
echo Your site will open at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd frontend
npx http-server -p 8080 -o

pause
