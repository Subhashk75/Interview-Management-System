@echo off
echo ========================================================
echo   Starting Interview Management System (IMS) Services
echo ========================================================

set ROOT=%~dp0
set JAVA_HOME=%ROOT%.tools\jdk-21.0.5+11
set PATH=%JAVA_HOME%\bin;%ROOT%.tools\apache-maven-3.9.9\bin;%PATH%

echo [1/3] Starting MongoDB on port 27017...
start "IMS MongoDB" cmd /k ""%ROOT%.tools\mongodb-win32-x86_64-windows-7.0.14\bin\mongod.exe" --dbpath "%ROOT%.tools\data\db" --bind_ip 127.0.0.1 --port 27017"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Spring Boot Backend on port 8080...
start "IMS Backend" cmd /k "cd /d "%ROOT%" && "%JAVA_HOME%\bin\java.exe" -jar backend\target\ims-backend-1.0.0.jar"

timeout /t 5 /nobreak >nul

echo [3/3] Starting Next.js Frontend on port 3000...
start "IMS Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo ========================================================
echo All 3 services launched in separate windows!
echo - Frontend:  http://localhost:3000
echo - Backend:   http://localhost:8080
echo - Swagger:   http://localhost:8080/swagger-ui/index.html
echo ========================================================
pause
