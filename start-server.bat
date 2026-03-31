@echo off
cd /d C:\Users\oliver\Projects\webdev

:: Kill only the previous webdev server if PID file exists
if exist webdev.pid (
  set /p OLD_PID=<webdev.pid
  taskkill /f /t /pid %OLD_PID% >nul 2>&1
  del webdev.pid
)

:: Start server and save PID
start /b npx tsx src/server/index.ts > webdev.log 2>&1
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo list ^| findstr "PID:" ^| sort /r') do (
  echo %%a> webdev.pid
  goto :started
)
:started
echo Webdev MCP server started (PID in webdev.pid)
