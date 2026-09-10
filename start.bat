@echo off
echo ===================================================
echo   Starting Maha-Seva Integrator Platform
echo ===================================================

echo [1/2] Launching Backend API Server (FastAPI on Port 8000)...
start "Maha-Seva Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend Development Server (Vite on Port 5173)...
start "Maha-Seva Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting up!
echo - Frontend: http://127.0.0.1:5173
echo - Backend API Docs: http://127.0.0.1:8000/docs
echo.
echo Opening portal in default browser...
start http://127.0.0.1:5173
echo.
pause
