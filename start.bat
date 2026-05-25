@echo off
echo NetPulse - Network Diagnostics Dashboard
echo =========================================

echo Starting backend on port 3001...
cd backend
start "NetPulse Backend" cmd /k "npm install && node server.js"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting frontend on port 5173...
cd ..\frontend
start "NetPulse Frontend" cmd /k "npm install && npm run dev"

echo.
echo NetPulse is starting!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo.
echo Two terminal windows have been opened.
echo Close them to stop the application.
pause
