@echo off
cd /d C:\Users\olive\Projects\webdev

echo [%date% %time%] Starting webdev deploy... > deploy.log 2>&1

echo [%date% %time%] Building image... >> deploy.log 2>&1
docker build -t webdev-mcp-server:latest . >> deploy.log 2>&1
if errorlevel 1 (
    echo [%date% %time%] BUILD FAILED >> deploy.log 2>&1
    exit /b 1
)

echo [%date% %time%] Recreating container... >> deploy.log 2>&1
docker compose up -d --force-recreate >> deploy.log 2>&1

ping -n 15 127.0.0.1 >nul
curl.exe -sf http://localhost:4500/api/health >> deploy.log 2>&1
if errorlevel 1 (
    echo [%date% %time%] HEALTH CHECK FAILED >> deploy.log 2>&1
    exit /b 1
)

echo [%date% %time%] Deploy successful >> deploy.log 2>&1
