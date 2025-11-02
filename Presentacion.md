# Performance y Eficiencia


## Cliente Streamer -> Servidor con WebRTC
*WebRTC Peer Connection desde el cliente Streamer hacia el servidor.*
WebRTC no soporta cambiar la calidad de video dinámicamente en una conexión ya establecida. Por lo tanto, hemos implementado un sistema donde el usuario selecciona manualmente la calidad del stream antes de iniciar la transmisión.

### Test de Bitrate y Selección de Calidad Manual

En la consola de chrome

```javascript
if (typeof peerConnections !== 'undefined' && peerConnections && peerConnections.size > 0) {
    console.log('🔍 Obteniendo estadísticas de WebRTC...\n');
    
    // Obtener la primera peer connection
    const pc = Array.from(peerConnections.values())[0];
    
    pc.getStats().then(stats => {
        stats.forEach(stat => {
            if (stat.type === 'outbound-rtp' && stat.mediaType === 'video') {
                console.log('📊 Estadísticas de Video:');
                console.log('  - Resolución:', stat.frameWidth, 'x', stat.frameHeight);
                console.log('  - FPS:', stat.framesPerSecond);
                console.log('  - Frames enviados:', stat.framesSent);
                console.log('  - Bytes enviados:', (stat.bytesSent / 1024 / 1024).toFixed(2), 'MB');
                
                if (stat.timestamp) {
                    const bitrate = (stat.bytesSent * 8 / stat.timestamp * 1000).toFixed(2);
                    console.log('  - Bitrate estimado:', bitrate, 'Kbps');
                }
            }
            
            if (stat.type === 'outbound-rtp' && stat.mediaType === 'audio') {
                console.log('\n🔊 Estadísticas de Audio:');
                console.log('  - Packets enviados:', stat.packetsSent);
                console.log('  - Bytes enviados:', (stat.bytesSent / 1024).toFixed(2), 'KB');
            }
        });
    });
} else {
    console.log('⚠️  No hay viewers conectados. Conéctate con un viewer primero.');
}
```

```javascript
function detectConnectionSpeed() {
    // 1. Intenta Network Information API (Chrome, Edge)
    if (navigator.connection?.downlink) {
        return navigator.connection.downlink; // Mbps real
    }
    
    // 2. Intenta effectiveType (Firefox)
    if (navigator.connection?.effectiveType) {
        const speedMap = {
            'slow-2g': 0.5,
            '2g': 1,
            '3g': 3,
            '4g': 10
        };
        return speedMap[effectiveType] || 5;
    }
    
    // 3. Fallback: 4 Mbps (Safari, otros)
    return 4;
}
```



### Test buffering adaptativo del lado del viewer
El servidor envía con multicast a los viewers y tampoco puede cambiar la calidad dinámicamente. Pero el viewer puede ajustar su buffer para mejorar la experiencia según su conexión.


Para forzar buffering manualmente (simulando alta pérdida de paquetes):
```
applyAdaptiveBuffering(20, 1000);
```

# Escalabilidad

## Usuarios viewers Simultáneos
El sistema está diseñado para soportar múltiples viewers simultáneos sin aumentar el uso de ancho de banda del streamer. 

1- El streamer envía un único stream al servidor(WebRTC).
2- El servidor lo distribuye a todos los viewers conectados (Multicast).

```
┌──────────────┐
│   Streamer   │  Envía 1 stream (2.5 Mbps)
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  StreamDistributor   │  Multicast: Distribuye a N viewers
│   (Servidor)         │
└──────┬───────────────┘
       │
       ├─────→ Viewer 1 (2.5 Mbps)
       ├─────→ Viewer 2 (2.5 Mbps)
       ├─────→ Viewer 3 (2.5 Mbps)
       └─────→ Viewer N (2.5 Mbps)
```

