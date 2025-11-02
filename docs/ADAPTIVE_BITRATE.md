# 🚀 Adaptive Bitrate - Implementación

Sistema de ajuste automático de calidad de streaming basado en la velocidad de conexión del usuario.

---

## 📊 ¿Qué es Adaptive Bitrate?

**Adaptive Bitrate (ABR)** es una tecnología que ajusta automáticamente la calidad del stream según la velocidad de conexión disponible, optimizando la experiencia del usuario sin intervención manual.

### Beneficios

- ✅ **Automático**: No requiere configuración manual del streamer
- ✅ **Optimizado**: Usa la mejor calidad posible según la conexión
- ✅ **Eficiente**: Evita buffering y lag por calidad excesiva
- ✅ **Inteligente**: Se adapta a cambios en la conexión en tiempo real

---

## 🎯 Perfiles de Calidad Implementados

StreamHub incluye **5 perfiles** que se seleccionan automáticamente:

### 1. 🚨 Emergencia (240p)
**Rango de conexión**: 0 - 1.5 Mbps

```javascript
{
    video: { width: 426, height: 240, frameRate: 15 },
    audio: { 
        echoCancellation: true, 
        noiseSuppression: false,  // Deshabilitado para ahorrar CPU
        autoGainControl: false, 
        sampleRate: 16000 
    }
}
```

**Características**:
- Resolución: 426x240 (240p)
- FPS: 15
- Audio: 16kHz (calidad mínima)
- Ancho de banda: ~300-600 KB/s
- **Uso**: Conexiones muy lentas, backup de emergencia

---

### 2. 📱 Móvil (360p)
**Rango de conexión**: 1.5 - 3 Mbps

```javascript
{
    video: { width: 640, height: 360, frameRate: 24 },
    audio: { 
        echoCancellation: true, 
        noiseSuppression: true, 
        autoGainControl: true, 
        sampleRate: 32000 
    }
}
```

**Características**:
- Resolución: 640x360 (360p)
- FPS: 24
- Audio: 32kHz
- Ancho de banda: ~800 KB - 1.5 Mbps
- **Uso**: WiFi débil, datos móviles, dispositivos limitados

---

### 3. 💡 Balanceado (480p) - **Más Común**
**Rango de conexión**: 3 - 5 Mbps

```javascript
{
    video: { width: 854, height: 480, frameRate: 30 },
    audio: { 
        echoCancellation: true, 
        noiseSuppression: true, 
        autoGainControl: true, 
        sampleRate: 44100 
    }
}
```

**Características**:
- Resolución: 854x480 (480p)
- FPS: 30
- Audio: 44.1kHz (calidad CD)
- Ancho de banda: ~1.5-2.5 Mbps
- **Uso**: Conexiones estándar, streaming casual

---

### 4. 📹 Alta Calidad (720p) - **Recomendado**
**Rango de conexión**: 5 - 8 Mbps

```javascript
{
    video: { width: 1280, height: 720, frameRate: 30 },
    audio: { 
        echoCancellation: true, 
        noiseSuppression: true, 
        autoGainControl: true, 
        sampleRate: 48000 
    }
}
```

**Características**:
- Resolución: 1280x720 (HD 720p)
- FPS: 30
- Audio: 48kHz (calidad profesional)
- Ancho de banda: ~3.5-5 Mbps
- **Uso**: Streaming profesional, tutoriales, producción

---

### 5. 🎮 Gaming (720p60)
**Rango de conexión**: ≥8 Mbps

```javascript
{
    video: { width: 1280, height: 720, frameRate: 60 },
    audio: { 
        echoCancellation: true, 
        noiseSuppression: true, 
        autoGainControl: true, 
        sampleRate: 48000 
    }
}
```

**Características**:
- Resolución: 1280x720 (HD 720p)
- FPS: 60 (súper fluido)
- Audio: 48kHz
- Ancho de banda: ~5-7 Mbps
- **Uso**: Gaming, esports, contenido de alta acción

---

## 🔬 Detección de Velocidad

StreamHub utiliza la **Network Information API** del navegador:

### Método 1: Downlink Speed (Preferido)
```javascript
if (navigator.connection && navigator.connection.downlink) {
    const downlink = navigator.connection.downlink; // Mbps
    console.log(`Velocidad: ${downlink} Mbps`);
}
```

### Método 2: Effective Type (Fallback)
```javascript
if (navigator.connection && navigator.connection.effectiveType) {
    const effectiveType = navigator.connection.effectiveType;
    // '4g', '3g', '2g', 'slow-2g'
    const speedMap = {
        'slow-2g': 0.5,
        '2g': 1,
        '3g': 3,
        '4g': 10
    };
}
```

### Método 3: Fallback Final
Si no está disponible la API, se asume **4 Mbps** (perfil balanceado).

---

## 🎨 Interfaz Visual

El streamer verá un **badge animado** que muestra el perfil seleccionado:

```
┌─────────────────────────────┐
│  💡 Balanceado (480p)       │
└─────────────────────────────┘
```

El badge cambia según el perfil:
- 🚨 Emergencia (240p)
- 📱 Móvil (360p)
- 💡 Balanceado (480p)
- 📹 Alta Calidad (720p)
- 🎮 Gaming (720p60)

---

## 📡 Monitoreo en Tiempo Real

El sistema monitorea cambios en la conexión y notifica al usuario:

```javascript
navigator.connection.addEventListener('change', () => {
    const newSpeed = detectConnectionSpeed();
    const newProfile = selectOptimalProfile(newSpeed);
    
    // Notificar en el chat
    addSystemMessage(`⚡ Conexión cambió - Perfil óptimo ahora: ${newProfile.emoji} ${newProfile.name}`);
    addSystemMessage(`💡 Reinicia el stream para aplicar la nueva configuración`);
});
```

### Ejemplo de Notificaciones

```
Sistema: 💡 Calidad auto-ajustada: Balanceado (480p)
Sistema: ⚡ Conexión cambió - Perfil óptimo ahora: 📹 Alta Calidad (720p)
Sistema: 💡 Reinicia el stream para aplicar la nueva configuración
```

---

## 🔧 Cómo Funciona (Internamente)

### Paso 1: Detección
```javascript
const connectionSpeed = detectConnectionSpeed(); // Ej: 4.5 Mbps
```

### Paso 2: Selección de Perfil
```javascript
const selectedProfile = selectOptimalProfile(4.5);
// Resultado: qualityProfiles.balanced
```

### Paso 3: Aplicación
```javascript
localStream = await navigator.mediaDevices.getUserMedia({
    video: selectedProfile.video,
    audio: selectedProfile.audio
});
```

### Paso 4: Visualización
```javascript
qualityBadge.textContent = `💡 Balanceado (480p)`;
addSystemMessage(`💡 Calidad auto-ajustada: Balanceado (480p)`);
```

---

## 📊 Tabla Comparativa de Perfiles

| Perfil | Emoji | Resolución | FPS | Audio | CPU | Ancho Banda | Rango Conexión |
|--------|-------|------------|-----|-------|-----|-------------|----------------|
| Emergencia | 🚨 | 426x240 | 15 | 16kHz | Mínima | ~500 KB/s | 0-1.5 Mbps |
| Móvil | 📱 | 640x360 | 24 | 32kHz | Muy Baja | ~1 Mbps | 1.5-3 Mbps |
| Balanceado | 💡 | 854x480 | 30 | 44.1kHz | Baja | ~2 Mbps | 3-5 Mbps |
| Alta Calidad | 📹 | 1280x720 | 30 | 48kHz | Media | ~4 Mbps | 5-8 Mbps |
| Gaming | 🎮 | 1280x720 | 60 | 48kHz | Alta | ~6 Mbps | ≥8 Mbps |

---

## 🎯 Casos de Uso Reales

### Escenario 1: Streamer en Casa (WiFi)
- **Conexión detectada**: 6 Mbps
- **Perfil seleccionado**: 📹 Alta Calidad (720p)
- **Experiencia**: Stream fluido, excelente calidad visual

### Escenario 2: Streamer en Café (WiFi Público)
- **Conexión detectada**: 2.5 Mbps
- **Perfil seleccionado**: 📱 Móvil (360p)
- **Experiencia**: Stream estable, calidad reducida pero sin lag

### Escenario 3: Streamer en Oficina (Ethernet)
- **Conexión detectada**: 12 Mbps
- **Perfil seleccionado**: 🎮 Gaming (720p60)
- **Experiencia**: Stream ultra-fluido, ideal para gaming

### Escenario 4: Streamer en Zona Rural
- **Conexión detectada**: 1 Mbps
- **Perfil seleccionado**: 🚨 Emergencia (240p)
- **Experiencia**: Stream básico pero funcional

---

## 🚀 Ventajas sobre Configuración Manual

| Aspecto | Manual | Adaptive Bitrate |
|---------|--------|------------------|
| **Configuración** | Usuario debe elegir | ✅ Automático |
| **Optimización** | Puede ser incorrecta | ✅ Siempre óptima |
| **Cambios de red** | Requiere reconfigurar | ✅ Detecta y notifica |
| **Experiencia** | Variable | ✅ Consistente |
| **Conocimiento técnico** | Requerido | ✅ No necesario |

---

## 🔍 Debugging y Logs

### En la Consola del Navegador

Al iniciar el stream verás:

```
🌐 Velocidad detectada: 4.5 Mbps
💡 Perfil seleccionado: Balanceado (480p) (4.5 Mbps)
✅ Cámara y micrófono iniciados correctamente
📊 Resolución: 854x480 @ 30fps
🔊 Audio: 44100Hz
Audio tracks: 1
Video tracks: 1
```

### Si la Conexión Cambia

```
⚡ Conexión cambió a 7 Mbps
📹 Perfil seleccionado: Alta Calidad (720p) (7 Mbps)
```

---

## ⚙️ Personalización (Opcional)

Si deseas modificar los rangos de los perfiles, edita en `streamer.html` (líneas ~530-593):

```javascript
const qualityProfiles = {
    'balanced': {
        name: 'Balanceado (480p)',
        video: { width: 854, height: 480, frameRate: 30 },
        audio: { /* ... */ },
        minBandwidth: 3,      // ← Cambia aquí
        maxBandwidth: 5,      // ← Y aquí
        emoji: '💡'
    },
    // ...
};
```

---

## 🌐 Compatibilidad de Navegadores

| Navegador | Network Info API | Adaptive Bitrate |
|-----------|------------------|------------------|
| Chrome 61+ | ✅ Completo | ✅ Completo |
| Edge 79+ | ✅ Completo | ✅ Completo |
| Firefox | ⚠️ Parcial* | ✅ Con fallback |
| Safari | ❌ No soportado | ✅ Con fallback |
| Opera 48+ | ✅ Completo | ✅ Completo |

*Firefox solo soporta `effectiveType`, no `downlink`.

---

## 💡 Tips y Mejores Prácticas

### Para Streamers

1. **Deja que el sistema elija**: Confía en la detección automática
2. **Monitorea el badge**: Verifica qué perfil se seleccionó
3. **Si cambia la conexión**: Reinicia el stream para optimizar
4. **Test tu conexión**: Usa https://fast.com antes de streamear

### Para Desarrolladores

1. **Siempre incluye fallbacks**: No todos los navegadores soportan Network API
2. **Logs claros**: Ayudan a debugging y transparencia
3. **Notifica cambios**: El usuario debe saber si la conexión cambió
4. **Perfiles conservadores**: Mejor calidad baja estable que alta con lag

---

## 🔮 Futuras Mejoras

Posibles extensiones del sistema:

- [ ] **Ajuste dinámico en vivo**: Cambiar calidad sin reiniciar stream
- [ ] **Machine Learning**: Predecir mejor perfil basado en historial
- [ ] **Tests de velocidad**: Hacer speed test antes de iniciar
- [ ] **Perfiles personalizados**: Permitir al usuario crear sus propios perfiles
- [ ] **Estadísticas de red**: Dashboard con métricas de conexión en tiempo real

---

## 📚 Referencias

- **Network Information API**: https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
- **getUserMedia Constraints**: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- **WebRTC Best Practices**: https://webrtc.org/getting-started/media-capture-and-constraints

---

**Implementado**: Octubre 2025  
**Versión**: 1.0.0  
**Arquitectura**: WebRTC + Network Information API

🚀 ¡Streaming inteligente y automático!
