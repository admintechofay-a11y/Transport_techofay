# Starts the checked-out Laravel API and Vite frontend for local development.
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $root 'api'
$frontendDir = Join-Path $root 'frontend'
$logDir = Join-Path $root '.local-logs'
$apiEnv = Join-Path $apiDir '.env'

if (!(Get-Command php -ErrorAction SilentlyContinue)) {
    throw 'PHP is required for local API development. Start Docker with .\start-technofay.ps1 instead.'
}
if (!(Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'Node.js/npm is required for the frontend.'
}
if (!(Test-Path (Join-Path $apiDir 'vendor\autoload.php'))) {
    throw 'API dependencies are missing. Run composer install in api first.'
}
if (!(Test-Path (Join-Path $frontendDir 'node_modules'))) {
    throw 'Frontend dependencies are missing. Run npm install in frontend first.'
}

# Fleetbase has a large vendor tree. An optimized class map keeps each local
# PHP request from walking every package directory on the OneDrive workspace.
$autoloadClassmap = Join-Path $apiDir 'vendor\composer\autoload_classmap.php'
if (!(Test-Path $autoloadClassmap) -or (Get-Item $autoloadClassmap).Length -lt 100000) {
    Push-Location $apiDir
    composer dump-autoload --optimize --no-interaction
    Pop-Location
}

if (!(Test-Path $apiEnv)) {
    Copy-Item (Join-Path $apiDir '.env.example') $apiEnv
    Push-Location $apiDir
    php artisan key:generate --force
    Pop-Location
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$apiLog = Join-Path $logDir 'api.log'
$apiErrorLog = Join-Path $logDir 'api.error.log'
$frontendLog = Join-Path $logDir 'frontend.log'
$frontendErrorLog = Join-Path $logDir 'frontend.error.log'

$apiListening = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (!$apiListening) {
    Start-Process -FilePath 'php' `
        -ArgumentList @('-d', 'max_execution_time=0', 'artisan', 'serve', '--host=127.0.0.1', '--port=8000') `
        -WorkingDirectory $apiDir `
        -RedirectStandardOutput $apiLog `
        -RedirectStandardError $apiErrorLog `
        -WindowStyle Hidden | Out-Null
}

$frontendListening = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if (!$frontendListening) {
    Start-Process -FilePath 'npm.cmd' `
        -ArgumentList @('run', 'dev', '--', '--host=127.0.0.1') `
        -WorkingDirectory $frontendDir `
        -RedirectStandardOutput $frontendLog `
        -RedirectStandardError $frontendErrorLog `
        -WindowStyle Hidden | Out-Null
}

Write-Host 'Local services started:' -ForegroundColor Green
Write-Host '  Frontend: http://localhost:3001'
Write-Host '  API:      http://localhost:8000'
Write-Host "  Logs:     $logDir"
