
# Usage: .\script\migrate_db.ps1 -SourceUrl "postgres://..." -TargetUrl "postgres://..."

param (
    [string]$SourceUrl,
    [string]$TargetUrl
)

$ErrorActionPreference = "Stop"

if (-not $SourceUrl -or -not $TargetUrl) {
    Write-Host "Error: Both SourceUrl and TargetUrl are required." -ForegroundColor Red
    exit 1
}

Write-Host "Starting Database Migration..." -ForegroundColor Cyan
Write-Host "Source: $SourceUrl"
Write-Host "Target: $TargetUrl"
Write-Host "--------------------------------"

# Create a temporary dump file
$DumpFile = "temp_migration_dump.sql"

# 1. Dump Source Database
Write-Host "Step 1: Dumping source database..." -ForegroundColor Yellow
try {
    # use --dbname to be explicit and quote the argument to handle special chars
    & pg_dump --dbname="$SourceUrl" --no-owner --no-acl --format=plain --file="$DumpFile"
    if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
    Write-Host "Dump successful." -ForegroundColor Green
}
catch {
    Write-Host "Error dumping database: $_" -ForegroundColor Red
    exit 1
}

# 2. Restore to Target Database
Write-Host "Step 2: Restoring to target database..." -ForegroundColor Yellow
try {
    # Quote the target url
    & psql --dbname="$TargetUrl" --file="$DumpFile"
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "Warning: psql exited with code $LASTEXITCODE. Check output for errors (some are expected on fresh dbs)." -ForegroundColor Magenta 
    }
    Write-Host "Restore process completed." -ForegroundColor Green
}
catch {
    Write-Host "Error restoring database: $_" -ForegroundColor Red
    exit 1
}

# Cleanup
if (Test-Path $DumpFile) {
    Remove-Item $DumpFile
    Write-Host "Temporary dump file removed." -ForegroundColor Gray
}

Write-Host "Migration Finished!" -ForegroundColor Cyan
