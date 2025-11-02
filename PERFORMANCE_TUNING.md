# ⚙️ Configuración de Rendimiento - StreamHub

Guía completa de optimización para el sistema de streaming WebRTC con arquitectura multicast.

---

## 🎉 Sistema de Selección de Calidad Manual

**StreamHub permite elegir el perfil de calidad** antes de iniciar el stream, ya que WebRTC no permite cambios dinámicos durante la transmisión.

### ¿Cómo Funciona?

1. **Al configurar el stream**, verás 5 opciones de calidad
2. **El sistema recomienda automáticamente** el mejor perfil según tu conexión
3. **Puedes cambiar la selección** manualmente si lo prefieres
4. **Una vez iniciado**, la calidad permanece fija (reinicia para cambiar)

### Perfiles Disponibles

- 🎮 **Gaming (720p60)**: Para gaming y acción rápida (≥8 Mbps)
- 📹 **Alta Calidad (720p)**: Recomendado para streams profesionales (≥5 Mbps)  
- 💡 **Balanceado (480p)**: Perfecto para conexiones estándar (≥3 Mbps)
- 📱 **Móvil (360p)**: Para WiFi débil o datos móviles (≥2 Mbps)
- 🚨 **Emergencia (240p)**: Conexiones muy lentas (<2 Mbps)

### Recomendación Automática

El sistema detecta tu velocidad de conexión y **preselecciona automáticamente** el perfil óptimo:

```
✨ Recomendación Automática
Según tu conexión (6.5 Mbps), hemos seleccionado:
📹 Alta Calidad (720p)

Puedes cambiar el perfil si lo deseas
```

### Ver el Perfil Activo

Durante el stream verás el perfil en el badge:
```
┌─────────────────────────────┐
│  📹 Alta Calidad (720p)     │
└─────────────────────────────┘
```

### Documentación Completa

- **[Adaptive Bitrate Guide](docs/ADAPTIVE_BITRATE.md)**: Documentación completa de perfiles
- **[Testing Guide](docs/ADAPTIVE_BITRATE_TESTING.md)**: Guía de pruebas

---

## 🎯 Arquitectura de Streaming Actual

StreamHub utiliza **WebRTC** para transmisión de video/audio en tiempo real:

```
STREAMER (getUserMedia)
    ↓ WebRTC PeerConnection
  SERVER (Señalización Socket.IO)
    ↓ Multicast optimizado
 VIEWERS (1...N)
```

### Características Clave
- ✅ **WebRTC nativo**: Video/audio de calidad profesional
- ✅ **Arquitectura Multicast**: 1 streamer → N viewers sin degradación
- ✅ **Ancho de banda constante**: El streamer usa ~2-5 Mbps independiente de viewers
- ✅ **Audio integrado**: Opus codec @ 48kHz con cancelación de eco
- ✅ **Latencia ultra-baja**: ~200-500ms end-to-end

---

## 📊 Configuración Actual (streamer.html líneas ~434-444)

### Video
```javascript
video: { 
    width: 1300,      // ← Resolución horizontal
    height: 720,      // ← Resolución vertical
    frameRate: 30     // ← FPS (frames por segundo)
}
```

### Audio
```javascript
audio: {
    echoCancellation: true,     // Cancelación de eco
    noiseSuppression: true,     // Supresión de ruido
    autoGainControl: true,      // Control automático de ganancia
    sampleRate: 48000           // Calidad de audio (48kHz)
}
```

**Estado actual**: 
- Resolución: 1300x720 (casi HD)
- FPS: 30 (fluido)
- Audio: 48kHz estéreo con procesamiento
- Ancho de banda estimado: ~2.5-4 Mbps

---

## 🔧 Perfiles de Configuración Recomendados

### Dónde Editar
**Archivo**: `c:\Users\Matia\streamHub\public\streamer.html`  
**Líneas**: ~434-444 (función `initCamera()`)

---

### 📹 Perfil 1: Alta Calidad (Recomendado) ✅
**Uso**: Streaming profesional, producción, tutoriales

```javascript
localStream = await navigator.mediaDevices.getUserMedia({
    video: { 
        width: 1280,        // HD
        height: 720,        
        frameRate: 30       
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
    }
});
```

**Características**:
- Resolución: 1280x720 (HD 720p)
- FPS: 30
- Audio: Calidad máxima
- Ancho de banda: ~3.5-5 Mbps
- Latencia: ~300ms
- **Requiere**: Conexión estable ≥5 Mbps upload

---

### 🎮 Perfil 2: Gaming/Acción
**Uso**: Juegos, deportes, movimiento rápido

```javascript
localStream = await navigator.mediaDevices.getUserMedia({
    video: { 
        width: 1280,
        height: 720,
        frameRate: 60       // ← Más FPS para fluidez
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
    }
});
```

**Características**:
- Resolución: 1280x720
- FPS: **60** (súper fluido)
- Audio: Calidad máxima
- Ancho de banda: ~5-7 Mbps
- **Requiere**: Conexión ≥8 Mbps upload, PC potente

---

### 💡 Perfil 3: Balanceado (Internet Promedio)
**Uso**: Streaming casual, conexión estándar

```javascript
localStream = await navigator.mediaDevices.getUserMedia({
    video: { 
        width: 854,         // 480p
        height: 480,
        frameRate: 30
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100   // ← Slightly lower
    }
});
```

**Características**:
- Resolución: 854x480 (480p)
- FPS: 30
- Audio: Buena calidad
- Ancho de banda: ~1.5-2.5 Mbps
- **Requiere**: Conexión ≥3 Mbps upload

---

### 📱 Perfil 4: Móvil/WiFi Débil
**Uso**: Conexiones limitadas, dispositivos móviles

```javascript
localStream = await navigator.mediaDevices.getUserMedia({
    video: { 
        width: 640,
        height: 360,        // 360p
        frameRate: 24
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 32000   // ← Reduce audio bitrate
    }
});
```

**Características**:
- Resolución: 640x360 (360p)
- FPS: 24 (cinematográfico)
- Audio: Calidad reducida
- Ancho de banda: ~800 KB - 1.5 Mbps
- **Requiere**: Conexión ≥2 Mbps upload

---

### 🚨 Perfil 5: Emergencia (Conexión Crítica)
**Uso**: Conexiones muy lentas, backup

```javascript
localStream = await navigator.mediaDevices.getUserMedia({
    video: { 
        width: 426,
        height: 240,        // 240p
        frameRate: 15
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: false,  // ← Deshabilitar para reducir CPU
        autoGainControl: false,
        sampleRate: 16000         // ← Audio mínimo
    }
});
```

**Características**:
- Resolución: 426x240 (240p)
- FPS: 15
- Audio: Calidad mínima
- Ancho de banda: ~300-600 KB/s
- **Requiere**: Conexión ≥1 Mbps upload

---

## 🎬 Configuraciones por Tipo de Contenido

| Tipo de Stream | Resolución | FPS | Audio | Ancho Banda | Perfil |
|----------------|------------|-----|-------|-------------|--------|
| **🎤 Podcast/Charla** | 640x480 | 24 | 48kHz | ~1.5 Mbps | Balanceado |
| **🎮 Gaming Competitivo** | 1280x720 | 60 | 48kHz | ~6 Mbps | Gaming |
| **🎨 Arte/Tutorial** | 1280x720 | 30 | 48kHz | ~4 Mbps | Alta Calidad |
| **💬 Just Chatting** | 854x480 | 24 | 44.1kHz | ~1.2 Mbps | Balanceado |
| **🎵 Música/Concierto** | 1280x720 | 30 | 48kHz | ~4.5 Mbps | Alta Calidad |
| **📱 Stream Móvil** | 640x360 | 24 | 32kHz | ~1 Mbps | Móvil |

---

## 🔬 Optimizaciones Avanzadas

### 1. Adaptive Bitrate (Experimental)

Detecta velocidad de conexión y ajusta automáticamente:

```javascript
async function initCamera() {
    // Detectar velocidad de conexión
    let videoConstraints = { width: 1280, height: 720, frameRate: 30 };
    
    if (navigator.connection) {
        const downlink = navigator.connection.downlink; // Mbps
        
        if (downlink < 2) {
            // Conexión lenta
            videoConstraints = { width: 640, height: 360, frameRate: 24 };
            console.log('⚠️ Conexión lenta detectada, reduciendo calidad');
        } else if (downlink > 10) {
            // Conexión rápida
            videoConstraints = { width: 1920, height: 1080, frameRate: 30 };
            console.log('🚀 Conexión rápida detectada, aumentando calidad');
        }
    }

    localStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
        }
    });
}
```

### 2. Detección de CPU Alta

Reduce FPS si la CPU está sobrecargada:

```javascript
let cpuUsageHigh = false;

// Monitor performance
setInterval(() => {
    if (performance.now() > lastFrameTime + 200) {
        // Frame drops detectados
        cpuUsageHigh = true;
        console.warn('⚠️ CPU alta, considera reducir FPS o resolución');
    }
}, 5000);
```

### 3. Modo "Solo Audio"

Para podcasts o cuando el video no es necesario:

```javascript
localStream = await navigator.mediaDevices.getUserMedia({
    video: false,  // ← Deshabilitar video
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
    }
});
```

---

## 📊 Monitoreo de Performance

### En la Consola del Navegador (Streamer)

Abre DevTools (F12) y verás:

```
✅ Cámara y micrófono iniciados correctamente
Audio tracks: 1
Video tracks: 1
✅ Offer creado con audio: true
```

### Verificar Calidad del Stream

1. **Chrome**: `chrome://webrtc-internals`
2. **Firefox**: `about:webrtc`

Métricas importantes:
- **packetsSent**: Paquetes enviados
- **bytesSent**: Bytes totales
- **framesPerSecond**: FPS real
- **frameWidth/Height**: Resolución real

### Calcular Bitrate Real

```javascript
// En la consola del navegador
const stats = await peerConnection.getStats();
stats.forEach(stat => {
    if (stat.type === 'outbound-rtp' && stat.mediaType === 'video') {
        console.log('Bitrate:', (stat.bytesSent * 8 / stat.timestamp).toFixed(2), 'bps');
    }
});
```

---

## 🚨 Troubleshooting

### Problema: Video con lag/stuttering

**Soluciones**:
1. Reducir FPS de 30 a 24
2. Reducir resolución (e.g., 1280x720 → 854x480)
3. Cerrar otras apps que usen la cámara
4. Verificar CPU/GPU usage

### Problema: Audio con eco

**Soluciones**:
1. Asegurar `echoCancellation: true`
2. Usar audífonos (no bocinas)
3. Mutear el preview local: `videoElement.muted = true`

### Problema: Alto uso de CPU

**Soluciones**:
1. Reducir FPS a 24 o 15
2. Reducir resolución
3. Deshabilitar `noiseSuppression` si no es crítico

### Problema: Viewers no escuchan audio

**Verificar**:
1. En streamer.html línea ~444: `sampleRate: 48000` presente
2. En viewer.html línea ~613: `videoElement.muted = false`
3. Navegador permitió autoplay (click para activar)

---

## 🎯 Recomendaciones Finales

### Para Streamers Principiantes
→ Usa **Perfil Balanceado** (854x480 @ 30fps)

### Para Producción Profesional
→ Usa **Alta Calidad** (1280x720 @ 30fps)

### Para Gaming/Esports
→ Usa **Gaming** (1280x720 @ 60fps)

### Para WiFi Inestable
→ Usa **Móvil** (640x360 @ 24fps)

---

## 📈 Comparativa de Perfiles

| Perfil | Resolución | FPS | Audio | CPU | Ancho Banda | Calidad Visual |
|--------|------------|-----|-------|-----|-------------|----------------|
| Alta Calidad | 1280x720 | 30 | 48kHz | Media | ~4 Mbps | ⭐⭐⭐⭐⭐ |
| Gaming | 1280x720 | 60 | 48kHz | Alta | ~6 Mbps | ⭐⭐⭐⭐⭐ |
| Balanceado | 854x480 | 30 | 44.1kHz | Baja | ~2 Mbps | ⭐⭐⭐⭐ |
| Móvil | 640x360 | 24 | 32kHz | Muy Baja | ~1 Mbps | ⭐⭐⭐ |
| Emergencia | 426x240 | 15 | 16kHz | Mínima | ~500 KB/s | ⭐⭐ |

---

## 🔗 Recursos Adicionales

- **WebRTC Stats**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- **Compatibility**: https://caniuse.com/webrtc
- **Debugging**: chrome://webrtc-internals

---

**Última actualización**: Octubre 2025  
**Versión de StreamHub**: 1.0.0  
**Arquitectura**: WebRTC Multicast con Socket.IO

🚀 ¡Optimiza y disfruta streaming de calidad profesional!
