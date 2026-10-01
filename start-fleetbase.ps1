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

Write-Host "[2/3] Probing application readiness (GET /ready)..." -ForegroundColor Green
$ready = $false
$maxAttempts = 30
$attempt = 0

while (-not $ready -and $attempt -lt $maxAttempts) {
    $attempt++
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8000/ready" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($res.status -eq 'ready') {
            $ready = $true
            Write-Host "    [+] System readiness probe passed on attempt $attempt" -ForegroundColor Green
            break
        }
    } catch {
        # Retry until ready
    }
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    Write-Host "    [!] Warning: Readiness probe timed out after $($maxAttempts * 2)s. Proceeding with caution..." -ForegroundColor Yellow
}

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
