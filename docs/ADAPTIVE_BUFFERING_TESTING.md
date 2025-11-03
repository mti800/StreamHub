# 🧪 Guía de Pruebas - Buffering Adaptativo

## Pruebas Rápidas (5 minutos)

### ✅ Test 1: Conexión Normal (Esperado: 🟢)

1. **Iniciar servidor:**
   ```powershell
   npm start
   ```

2. **Abrir streamer:**
   - http://localhost:3000/streamer.html
   - Login → Crear Stream → Iniciar

3. **Abrir viewer:**
   - http://localhost:3000/viewer.html
   - Login → Pegar Stream Key → Unirse

4. **Verificar:**
   - ✅ Badge de conexión debe ser 🟢 (verde)
   - ✅ Pérdida de paquetes < 2%
   - ✅ Latencia < 100ms
   - ✅ Video reproduce sin interrupciones
   - ✅ NO aparece advertencia de conexión pobre

---

### ⚠️ Test 2: Simular Conexión Pobre (Esperado: 🔴)

1. **En el viewer, abrir DevTools:**
   - Presiona `F12`

2. **Configurar throttling:**
   - Tab **Network**
   - Click en **No throttling** dropdown
   - Selecciona **Add custom profile...**
   - Configura:
     ```
     Profile name: Poor Connection
     Download: 1 Mbps
     Upload: 0.5 Mbps
     Latency: 200ms
     ```
   - Click **Add**

3. **Aplicar el perfil:**
   - Selecciona "Poor Connection" del dropdown

4. **Verificar (esperar ~10 segundos):**
   - ✅ Badge cambia a 🟠 o 🔴
   - ✅ Pérdida de paquetes aumenta
   - ✅ Latencia aumenta (>150ms)
   - ✅ Puede aparecer overlay de buffering
   - ✅ Puede aparecer "⚠️ Conexión inestable"

---

### 🔥 Test 3: Simular Pérdida Alta de Paquetes

**Usando extensión de Chrome:**

1. **Instalar "Network Throttle" (opcional)**
   - O usar DevTools con packet loss personalizado

2. **Configurar 15% packet loss**

3. **Verificar:**
   - ✅ Overlay "Buffering..." aparece
   - ✅ Video se pausa brevemente (2 segundos)
   - ✅ Luego continúa reproduciendo
   - ✅ Badge es 🔴 (rojo)

---

### 📊 Test 4: Inspeccionar Estadísticas en Consola

1. **Abrir consola de DevTools:**
   - `F12` → Tab **Console**

2. **Buscar logs del monitoreo:**
   ```
   📊 Stats - Pérdida: 2.35% | Latencia: 45ms | Jitter: 0.002
   ```

3. **Verificar:**
   - ✅ Logs aparecen cada ~10 segundos
   - ✅ Valores coinciden con la UI

---

### 🔍 Test 5: Ver Estadísticas Completas de WebRTC

**En la consola del viewer:**

```javascript
// Ejecuta este código:
const stats = await peerConnection.getStats();
stats.forEach(report => {
    if (report.type === 'inbound-rtp' && report.kind === 'video') {
        console.log('📦 Paquetes recibidos:', report.packetsReceived);
        console.log('❌ Paquetes perdidos:', report.packetsLost);
        console.log('📊 Jitter:', report.jitter);
        console.log('💾 Bytes recibidos:', report.bytesReceived);
    }
    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        console.log('⏱️ RTT:', report.currentRoundTripTime);
    }
});
```

**Verificar:**
- ✅ Muestra estadísticas detalladas
- ✅ Valores son coherentes

---

## Pruebas Avanzadas (10-15 minutos)

### 🎬 Test 6: Cambiar Condiciones Durante el Stream

1. Iniciar con conexión normal (🟢)
2. Aplicar throttling medio (🟡)
3. Aplicar throttling pesado (🔴)
4. Volver a normal (🟢)

**Verificar:**
- ✅ El badge cambia dinámicamente
- ✅ Las advertencias aparecen/desaparecen según corresponda
- ✅ El buffering se activa solo cuando es necesario

---

### 🕐 Test 7: Conexión Pobre Prolongada

1. Aplicar "Slow 3G" en DevTools
2. Esperar 30 segundos

**Verificar:**
- ✅ Aparece "⚠️ Conexión inestable" persistente
- ✅ Buffering se activa múltiples veces
- ✅ Video continúa reproduciendo (aunque con pausas)
- ✅ No hay crashes ni errores

---

### 🔄 Test 8: Salir y Reingresar al Stream

1. Viewer unido con conexión normal
2. Click en "Salir del Stream"
3. Volver a unirse al stream

**Verificar:**
- ✅ El monitoreo se detiene al salir
- ✅ El monitoreo se reinicia al volver a unirse
- ✅ No hay memory leaks (verificar en DevTools → Memory)

---

### 🎯 Test 9: Stream Finalizado

1. Viewer viendo stream
2. Streamer finaliza stream

**Verificar:**
- ✅ Aparece alerta "El stream ha finalizado"
- ✅ El monitoreo se detiene
- ✅ No hay errores en consola

---

## 🐛 Debugging

### Ver Variables de Estado

**En la consola del viewer:**

```javascript
console.log('Monitoring activo:', statsInterval !== null);
console.log('Buffering activo:', bufferingActive);
console.log('Contador poor quality:', consecutivePoorQuality);
console.log('Últimos paquetes recibidos:', lastPacketsReceived);
```

### Forzar Buffering Manualmente

```javascript
// Simular alta pérdida de paquetes
applyAdaptiveBuffering(20, 1000);
```

### Ver Estado de PeerConnection

```javascript
console.log('PeerConnection state:', peerConnection.connectionState);
console.log('ICE state:', peerConnection.iceConnectionState);
```

---

## ✅ Checklist de Validación

### Funcionalidad Básica
- [ ] Badge de conexión se muestra
- [ ] Indicadores de pérdida y latencia funcionan
- [ ] Valores se actualizan cada 2 segundos
- [ ] Badge cambia de color según calidad

### Buffering Adaptativo
- [ ] Overlay de buffering aparece con pérdida > 15%
- [ ] Advertencia aparece con pérdida > 10% sostenida
- [ ] Buffering se desactiva cuando mejora conexión
- [ ] Video.preload se ajusta dinámicamente

### Monitoreo
- [ ] Logs aparecen en consola cada ~10 segundos
- [ ] Estadísticas coinciden con valores reales
- [ ] Monitoreo se detiene al salir
- [ ] Monitoreo se detiene cuando stream termina

### UI/UX
- [ ] Spinner de buffering es visible y animado
- [ ] Advertencia de conexión pobre es visible
- [ ] Colores de badge son correctos (🟢🟡🟠🔴)
- [ ] No hay flickering ni parpadeos

### Performance
- [ ] CPU usage < 5% adicional
- [ ] No hay memory leaks
- [ ] No afecta reproducción de video
- [ ] No afecta chat ni reacciones

---

## 🎯 Resultados Esperados

### Conexión Excelente (< 2% pérdida)
```
Badge: 🟢
Pérdida: 0.5% - 1.8%
Latencia: 20-80ms
Buffering: NO
Advertencia: NO
```

### Conexión Buena (2-5% pérdida)
```
Badge: 🟡
Pérdida: 2.1% - 4.9%
Latencia: 80-150ms
Buffering: NO
Advertencia: NO
```

### Conexión Regular (5-10% pérdida)
```
Badge: 🟠
Pérdida: 5.1% - 9.9%
Latencia: 150-300ms
Buffering: OCASIONAL
Advertencia: POSIBLE
```

### Conexión Pobre (> 10% pérdida)
```
Badge: 🔴
Pérdida: 10%+
Latencia: 300ms+
Buffering: FRECUENTE
Advertencia: SÍ (persistente)
```

---

## 📝 Reporte de Bugs

Si encuentras algún problema, reporta:

1. **Navegador y versión**
2. **Condiciones de red aplicadas**
3. **Badge mostrado vs esperado**
4. **Errores en consola** (si hay)
5. **Screenshots** (si aplica)

---

## 🚀 Tests de Carga (Opcional)

### Múltiples Viewers

1. Abrir 5-10 viewers simultáneamente
2. Aplicar throttling diferente a cada uno
3. Verificar que cada viewer muestra estadísticas independientes

**Verificar:**
- ✅ Cada viewer tiene su propio monitoreo
- ✅ No hay interferencia entre viewers
- ✅ El servidor no se ve afectado

---

## 💡 Tips de Testing

1. **Usa modo incógnito** para probar múltiples viewers sin conflictos de sesión
2. **Chrome DevTools → Performance** para verificar que no hay memory leaks
3. **Network tab** para validar que el monitoreo no genera tráfico adicional
4. **Console** filtrado por "📊" para ver solo logs de monitoreo

---

**Happy Testing! 🎉**
