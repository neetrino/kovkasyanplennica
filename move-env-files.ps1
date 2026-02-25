# Script to find and move all .env files to env folder (or copy for safe backup)
# Uses current script directory as project root
$rootPath = $PSScriptRoot
$envFolder = Join-Path $rootPath "env"

# Create env folder if it doesn't exist
if (-not (Test-Path $envFolder)) {
    New-Item -ItemType Directory -Path $envFolder | Out-Null
}

# Find all .env files recursively (exclude node_modules and env folder)
$envFiles = Get-ChildItem -Path $rootPath -Filter ".env*" -Recurse -Force -ErrorAction SilentlyContinue | Where-Object {
    $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*env\*" -and $_.FullName -notlike "*\.next*"
}

Write-Host "Project root: $rootPath"
Write-Host "Env folder:   $envFolder"
Write-Host "Found $($envFiles.Count) .env files:"
foreach ($file in $envFiles) {
    Write-Host "  $($file.FullName)"
    $destination = Join-Path $envFolder $file.Name
    if (Test-Path $destination) {
        $parentName = Split-Path (Split-Path $file.FullName -Parent) -Leaf
        $newName = "$parentName-$($file.Name)"
        $destination = Join-Path $envFolder $newName
    }
    # Move to env folder (remove -Force to avoid overwriting; use Copy-Item to keep originals)
    Move-Item -Path $file.FullName -Destination $destination -Force
    Write-Host "    -> Moved to $destination"
}

Write-Host "Done! Next.js will load from root .env or env/.env if present (see next.config.js)."
Write-Host "To keep .env in place and only copy to env/: replace Move-Item with Copy-Item above."










