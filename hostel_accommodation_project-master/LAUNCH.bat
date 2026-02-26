@echo off
echo ========================================
echo AU Hostel Accommodation System Launcher
echo ========================================
echo.
echo Starting local development server...
echo.
echo Your site will open at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd frontend
python -m http.server 8000

pause
