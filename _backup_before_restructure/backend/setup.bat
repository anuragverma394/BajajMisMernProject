@echo off
REM Backend Setup Script for Monorepo (Windows)
REM Usage: setup.bat

setlocal enabledelayedexpansion

echo ==================================================
echo Bajaj Backend Monorepo Setup
echo ==================================================

REM Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm is not installed
    exit /b 1
)

REM Check npm version (need 8.5.0+ for workspace support)
echo.
echo [0/4] Checking npm version...
for /f "tokens=*" %%i in ('npm -v') do set "npm_version=%%i"
echo Current npm version: %npm_version%

REM Extract major version
for /f "tokens=1 delims=." %%i in ("%npm_version%") do set "major_version=%%i"

if %major_version% LSS 8 (
    echo WARNING: npm version %npm_version% does not support workspaces
    echo Updating npm to latest version...
    call npm install -g npm@latest
    if errorlevel 1 (
        echo WARNING: Could not auto-update npm
    )
)

echo.
echo [1/4] Cleaning old dependencies...
if exist "node_modules" (
    echo Removing old node_modules...
    rmdir /s /q node_modules
    if exist "package-lock.json" del package-lock.json
)

echo.
echo [2/4] Installing root dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    echo Troubleshooting:
    echo  1. Ensure npm version is 8.5.0+: npm -v
    echo  2. Update npm: npm install -g npm@latest
    echo  3. Try again: npm install
    exit /b 1
)

echo.
echo [3/4] Verifying shared package is linked...
if exist "node_modules\@bajaj\shared" (
    echo [OK] @bajaj/shared is linked
) else (
    echo ERROR: @bajaj/shared not linked
    exit /b 1
)

echo.
echo [4/4] Checking service directories...
setlocal enabledelayedexpansion
set "services=user-service auth-service dashboard-service report-service tracking-service survey-service lab-service distillery-service whatsapp-service"

for %%s in (%services%) do (
    if exist "services\%%s" (
        echo [OK] services/%%s
    )
)

echo.
echo ==================================================
echo Setup Complete!
echo ==================================================
echo.
echo To start all services:
echo   npm start
echo.
echo To start a specific service:
echo   cd services\user-service
echo   npm start
echo.
pause
