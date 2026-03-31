@echo off
cd /d C:\Users\oliver\Projects\webdev

:: Kill only the previous webdev server (by port, not by PID file)
powershell -Command "Get-NetTCPConnection -LocalPort 4500 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
timeout /t 2 /nobreak >nul

:: Build if dist is missing
if not exist dist\server\index.js (
  call npm run build
)

:: Start compiled server (stays in foreground so scheduled task keeps it alive)
node dist\server\index.js
