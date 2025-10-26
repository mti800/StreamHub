# Script para iniciar el servidor
# Uso: .\scripts\start-server.ps1

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    StreamHub - Iniciando Servidor" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Iniciar servidor
Write-Host "🚀 Iniciando servidor en http://localhost:3000" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

npm run dev:server
