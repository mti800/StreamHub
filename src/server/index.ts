/**
 * Server Hub: Servidor central que coordina streamers y viewers
 */

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { StreamManager } from './StreamManager';
import { UserManager } from './UserManager';
import { eventBus } from '../pubsub/EventBus';
import { Publisher } from '../pubsub/Publisher';
import { Events } from '../shared/events';
import { MessageFactory } from '../factories/MessageFactory';
import { UserRole, IWebRTCSignal } from '../shared/types';

const PORT = process.env.PORT || 3000;

class StreamHubServer {
  private app: express.Application;
  private httpServer: ReturnType<typeof createServer>;
  private io: Server;
  private streamManager: StreamManager;
  private userManager: UserManager;
  private publisher: Publisher;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.streamManager = new StreamManager();
    this.userManager = new UserManager();
    this.publisher = new Publisher(eventBus);

    this.setupRoutes();
    this.setupSocketIO();
    this.setupCleanupTask();
  }

  /**
   * Configura las rutas HTTP
   */
  private setupRoutes(): void {
    // Servir archivos estáticos
    this.app.use(express.static(path.join(__dirname, '../../public')));

    // Ruta principal - sirve index.html desde public
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../../public/index.html'));
    });

    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        activeStreams: this.streamManager.getActiveStreams().length,
        connectedUsers: this.userManager.getAllUsers().length
      });
    });

    this.app.get('/streams', (req, res) => {
      const activeStreams = this.streamManager.getActiveStreams();
      res.json({ streams: activeStreams });
    });
  }

  /**
   * Configura Socket.IO
   */
  private setupSocketIO(): void {
    this.io.on(Events.CONNECTION, (socket: Socket) => {
      console.log(`[Server] Nueva conexión: ${socket.id}`);

      this.handleUserRegistration(socket);
      this.handleStreamCreation(socket);
      this.handleStreamJoin(socket);
      this.handleStreamStart(socket);
      this.handleStreamEnd(socket);
      this.handleWebRTCSignaling(socket);
      this.handleChatMessages(socket);
      this.handleReactions(socket);
      this.handleDisconnect(socket);
    });
  }

  /**
   * Maneja el registro de usuarios
   */
  private handleUserRegistration(socket: Socket): void {
    socket.on(Events.USER_REGISTER, (data: { username: string; role: UserRole }) => {
      try {
        const user = this.userManager.registerUser(data.username, data.role, socket.id);
        
        socket.emit(Events.USER_REGISTERED, { user });
        console.log(`[Server] Usuario registrado: ${user.username} (${user.role})`);

        this.publisher.publish(Events.USER_REGISTERED, { user });
      } catch (error) {
        socket.emit(Events.STREAM_ERROR, { 
          message: 'Error al registrar usuario',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }

  /**
   * Maneja la creación de streams
   */
  private handleStreamCreation(socket: Socket): void {
    socket.on(Events.STREAM_CREATE, () => {
      try {
        const user = this.userManager.getUserBySocket(socket.id);
        
        if (!user || user.role !== UserRole.STREAMER) {
          socket.emit(Events.STREAM_ERROR, { 
            message: 'Solo los streamers pueden crear streams' 
          });
          return;
        }

        const stream = this.streamManager.createStream({ streamerId: user.id });
        
        socket.join(`stream:${stream.streamKey}`);
        socket.emit(Events.STREAM_CREATED, { stream });
        
        console.log(`[Server] Stream creado: ${stream.streamKey} por ${user.username}`);
        this.publisher.publish(Events.STREAM_CREATED, { stream, user });
      } catch (error) {
        socket.emit(Events.STREAM_ERROR, { 
          message: 'Error al crear stream',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }

  /**
   * Maneja cuando un viewer se une a un stream
   */
  private handleStreamJoin(socket: Socket): void {
    socket.on(Events.STREAM_JOIN, (data: { streamKey: string }) => {
      try {
        const user = this.userManager.getUserBySocket(socket.id);
        
        if (!user) {
          socket.emit(Events.STREAM_ERROR, { message: 'Usuario no registrado' });
          return;
        }

        const stream = this.streamManager.getStreamByKey(data.streamKey);
        
        if (!stream) {
          socket.emit(Events.STREAM_ERROR, { message: 'Stream no encontrado' });
          return;
        }

        socket.join(`stream:${stream.streamKey}`);
        
        const viewerCount = this.streamManager.addViewer(data.streamKey);
        
        socket.emit(Events.STREAM_JOINED, { stream });
        
        // Notificar a todos en el stream sobre el nuevo viewer
        this.io.to(`stream:${stream.streamKey}`).emit(Events.VIEWER_JOINED, {
          username: user.username,
          viewerCount
        });
        
        this.io.to(`stream:${stream.streamKey}`).emit(Events.VIEWER_COUNT_UPDATE, {
          viewerCount
        });

        console.log(`[Server] ${user.username} se unió al stream ${stream.streamKey}`);

        // Mensaje de sistema en el chat
        const systemMessage = MessageFactory.createSystemMessage(
          stream.id,
          `${user.username} se unió al stream`
        );
        this.io.to(`stream:${stream.streamKey}`).emit(Events.CHAT_MESSAGE_BROADCAST, {
          message: systemMessage
        });

        this.publisher.publish(Events.STREAM_JOINED, { stream, user, viewerCount });
      } catch (error) {
        socket.emit(Events.STREAM_ERROR, { 
          message: 'Error al unirse al stream',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }

  /**
   * Maneja el inicio de un stream
   */
  private handleStreamStart(socket: Socket): void {
    socket.on(Events.STREAM_START, (data: { streamKey: string }) => {
      try {
        const stream = this.streamManager.startStream(data.streamKey);
        
        if (!stream) {
          socket.emit(Events.STREAM_ERROR, { message: 'Stream no encontrado' });
          return;
        }

        this.io.to(`stream:${stream.streamKey}`).emit(Events.STREAM_STARTED, { stream });
        
        console.log(`[Server] Stream iniciado: ${stream.streamKey}`);
        this.publisher.publish(Events.STREAM_STARTED, { stream });
      } catch (error) {
        socket.emit(Events.STREAM_ERROR, { 
          message: 'Error al iniciar stream',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }

  /**
   * Maneja la finalización de un stream
   */
  private handleStreamEnd(socket: Socket): void {
    socket.on(Events.STREAM_END, (data: { streamKey: string }) => {
      try {
        const stream = this.streamManager.endStream(data.streamKey);
        
        if (!stream) {
          socket.emit(Events.STREAM_ERROR, { message: 'Stream no encontrado' });
          return;
        }

        this.io.to(`stream:${stream.streamKey}`).emit(Events.STREAM_ENDED, { stream });
        
        // Desconectar a todos del room
        this.io.in(`stream:${stream.streamKey}`).socketsLeave(`stream:${stream.streamKey}`);
        
        console.log(`[Server] Stream finalizado: ${stream.streamKey}`);
        this.publisher.publish(Events.STREAM_ENDED, { stream });
      } catch (error) {
        socket.emit(Events.STREAM_ERROR, { 
          message: 'Error al finalizar stream',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }

  /**
   * Maneja señalización WebRTC entre peers
   */
  private handleWebRTCSignaling(socket: Socket): void {
    // Solicitud de conexión de viewer
    socket.on('webrtc:request', (data: any) => {
      console.log(`[Server] Viewer ${data.viewerId} solicita conexión al stream ${data.streamKey}`);
      const stream = this.streamManager.getStreamByKey(data.streamKey);
      if (stream) {
        const streamer = this.userManager.getUser(stream.streamerId);
        if (streamer && streamer.socketId) {
          this.io.to(streamer.socketId).emit('webrtc:request', data);
        }
      }
    });

    // Offer del streamer al viewer
    socket.on(Events.WEBRTC_OFFER, (data: IWebRTCSignal) => {
      console.log(`[Server] WebRTC Offer de ${data.from} a ${data.to}`);
      this.io.to(data.to).emit(Events.WEBRTC_OFFER, data);
    });

    // Answer del viewer al streamer
    socket.on(Events.WEBRTC_ANSWER, (data: IWebRTCSignal) => {
      console.log(`[Server] WebRTC Answer de ${data.from} a ${data.to}`);
      this.io.to(data.to).emit(Events.WEBRTC_ANSWER, data);
    });

    // ICE Candidates
    socket.on(Events.WEBRTC_ICE_CANDIDATE, (data: IWebRTCSignal) => {
      console.log(`[Server] ICE Candidate de ${data.from} a ${data.to}`);
      this.io.to(data.to).emit(Events.WEBRTC_ICE_CANDIDATE, data);
    });
  }

  /**
   * Maneja mensajes de chat
   */
  private handleChatMessages(socket: Socket): void {
    socket.on(Events.CHAT_MESSAGE_SEND, (data: { streamKey: string; content: string }) => {
      try {
        const user = this.userManager.getUserBySocket(socket.id);
        const stream = this.streamManager.getStreamByKey(data.streamKey);
        
        if (!user || !stream) return;

        const message = MessageFactory.createChatMessage(
          stream.id,
          user.id,
          user.username,
          data.content
        );

        this.io.to(`stream:${stream.streamKey}`).emit(Events.CHAT_MESSAGE_BROADCAST, {
          message
        });

        console.log(`[Server] Chat [${stream.streamKey}] ${user.username}: ${data.content}`);
        this.publisher.publish(Events.CHAT_MESSAGE_BROADCAST, { message, stream });
      } catch (error) {
        console.error('[Server] Error en mensaje de chat:', error);
      }
    });
  }

  /**
   * Maneja reacciones
   */
  private handleReactions(socket: Socket): void {
    socket.on(Events.REACTION_SEND, (data: { streamKey: string; emoji: string }) => {
      try {
        const user = this.userManager.getUserBySocket(socket.id);
        const stream = this.streamManager.getStreamByKey(data.streamKey);
        
        if (!user || !stream) return;

        const reaction = MessageFactory.createReaction(
          stream.id,
          user.id,
          user.username,
          data.emoji
        );

        this.io.to(`stream:${stream.streamKey}`).emit(Events.REACTION_BROADCAST, {
          reaction
        });

        console.log(`[Server] Reacción [${stream.streamKey}] ${user.username}: ${data.emoji}`);
        this.publisher.publish(Events.REACTION_BROADCAST, { reaction, stream });
      } catch (error) {
        console.error('[Server] Error en reacción:', error);
      }
    });
  }

  /**
   * Maneja desconexiones
   */
  private handleDisconnect(socket: Socket): void {
    socket.on(Events.DISCONNECT, () => {
      const user = this.userManager.getUserBySocket(socket.id);
      
      if (user) {
        console.log(`[Server] Usuario desconectado: ${user.username}`);

        // Si es un streamer, finalizar su stream
        if (user.role === UserRole.STREAMER) {
          const stream = this.streamManager.getStreamByStreamer(user.id);
          if (stream) {
            this.streamManager.endStream(stream.streamKey);
            this.io.to(`stream:${stream.streamKey}`).emit(Events.STREAM_ENDED, { 
              stream,
              reason: 'El streamer se desconectó'
            });
          }
        }

        this.userManager.removeUser(user.id);
        this.publisher.publish(Events.DISCONNECT, { user });
      }
    });
  }

  /**
   * Configura tarea de limpieza periódica
   */
  private setupCleanupTask(): void {
    setInterval(() => {
      this.streamManager.cleanup(24);
      console.log('[Server] Limpieza de streams antiguos completada');
    }, 60 * 60 * 1000); // Cada hora
  }

  /**
   * Inicia el servidor
   */
  start(): void {
    this.httpServer.listen(PORT, () => {
      console.log('╔════════════════════════════════════════╗');
      console.log('║     StreamHub Server - INICIADO       ║');
      console.log('╚════════════════════════════════════════╝');
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📡 WebSocket listo para conexiones`);
      console.log(`⏰ Sistema Pub/Sub activo`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  }
}

// Iniciar servidor
const server = new StreamHubServer();
server.start();

export default StreamHubServer;
