param([string]$cmd = "up")

switch ($cmd) {
    "up"      { docker compose up }
    "down"    { docker compose down }
    "build"   { docker builder prune -f; docker compose build --no-cache }
    "restart" { docker compose down; docker builder prune -f; docker compose build --no-cache; docker compose up }
    default   { Write-Host "Usage: .\dev.ps1 [up|down|build|restart]" }
}
