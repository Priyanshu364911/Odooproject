@echo off
echo Starting Expense Management Platform Development Servers...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d backend && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d frontend && npm run dev"

echo.
echo Both servers are starting!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to continue...
pause >nul