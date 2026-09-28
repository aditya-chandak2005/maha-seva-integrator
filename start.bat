@echo off
echo ===================================================
echo   Starting Maha-Seva Integrator Platform
echo ===================================================

echo [1/2] Launching Backend API Server (FastAPI on Port 8000)...
start "Maha-Seva Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend Server (Vite on Port 5173)...
start "Maha-Seva Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo   Servers are active! Access options:
echo ===================================================
echo   [Laptop / Local PC] : http://localhost:5173
echo   [Mobile / Wi-Fi LAN]: http://192.168.0.100:5173
echo   [Backend API Docs]  : http://localhost:8000/docs
echo.
echo   Want to share with friends over the internet?
echo   Simply double-click: share-online.bat
echo ===================================================
echo.
echo Opening portal in default browser...
start http://localhost:5173
echo.
pause
