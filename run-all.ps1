Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting Interview Management System (IMS) Services" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
$env:JAVA_HOME = "$root\.tools\jdk-21.0.5+11"
$env:Path = "$env:JAVA_HOME\bin;$root\.tools\apache-maven-3.9.9\bin;$env:Path"

Write-Host "`n[1/3] Starting MongoDB on port 27017..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$root\.tools\mongodb-win32-x86_64-windows-7.0.14\bin\mongod.exe' --dbpath '$root\.tools\data\db' --bind_ip 127.0.0.1 --port 27017"

Start-Sleep -Seconds 3

Write-Host "`n[2/3] Starting Spring Boot Backend on port 8080..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:JAVA_HOME = '$root\.tools\jdk-21.0.5+11'; & '$env:JAVA_HOME\bin\java.exe' -jar '$root\backend\target\ims-backend-1.0.0.jar'"

Start-Sleep -Seconds 5

Write-Host "`n[3/3] Starting Next.js Frontend on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " All services started successfully!" -ForegroundColor Green
Write-Host " - Frontend:  http://localhost:3000" -ForegroundColor Green
Write-Host " - Backend:   http://localhost:8080" -ForegroundColor Green
Write-Host " - Swagger:   http://localhost:8080/swagger-ui/index.html" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
