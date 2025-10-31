# ⚙️ Configuración de Calidad del Stream

# 🚀 Optimizaciones Implementadas

## ✅ Mejoras Realizadas (Última Actualización)

### 1. **WebP en lugar de JPEG**
- ✅ Mejor compresión (~30% más eficiente)
- ✅ Menor tamaño de datos transmitidos
- ✅ Misma calidad visual con menos bytes

**Antes**: JPEG @ 75% calidad  
**Ahora**: WebP @ 80% calidad  
**Resultado**: ~25-35% reducción en tamaño de archivo

### 2. **Aumento de FPS**
- ✅ De 10 FPS a 15 FPS
- ✅ Movimiento más fluido
- ✅ Mejor experiencia visual

**Antes**: 100ms por frame (10 FPS)  
**Ahora**: 66ms por frame (15 FPS)  
**Resultado**: 50% más fluido

### 3. **Audio Streaming IMPLEMENTADO**
- ✅ Captura de audio con MediaRecorder
- ✅ Codec Opus (excelente calidad, bajo bitrate)
- ✅ Chunks cada 100ms sincronizados con video
- ✅ Bitrate: 64kbps (calidad óptima)

## 📊 Comparativa de Rendimiento

| Métrica | Anterior | Actual | Mejora |
|---------|----------|--------|--------|
| **Formato Video** | JPEG 75% | WebP 80% | +30% compresión |
| **FPS** | 10 | 15 | +50% fluidez |
| **Audio** | ❌ No | ✅ Sí (Opus 64k) | ✅ Implementado |
| **Tamaño Frame** | ~45 KB | ~30 KB | -33% |
| **Ancho de banda/seg** | ~450 KB/s | ~450 KB/s | Igual (por mejor compresión) |

## 🎯 Configuración Actual

### Video
- **Resolución**: 640x480
- **FPS**: 15
- **Formato**: WebP
- **Calidad**: 80%
- **Bitrate estimado**: ~3.6 Mbps

### Audio
- **Codec**: Opus (WebM)
- **Bitrate**: 64 kbps
- **Chunks**: 100ms
- **Sincronización**: Con video

## 🔧 Ajustes Disponibles

### Para Mayor Calidad (más ancho de banda)
```javascript
// En streamer.html línea ~570
canvas.width = 1280;  // HD
canvas.height = 720;
}, 'image/webp', 0.9); // Calidad 90%
}, 50); // 20 FPS
```

### Para Menor Ancho de Banda (más eficiente)
```javascript
// En streamer.html línea ~570
canvas.width = 480;   // SD
canvas.height = 360;
}, 'image/webp', 0.7); // Calidad 70%
}, 100); // 10 FPS
```

### Streamer
- ✅ Cambió de `setInterval` a `requestAnimationFrame` (mejor performance)
- ✅ Aumentó de 10 FPS a 30 FPS
- ✅ Mejoró calidad JPEG de 75% a 80%
- ✅ Control de timing preciso (throttle a 30 FPS exactos)

### Viewer
- ✅ Renderizado inmediato sin delays
- ✅ Logs reducidos para mejor performance

## 📊 Configuraciones Disponibles

### En `streamer.html` (línea ~560)

#### Opción 1: Alta Calidad (Recomendado)
```javascript
const targetFPS = 30;           // FPS objetivo
canvas.width = 640;             // Ancho (línea ~525)
canvas.height = 480;            // Alto (línea ~526)
}, 'image/jpeg', 0.8);          // Calidad 80% (línea ~589)
```
**Resultado**: Fluido, buena calidad, ~3 Mbps

#### Opción 2: Performance (Más FPS)
```javascript
const targetFPS = 60;           // FPS objetivo
canvas.width = 480;             // Ancho
canvas.height = 360;            // Alto
}, 'image/jpeg', 0.7);          // Calidad 70%
```
**Resultado**: Muy fluido, calidad media, ~4 Mbps

#### Opción 3: Económico (Menos ancho de banda)
```javascript
const targetFPS = 24;           // FPS objetivo
canvas.width = 640;             // Ancho
canvas.height = 480;            // Alto
}, 'image/jpeg', 0.6);          // Calidad 60%
```
**Resultado**: Aceptable, calidad reducida, ~1.5 Mbps

#### Opción 4: Modo "Twitch" (HD)
```javascript
const targetFPS = 30;           // FPS objetivo
canvas.width = 1280;            // Ancho
canvas.height = 720;            // Alto
}, 'image/jpeg', 0.85);         // Calidad 85%
```
**Resultado**: Alta calidad, ~8 Mbps (requiere buena conexión)

#### Opción 5: Modo "Bajo Recursos"
```javascript
const targetFPS = 15;           // FPS objetivo
canvas.width = 320;             // Ancho
canvas.height = 240;            // Alto
}, 'image/jpeg', 0.5);          // Calidad 50%
```
**Resultado**: Básico pero funcional, ~500 Kbps

## 🚀 Cómo Cambiar la Configuración

### 1. Abrir el archivo
```
c:\Users\Matia\streamHub\public\streamer.html
```

### 2. Buscar la línea ~560
```javascript
const targetFPS = 30; // <-- CAMBIAR AQUÍ
```

### 3. Buscar las líneas ~525-526
```javascript
canvas.width = 640;   // <-- CAMBIAR AQUÍ
canvas.height = 480;  // <-- CAMBIAR AQUÍ
```

### 4. Buscar la línea ~589
```javascript
}, 'image/jpeg', 0.8); // <-- CAMBIAR AQUÍ
```

### 5. Guardar y refrescar el navegador

## 📈 Comparativa de Configuraciones

| Configuración | FPS | Resolución | Calidad | Ancho de Banda | Uso |
|---------------|-----|------------|---------|----------------|-----|
| **Alta Calidad** | 30 | 640x480 | 80% | ~3 Mbps | Recomendado ✅ |
| Performance | 60 | 480x360 | 70% | ~4 Mbps | Juegos/acción |
| Económico | 24 | 640x480 | 60% | ~1.5 Mbps | WiFi débil |
| Twitch HD | 30 | 1280x720 | 85% | ~8 Mbps | Producción |
| Bajo Recursos | 15 | 320x240 | 50% | ~500 Kbps | Dispositivos lentos |

## 🎮 Consejos por Tipo de Contenido

### 🎬 Charla/Presentación
- **FPS**: 24
- **Resolución**: 640x480
- **Calidad**: 70%

### 🎮 Gaming
- **FPS**: 60
- **Resolución**: 1280x720
- **Calidad**: 75%

### 🎤 Música/Concierto
- **FPS**: 30
- **Resolución**: 1280x720
- **Calidad**: 85%

### 💬 Chat casual
- **FPS**: 15-24
- **Resolución**: 480x360
- **Calidad**: 60%

## 🔧 Optimizaciones Adicionales (Avanzado)

### Usar WebP en lugar de JPEG (Mejor compresión)
```javascript
}, 'image/webp', 0.8);
```
⚠️ Requiere verificar compatibilidad del navegador

### Ajustar resolución según conexión (Adaptive Bitrate)
```javascript
// Detectar velocidad de conexión y ajustar
if (navigator.connection && navigator.connection.downlink < 2) {
    canvas.width = 320;
    canvas.height = 240;
}
```

### Usar OffscreenCanvas (Mejor performance)
```javascript
canvas = new OffscreenCanvas(640, 480);
```
⚠️ Solo navegadores modernos

## 📊 Monitoreo de Performance

### Ver FPS real en consola del navegador
Los logs ahora muestran cada 100 frames:
```
📹 Frames enviados: 100, FPS: ~30
📹 Frames enviados: 200, FPS: ~30
```

### Calcular FPS manualmente
```
FPS real = Frames enviados / (tiempo en segundos)
```

## ✨ Estado Actual

**Configuración Aplicada**: Alta Calidad
- 30 FPS
- 640x480
- JPEG 80%
- requestAnimationFrame (optimizado)

**Resultado Esperado**: 
- Stream fluido sin stuttering
- Calidad visual buena
- Latencia ~500ms
- Ancho de banda ~3 Mbps

¡Prueba y ajusta según tu conexión y necesidades! 🚀
