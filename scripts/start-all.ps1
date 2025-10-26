# Script para iniciar todo el sistema automáticamente
# Abre 3 ventanas de PowerShell: Servidor, Streamer, Viewer
# Uso: .\scripts\start-all.ps1

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  StreamHub - Iniciando Sistema Completo" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$rootPath = Split-Path -Parent $PSScriptRoot

# Verificar si node_modules existe
if (-not (Test-Path "$rootPath\node_modules")) {
    Write-Host "⚠️  Instalando dependencias..." -ForegroundColor Yellow
    Set-Location $rootPath
    npm install
    Write-Host ""
}

Write-Host "🚀 Abriendo ventanas de terminal..." -ForegroundColor Green
Write-Host ""

# Abrir servidor en nueva ventana
Write-Host "1️⃣  Iniciando Servidor..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$rootPath'; .\scripts\start-server.ps1"
Start-Sleep -Seconds 3

# Abrir streamer en nueva ventana
Write-Host "2️⃣  Iniciando Streamer..." -ForegroundColor Magenta
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$rootPath'; .\scripts\start-streamer.ps1"
Start-Sleep -Seconds 2

# Abrir viewer en nueva ventana
Write-Host "3️⃣  Iniciando Viewer..." -ForegroundColor Blue
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$rootPath'; .\scripts\start-viewer.ps1"

Write-Host ""
Write-Host "✅ Sistema iniciado en 3 ventanas de terminal" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📝 Instrucciones:" -ForegroundColor Yellow
Write-Host "   1. En la ventana STREAMER:" -ForegroundColor White
Write-Host "      - Ingresa nombre de usuario" -ForegroundColor Gray
Write-Host "      - Crea un stream (s)" -ForegroundColor Gray
Write-Host "      - COPIA la Stream Key generada" -ForegroundColor Gray
Write-Host "      - Inicia transmisión (s)" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. En la ventana VIEWER:" -ForegroundColor White
Write-Host "      - Ingresa nombre de usuario" -ForegroundColor Gray
Write-Host "      - PEGA la Stream Key del streamer" -ForegroundColor Gray
Write-Host "      - ¡Disfruta del stream!" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Prueba los comandos:" -ForegroundColor White
Write-Host "      - /chat <mensaje>  (en ambos)" -ForegroundColor Gray
Write-Host "      - /react <emoji>   (solo viewer)" -ForegroundColor Gray
Write-Host "      - /viewers         (en ambos)" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Read-Host "Presiona Enter para cerrar esta ventana"
