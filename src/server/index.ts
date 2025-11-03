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
import { NotificationService } from './NotificationService';
import { DatabaseService } from './Database';
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
  private db: DatabaseService;
  private streamManager: StreamManager;
  private userManager: UserManager;
  private streamDistributor: StreamDistributor;
  private subscriptionManager: SubscriptionManager;
  private notificationService: NotificationService;
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

    // Inicializar base de datos primero
    this.db = new DatabaseService();
    
    // Inicializar managers con la DB
    this.streamManager = new StreamManager(this.db);
    this.userManager = new UserManager(this.db);
    this.streamDistributor = new StreamDistributor(this.io);
    this.subscriptionManager = new SubscriptionManager(this.db);
    this.notificationService = new NotificationService(this.io);
    this.publisher = new Publisher(eventBus);
    this.viewerToStream = new Map();

    this.setupRoutes();
    this.setupSocketIO();
    this.setupCleanupTask();
    this.setupGracefulShutdown();
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
        
        this.notificationService.notifyUserRegistered(socket.id, user);
        console.log(`[Server] Usuario registrado: ${user.username} (${user.role})`);

        this.publisher.publish(Events.USER_REGISTERED, { user });
      } catch (error) {
        this.notificationService.notifyError(
          socket.id,
          'Error al registrar usuario',
          error instanceof Error ? error.message : undefined
        );
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
          this.notificationService.notifyError(socket.id, 'Solo los streamers pueden crear streams');
          return;
        }

        const stream = this.streamManager.createStream({ streamerId: user.id });
        
        // Registrar stream en el distributor para multicast
        this.streamDistributor.registerStream(stream.streamKey);
        
        socket.join(`stream:${stream.streamKey}`);
        this.notificationService.notifyStreamCreated(socket.id, stream);
        
        console.log(`[Server] Stream creado: ${stream.streamKey} por ${user.username}`);
        this.publisher.publish(Events.STREAM_CREATED, { stream, user });
      } catch (error) {
        this.notificationService.notifyError(
          socket.id,
          'Error al crear stream',
          error instanceof Error ? error.message : undefined
        );
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
          this.notificationService.notifyError(socket.id, 'Usuario no registrado');
          return;
        }

        const stream = this.streamManager.getStreamByKey(data.streamKey);
        
        if (!stream) {
          this.notificationService.notifyError(socket.id, 'Stream no encontrado');
          return;
        }

        socket.join(`stream:${stream.streamKey}`);
        
        const viewerCount = this.streamManager.addViewer(data.streamKey);
        
        // Registrar viewer en el distributor
        this.streamDistributor.addViewer(data.streamKey, socket.id);
        
        // Trackear qué stream está viendo este socket
        this.viewerToStream.set(socket.id, stream.streamKey);
        
        this.notificationService.notifyStreamJoined(socket.id, stream);
        
        // Notificar a todos en el stream sobre el nuevo viewer
        this.notificationService.notifyViewerJoined(stream.streamKey, user.username, viewerCount);
        this.notificationService.notifyViewerCountUpdate(stream.streamKey, viewerCount);

        console.log(`[Server] ${user.username} se unió al stream ${stream.streamKey}`);

        // Mensaje de sistema en el chat
        const systemMessage = MessageFactory.createSystemMessage(
          stream.id,
          `${user.username} se unió al stream`
        );
        this.notificationService.broadcastChatMessage(stream.streamKey, systemMessage);

        this.publisher.publish(Events.STREAM_JOINED, { stream, user, viewerCount });
      } catch (error) {
        this.notificationService.notifyError(
          socket.id,
          'Error al unirse al stream',
          error instanceof Error ? error.message : undefined
        );
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
          this.notificationService.notifyError(socket.id, 'Stream no encontrado');
          return;
        }

        this.notificationService.notifyStreamStarted(stream.streamKey, stream);
        
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
              this.notificationService.notifyFollower(follower.socketId, 'started', {
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
        this.notificationService.notifyError(
          socket.id,
          'Error al iniciar stream',
          error instanceof Error ? error.message : undefined
        );
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
          this.notificationService.notifyError(socket.id, 'Stream no encontrado');
          return;
        }

        this.notificationService.notifyStreamEnded(stream.streamKey, stream);
        
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
              this.notificationService.notifyFollower(follower.socketId, 'ended', {
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
        this.notificationService.leaveRoom(stream.streamKey);
      } catch (error) {
        this.notificationService.notifyError(
          socket.id,
          'Error al finalizar stream',
          error instanceof Error ? error.message : undefined
        );
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
        this.notificationService.notifyViewerLeft(stream.streamKey, user.username, viewerCount);
        this.notificationService.notifyViewerCountUpdate(stream.streamKey, viewerCount);

        console.log(`[Server] ${user.username} salió del stream ${stream.streamKey}`);
        
        // Mensaje de sistema en el chat
        const systemMessage = MessageFactory.createSystemMessage(
          stream.id,
          `${user.username} salió del stream`
        );
        this.notificationService.broadcastChatMessage(stream.streamKey, systemMessage);

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
          this.notificationService.sendWebRTCSignal(streamer.socketId, 'webrtc:request', data);
        }
      }
    });

    // Offer del streamer al viewer
    socket.on(Events.WEBRTC_OFFER, (data: IWebRTCSignal) => {
      console.log(`[Server] WebRTC Offer de ${data.from} a ${data.to}`);
      this.notificationService.sendWebRTCSignal(data.to, Events.WEBRTC_OFFER, data);
    });

    // Answer del viewer al streamer
    socket.on(Events.WEBRTC_ANSWER, (data: IWebRTCSignal) => {
      console.log(`[Server] WebRTC Answer de ${data.from} a ${data.to}`);
      this.notificationService.sendWebRTCSignal(data.to, Events.WEBRTC_ANSWER, data);
    });

    // ICE Candidates
    socket.on(Events.WEBRTC_ICE_CANDIDATE, (data: IWebRTCSignal) => {
      console.log(`[Server] ICE Candidate de ${data.from} a ${data.to}`);
      this.notificationService.sendWebRTCSignal(data.to, Events.WEBRTC_ICE_CANDIDATE, data);
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

        this.notificationService.broadcastChatMessage(stream.streamKey, message);

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

        this.notificationService.broadcastReaction(stream.streamKey, reaction);

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
          this.notificationService.notifyError(socket.id, 'Usuario no registrado');
          return;
        }

        const targetUser = this.userManager.getUser(data.targetUserId);
        
        if (!targetUser) {
          this.notificationService.notifyError(socket.id, 'Usuario objetivo no encontrado');
          return;
        }

        const success = this.subscriptionManager.subscribe(user.id, data.targetUserId);
        
        if (success) {
          this.notificationService.notifyUserSubscribed(socket.id, data.targetUserId, targetUser.username);
          console.log(`[Server] ${user.username} se suscribió a ${targetUser.username}`);
        } else {
          this.notificationService.notifyError(socket.id, 'No se pudo completar la suscripción');
        }
      } catch (error) {
        this.notificationService.notifyError(
          socket.id,
          'Error al suscribirse',
          error instanceof Error ? error.message : undefined
        );
      }
    });

    // Desuscribirse de un usuario
    socket.on(Events.USER_UNSUBSCRIBE, (data: { targetUserId: string }) => {
      try {
        const user = this.userManager.getUserBySocket(socket.id);
        
        if (!user) {
          this.notificationService.notifyError(socket.id, 'Usuario no registrado');
          return;
        }

        const success = this.subscriptionManager.unsubscribe(user.id, data.targetUserId);
        
        if (success) {
          const targetUser = this.userManager.getUser(data.targetUserId);
          this.notificationService.notifyUserUnsubscribed(socket.id, data.targetUserId, targetUser?.username);
          console.log(`[Server] ${user.username} se desuscribió de ${targetUser?.username}`);
        }
      } catch (error) {
        this.notificationService.notifyError(
          socket.id,
          'Error al desuscribirse',
          error instanceof Error ? error.message : undefined
        );
      }
    });

    // Obtener lista de suscripciones
    socket.on(Events.SUBSCRIPTIONS_GET, () => {
      try {
        const user = this.userManager.getUserBySocket(socket.id);
        
        if (!user) {
          this.notificationService.notifyError(socket.id, 'Usuario no registrado');
          return;
        }

        const subscriptionIds = this.subscriptionManager.getSubscriptions(user.id);
        const subscriptions = subscriptionIds
          .map(id => this.userManager.getUser(id))
          .filter(u => u !== undefined);

        this.notificationService.sendSubscriptionsList(socket.id, subscriptions);
      } catch (error) {
        this.notificationService.notifyError(
          socket.id,
          'Error al obtener suscripciones',
          error instanceof Error ? error.message : undefined
        );
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
          this.notificationService.notifyError(socket.id, 'Usuario no registrado');
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

        this.notificationService.sendUsersList(socket.id, usersList);
      } catch (error) {
        this.notificationService.notifyError(
          socket.id,
          'Error al obtener usuarios',
          error instanceof Error ? error.message : undefined
        );
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
            
            this.notificationService.notifyStreamEnded(
              stream.streamKey,
              stream,
              'El streamer se desconectó'
            );
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
            this.notificationService.notifyViewerCountUpdate(streamKey, viewerCount);
            this.notificationService.notifyViewerLeft(streamKey, user.username, viewerCount);
            
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
   * Configura limpieza al cerrar el servidor
   */
  private setupGracefulShutdown(): void {
    const shutdown = () => {
      console.log('\n[Server] Cerrando servidor...');
      
      // Mostrar estadísticas finales
      const stats = this.db.getStats();
      console.log('[Database] Estadísticas finales:', stats);
      
      // Cerrar base de datos
      this.db.close();
      
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
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
      console.log(`💾 Base de datos SQLite conectada`);
      
      // Mostrar estadísticas de datos cargados
      const stats = this.db.getStats();
      console.log(`📊 Datos persistidos: ${stats.users} usuarios, ${stats.streams} streams, ${stats.subscriptions} suscripciones`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  }
}

// Iniciar servidor
const server = new StreamHubServer();
server.start();

export default StreamHubServer;
