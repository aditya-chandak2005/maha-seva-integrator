@echo off
echo ===================================================
echo   Stopping Maha-Seva Integrator Platform
echo ===================================================

echo Stopping processes listening on Port 8000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Terminating PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo Stopping processes listening on Port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Terminating PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo All Maha-Seva servers have been stopped successfully.
echo.
pause

