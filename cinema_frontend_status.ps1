# Status helper for Cinema Frontend NSSM service
$serviceName = "CinemaFrontend"
$stdout = "D:\sites\cinema\new-cinema-frontend\logs\nssm-stdout.log"
$stderr = "D:\sites\cinema\new-cinema-frontend\logs\nssm-stderr.log"

Get-Service -Name $serviceName -ErrorAction SilentlyContinue | Format-List Name, Status, StartType, DisplayName
Write-Host "--- port 3000 ---"
netstat -ano | findstr "LISTENING" | findstr ":3000 "
Write-Host "--- stdout (tail) ---"
if (Test-Path $stdout) { Get-Content $stdout -Tail 20 } else { Write-Host "(no stdout log yet)" }
Write-Host "--- stderr (tail) ---"
if (Test-Path $stderr) { Get-Content $stderr -Tail 20 } else { Write-Host "(no stderr log yet)" }
