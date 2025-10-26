# Script para iniciar un cliente viewer
# Uso: .\scripts\start-viewer.ps1

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    StreamHub - Iniciando Viewer" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Verificar si el servidor está corriendo
$serverUrl = "http://localhost:3000/health"
try {
    $response = Invoke-WebRequest -Uri $serverUrl -UseBasicParsing -ErrorAction SilentlyContinue
    $status = $response.Content | ConvertFrom-Json
    Write-Host "✅ Servidor detectado en http://localhost:3000" -ForegroundColor Green
    Write-Host "   Streams activos: $($status.activeStreams)" -ForegroundColor Gray
    Write-Host "   Usuarios conectados: $($status.connectedUsers)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  ADVERTENCIA: No se detectó el servidor en http://localhost:3000" -ForegroundColor Yellow
    Write-Host "   Asegúrate de iniciar el servidor primero con: .\scripts\start-server.ps1" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "¿Continuar de todas formas? (s/n)"
    if ($continue -ne "s") {
        exit
    }
}

Write-Host ""
Write-Host "👁️  Iniciando cliente Viewer..." -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

npm run dev:viewer
