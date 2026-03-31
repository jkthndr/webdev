@echo off
:: Find and kill only the process listening on port 4500 (webdev MCP server)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4500" ^| findstr "LISTENING"') do (
  echo Killing webdev server PID %%a
  taskkill /f /t /pid %%a >nul 2>&1
)
