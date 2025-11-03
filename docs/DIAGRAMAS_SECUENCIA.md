# 📊 Diagramas - StreamHub

## 🏗️ Arquitectura General

**Arquitectura**: Monolito con Capas (Layered Monolith)
**Stack Tecnológico**: 
- **Frontend**: Next.js (React)
- **Backend**: Node.js + Express + Socket.IO
- **Base de Datos**: MongoDB Atlas
- **Streaming**: AWS (IVS/MediaLive), RTMP
- **Infraestructura**: AWS (EC2, CloudFront)

## 🏗️ Vista Lógica General del Sistema

```mermaid
graph TB
    subgraph "📱 Capa de Presentación - Next.js"
        V[👁️ Viewer Client<br/>BaseClient<br/>React Components]
        S[📹 Streamer Client<br/>BaseClient<br/>React Components]
    end
    
    subgraph "🌐 Capa de Comunicación - Node.js"
        HTTP[Express HTTP<br/>REST API]
        WS[Socket.IO<br/>WebSocket Events]
    end
    
    subgraph "🎯 Capa de Aplicación - Node.js Backend"
        direction TB
        
        subgraph "Core Services"
            NS[NotificationService<br/>Broadcast Messages]
            SD[StreamDistributor<br/>Media Distribution<br/>RTMP Handler]
        end
        
        subgraph "Domain Managers"
            SM[StreamManager<br/>Stream Lifecycle]
            UM[UserManager<br/>User Sessions]
            SbM[SubscriptionManager<br/>Subscriptions]
        end
        
        subgraph "Factories"
            MF[MessageFactory<br/>+ MessageStrategies]
            SF[StreamFactory]
            UF[UserFactory]
        end
    end
    
    subgraph "💾 Capa de Datos"
        MEM[(In-Memory<br/>Maps & Sets)]
        DB[(MongoDB Atlas<br/>Persistencia)]
    end
    
    subgraph "☁️ Infraestructura AWS"
        RTMP_INFRA[AWS IVS/MediaLive<br/>RTMP Streaming]
        CDN_INFRA[CloudFront CDN<br/>Distribución Global]
    end
    
    V <-->|WSS| WS
    S <-->|WSS| WS
    V <-->|HTTPS| HTTP
    S <-->|HTTPS| HTTP
    
    WS --> SM
    WS --> UM
    WS --> NS
    HTTP --> SM
    HTTP --> UM
    
    NS -.->|emit| WS
    SD -.->|broadcast| WS
    
    SM --> SF
    UM --> UF
    SM --> MF
    
    SM --> MEM
    UM --> MEM
    SbM --> MEM
    
    SM -.->|future| DB
    UM -.->|future| DB
    
    SD -.->|RTMP Push| RTMP_INFRA
    RTMP_INFRA -.->|HLS/DASH| CDN_INFRA
    CDN_INFRA -.->|Stream| V
    
    style V fill:#e1f5ff
    style S fill:#fff4e1
    style HTTP fill:#f0f0f0
    style WS fill:#f0f0f0
    style NS fill:#e8f5e9
    style SD fill:#e8f5e9
    style SM fill:#fff3e0
    style UM fill:#fff3e0
    style SbM fill:#fff3e0
    style MF fill:#fce4ec
    style SF fill:#fce4ec
    style UF fill:#fce4ec
    style MEM fill:#ede7f6
    style DB fill:#ffebee
    style RTMP_INFRA fill:#fff9c4
    style CDN_INFRA fill:#f3e5f5
```

### 📋 Descripción de Capas (Monolito con Capas)

1. **Capa de Presentación** (Next.js): Componentes React para Viewer y Streamer
2. **Capa de Comunicación** (Node.js): Express REST API + Socket.IO WebSockets
3. **Capa de Aplicación** (Node.js): Lógica de negocio, servicios y managers
4. **Capa de Datos**: MongoDB Atlas + In-Memory storage
5. **Infraestructura AWS**: RTMP streaming y CDN para distribución

---

## 🌐 Vista de Despliegue (Producción)

**Arquitectura**: Monolito con Capas desplegado en AWS
**Stack**: Next.js + Node.js + MongoDB + RTMP

```mermaid
graph TB
    subgraph Internet
        U[👤 Usuario<br/>Streamer/Viewer]
    end
    
    subgraph "Capa de Cliente - Next.js"
        B[🌐 Next.js App<br/>React Frontend<br/>Chrome/Firefox/Safari]
    end
    
    subgraph "AWS Cloud - Infraestructura"
        subgraph "EC2 Instance - Monolito Node.js"
            N[Nginx<br/>Reverse Proxy<br/>SSL/TLS]
            APP[Node.js Monolith<br/>Express + Socket.IO<br/>StreamHub Server]
        end
        
        subgraph "Media Services - Streaming en Tiempo Real"
            RTMP[AWS IVS/MediaLive<br/>RTMP Server<br/>Ingestión de Video<br/>Tiempo Real]
            CDN[Amazon CloudFront<br/>CDN Global<br/>Distribución HLS/DASH]
        end
    end
    
    subgraph "Database Cloud - MongoDB"
        DB[(MongoDB Atlas<br/>Cluster M10<br/>Usuarios + Streams)]
    end
    
    U -->|HTTPS| B
    B -->|WSS WebSocket<br/>Port 443| N
    B -->|HTTPS REST<br/>Port 443| N
    
    N -->|Proxy Pass<br/>Port 3000| APP
    
    APP -->|Mongoose<br/>Connection String| DB
    
    B -.->|RTMP Push<br/>rtmp://| RTMP
    RTMP -->|Transcode| CDN
    CDN -.->|HLS/DASH Pull| B
    
    APP -.->|Metadata| RTMP
    APP -.->|Stream Events| CDN
    
    style U fill:#e3f2fd
    style B fill:#fff3e0
    style N fill:#e8f5e9
    style APP fill:#f3e5f5
    style DB fill:#ffe0b2
    style RTMP fill:#ffebee
    style CDN fill:#e0f2f1
```

### 🔧 Tecnologías de Despliegue

**Arquitectura**: Monolito con Capas (Layered Monolithic Architecture)

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **Frontend** | Next.js (React) | Framework de interfaz de usuario |
| **Navegador** | Chrome, Firefox, Safari | Cliente web |
| **Protocolo Web** | HTTPS + WebSocket Secure (WSS) | Comunicación segura |
| **Reverse Proxy** | Nginx | SSL termination, load balancing |
| **Backend Monolito** | Node.js + Express + Socket.IO | Lógica de negocio y WebSockets |
| **Infraestructura Cloud** | AWS EC2 (t3.medium o superior) | Servidor de aplicación |
| **Base de Datos** | MongoDB Atlas (M10 Cluster) | Persistencia de datos |
| **Streaming RTMP** | AWS IVS / MediaLive | Ingesta RTMP en tiempo real |
| **Video CDN** | Amazon CloudFront | Distribución global HLS/DASH |
| **Monitoring** | AWS CloudWatch + PM2 | Logs y métricas |

### 📦 Configuración de Producción

**EC2 Instance:**
- Tipo: `t3.medium` (2 vCPU, 4 GB RAM)
- OS: Ubuntu 22.04 LTS
- Node.js: v18 LTS
- PM2: Gestor de procesos

**Nginx:**
```nginx
upstream streamhub {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name streamhub.example.com;
    
    ssl_certificate /etc/letsencrypt/live/streamhub.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/streamhub.example.com/privkey.pem;
    
    location / {
        proxy_pass http://streamhub;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /socket.io/ {
        proxy_pass http://streamhub;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**MongoDB Atlas:**
- Cluster Tier: M10 (10 GB, 2 vCPU)
- Region: US-East-1 (mismo que EC2)
- Connection String: `mongodb+srv://user:pass@cluster.mongodb.net/streamhub`

**AWS IVS (Interactive Video Service):**
- Canal de streaming con URL RTMP
- Transcodificación automática
- Latencia ultra-baja (<3 segundos)

---

## 📺 Caso de Uso 1: Usuario Viewer Accede a un Stream a partir de una StreamKey

```mermaid
sequenceDiagram
    participant Viewer
    participant Server
    participant StreamManager
    participant NotificationService
    participant Streamer

    Viewer->>Server: USER_REGISTER {username, VIEWER}
    Server-->>Viewer: USER_REGISTERED
    
    Viewer->>Server: STREAM_JOIN {streamKey}
    Server->>StreamManager: getStreamByKey()
    Server->>StreamManager: addViewer()
    Server-->>Viewer: STREAM_JOINED
    
    Server->>NotificationService: notifyViewerJoined()
    NotificationService->>Streamer: VIEWER_JOINED
    
    loop Streaming continuo
        Streamer->>Server: STREAM_DATA
        Server->>Viewer: STREAM_DATA
    end
```

---

## 💬 Caso de Uso 2: Usuario Viewer Envía Mensaje en el Chat

```mermaid
sequenceDiagram
    participant Viewer
    participant Server
    participant MessageFactory
    participant NotificationService
    participant Streamer
    participant OtrosViewers

    Viewer->>Server: CHAT_MESSAGE_SEND {streamKey, content}
    Server->>MessageFactory: createChatMessage()
    MessageFactory-->>Server: message
    
    Server->>NotificationService: broadcastChatMessage()
    
    par Broadcast a todos
        NotificationService->>Streamer: CHAT_MESSAGE_BROADCAST
        NotificationService->>Viewer: CHAT_MESSAGE_BROADCAST
        NotificationService->>OtrosViewers: CHAT_MESSAGE_BROADCAST
    end
```

---

## 📋 Componentes

- **Viewer**: Cliente que ve el stream
- **Streamer**: Cliente que transmite
- **Server**: Servidor central
- **StreamManager**: Gestiona streams
- **NotificationService**: Envía notificaciones
- **MessageFactory**: Crea mensajes
