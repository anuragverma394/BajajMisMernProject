@echo off
REM Manual Workspace Linker
REM Use this if automatic workspace setup fails
REM Usage: link.bat

setlocal enabledelayedexpansion

echo.
echo ====================================================================
echo        Manual Workspace Linking
echo ====================================================================
echo.

REM Check if shared package exists
if not exist "shared\package.json" (
    echo ERROR: shared\package.json not found
    echo Are you running this from the backend directory?
    pause
    exit /b 1
)

echo [STEP 1] Linking @bajaj/shared globally...
echo.

cd shared
call npm link
if errorlevel 1 (
    echo ERROR: Failed to link @bajaj/shared
    cd ..
    pause
    exit /b 1
)
cd ..

echo [OK] @bajaj/shared linked globally

echo.
echo [STEP 2] Linking services to @bajaj/shared...
echo.

setlocal enabledelayedexpansion
set "services=user-service auth-service dashboard-service report-service tracking-service survey-service lab-service distillery-service whatsapp-service"

for %%s in (%services%) do (
    if exist "services\%%s" (
        echo Linking services\%%s...
        cd services\%%s
        call npm link @bajaj/shared
        if errorlevel 1 (
            echo WARNING: Failed to link %%s
        ) else (
            echo [OK] %%s linked
        )
        cd ..\..
    )
)

echo.
echo [STEP 3] Verifying links...
echo.

node -e "try { require('@bajaj/shared'); console.log('SUCCESS: @bajaj/shared resolved'); } catch(e) { console.log('ERROR: ' + e.message); process.exit(1); }"
if errorlevel 1 (
    echo ERROR: @bajaj/shared still cannot be resolved
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo               Manual Linking Complete!
echo ====================================================================
echo.
echo You can now run:
echo   npm start
echo.
pause
