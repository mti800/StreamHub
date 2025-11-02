# StreamHub - Sistema de Streaming con Chat en Tiempo Real

Sistema de streaming con arquitectura **multicast** usando **Node.js**, **TypeScript**, **Socket.IO** y patrones de diseño **Factory**, **Strategy** y **Pub/Sub**.

## ⚡ Características Principales

- ✅ **Streaming Multicast**: Un streamer transmite a N viewers con ancho de banda constante
- ✅ **Escalabilidad**: Soporta 100+ viewers simultáneos
- ✅ **Selección de Calidad**: 5 perfiles configurables con recomendación automática
- ✅ **Buffering Adaptativo**: Gestión dinámica según condiciones de red del viewer
- ✅ **Chat en Tiempo Real**: Mensajes y reacciones instantáneas
- ✅ **Patrones de Diseño**: Factory, Strategy, Pub/Sub, Repository
- ✅ **Buffer Inteligente**: Viewers tardíos reciben frames recientes automáticamente
- ✅ **Monitoreo de Red**: Estadísticas WebRTC en tiempo real (pérdida de paquetes, latencia)

## 🚀 Inicio Rápido

### Instalación
```powershell
npm install
```

## ▶️ Ejecución

### Inicia el servidor
```powershell
npm start
# o alternativamente:
npm run dev
```

### Abre tu navegador
El servidor estará disponible en `http://localhost:3000`

- **Streamer**: http://localhost:3000/streamer.html
- **Viewer**: http://localhost:3000/viewer.html
- **Home**: http://localhost:3000

### Cómo usar

**Como Streamer:**
1. Abre http://localhost:3000/streamer.html
2. Ingresa tu nombre
3. Haz clic en "Crear Stream"
4. Permite acceso a cámara y micrófono
5. **Copia la Stream Key**
6. Haz clic en "Iniciar Transmisión"
7. ¡Comparte la Stream Key con tus viewers!

**Como Viewer:**
1. Abre http://localhost:3000/viewer.html
2. Ingresa tu nombre
3. **Pega la Stream Key**
4. Haz clic en "Unirse"
5. ¡Disfruta del stream en vivo!

### Cliente CLI (Opcional - Solo para testing)

Si quieres probar el sistema desde la terminal:

```powershell
npm run dev:client
```

**Nota**: El cliente CLI es solo para testing. Para la experiencia completa con video, usa el navegador.

## 📋 Comandos Disponibles

```powershell
npm start          # Inicia el servidor (alias de npm run dev)
npm run dev        # Inicia el servidor en modo desarrollo
npm run build      # Compila TypeScript a JavaScript
npm run dev:client # Cliente CLI para testing (opcional)
npm run clean      # Limpia los archivos compilados
```


---

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Patrones de Diseño](#patrones-de-diseño)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API de Eventos](#api-de-eventos)
- [Comandos de Chat](#comandos-de-chat)

### Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│                    STREAMER CLIENT                      │
│  - Crea stream                                          │
│  - Genera Stream Key                                    │
│  - Transmite video (WebRTC)                             │
│  - Envía mensajes de chat                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Socket.IO
                 │
┌────────────────▼────────────────────────────────────────┐
│                     SERVER HUB                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            PUB/SUB EVENT BUS                     │   │
│  │  - Publisher: Publica eventos                    │   │
│  │  - Subscriber: Se suscribe a eventos             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         MANAGERS (Gestión de Estado)             │   │
│  │  - StreamManager: Gestiona streams activos       │   │
│  │  - UserManager: Gestiona usuarios conectados     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │    STREAMING (Distribución Multicast)            │   │
│  │  - StreamDistributor: Distribuye datos 1→N       │   │
│  │  - Buffer circular para late joiners             │   │
│  │  - Optimización de ancho de banda                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │       FACTORIES (Creación de Objetos)            │   │
│  │  - UserFactory: Crea usuarios (Streamer/Viewer)  │   │
│  │  - StreamFactory: Crea streams                   │   │
│  │  - MessageFactory: Crea mensajes (con Strategy)  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Funciones:                                              │
│  - Distribución multicast de video/audio                │
│  - Maneja señalización WebRTC (opcional)                │
│  - Gestiona chat y reacciones                           │
│  - Emite eventos Pub/Sub                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Socket.IO (Multicast optimizado)
                 │
┌────────────────▼────────────────────────────────────────┐
│                     VIEWER CLIENT                       │
│  - Se conecta con Stream Key                            │
│  - Recibe video/audio (Multicast)                       │
│  - Envía/recibe mensajes de chat                        │
│  - Envía reacciones                                     │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Datos (Multicast)

1. **Streamer** → Crea stream → Recibe **Stream Key**
2. **Server Hub** → Genera Stream Key único y registra en StreamDistributor
3. **Viewer** → Ingresa Stream Key → Se conecta al stream
4. **Streamer** → Envía frame → **UNA SOLA VEZ** al servidor
5. **StreamDistributor** → Distribuye frame a **TODOS los viewers** simultáneamente
6. **Viewers tardíos** → Reciben buffer de últimos 30 frames (catchup automático)
7. **Chat/Reacciones** → Fluyen a través del Server Hub usando Pub/Sub

**💡 Ventaja clave**: El streamer usa ~2.5 Mbps sin importar si hay 1 o 100 viewers

---

## 🎨 Patrones de Diseño

### Factory Pattern
Crea usuarios, streams y mensajes de forma consistente:
```typescript
UserFactory.createStreamer('John', socketId);
StreamFactory.createStream(streamerId);
MessageFactory.createChatMessage(streamId, userId, 'Hola!');
```

### Strategy Pattern
Permite añadir nuevos tipos de mensajes fácilmente:
```typescript
// El MessageFactory usa estrategias internamente
MessageFactory.createChatMessage(...);     // Usa ChatMessageStrategy
MessageFactory.createSystemMessage(...);   // Usa SystemMessageStrategy
MessageFactory.createReaction(...);        // Usa ReactionMessageStrategy

// Se pueden cambiar las estrategias si es necesario
MessageFactory.setChatStrategy(new CustomChatStrategy());
```

### Publisher-Subscriber Pattern
Sistema de eventos desacoplado:
```typescript
publisher.publish(Events.STREAM_CREATED, { stream });
subscriber.subscribe(Events.STREAM_CREATED, callback);
```

---

---

## 🏗️ Arquitectura

```
src/
├── shared/         # Tipos e interfaces
├── factories/      # Factory & Builder patterns
├── pubsub/         # Sistema Pub/Sub
├── server/         # Server Hub + Managers
└── clients/        # Streamer & Viewer
```

---

## 📚 Documentación Adicional

- **[Performance Tuning](PERFORMANCE_TUNING.md)**: Guía de optimización y perfiles de calidad
- **[Manual Quality Selection](docs/MANUAL_QUALITY_SELECTION.md)**: Sistema de selección de calidad
- **[Adaptive Bitrate](docs/ADAPTIVE_BITRATE.md)**: Documentación técnica de perfiles
- **[Multicast Implementation](MULTICAST_IMPLEMENTATION_SUMMARY.md)**: Detalles de la arquitectura multicast
- **[Strategy Pattern](STRATEGY_IMPLEMENTATION_SUMMARY.md)**: Implementación de patrones de diseño
- **[Adding Message Types](docs/ADDING_MESSAGE_TYPES.md)**: Cómo agregar nuevos tipos de mensajes

---

## 📋 Comandos Disponibles

### En cliente CLI (si lo usas)

**Streamer:**
- `/chat <mensaje>` - Enviar mensaje
- `/viewers` - Ver cantidad de viewers
- `/end` - Finalizar stream

**Viewer:**
- `/chat <mensaje>` - Enviar mensaje
- `/react <emoji>` - Enviar reacción
- `/viewers` - Ver cantidad de viewers
- `/leave` - Salir del stream

---

## 📡 API de Eventos

### Principales Eventos

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `user:register` | Cliente → Servidor | Registrar usuario |
| `stream:create` | Cliente → Servidor | Crear stream |
| `stream:join` | Cliente → Servidor | Unirse con Stream Key |
| `stream:start` | Cliente → Servidor | Iniciar transmisión |
| `chat:message:send` | Cliente → Servidor | Enviar mensaje |
| `chat:message:broadcast` | Servidor → Todos | Difundir mensaje |
| `reaction:send` | Cliente → Servidor | Enviar reacción |
| `reaction:broadcast` | Servidor → Todos | Difundir reacción |

---

## 📚 Documentación Adicional

- **[Arquitectura Multicast](./docs/MULTICAST_IMPLEMENTATION.md)** - Diseño de distribución multicast
- **[Patrones de Diseño](./docs/STRATEGY_PATTERN_ARCHITECTURE.md)** - Strategy Pattern para mensajes
- **[Selección de Calidad](./docs/MANUAL_QUALITY_SELECTION.md)** - Sistema de perfiles de calidad
- **[Buffering Adaptativo](./docs/ADAPTIVE_BUFFERING.md)** - Gestión dinámica de buffering en el viewer
- **[Optimización de Rendimiento](./PERFORMANCE_TUNING.md)** - Guía de optimización

---

##  Troubleshooting

### "Stream no encontrado"
- Verifica que la Stream Key sea correcta
- Confirma que el streamer haya iniciado la transmisión

### "Puerto en uso"
```powershell
# Cambia el puerto
$env:PORT=3001
npm start
```

### Problemas con la cámara
- Asegúrate de dar permisos al navegador
- Verifica que ninguna otra app esté usando la cámara
- Prueba en http://localhost:3000 (no https)

---

**¡Disfruta construyendo con StreamHub!** 🚀
