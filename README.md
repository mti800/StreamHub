# StreamHub - Sistema de Streaming con Chat en Tiempo Real

Proyecto para la materia Ingeniería del Software III
UAP - Noviembre 2025

Sistema de streaming de video en tiempo real con chat e interacciónes. Proyecto testigo implementado con una arquitectura monolítica + capas y **Factory**, **Strategy** y **Pub/Sub** fueron los patrones de diseño utilizados. Las tecnologías que se utilizaron incluyen **WebRTC**, **multicast**, **Node.js**, **TypeScript** y **Socket.IO** entre otras.

## ⚡ Características Principales

- ✅ **Streaming Multicast**: Un streamer transmite a N viewers con ancho de banda constante
- ✅ **Escalabilidad**: Soporta 100+ viewers simultáneos
- ✅ **Selección de Calidad**: 5 perfiles configurables con recomendación automática
- ✅ **Buffering Adaptativo**: Gestión dinámica según condiciones de red del viewer
- ✅ **Chat en Tiempo Real**: Mensajes y reacciones instantáneas
- ✅ **Patrones de Diseño**: Factory, Strategy, Pub/Sub
- ✅ **Buffer Inteligente**: Viewers tardíos reciben frames recientes automáticamente
- ✅ **Monitoreo de Red**: Estadísticas WebRTC en tiempo real (pérdida de paquetes, latencia)

## 🚀 Inicio Rápido

### Instalación
```powershell
npm install
```

### Inicia el servidor
```powershell
npm start
# o alternativamente:
npm run dev
```

### Abre tu navegador
El servidor estará disponible en `http://localhost:3000`

- **Home**: http://localhost:3000
- **Streamer**: http://localhost:3000/streamer.html
- **Viewer**: http://localhost:3000/viewer.html

### Cómo usar

**Como Streamer:**
1. Abre http://localhost:3000/streamer.html
2. Ingresa tu nombre
3. Haz clic en "Crear Stream"
4. Permite acceso a cámara y micrófono
5. **Copia la Stream Key** generada
6. Haz clic en "Iniciar Transmisión"
7. ¡Comparte la Stream Key con tus viewers!

**Como Viewer:**
1. Abre http://localhost:3000/viewer.html
2. Ingresa tu nombre
3. **Pega la Stream Key** que te compartió el streamer
4. Haz clic en "Unirse"
5. ¡Disfruta del stream en vivo!

### Cliente CLI (Opcional - Solo para testing)

Si quieres probar el sistema desde la terminal:

```powershell
npm run dev:client
```

**Nota**: El cliente CLI es solo para testing. Para la experiencia completa con video/audio, usa el navegador.

## 📋 Comandos Disponibles

```powershell
npm start          # Inicia el servidor (alias de npm run dev)
npm run dev        # Inicia el servidor en modo desarrollo
npm run build      # Compila TypeScript a JavaScript
npm run dev:client # Cliente CLI para testing (opcional)
npm run clean      # Limpia los archivos compilados
```

---

## 🏗️ Arquitectura del Sistema

## 🏗️ Arquitectura del Sistema

### Estructura del Proyecto
```
src/
├── shared/         # Tipos e interfaces compartidos
│   ├── types.ts    # Definiciones de tipos
│   └── events.ts   # Constantes de eventos
├── factories/      # Factory Pattern (creación de objetos)
│   ├── UserFactory.ts      # Crea usuarios (Streamer/Viewer)
│   ├── StreamFactory.ts    # Crea streams
│   ├── MessageFactory.ts   # Crea mensajes
│   └── MessageStrategies.ts # Strategy Pattern para mensajes
├── pubsub/         # Publisher-Subscriber Pattern
│   ├── EventBus.ts      # Bus de eventos central
│   ├── Publisher.ts     # Publicador de eventos
│   └── Subscriber.ts    # Suscriptor de eventos
├── server/         # Servidor Hub + Managers
│   ├── index.ts                # Servidor principal
│   ├── Database.ts             # Persistencia con SQLite
│   ├── UserManager.ts          # Gestión de usuarios
│   ├── StreamManager.ts        # Gestión de streams
│   ├── StreamDistributor.ts    # Distribución multicast
│   ├── SubscriptionManager.ts  # Gestión de suscripciones
│   └── NotificationService.ts  # Servicio de notificaciones
└── clients/        # Clientes (para testing CLI)
    ├── BaseClient.ts
    ├── client.ts
    ├── streamer.ts
    └── viewer.ts

public/
├── index.html      # Página de inicio
├── streamer.html   # Interfaz del streamer
└── viewer.html     # Interfaz del viewer
```

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
MessageFactory.createChatMessage(streamId, userId, username, 'Hola!');
```

### Strategy Pattern
Permite añadir nuevos tipos de mensajes fácilmente:
```typescript
// El MessageFactory usa estrategias internamente
MessageFactory.createChatMessage(...);     // Usa ChatMessageStrategy
MessageFactory.createSystemMessage(...);   // Usa SystemMessageStrategy
MessageFactory.createReaction(...);        // Usa ReactionMessageStrategy
```

### Publisher-Subscriber Pattern
Sistema de eventos desacoplado:
```typescript
publisher.publish(Events.STREAM_CREATED, { stream });
subscriber.subscribe(Events.STREAM_CREATED, callback);
```

---

## 📡 API de Eventos

### Eventos Principales

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `user:register` | Cliente → Servidor | Registrar usuario |
| `stream:create` | Cliente → Servidor | Crear stream |
| `stream:join` | Cliente → Servidor | Unirse con Stream Key |
| `stream:start` | Cliente → Servidor | Iniciar transmisión |
| `stream:end` | Cliente → Servidor | Finalizar transmisión |
| `stream:data:send` | Cliente → Servidor | Enviar datos de stream |
| `stream:data` | Servidor → Viewers | Distribuir datos (multicast) |
| `chat:message:send` | Cliente → Servidor | Enviar mensaje |
| `chat:message:broadcast` | Servidor → Todos | Difundir mensaje |
| `reaction:send` | Cliente → Servidor | Enviar reacción |
| `reaction:broadcast` | Servidor → Todos | Difundir reacción |
| `user:subscribe` | Cliente → Servidor | Suscribirse a usuario |
| `stream:notification` | Servidor → Suscriptores | Notificación de stream |

---

## 💾 Persistencia de Datos

El sistema utiliza **SQLite** para persistencia de datos:

- **Usuarios**: Información de streamers y viewers
- **Streams**: Historial completo de transmisiones
- **Suscripciones**: Relaciones entre usuarios (followers/following)

Los datos persisten entre reinicios del servidor, permitiendo:
- Recuperar usuarios registrados
- Mantener historial de streams
- Conservar suscripciones entre sesiones

---

## 🔔 Sistema de Notificaciones

Los usuarios pueden **suscribirse a streamers** para recibir notificaciones cuando:
- Un streamer inicia una transmisión
- Un streamer finaliza su transmisión

Las notificaciones se envían en tiempo real usando Socket.IO y el patrón Pub/Sub.

---
