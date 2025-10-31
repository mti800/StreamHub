# Script principal de StreamHub
# Este script inicia el servidor en modo desarrollo

Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              STREAMHUB - SERVIDOR                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Iniciando servidor en modo desarrollo..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs disponibles:" -ForegroundColor Yellow
Write-Host "   • Streamer:  http://localhost:3000/streamer.html" -ForegroundColor White
Write-Host "   • Viewer:    http://localhost:3000/viewer.html" -ForegroundColor White
Write-Host "   • Principal: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "💡 Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Iniciar el servidor
npm run dev:server
