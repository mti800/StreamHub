/**
 * Server Hub: Servidor central que coordina streamers y viewers
 */

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { StreamManager } from './StreamManager';
import { UserManager } from './UserManager';
import { StreamDistributor } from './StreamDistributor';
import { SubscriptionManager } from './SubscriptionManager';
import { eventBus } from '../pubsub/EventBus';
import { Publisher } from '../pubsub/Publisher';
import { Events } from '../shared/events';
import { MessageFactory } from '../factories/MessageFactory';
import { UserRole, IWebRTCSignal, IUserSubscription } from '../shared/types';

const PORT = process.env.PORT || 3000;

class StreamHubServer {
  private app: express.Application;
  private httpServer: ReturnType<typeof createServer>;
  private io: Server;
  private streamManager: StreamManager;
  private userManager: UserManager;
  private streamDistributor: StreamDistributor;
  private subscriptionManager: SubscriptionManager;
  private publisher: Publisher;
  // Map para trackear qué stream está viendo cada socket
  private viewerToStream: Map<string, string>; // socketId -> streamKey

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
    this.streamDistributor = new StreamDistributor(this.io);
    this.subscriptionManager = new SubscriptionManager();
    this.publisher = new Publisher(eventBus);
    this.viewerToStream = new Map();

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
      const userStats = this.userManager.getStats();
      res.json({
        status: 'ok',
        activeStreams: this.streamManager.getActiveStreams().length,
        users: {
          total: userStats.total,
          connected: userStats.connected,
          disconnected: userStats.disconnected
        }
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
      this.handleStreamData(socket);
      this.handleStreamLeave(socket);
      this.handleWebRTCSignaling(socket);
      this.handleChatMessages(socket);
      this.handleReactions(socket);
      this.handleSubscriptions(socket);
      this.handleUsersList(socket);
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
        
        // Registrar stream en el distributor para multicast
        this.streamDistributor.registerStream(stream.streamKey);
        
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
        
        // Registrar viewer en el distributor
        this.streamDistributor.addViewer(data.streamKey, socket.id);
        
        // Trackear qué stream está viendo este socket
        this.viewerToStream.set(socket.id, stream.streamKey);
        
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
        
        // Usar Pub/Sub para notificar a suscriptores
        const streamer = this.userManager.getUser(stream.streamerId);
        if (streamer) {
          const followers = this.subscriptionManager.getFollowers(stream.streamerId);
          
          // Publicar evento de stream iniciado con información de suscriptores
          this.publisher.publish(Events.STREAM_STARTED, { 
            stream, 
            streamer,
            followerCount: followers.length
          });
          
          // Enviar notificación a cada suscriptor conectado
          followers.forEach(followerId => {
            const follower = this.userManager.getUser(followerId);
            if (follower && follower.socketId) {
              this.io.to(follower.socketId).emit(Events.STREAM_NOTIFICATION, {
                type: 'started',
                streamerId: stream.streamerId,
                streamerUsername: streamer.username,
                streamId: stream.id,
                streamKey: stream.streamKey,
                startedAt: stream.startedAt
              });
            }
          });
          
          console.log(`[Server] Stream iniciado: ${stream.streamKey}`);
          console.log(`[Server] Notificados ${followers.length} suscriptores`);
        }
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
        
        // Usar Pub/Sub para notificar a suscriptores que el stream finalizó
        const streamer = this.userManager.getUser(stream.streamerId);
        if (streamer) {
          const followers = this.subscriptionManager.getFollowers(stream.streamerId);
          
          // Publicar evento de stream finalizado
          this.publisher.publish(Events.STREAM_ENDED, { 
            stream, 
            streamer,
            followerCount: followers.length
          });
          
          // Enviar notificación a cada suscriptor conectado
          followers.forEach(followerId => {
            const follower = this.userManager.getUser(followerId);
            if (follower && follower.socketId) {
              this.io.to(follower.socketId).emit(Events.STREAM_NOTIFICATION, {
                type: 'ended',
                streamerId: stream.streamerId,
                streamerUsername: streamer.username,
                streamId: stream.id,
                streamKey: stream.streamKey,
                endedAt: stream.endedAt
              });
            }
          });
          
          console.log(`[Server] Stream finalizado: ${stream.streamKey}`);
          console.log(`[Server] Notificados ${followers.length} suscriptores de la finalización`);
        }
        
        // Desregistrar stream del distributor
        this.streamDistributor.unregisterStream(stream.streamKey);
        
        // Limpiar viewers de este stream del tracking
        this.viewerToStream.forEach((streamKey, socketId) => {
          if (streamKey === stream.streamKey) {
            this.viewerToStream.delete(socketId);
          }
        });
        
        // Desconectar a todos del room
        this.io.in(`stream:${stream.streamKey}`).socketsLeave(`stream:${stream.streamKey}`);
      } catch (error) {
        socket.emit(Events.STREAM_ERROR, { 
          message: 'Error al finalizar stream',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }

  /**
   * Maneja cuando un viewer sale de un stream
   */
  private handleStreamLeave(socket: Socket): void {
    socket.on(Events.STREAM_LEAVE, (data: { streamKey: string }) => {
      try {
        const user = this.userManager.getUserBySocket(socket.id);
        
        if (!user) {
          return;
        }

        const stream = this.streamManager.getStreamByKey(data.streamKey);
        
        if (!stream) {
          return;
        }

        // Decrementar contador de viewers
        const viewerCount = this.streamManager.removeViewer(data.streamKey);
        
        // Remover del distributor
        this.streamDistributor.removeViewer(data.streamKey, socket.id);
        
        // Remover del tracking
        this.viewerToStream.delete(socket.id);
        
        // Salir del room
        socket.leave(`stream:${stream.streamKey}`);
        
        // Notificar a todos en el stream
        this.io.to(`stream:${stream.streamKey}`).emit(Events.VIEWER_LEFT, {
          username: user.username,
          viewerCount
        });
        
        this.io.to(`stream:${stream.streamKey}`).emit(Events.VIEWER_COUNT_UPDATE, {
          viewerCount
        });

        console.log(`[Server] ${user.username} salió del stream ${stream.streamKey}`);
        
        // Mensaje de sistema en el chat
        const systemMessage = MessageFactory.createSystemMessage(
          stream.id,
          `${user.username} salió del stream`
        );
        this.io.to(`stream:${stream.streamKey}`).emit(Events.CHAT_MESSAGE_BROADCAST, {
          message: systemMessage
        });

        this.publisher.publish(Events.VIEWER_LEFT, { stream, user, viewerCount });
      } catch (error) {
        console.error('[Server] Error al salir del stream:', error);
      }
    });
  }

  /**
   * Maneja el envío de datos de streaming (Multicast)
   */
  private handleStreamData(socket: Socket): void {
    socket.on(Events.STREAM_DATA_SEND, (data: { streamKey: string; data: string }) => {
      try {
        const user = this.userManager.getUserBySocket(socket.id);
        const stream = this.streamManager.getStreamByKey(data.streamKey);
        
        if (!user || !stream) {
          console.error('[Server] Usuario o stream no encontrado para envío de datos');
          return;
        }

        // Verificar que el usuario es el streamer
        if (user.id !== stream.streamerId) {
          console.error('[Server] Solo el streamer puede enviar datos');
          return;
        }

        // Distribuir datos usando multicast a todos los viewers
        const viewersReached = this.streamDistributor.distributeStreamData(
          data.streamKey,
          data.data,
          user.id
        );

        // Opcional: Log cada N frames para no saturar la consola
        if (Math.random() < 0.01) { // ~1% de los frames
          console.log(`[Server] Stream data distribuido a ${viewersReached} viewers en ${data.streamKey}`);
        }
      } catch (error) {
        console.error('[Server] Error distribuyendo datos de stream:', error);
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
   * Maneja suscripciones de usuarios
   */
  private handleSubscriptions(socket: Socket): void {
    // Suscribirse a un usuario
    socket.on(Events.USER_SUBSCRIBE, (data: { targetUserId: string }) => {
      try {
        const user = this.userManager.getUserBySocket(socket.id);
        
        if (!user) {
          socket.emit(Events.STREAM_ERROR, { message: 'Usuario no registrado' });
          return;
        }

        const targetUser = this.userManager.getUser(data.targetUserId);
        
        if (!targetUser) {
          socket.emit(Events.STREAM_ERROR, { message: 'Usuario objetivo no encontrado' });
          return;
        }

        const success = this.subscriptionManager.subscribe(user.id, data.targetUserId);
        
        if (success) {
          socket.emit(Events.USER_SUBSCRIBED, {
            targetUserId: data.targetUserId,
            targetUsername: targetUser.username
          });
          
          console.log(`[Server] ${user.username} se suscribió a ${targetUser.username}`);
        } else {
          socket.emit(Events.STREAM_ERROR, { 
            message: 'No se pudo completar la suscripción' 
          });
        }
      } catch (error) {
        socket.emit(Events.STREAM_ERROR, { 
          message: 'Error al suscribirse',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });

    // Desuscribirse de un usuario
    socket.on(Events.USER_UNSUBSCRIBE, (data: { targetUserId: string }) => {
      try {
        const user = this.userManager.getUserBySocket(socket.id);
        
        if (!user) {
          socket.emit(Events.STREAM_ERROR, { message: 'Usuario no registrado' });
          return;
        }

        const success = this.subscriptionManager.unsubscribe(user.id, data.targetUserId);
        
        if (success) {
          const targetUser = this.userManager.getUser(data.targetUserId);
          socket.emit(Events.USER_UNSUBSCRIBED, {
            targetUserId: data.targetUserId,
            targetUsername: targetUser?.username
          });
          
          console.log(`[Server] ${user.username} se desuscribió de ${targetUser?.username}`);
        }
      } catch (error) {
        socket.emit(Events.STREAM_ERROR, { 
          message: 'Error al desuscribirse',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });

    // Obtener lista de suscripciones
    socket.on(Events.SUBSCRIPTIONS_GET, () => {
      try {
        const user = this.userManager.getUserBySocket(socket.id);
        
        if (!user) {
          socket.emit(Events.STREAM_ERROR, { message: 'Usuario no registrado' });
          return;
        }

        const subscriptionIds = this.subscriptionManager.getSubscriptions(user.id);
        const subscriptions = subscriptionIds
          .map(id => this.userManager.getUser(id))
          .filter(u => u !== undefined);

        socket.emit(Events.SUBSCRIPTIONS_LIST, { subscriptions });
      } catch (error) {
        socket.emit(Events.STREAM_ERROR, { 
          message: 'Error al obtener suscripciones',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }

  /**
   * Maneja solicitud de lista de usuarios
   */
  private handleUsersList(socket: Socket): void {
    socket.on(Events.USERS_GET, () => {
      try {
        const currentUser = this.userManager.getUserBySocket(socket.id);
        
        if (!currentUser) {
          socket.emit(Events.STREAM_ERROR, { message: 'Usuario no registrado' });
          return;
        }

        const allUsers = this.userManager.getAllUsers();
        const activeStreams = this.streamManager.getActiveStreams();
        const subscriptions = this.subscriptionManager.getSubscriptions(currentUser.id);

        // Crear lista de usuarios con información de suscripción y estado de stream
        const usersList: IUserSubscription[] = allUsers
          .filter(u => u.id !== currentUser.id) // Excluir al usuario actual
          .map(user => {
            const activeStream = activeStreams.find(s => s.streamerId === user.id);
            
            return {
              userId: user.id,
              username: user.username,
              role: user.role,
              isSubscribed: subscriptions.includes(user.id),
              streamStatus: activeStream ? 'active' : 'inactive',
              currentStreamKey: activeStream?.streamKey
            } as IUserSubscription;
          });

        socket.emit(Events.USERS_LIST, { users: usersList });
      } catch (error) {
        socket.emit(Events.STREAM_ERROR, { 
          message: 'Error al obtener usuarios',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
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
            this.streamDistributor.unregisterStream(stream.streamKey);
            
            // Limpiar viewers de este stream del tracking
            this.viewerToStream.forEach((streamKey, socketId) => {
              if (streamKey === stream.streamKey) {
                this.viewerToStream.delete(socketId);
              }
            });
            
            this.io.to(`stream:${stream.streamKey}`).emit(Events.STREAM_ENDED, { 
              stream,
              reason: 'El streamer se desconectó'
            });
          }
        } else {
          // Si es viewer, verificar si estaba viendo un stream
          const streamKey = this.viewerToStream.get(socket.id);
          
          if (streamKey) {
            // Decrementar contador de viewers
            const viewerCount = this.streamManager.removeViewer(streamKey);
            
            // Remover del distributor
            this.streamDistributor.removeViewer(streamKey, socket.id);
            
            // Remover del tracking
            this.viewerToStream.delete(socket.id);
            
            // Notificar actualización de contador
            this.io.to(`stream:${streamKey}`).emit(Events.VIEWER_COUNT_UPDATE, {
              viewerCount
            });
            
            this.io.to(`stream:${streamKey}`).emit(Events.VIEWER_LEFT, {
              username: user.username,
              viewerCount
            });
            
            console.log(`[Server] Viewer ${user.username} removido del stream ${streamKey}, viewers restantes: ${viewerCount}`);
          }
        }

        // Desconectar usuario pero mantenerlo en el sistema (persistencia)
        this.userManager.disconnectUser(user.id);
        
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
      this.streamDistributor.cleanupEmptyStreams();
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
