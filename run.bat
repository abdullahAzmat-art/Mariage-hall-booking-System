@echo off
title Venuora - Marriage Hall Booking System Launcher
color 0B

echo ===================================================
echo     VENUORA - MARRIAGE HALL BOOKING SYSTEM
echo ===================================================
echo.
echo Starting Backend and Frontend servers...
echo.

:: Get the directory where run.bat is located
set ROOT_DIR=%~dp0

:: Launch Backend in a new CMD window
echo [1/2] Launching Backend Server...
start "Venuora Backend Server" cmd /k "cd /d "%ROOT_DIR%backend" && title Venuora Backend Server && echo ======================================== && echo   VENUORA BACKEND (Node / Express) && echo ======================================== && npm run dev"

:: Small delay to let backend start initializing
timeout /t 2 /nobreak >nul

:: Launch Frontend in a new CMD window
echo [2/2] Launching Frontend Client...
start "Venuora Frontend Client" cmd /k "cd /d "%ROOT_DIR%frontend" && title Venuora Frontend Client && echo ======================================== && echo   VENUORA FRONTEND (Vite / React) && echo ======================================== && npm run dev"

echo.
echo ===================================================
echo   Both Backend & Frontend are now launching!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000 (or configured port)
echo ===================================================
echo.
echo You can keep this window open or close it anytime.
pause
