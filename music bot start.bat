@echo off
title Music Bot

cd /d "c:\Users\Administrator\Desktop\bot-music-discord"

echo.
echo ==========================================
echo            Music Bot - Launcher
echo ==========================================
echo.
echo [INFO] Checking dependencies...
if not exist "node_modules" (
    echo [WARN] node_modules not found. Running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Please run it manually.
        pause
        exit /b 1
    )
)

echo.
echo [STEP 1] Deploying Slash Commands...
call node deploy-commands.js
echo.
echo [STEP 2] Starting Music Bot...
echo.
call node index.js
pause
