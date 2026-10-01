# Technofay Transport Quickstart Script for Windows PowerShell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting Technofay Transport Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if Docker is running
docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Docker is not running or not in PATH." -ForegroundColor Yellow
    Write-Host "    Please ensure Docker Desktop is started and running." -ForegroundColor Yellow
    Exit 1
}

Write-Host "[1/3] Pulling and starting Docker containers..." -ForegroundColor Green
docker compose up -d

Write-Host "[2/3] Waiting for database to initialize (15s)..." -ForegroundColor Green
Start-Sleep -Seconds 15

Write-Host "[3/3] Running migrations and initial database deploy..." -ForegroundColor Green
docker compose exec -T application bash -c "./deploy.sh"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Technofay Transport is Ready to Use!   " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host " Console (Web UI): http://localhost:4200" -ForegroundColor White
Write-Host " API Server:       http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:   docker compose logs -f" -ForegroundColor DarkGray
Write-Host "To stop:        docker compose down" -ForegroundColor DarkGray
