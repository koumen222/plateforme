param(
  [string]$Message = "chore: sync uploaded media"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

Write-Host "Staging uploads..." -ForegroundColor Cyan
git add "backend/uploads" "backend/.gitignore"

$status = git status -sb
if ($status -notmatch "backend/uploads") {
  Write-Host "No new uploads to commit." -ForegroundColor Yellow
  exit 0
}

Write-Host "Committing..." -ForegroundColor Cyan
git commit -m $Message

Write-Host "Pushing..." -ForegroundColor Cyan
git push

Write-Host "Done." -ForegroundColor Green
