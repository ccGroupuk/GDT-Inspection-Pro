@echo off

echo ==========================================
echo   Starting CCC Group CRM (TradeVaultAi)
echo ==========================================
echo.
echo 1. Installing dependencies (including local database)...
call npm install
call npm install @electric-sql/pglite
if %ERRORLEVEL% NEQ 0 (
    echo Error installing dependencies. Please check if Node.js is installed.
    pause
    exit /b
)

echo.
echo 2. Generating Database Schema...
call npx drizzle-kit generate
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Schema generation failed. App might crash if DB is empty.
)

echo.
echo 3. Starting Development Server...
echo    Access the site at: http://localhost:5000
echo.

:: Set environment variable for Windows and run directly
set NODE_ENV=development
call npx tsx --env-file=.env server/index.ts

pause
