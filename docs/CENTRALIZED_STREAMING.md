# Distribución Centralizada de Streams

## 🎯 Resumen

Se ha implementado un sistema de **distribución centralizada** de streams como alternativa al WebRTC P2P. Esto permite que el servidor distribuya el stream a múltiples viewers sin que el streamer consuma ancho de banda multiplicado.

## 🏗️ Arquitectura Implementada

### Componentes Nuevos

1. **StreamDistributor** (`src/server/StreamDistributor.ts`)
   - Maneja la distribución de datos del stream
   - Registra streamers y viewers
   - Distribuye frames a todos los viewers conectados

2. **Eventos Nuevos** (`src/shared/events.ts`)
   - `STREAM_DATA`: Datos recibidos por viewers
   - `STREAM_DATA_SEND`: Datos enviados por streamer

## 📊 Comparación: WebRTC P2P vs Distribución Centralizada

| Aspecto | WebRTC P2P (Actual) | Centralizado (Nuevo) |
|---------|---------------------|----------------------|
| **Ancho de banda streamer** | N × 2.5 Mbps | 2.5 Mbps fijo |
| **Latencia** | ~100ms | ~500ms |
| **Escalabilidad** | Hasta 5 viewers | Hasta 100+ viewers |
| **Complejidad** | Alta (ICE, STUN, TURN) | Baja |
| **Configuración** | Requiere servidor STUN/TURN | Ninguna |

## 🚀 Cómo Usar (Cliente Streamer)

### Opción 1: Canvas Streaming (Recomendado para demo)

```javascript
// 1. Capturar el video en un canvas
const video = document.getElementById('localVideo');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 640;
canvas.height = 480;

// 2. Función para capturar y enviar frames
function captureAndSendFrame() {
    // Dibujar frame del video en el canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir a blob
    canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
            // Enviar al servidor
            socket.emit('stream:data:send', {
                streamKey: currentStreamKey,
                data: reader.result // Base64 string
            });
        };
    }, 'image/jpeg', 0.7); // Calidad 70%
}

// 3. Enviar frames cada 100ms (10 FPS)
let streamInterval;
function startStreaming() {
    streamInterval = setInterval(captureAndSendFrame, 100);
}

function stopStreaming() {
    clearInterval(streamInterval);
}
```

### Opción 2: Video Chunks (Mayor calidad)

```javascript
// Usando MediaRecorder para chunks de video
const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
    audio: true
});

const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm',
    videoBitsPerSecond: 2500000 // 2.5 Mbps
});

mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
        const reader = new FileReader();
        reader.readAsDataURL(event.data);
        reader.onload = () => {
            socket.emit('stream:data:send', {
                streamKey: currentStreamKey,
                data: reader.result
            });
        };
    }
};

// Enviar chunks cada 500ms
mediaRecorder.start(500);
```

## 🎬 Cómo Usar (Cliente Viewer)

```javascript
// 1. Escuchar datos del stream
socket.on('stream:data', (data) => {
    const { data: base64Data, timestamp } = data;
    
    // Opción A: Mostrar en elemento <img>
    const img = document.getElementById('streamImage');
    img.src = base64Data;
    
    // Opción B: Mostrar en canvas (mejor performance)
    const canvas = document.getElementById('streamCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = base64Data;
});
```

## 📝 Ejemplo HTML Completo (Streamer)

```html
<div id="streamer-view">
    <video id="localVideo" autoplay muted style="display: none;"></video>
    <canvas id="previewCanvas" width="640" height="480"></canvas>
    
    <button onclick="startCentralizedStream()">Iniciar Stream</button>
    <button onclick="stopCentralizedStream()">Detener Stream</button>
</div>

<script>
let streamInterval;
let currentStreamKey;

async function startCentralizedStream() {
    // Obtener acceso a cámara
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
    
    const video = document.getElementById('localVideo');
    video.srcObject = stream;
    
    // Esperar a que el stream esté listo
    await new Promise(resolve => video.onloadedmetadata = resolve);
    
    // Iniciar captura de frames
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    
    streamInterval = setInterval(() => {
        // Dibujar frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Enviar al servidor
        canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => {
                socket.emit('stream:data:send', {
                    streamKey: currentStreamKey,
                    data: reader.result
                });
            };
        }, 'image/jpeg', 0.75);
    }, 100); // 10 FPS
}

function stopCentralizedStream() {
    clearInterval(streamInterval);
}
</script>
```

## 📝 Ejemplo HTML Completo (Viewer)

```html
<div id="viewer-view">
    <canvas id="streamCanvas" width="640" height="480"></canvas>
    <p>Viewers: <span id="viewerCount">0</span></p>
</div>

<script>
socket.on('stream:data', (data) => {
    const canvas = document.getElementById('streamCanvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = data.data;
});
</script>
```

## ⚙️ Configuración Recomendada

### Para Demos/Testing
- **Resolución**: 640x480
- **FPS**: 10
- **Calidad JPEG**: 0.7
- **Formato**: image/jpeg

### Para Producción
- **Resolución**: 1280x720
- **FPS**: 24-30
- **Formato**: video/webm chunks
- **Bitrate**: 2.5 Mbps

## 🔧 API del StreamDistributor

### Métodos del Servidor

```typescript
// Registrar streamer
streamDistributor.registerStreamer(streamKey, socketId);

// Registrar viewer
streamDistributor.registerViewer(streamKey, socketId);

// Distribuir datos
streamDistributor.distributeStreamData(streamKey, data, streamerId);

// Obtener estadísticas
const stats = streamDistributor.getStats();
// {
//   activeStreams: 2,
//   totalViewers: 15,
//   streamDetails: [...]
// }
```

## 📊 Monitoreo

Endpoint de health actualizado con estadísticas del distribuidor:

```bash
curl http://localhost:3000/health
```

Respuesta:
```json
{
  "status": "ok",
  "activeStreams": 1,
  "connectedUsers": 5,
  "distribution": {
    "activeStreams": 1,
    "totalViewers": 4,
    "streamDetails": [
      { "streamKey": "abc123...", "viewers": 4 }
    ]
  }
}
```

## ✅ Ventajas de la Implementación

1. **Mantenibilidad**: Sigue los patrones existentes (Manager pattern)
2. **Escalabilidad**: Un streamer puede tener 50+ viewers
3. **Simplicidad**: No requiere configuración STUN/TURN
4. **Flexibilidad**: Coexiste con WebRTC (puedes usar ambos)
5. **Monitoreo**: Estadísticas integradas

## 🔄 Migración desde WebRTC

El sistema actual de WebRTC **NO se ha eliminado**, sigue funcionando. Puedes:

1. **Usar solo distribución centralizada**: Comentar el código WebRTC
2. **Usar ambos**: WebRTC para baja latencia, centralizado para muchos viewers
3. **Migrar gradualmente**: Cambiar cliente por cliente

## 🎯 Próximos Pasos Recomendados

1. Actualizar `streamer.html` para usar distribución centralizada
2. Actualizar `viewer.html` para recibir datos centralizados
3. Agregar selector en UI: "Modo WebRTC" vs "Modo Centralizado"
4. Implementar buffer de frames para smooth playback
5. Agregar compresión adicional si es necesario
