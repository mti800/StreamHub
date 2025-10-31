# StreamHub - Sistema de Streaming con Chat en Tiempo Real

Sistema de streaming unidireccional usando **Node.js**, **TypeScript**, **Socket.IO** y patrones de diseño **Factory**, **Strategy** y **Pub/Sub**.

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
│  │       FACTORIES (Creación de Objetos)            │   │
│  │  - UserFactory: Crea usuarios (Streamer/Viewer)  │   │
│  │  - StreamFactory: Crea streams                   │   │
│  │  - MessageFactory: Crea mensajes (con Strategy)  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Funciones:                                              │
│  - Coordina conexiones entre peers                      │
│  - Maneja señalización WebRTC                           │
│  - Gestiona chat y reacciones                           │
│  - Emite eventos Pub/Sub                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Socket.IO
                 │
┌────────────────▼────────────────────────────────────────┐
│                     VIEWER CLIENT                       │
│  - Se conecta con Stream Key                            │
│  - Recibe video (WebRTC)                                │
│  - Envía/recibe mensajes de chat                        │
│  - Envía reacciones                                     │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Streamer** → Crea stream → Recibe **Stream Key**
2. **Server Hub** → Genera Stream Key único y registra stream
3. **Viewer** → Ingresa Stream Key → Se conecta al stream
4. **Server Hub** → Coordina señalización WebRTC entre Streamer y Viewer
5. **WebRTC** → Conexión P2P directa para video (simplificada en esta demo)
6. **Chat/Reacciones** → Fluyen a través del Server Hub usando Pub/Sub

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

## � Comandos Disponibles

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
