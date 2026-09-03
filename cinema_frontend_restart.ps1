# Restart Cinema Frontend Windows service (NSSM / CinemaFrontend)
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\cinema_frontend_restart.ps1

$ErrorActionPreference = "Stop"
$serviceName = "CinemaFrontend"
$nssm = "D:\sites\cinema\tools\nssm\win64\nssm.exe"

if (-not (Get-Service -Name $serviceName -ErrorAction SilentlyContinue)) {
  Write-Error "Service '$serviceName' not found. Install it first (see FULLSTACK_HOSTING.md)."
  exit 1
}

Write-Host "Restarting $serviceName..."
if (Test-Path $nssm) {
  & $nssm restart $serviceName
} else {
  Restart-Service -Name $serviceName -Force
}

Start-Sleep -Seconds 3
Get-Service -Name $serviceName | Format-Table Name, Status, StartType -AutoSize
netstat -ano | findstr "LISTENING" | findstr ":3000 "
Write-Host "Done."
