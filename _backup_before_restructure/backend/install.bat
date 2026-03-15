@echo off
REM Complete Backend Setup & Installation Script
REM Fixes npm workspace linking issues
REM Usage: install.bat

setlocal enabledelayedexpansion

echo.
echo ====================================================================
echo        Bajaj Backend - Complete Setup & Installation
echo ====================================================================
echo.

REM Colors won't work in basic cmd, but we can use echoing
echo [STEP 1] Checking prerequisites...
echo.

REM Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm is not installed
    echo Please download from: https://nodejs.org
    pause
    exit /b 1
)

REM Check npm version
for /f "tokens=*" %%i in ('npm -v') do set "npm_version=%%i"
echo npm version: %npm_version%

REM Check if npm supports workspaces (v8.5.0+)
for /f "tokens=1 delims=." %%i in ("%npm_version%") do set "major_version=%%i"

if %major_version% LSS 8 (
    echo.
    echo WARNING: npm %npm_version% does not support workspaces!
    echo Workspaces require npm 8.5.0 or higher
    echo.
    echo Updating npm to latest version...
    call npm install -g npm@latest
    if errorlevel 1 (
        echo ERROR: Could not update npm
        echo Please manually update from: https://nodejs.org
        pause
        exit /b 1
    )
    REM Get new version
    for /f "tokens=*" %%i in ('npm -v') do set "npm_version=%%i"
    echo npm updated to: !npm_version!
)

echo.
echo [STEP 2] Cleaning old dependencies...
echo.

if exist "node_modules" (
    echo Removing node_modules directory...
    rmdir /s /q node_modules >nul 2>&1
    if errorlevel 1 (
        echo WARNING: Could not remove node_modules (might be in use)
    ) else (
        echo [OK] node_modules removed
    )
)

if exist "package-lock.json" (
    echo Removing package-lock.json...
    del /f /q package-lock.json >nul 2>&1
    if errorlevel 1 (
        echo WARNING: Could not remove package-lock.json
    ) else (
        echo [OK] package-lock.json removed
    )
)

echo Clearing npm cache...
call npm cache clean --force >nul 2>&1

echo.
echo [STEP 3] Installing all dependencies (this may take a minute)...
echo.

call npm install
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed
    echo.
    echo Troubleshooting:
    echo  1. Ensure npm version is 8.5.0+: npm -v
    echo  2. Check internet connection
    echo  3. Try manual fix:
    echo     - Delete node_modules and package-lock.json
    echo     - Run: npm install
    pause
    exit /b 1
)

echo.
echo [STEP 4] Verifying workspace setup...
echo.

if exist "node_modules\@bajaj\shared" (
    echo [OK] @bajaj/shared is linked
) else (
    echo WARNING: @bajaj/shared not found in node_modules
    echo Attempting manual link...
    
    if exist "shared" (
        cd shared
        call npm link
        cd ..
        if errorlevel 1 (
            echo ERROR: Manual link failed
        ) else (
            echo [OK] Manual link completed
        )
    )
)

echo.
echo [STEP 5] Verifying services...
echo.

REM Check each service
if exist "services\user-service" (
    echo [OK] user-service
) else (
    echo WARNING: user-service not found
)

if exist "services\auth-service" (
    echo [OK] auth-service
) else (
    echo WARNING: auth-service not found
)

if exist "services\dashboard-service" (
    echo [OK] dashboard-service
) else (
    echo WARNING: dashboard-service not found
)

if exist "services\report-service" (
    echo [OK] report-service
) else (
    echo WARNING: report-service not found
)

echo.
echo [STEP 6] Testing module resolution...
echo.

REM Test if @bajaj/shared can be resolved
node -e "try { require('@bajaj/shared'); console.log('SUCCESS: @bajaj/shared found'); } catch(e) { console.log('ERROR: ' + e.message); process.exit(1); }"
if errorlevel 1 (
    echo.
    echo ERROR: @bajaj/shared cannot be resolved
    echo This indicates workspace linking failed
    echo.
    echo Additional troubleshooting:
    echo  1. Delete all node_modules and package-lock.json manually
    echo  2. Restart your terminal (close and reopen)
    echo  3. Run this script again
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo               Setup Complete and Verified!
echo ====================================================================
echo.
echo Next steps:
echo.
echo To start all services:
echo   npm start
echo.
echo To start a specific service:
echo   cd services\user-service
echo   npm start
echo.
echo To rebuild if issues persist:
echo   node rebuild.js
echo.
pause
