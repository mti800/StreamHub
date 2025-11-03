# 📊 Buffering Adaptativo en el Viewer

## Descripción General

Sistema de gestión dinámica de buffering implementado en el lado del cliente (viewer) que monitorea las condiciones de red en tiempo real y ajusta automáticamente el comportamiento del reproductor de video para optimizar la experiencia de visualización.

## 🎯 Objetivo

Dado que StreamHub usa **multicast** (un único stream para todos los viewers), no es posible ajustar la calidad del stream por viewer individual. Sin embargo, **sí podemos optimizar la reproducción local** según las condiciones de red de cada viewer.

## ✨ Características Implementadas

### 1. Monitoreo de Estadísticas WebRTC

El sistema monitorea cada 2 segundos las siguientes métricas:

- **Pérdida de Paquetes (%)**: Porcentaje de paquetes perdidos vs recibidos
- **Latencia (RTT)**: Round Trip Time en milisegundos
- **Jitter**: Variación en la latencia
- **Bytes Recibidos**: Cantidad de datos recibidos

### 2. Indicadores Visuales de Calidad

**Badge de Conexión:**
- 🟢 **Excelente**: < 2% pérdida de paquetes
- 🟡 **Buena**: 2-5% pérdida de paquetes  
- 🟠 **Regular**: 5-10% pérdida de paquetes
- 🔴 **Pobre**: > 10% pérdida de paquetes

**Estadísticas en Tiempo Real:**
- Contador de viewers
- Indicador de calidad de conexión
- Porcentaje de pérdida de paquetes
- Latencia en milisegundos

### 3. Estrategias de Buffering Adaptativo

#### Estrategia 1: Buffering Automático
- **Trigger**: Pérdida de paquetes > 15%
- **Acción**: Pausa el video por 2 segundos para acumular buffer
- **UI**: Muestra overlay "Buffering..." con spinner

#### Estrategia 2: Advertencia de Conexión Pobre
- **Trigger**: Pérdida de paquetes > 10% durante 3 mediciones consecutivas (6 segundos)
- **Acción**: Muestra advertencia persistente
- **UI**: "⚠️ Conexión inestable. Puede haber interrupciones."

#### Estrategia 3: Ajuste de Preload
- **Pérdida > 8%**: `video.preload = 'auto'` (precargar más datos)
- **Pérdida < 8%**: `video.preload = 'metadata'` (modo normal)

#### Estrategia 4: Detección de Stream Detenido
- **Trigger**: No se reciben paquetes nuevos
- **Acción**: Activa overlay de buffering hasta que se recuperen paquetes

## 🔧 Implementación Técnica

### Nuevos Elementos HTML

```html
<!-- Estadísticas de conexión -->
<div class="stat-item" id="connectionQuality">
    <div class="number">🟢</div>
    <div class="label">Conexión</div>
</div>

<!-- Overlay de buffering -->
<div id="bufferingOverlay" class="buffering-overlay hidden">
    <div class="buffering-spinner"></div>
    <p>Buffering...</p>
</div>

<!-- Advertencia de conexión pobre -->
<div id="poorConnectionWarning" class="connection-warning hidden">
    <p>⚠️ Conexión inestable. Puede haber interrupciones.</p>
</div>
```

### Funciones Principales

#### `startNetworkMonitoring()`
Inicia el monitoreo de estadísticas WebRTC cada 2 segundos usando `peerConnection.getStats()`.

#### `processWebRTCStats(stats)`
Procesa las estadísticas crudas de WebRTC:
- Extrae métricas de `inbound-rtp` (video)
- Extrae RTT de `candidate-pair`
- Calcula porcentaje de pérdida de paquetes

#### `updateNetworkUI(packetLoss, latency, jitter)`
Actualiza los indicadores visuales:
- Badge de calidad de conexión
- Contadores de pérdida y latencia

#### `applyAdaptiveBuffering(packetLoss, packetsReceived)`
Aplica las 4 estrategias de buffering adaptativo según las condiciones detectadas.

#### `stopNetworkMonitoring()`
Detiene el monitoreo cuando el viewer sale del stream.

### Variables de Estado

```javascript
let statsInterval = null;              // Intervalo de monitoreo
let lastPacketsLost = 0;               // Paquetes perdidos previos
let lastPacketsReceived = 0;           // Paquetes recibidos previos
let consecutivePoorQuality = 0;        // Mediciones consecutivas de mala calidad
let bufferingActive = false;           // Flag de buffering activo
```

## 📈 Flujo de Operación

```
1. Viewer se une al stream
   ↓
2. WebRTC establece conexión (handleOffer)
   ↓
3. Se inicia monitoreo (startNetworkMonitoring)
   ↓
4. Cada 2 segundos:
   - getStats() obtiene métricas
   - processWebRTCStats() calcula indicadores
   - updateNetworkUI() actualiza interfaz
   - applyAdaptiveBuffering() aplica estrategias
   ↓
5. Viewer sale del stream
   ↓
6. Se detiene monitoreo (stopNetworkMonitoring)
```

## 🎨 Estilos CSS

### Buffering Overlay
```css
.buffering-overlay {
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    /* Spinner animado + texto */
}
```

### Connection Warning
```css
.connection-warning {
    position: absolute;
    background: rgba(220, 20, 60, 0.95);
    animation: pulse 2s infinite;
}
```

### Quality Indicators
```css
.quality-excellent { color: #00ff00; } /* 🟢 */
.quality-good { color: #ffff00; }      /* 🟡 */
.quality-fair { color: #ffa500; }      /* 🟠 */
.quality-poor { color: #ff0000; }      /* 🔴 */
```

## 🧪 Pruebas

### Probar Pérdida de Paquetes
Usa las herramientas de desarrollador de Chrome:

1. Abrir DevTools → **Network**
2. Click en **Throttling** → **Add custom profile**
3. Configurar:
   - Download: 1 Mbps
   - Upload: 0.5 Mbps
   - Latency: 100ms
   - Packet loss: 10%

### Probar Conexión Lenta
1. Throttling → **Slow 3G**
2. Verificar que aparece advertencia de conexión pobre
3. Verificar que el buffering se activa automáticamente

### Inspeccionar Estadísticas en Consola
```javascript
// Revisar logs del monitoreo
// Cada ~10 segundos verás:
📊 Stats - Pérdida: 2.35% | Latencia: 45ms | Jitter: 0.002
```

## 🔍 Debugging

### Ver Estadísticas Completas
```javascript
// En la consola del browser:
const stats = await peerConnection.getStats();
stats.forEach(report => console.log(report));
```

### Forzar Buffering Manual
```javascript
// Simular alta pérdida de paquetes
applyAdaptiveBuffering(20, 1000);
```

## ⚡ Rendimiento

- **Overhead**: ~1-2% CPU por el monitoreo cada 2 segundos
- **Memoria**: Despreciable (~50KB para estadísticas)
- **Impacto en red**: Cero (solo lee estadísticas locales)

## 🚀 Mejoras Futuras

1. **Historial de Estadísticas**: Gráfico de pérdida/latencia en tiempo real
2. **Notificación al Streamer**: Informar si muchos viewers tienen mala conexión
3. **Buffering Inteligente**: Ajustar tiempo de buffering según la tendencia
4. **Reconexión Automática**: Si la conexión se pierde completamente
5. **Modo de Bajo Consumo**: Reducir FPS del lado del cliente si es necesario

## 📊 Métricas Recomendadas

### Calidad Excelente
- Pérdida de paquetes: < 2%
- Latencia: < 100ms
- Jitter: < 0.01

### Calidad Aceptable
- Pérdida de paquetes: 2-5%
- Latencia: 100-300ms
- Jitter: 0.01-0.05

### Calidad Pobre
- Pérdida de paquetes: > 10%
- Latencia: > 500ms
- Jitter: > 0.1

## 🎯 Limitaciones Conocidas

1. **No cambia la calidad del stream**: El stream es multicast, todos reciben la misma calidad
2. **Depende del codec**: Algunos codecs manejan mejor la pérdida de paquetes
3. **Browser-dependent**: Safari tiene soporte limitado de `getStats()`
4. **No previene pérdida de paquetes**: Solo reacciona a ella

## 📚 Referencias

- [WebRTC getStats() API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats)
- [RTCInboundRtpStreamStats](https://developer.mozilla.org/en-US/docs/Web/API/RTCInboundRtpStreamStats)
- [HTML5 Video Buffering](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement)

---

**Implementado en**: `public/viewer.html`  
**Fecha**: 2 de noviembre de 2025  
**Versión**: 1.0
