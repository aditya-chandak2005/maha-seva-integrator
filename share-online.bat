@echo off
echo ================================================================
echo      Maha-Seva Live Public Link Generator (Share with Friends)
echo ================================================================
echo.
echo Please ensure Maha-Seva is running (run start.bat first).
echo.
echo Fetching your tunnel password for friendly verification...
for /f "tokens=*" %%i in ('curl -s https://loca.lt/mytunnelpassword') do set TUNNEL_PWD=%%i
echo.
echo ----------------------------------------------------------------
echo   IMPORTANT: When your friend opens the link for the first time,
echo   the page will ask for a "Tunnel Password / Endpoint IP".
echo   Share this password with them:
echo.
echo   >>> %TUNNEL_PWD% <<<
echo ----------------------------------------------------------------
echo.
echo Starting secure tunnel on port 5173...
echo Your public HTTPS link will appear below (e.g. https://...loca.lt):
echo.
npx --yes localtunnel --port 5173
pause

