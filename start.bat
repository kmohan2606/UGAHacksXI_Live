@echo off
setlocal

set "DIR=%~dp0"
set "DIR=%DIR:~0,-1%"
set "BUN_BIN=%DIR%\.bun\bin\bun.exe"

REM Install bun locally if missing
if not exist "%BUN_BIN%" (
    echo Installing Bun locally...
    set "BUN_INSTALL=%DIR%\.bun"
    powershell -Command "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; irm bun.sh/install.ps1 | iex"
)

REM Check if local bun exists, otherwise try global
if exist "%BUN_BIN%" (
    set "BUN_CMD=%BUN_BIN%"
) else (
    echo Local Bun not found, trying global 'bun'...
    set "BUN_CMD=bun"
)

REM Install deps if needed
if not exist "%DIR%\backend\node_modules" (
    echo Installing backend dependencies...
    pushd "%DIR%\backend"
    "%BUN_CMD%" install
    popd
)
if not exist "%DIR%\webapp\node_modules" (
    echo Installing webapp dependencies...
    pushd "%DIR%\webapp"
    "%BUN_CMD%" install
    popd
)

REM Kill existing processes on ports 3000 and 8000
echo Killing existing processes on port 3000 and 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo Starting backend on http://localhost:3000 ...
start "Backend Server" /D "%DIR%\backend" "%BUN_CMD%" run --hot src/index.ts

echo Starting webapp on http://localhost:8000 ...
start "Webapp Server" /D "%DIR%\webapp" "%BUN_CMD%" x vite --host 127.0.0.1 --port 8000

echo.
echo Servers have been started in separate windows.
echo Open http://localhost:8000 in your browser to view the app.
echo Close the separate command windows to stop the servers.
echo.
pause
