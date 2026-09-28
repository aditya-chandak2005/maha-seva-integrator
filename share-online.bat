@echo off
echo ================================================================
echo      Maha-Seva Live Public Link Generator (Cloudflare Tunnel)
echo ================================================================
echo.
echo Please ensure Maha-Seva is running (run start.bat first).
echo.
echo Starting high-speed secure Cloudflare Tunnel for your website...
echo  - NO PASSWORD REQUIRED!
echo  - Works on iPhone, Android, tablets, and laptops worldwide!
echo.
echo Your public HTTPS link will appear below (e.g. https://...trycloudflare.com):
echo ----------------------------------------------------------------
echo.
"%~dp0cloudflared.exe" tunnel --url http://localhost:5173
pause
