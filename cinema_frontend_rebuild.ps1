# Rebuild Next.js frontend and restart CinemaFrontend service
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\cinema_frontend_rebuild.ps1
# Optional: -SkipInstall to skip npm ci

param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$serviceName = "CinemaFrontend"
$nssm = "D:\sites\cinema\tools\nssm\win64\nssm.exe"
$appDir = "D:\sites\cinema\new-cinema-frontend"

Set-Location $appDir

Write-Host "==> Stopping $serviceName (if running)..."
$svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -ne "Stopped") {
  if (Test-Path $nssm) {
    & $nssm stop $serviceName confirm
  } else {
    Stop-Service -Name $serviceName -Force
  }
  Start-Sleep -Seconds 2
}

if (-not $SkipInstall) {
  Write-Host "==> npm ci"
  npm ci
} else {
  Write-Host "==> Skipping npm ci (-SkipInstall)"
}

Write-Host "==> npm run build"
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Error "Build failed. Service was left stopped."
  exit $LASTEXITCODE
}

Write-Host "==> Starting $serviceName..."
if (Test-Path $nssm) {
  & $nssm start $serviceName
} else {
  Start-Service -Name $serviceName
}

Start-Sleep -Seconds 4
Get-Service -Name $serviceName | Format-Table Name, Status, StartType -AutoSize
netstat -ano | findstr "LISTENING" | findstr ":3000 "
Write-Host "Rebuild + restart complete."
