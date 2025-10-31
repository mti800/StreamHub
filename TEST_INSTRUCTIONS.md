# 🔍 Instrucciones de Prueba - Distribución Centralizada

## Problema Identificado
El viewer no está recibiendo el stream. Vamos a diagnosticar paso a paso.

## Pasos para Probar

### 1. Reiniciar el Servidor
```powershell
# Detener el servidor actual (Ctrl+C)
npm start
```

### 2. Abrir Streamer (Primera Pestaña)
1. Ir a: `http://localhost:3000/streamer.html`
2. **Abrir la Consola del Navegador** (F12)
3. Ingresar nombre de usuario
4. Click "Conectar"
5. Click "Crear Stream"
6. Permitir acceso a cámara/micrófono
7. **Copiar la Stream Key que aparece**

### 3. Verificar Logs del Streamer
En la consola del navegador deberías ver:
```
Conectado al servidor
Cámara inicializada - Distribución centralizada lista
Streaming centralizado iniciado (10 FPS, 640x480)
Frames enviados: 50, tamaño: XXXXX bytes
Frames enviados: 100, tamaño: XXXXX bytes
```

### 4. Abrir Viewer (Segunda Pestaña)
1. Ir a: `http://localhost:3000/viewer.html`
2. **Abrir la Consola del Navegador** (F12)
3. Ingresar nombre de usuario
4. Click "Conectar"
5. **Pegar la Stream Key**
6. Click "Unirse"

### 5. Verificar Logs del Viewer
En la consola del navegador deberías ver:
```
Conectado al servidor
Canvas inicializado para recibir stream centralizado
Evento stream:data recibido XXXXX
Frames recibidos: 50
Frames recibidos: 100
```

### 6. Verificar Logs del Servidor
En la terminal del servidor deberías ver:
```
[Server] Stream creado: XXXXX por Usuario1
[StreamDistributor] Streamer registrado para XXXXX
[Server] Stream iniciado: XXXXX
[StreamDistributor] Viewer registrado para XXXXX (Total: 1)
[Server] Usuario se unió al stream XXXXX
[Server] Stream data distribuido a 1 viewers (tamaño: XXXXX bytes)
```

## 🐛 Posibles Problemas y Soluciones

### Problema 1: "Canvas no inicializado aún"
**Causa**: El evento stream:data llega antes de que el canvas esté listo
**Solución**: Ya implementada - el listener se registra antes de unirse

### Problema 2: "No hay viewers para XXXXX"
**Causa**: El viewer no se registró correctamente en el distribuidor
**Verificar**: 
- Que el evento `stream:join` se emitió correctamente
- Que el streamKey es correcto (copiar/pegar cuidadosamente)

### Problema 3: No se ven frames enviados
**Causa**: El video no está listo o el canvas no captura
**Verificar**:
- Que la cámara esté permitida
- Que el video local se vea en el streamer
- Logs de "Frames enviados"

### Problema 4: "Usuario XXXXX no es streamer"
**Causa**: El rol no está registrado correctamente
**Solución**: Verificar que se registró con role: 'STREAMER'

## 📊 Checklist de Diagnóstico

- [ ] Servidor corriendo sin errores
- [ ] Streamer: Cámara permitida y funcionando
- [ ] Streamer: Video local visible
- [ ] Streamer: Logs de "Frames enviados"
- [ ] Servidor: Logs de "Streamer registrado"
- [ ] Servidor: Logs de "Stream iniciado"
- [ ] Viewer: Stream Key correcta (copiada del streamer)
- [ ] Viewer: Logs de "Canvas inicializado"
- [ ] Servidor: Logs de "Viewer registrado"
- [ ] Servidor: Logs de "Stream data distribuido"
- [ ] Viewer: Logs de "Evento stream:data recibido"
- [ ] Viewer: Logs de "Frames recibidos"
- [ ] Viewer: Canvas mostrando video

## 🔧 Comandos Útiles

### Ver logs del servidor en tiempo real
```powershell
# El servidor ya muestra logs, observa especialmente:
# - [StreamDistributor] ...
# - [Server] Stream data distribuido...
```

### Limpiar caché del navegador
```
Ctrl + Shift + Delete
O
F12 → Network → Disable cache (checkbox)
```

### Refrescar página sin caché
```
Ctrl + F5
```

## 📝 Reporte de Problema

Si después de seguir estos pasos aún no funciona, reporta:

1. **Logs de la consola del Streamer** (completos)
2. **Logs de la consola del Viewer** (completos)
3. **Logs del Servidor** (últimas 50 líneas)
4. **Navegador y versión** (Chrome, Firefox, etc.)
5. **Sistema operativo**

## ✅ Resultado Esperado

- **Streamer**: Video local visible + logs de frames enviados
- **Viewer**: Canvas mostrando el stream en tiempo real
- **Servidor**: Logs confirmando distribución
- **Latencia**: ~500ms es normal
- **Calidad**: Video visible aunque no sea HD
