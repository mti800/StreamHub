# 🧪 Testing Adaptive Bitrate

Guía para probar y verificar el funcionamiento del sistema de Adaptive Bitrate en StreamHub.

---

## 🎯 Objetivo

Verificar que el sistema detecta correctamente la velocidad de conexión y selecciona el perfil óptimo.

---

## 🔍 Prueba 1: Verificar Detección Básica

### Pasos

1. **Abrir streamer.html** en Chrome/Edge
2. **Abrir DevTools** (F12)
3. **Ir a la pestaña Console**
4. **Iniciar sesión y crear stream**

### Resultado Esperado

Deberías ver logs similares a:

```
🌐 Velocidad detectada: 10 Mbps
🎮 Perfil seleccionado: Gaming (720p60) (10 Mbps)
✅ Cámara y micrófono iniciados correctamente
📊 Resolución: 1280x720 @ 60fps
🔊 Audio: 48000Hz
```

### ✅ Verificación

- [ ] Se detectó la velocidad
- [ ] Se seleccionó un perfil apropiado
- [ ] El badge en la UI muestra el perfil correcto
- [ ] El chat muestra mensaje de confirmación

---

## 🌐 Prueba 2: Simular Conexión Lenta (Chrome DevTools)

### Pasos

1. **Abrir DevTools** (F12)
2. **Ir a pestaña Network**
3. **Seleccionar throttling**: "Slow 3G" o "Fast 3G"
4. **Recargar la página**
5. **Iniciar sesión y crear stream**

### Resultado Esperado

Con "Slow 3G":
```
🌐 Tipo de conexión: 3g (~3 Mbps)
💡 Perfil seleccionado: Balanceado (480p) (3 Mbps)
```

Con "Fast 3G":
```
🌐 Tipo de conexión: 4g (~10 Mbps)
🎮 Perfil seleccionado: Gaming (720p60) (10 Mbps)
```

### ✅ Verificación

- [ ] El perfil cambió según el throttling
- [ ] La resolución se ajustó automáticamente
- [ ] El badge refleja el cambio

---

## 📱 Prueba 3: Navegadores sin Network API (Safari, Firefox)

### Safari (macOS/iOS)

Safari NO soporta Network Information API.

#### Resultado Esperado
```
⚠️ No se pudo detectar velocidad, usando perfil balanceado
💡 Perfil seleccionado: Balanceado (480p) (4 Mbps)
```

### Firefox

Firefox solo soporta `effectiveType`, no `downlink`.

#### Resultado Esperado
```
🌐 Tipo de conexión: 4g (~10 Mbps)
🎮 Perfil seleccionado: Gaming (720p60) (10 Mbps)
```

### ✅ Verificación

- [ ] Fallback funciona correctamente
- [ ] No hay errores en consola
- [ ] Stream inicia normalmente

---

## ⚡ Prueba 4: Cambio de Conexión en Tiempo Real

### Pasos (Chrome)

1. **Iniciar stream** normalmente
2. **Cambiar throttling** en DevTools (Network → Online → Fast 3G)
3. **Observar consola y chat**

### Resultado Esperado

```
⚡ Conexión cambió a 3 Mbps
💡 Perfil seleccionado: Balanceado (480p) (3 Mbps)
```

En el chat:
```
Sistema: ⚡ Conexión cambió - Perfil óptimo ahora: 💡 Balanceado (480p)
Sistema: 💡 Reinicia el stream para aplicar la nueva configuración
```

### ✅ Verificación

- [ ] Se detectó el cambio de conexión
- [ ] Se notificó al usuario en el chat
- [ ] Se sugiere reiniciar el stream

---

## 🔬 Prueba 5: Verificar Calidad Real del Stream

### Pasos

1. **Iniciar stream** con un perfil conocido (ej: Alta Calidad)
2. **En DevTools** → Console, ejecutar:

```javascript
const stats = await peerConnection.getStats();
stats.forEach(stat => {
    if (stat.type === 'outbound-rtp' && stat.mediaType === 'video') {
        console.log('📊 Resolución real:', stat.frameWidth, 'x', stat.frameHeight);
        console.log('📊 FPS real:', stat.framesPerSecond);
        console.log('📊 Bitrate:', (stat.bytesSent * 8 / stat.timestamp / 1000000).toFixed(2), 'Mbps');
    }
});
```

### Resultado Esperado

Para perfil "Alta Calidad":
```
📊 Resolución real: 1280 x 720
📊 FPS real: 30
📊 Bitrate: 3.85 Mbps
```

### ✅ Verificación

- [ ] Resolución coincide con el perfil
- [ ] FPS coincide con el perfil
- [ ] Bitrate está en el rango esperado

---

## 📊 Tabla de Resultados de Pruebas

| Prueba | Conexión | Perfil Esperado | Resolución | FPS | Resultado |
|--------|----------|-----------------|------------|-----|-----------|
| 1. Básica | 10 Mbps | Gaming | 1280x720 | 60 | ✅ / ❌ |
| 2. Slow 3G | ~0.5 Mbps | Emergencia | 426x240 | 15 | ✅ / ❌ |
| 3. Fast 3G | ~3 Mbps | Balanceado | 854x480 | 30 | ✅ / ❌ |
| 4. 4G | ~10 Mbps | Gaming | 1280x720 | 60 | ✅ / ❌ |
| 5. Safari | N/A | Balanceado | 854x480 | 30 | ✅ / ❌ |
| 6. Cambio Real | Varía | Detecta | Variable | Variable | ✅ / ❌ |

---

## 🐛 Troubleshooting

### La velocidad no se detecta

**Verificar**:
```javascript
console.log('API disponible:', !!navigator.connection);
console.log('Downlink:', navigator.connection?.downlink);
console.log('Type:', navigator.connection?.effectiveType);
```

**Solución**: El fallback debería funcionar. Si no, verifica que la función `detectConnectionSpeed()` esté presente.

### El perfil no cambia

**Verificar**:
```javascript
console.log('Perfiles:', qualityProfiles);
console.log('Velocidad:', detectConnectionSpeed());
console.log('Perfil:', selectOptimalProfile(detectConnectionSpeed()));
```

**Solución**: Asegúrate que los rangos en `qualityProfiles` cubren toda la gama de velocidades.

### El badge no se actualiza

**Verificar**:
```javascript
console.log('Badge element:', document.getElementById('qualityBadge'));
```

**Solución**: Verifica que el elemento existe en el DOM antes de iniciar la cámara.

---

## 🎯 Casos de Uso Específicos

### Caso 1: Gaming Stream

**Requisitos**:
- Conexión ≥8 Mbps
- CPU/GPU potente

**Testing**:
1. Usar throttling "No throttling" o "Online"
2. Verificar que se selecciona perfil Gaming
3. Verificar 60 FPS en `chrome://webrtc-internals`

### Caso 2: Podcast (Solo Audio)

**Modificar** `initCamera()` temporalmente:
```javascript
localStream = await navigator.mediaDevices.getUserMedia({
    video: false,  // Solo audio
    audio: selectedProfile.audio
});
```

**Resultado**: Stream solo de audio, ancho de banda mínimo.

### Caso 3: Mobile Streamer

**Requisitos**:
- Dispositivo móvil con 4G/WiFi limitado
- Uso de batería eficiente

**Testing**:
1. Abrir en dispositivo móvil
2. Verificar que se selecciona perfil Móvil o Balanceado
3. Monitorear uso de batería

---

## 📈 Métricas de Éxito

El Adaptive Bitrate es exitoso si:

- ✅ **Detección automática**: >95% de usuarios reciben perfil correcto
- ✅ **Sin buffering**: <5% de lag/stuttering reportado
- ✅ **Fallback funcional**: Safari/Firefox funcionan sin errores
- ✅ **Cambios detectados**: Usuario notificado en <5 segundos
- ✅ **Experiencia fluida**: Stream inicia en <3 segundos

---

## 🔄 Ciclo de Testing Recomendado

### Pre-Release
1. ✅ Prueba en Chrome (Windows/Mac)
2. ✅ Prueba en Firefox
3. ✅ Prueba en Safari
4. ✅ Prueba en Edge
5. ✅ Prueba en móvil (iOS/Android)

### Post-Release
1. 📊 Monitorear logs de producción
2. 📊 Analizar perfiles más seleccionados
3. 📊 Identificar errores comunes
4. 📊 Ajustar rangos si es necesario

---

## 🛠️ Script de Testing Automático

**IMPORTANTE**: Este script debe ejecutarse en la consola **DESPUÉS** de haber iniciado sesión y creado un stream, cuando ya se hayan cargado todas las funciones.

### Opción 1: Test Manual Paso a Paso

```javascript
// 1. Verificar que la API de Network Information esté disponible
console.log('🔍 Network Information API disponible:', !!navigator.connection);
if (navigator.connection) {
    console.log('📊 Downlink:', navigator.connection.downlink, 'Mbps');
    console.log('📊 Effective Type:', navigator.connection.effectiveType);
}

// 2. Verificar que el badge existe
console.log('🎨 Badge element:', document.getElementById('qualityBadge'));
console.log('📝 Badge text:', document.getElementById('qualityBadge')?.textContent);

// 3. Verificar que el stream local está activo
console.log('📹 Local stream:', localStream);
if (localStream) {
    console.log('📹 Video tracks:', localStream.getVideoTracks().length);
    console.log('🔊 Audio tracks:', localStream.getAudioTracks().length);
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log('📊 Resolución actual:', settings.width, 'x', settings.height);
        console.log('📊 FPS actual:', settings.frameRate);
    }
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        const settings = audioTrack.getSettings();
        console.log('🔊 Sample rate:', settings.sampleRate, 'Hz');
    }
}

console.log('✅ Tests manuales completados!');
```

### Opción 2: Test Completo (Copiar y Pegar Entero)

```javascript
// Script de Testing Completo de Adaptive Bitrate
// Ejecutar DESPUÉS de crear el stream

(function() {
    console.log('🧪 Iniciando tests de Adaptive Bitrate...\n');
    
    // Test 1: Verificar API de Network Information
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 Test 1: Network Information API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (navigator.connection) {
        console.log('✅ API disponible');
        console.log('  - Downlink:', navigator.connection.downlink || 'N/A', 'Mbps');
        console.log('  - Effective Type:', navigator.connection.effectiveType || 'N/A');
        console.log('  - RTT:', navigator.connection.rtt || 'N/A', 'ms');
    } else {
        console.log('⚠️  API NO disponible (normal en Safari)');
    }
    
    // Test 2: Verificar elementos de UI
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 Test 2: Elementos de Interfaz');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const badge = document.getElementById('qualityBadge');
    if (badge) {
        console.log('✅ Badge encontrado');
        console.log('  - Texto:', badge.textContent);
    } else {
        console.log('❌ Badge NO encontrado');
    }
    
    // Test 3: Verificar stream local
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📹 Test 3: Stream Local');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (typeof localStream !== 'undefined' && localStream) {
        console.log('✅ Stream activo');
        console.log('  - Video tracks:', localStream.getVideoTracks().length);
        console.log('  - Audio tracks:', localStream.getAudioTracks().length);
        
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            const vSettings = videoTrack.getSettings();
            console.log('  - Resolución:', vSettings.width, 'x', vSettings.height);
            console.log('  - FPS:', vSettings.frameRate);
            console.log('  - Device:', vSettings.deviceId?.substring(0, 20) + '...');
        }
        
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            const aSettings = audioTrack.getSettings();
            console.log('  - Sample rate:', aSettings.sampleRate, 'Hz');
            console.log('  - Channels:', aSettings.channelCount);
            console.log('  - Echo cancellation:', aSettings.echoCancellation);
            console.log('  - Noise suppression:', aSettings.noiseSuppression);
        }
    } else {
        console.log('⚠️  Stream NO activo (debes crear el stream primero)');
    }
    
    // Test 4: Simular detección con diferentes velocidades
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔬 Test 4: Simulación de Perfiles');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Definir perfiles localmente para el test
    const testProfiles = {
        'emergency': { name: 'Emergencia (240p)', emoji: '🚨', minBandwidth: 0, maxBandwidth: 1.5 },
        'mobile': { name: 'Móvil (360p)', emoji: '📱', minBandwidth: 1.5, maxBandwidth: 3 },
        'balanced': { name: 'Balanceado (480p)', emoji: '💡', minBandwidth: 3, maxBandwidth: 5 },
        'high': { name: 'Alta Calidad (720p)', emoji: '📹', minBandwidth: 5, maxBandwidth: 8 },
        'gaming': { name: 'Gaming (720p60)', emoji: '🎮', minBandwidth: 8, maxBandwidth: Infinity }
    };
    
    function simulateProfileSelection(bandwidth) {
        for (const [key, profile] of Object.entries(testProfiles)) {
            if (bandwidth >= profile.minBandwidth && bandwidth < profile.maxBandwidth) {
                return profile;
            }
        }
        return testProfiles.balanced;
    }
    
    const testSpeeds = [0.5, 2, 4, 6, 10, 15];
    console.log('Velocidad → Perfil esperado:');
    testSpeeds.forEach(speed => {
        const profile = simulateProfileSelection(speed);
        console.log(`  ${speed.toString().padStart(4)} Mbps → ${profile.emoji} ${profile.name}`);
    });
    
    // Test 5: Verificar peer connections (si existen)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 Test 5: Peer Connections');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (typeof peerConnections !== 'undefined' && peerConnections) {
        console.log('✅ Peer connections disponibles');
        console.log('  - Total conexiones:', peerConnections.size);
    } else {
        console.log('⚠️  No hay peer connections (normal si no hay viewers)');
    }
    
    // Resumen final
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 RESUMEN DE TESTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const results = {
        'Network API': !!navigator.connection,
        'Badge UI': !!document.getElementById('qualityBadge'),
        'Stream activo': typeof localStream !== 'undefined' && !!localStream,
        'Video track': typeof localStream !== 'undefined' && localStream?.getVideoTracks().length > 0,
        'Audio track': typeof localStream !== 'undefined' && localStream?.getAudioTracks().length > 0
    };
    
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}`);
    });
    
    const allPassed = Object.values(results).every(r => r);
    console.log('\n' + (allPassed ? '🎊 Todos los tests pasaron!' : '⚠️  Algunos tests fallaron'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();
```

### Opción 3: Test de WebRTC Stats (Calidad Real)

```javascript
// Verificar calidad real del stream a través de WebRTC
// Ejecutar solo si hay viewers conectados

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

### 📋 Instrucciones de Uso

1. **Abrir** `http://localhost:3000/streamer.html`
2. **Iniciar sesión** y **crear stream**
3. **Abrir DevTools** (F12) → Pestaña Console
4. **Copiar y pegar** uno de los scripts anteriores
5. **Presionar Enter**

### ⚠️ Notas Importantes

- Los scripts deben ejecutarse **DESPUÉS** de crear el stream
- Las funciones `detectConnectionSpeed` y `selectOptimalProfile` no son globales (están en el scope del HTML)
- El script de "Test Completo" funciona independientemente y no necesita acceso a esas funciones
- Para tests de WebRTC Stats, necesitas al menos un viewer conectado

---

## 📝 Checklist Final

Antes de considerar Adaptive Bitrate como completamente funcional:

- [ ] Detección funciona en Chrome
- [ ] Detección funciona en Firefox
- [ ] Fallback funciona en Safari
- [ ] Todos los 5 perfiles son seleccionables
- [ ] Badge UI se actualiza correctamente
- [ ] Mensajes en chat aparecen
- [ ] Cambios de conexión se detectan
- [ ] No hay errores en consola
- [ ] Stream inicia con perfil correcto
- [ ] Documentación completa y clara

---

**Happy Testing!** 🚀🧪

¿Encontraste un bug? Repórtalo con:
1. Navegador y versión
2. Logs de consola
3. Perfil esperado vs. obtenido
4. Velocidad de conexión real
