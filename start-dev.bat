@echo off
echo Starting Online Exam System...
echo.
echo Starting Backend Server on http://localhost:3001...
start "Backend Server" cmd /k "cd backend && npm run start:dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server on http://localhost:3000...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
pause
