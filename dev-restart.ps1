$ErrorActionPreference = 'Continue'

Set-Location -LiteralPath $PSScriptRoot

while ($true) {
  $startedAt = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Write-Host "[$startedAt] Starting DeadByte dev runtime..."

  pnpm start:ts
  $exitCode = $LASTEXITCODE

  $stoppedAt = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Write-Host "[$stoppedAt] DeadByte dev runtime stopped with exit code $exitCode. Restarting in 5 seconds..."

  Start-Sleep -Seconds 5
}
