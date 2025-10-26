# StreamHub - Sistema de Streaming con Chat en Tiempo Real

Sistema de streaming unidireccional usando **Node.js**, **TypeScript**, **Socket.IO** y patrones de diseño **Factory**, **Builder** y **Pub/Sub**.

## 🚀 Inicio Rápido

### Instalación
```powershell
npm install
```

## ▶️ Ejecución

### Opción 1: Interfaz Web (Recomendado - con video real)

1. **Inicia el servidor:**
```powershell
npm run dev:server
```

2. **Abre tu navegador:**
   - Streamer: http://localhost:3000/streamer.html
   - Viewer: http://localhost:3000/viewer.html

3. **Como Streamer:**
   - Ingresa tu nombre
   - Haz clic en "Crear Stream"
   - Permite acceso a cámara y micrófono
   - **Copia la Stream Key**
   - Haz clic en "Iniciar Transmisión"

4. **Como Viewer:**
   - Ingresa tu nombre
   - **Pega la Stream Key**
   - Haz clic en "Unirse"
   - ¡Ve el stream en vivo!

### Opción 2: Cliente CLI (Terminal - sin video)

**Terminal 1 - Servidor:**
```powershell
npm run dev:server
```

**Terminal 2 - Cliente (Streamer):**
```powershell
npm run dev:client
# Elige: 1. Transmitir (Streamer)
```

**Terminal 3 - Cliente (Viewer):**
```powershell
npm run dev:client
# Elige: 2. Ver stream (Viewer)
```

### Uso Básico

**Interfaz Web:**
1. Abre http://localhost:3000
2. Elige "Soy Streamer" o "Soy Viewer"
3. Comparte/ingresa la Stream Key
4. ¡Disfruta del video en vivo!

**Terminal CLI:**
1. **Streamer**: Ingresa nombre → Crea stream (`s`) → **Copia la Stream Key** → Inicia (`s`)
2. **Viewer**: Ingresa nombre → **Pega la Stream Key** → ¡Conectado!
3. **Chat**: Usa `/chat <mensaje>` en ambos
4. **Reacciones**: Usa `/react <emoji>` en viewer (ej: `/react 👍`)

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Patrones de Diseño](#patrones-de-diseño)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Comandos Disponibles](#comandos-disponibles)
- [API de Eventos](#api-de-eventos)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🏗️ Arquitectura

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
│  │    FACTORIES & BUILDERS (Creación de Objetos)    │   │
│  │  - UserFactory: Crea usuarios (Streamer/Viewer)  │   │
│  │  - StreamBuilder: Construye streams              │   │
│  │  - MessageFactory: Crea mensajes y reacciones    │   │
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
Crea usuarios y mensajes de forma consistente:
```typescript
UserFactory.createStreamer('John', socketId);
MessageFactory.createChatMessage(streamId, userId, 'Hola!');
```

### Builder Pattern
Construye streams con Stream Keys únicas:
```typescript
new StreamBuilder().withStreamer(userId).markAsStarted().build();
```

### Publisher-Subscriber Pattern
Sistema de eventos desacoplado:
```typescript
publisher.publish(Events.STREAM_CREATED, { stream });
subscriber.subscribe(Events.STREAM_CREATED, callback);
```

---

## 📁 Estructura del Proyecto

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

### Streamer
- `/chat <mensaje>` - Enviar mensaje al chat
- `/viewers` - Ver número de viewers
- `/end` - Finalizar stream

### Viewer
- `/chat <mensaje>` - Enviar mensaje al chat
- `/react <emoji>` - Enviar reacción (👍 ❤️ 🔥 😂)
- `/viewers` - Ver número de viewers
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

## 📝 Ejemplos de Uso

### Sesión Básica

**Streamer:**
```
> /chat Bienvenidos al stream!
💬 Tú: Bienvenidos al stream!
```

**Viewer:**
```
> /chat Hola!
💬 Tú: Hola!

> /react 👍
👍 Reacción enviada
```

### Múltiples Viewers

- Abre varias terminales de viewer
- Todos usan la misma Stream Key
- El chat es compartido entre todos
- Contador de viewers se actualiza automáticamente

---

## 🔧 Troubleshooting

### "Stream no encontrado"
- Verifica que la Stream Key sea correcta (32 caracteres)
- Confirma que el streamer haya iniciado el stream

### "Puerto en uso"
```powershell
$env:PORT=3001
npm run dev:server
```

### No veo mensajes
- Asegúrate de estar en el mismo stream
- Verifica la Stream Key

---

**¡Disfruta construyendo con StreamHub!** 🚀
