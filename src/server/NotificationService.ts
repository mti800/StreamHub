/**
 * NotificationService: Centraliza el envío de notificaciones Socket.IO
 * Elimina la duplicación de this.io.to(...).emit(...)
 */

import { Server } from 'socket.io';
import { Events } from '../shared/events';

export class NotificationService {
  constructor(private io: Server) {}

  /**
   * Envía una notificación a todos en un stream
   */
  broadcastToStream(streamKey: string, event: string, data: any): void {
    this.io.to(`stream:${streamKey}`).emit(event, data);
  }

  /**
   * Envía una notificación a un usuario específico por socket ID
   */
  notifyUser(socketId: string, event: string, data: any): void {
    this.io.to(socketId).emit(event, data);
  }

  /**
   * Envía una notificación de error a un usuario
   */
  notifyError(socketId: string, message: string, error?: string): void {
    this.io.to(socketId).emit(Events.STREAM_ERROR, {
      message,
      error: error || 'Error desconocido'
    });
  }

  /**
   * Notifica que un stream ha iniciado
   */
  notifyStreamStarted(streamKey: string, stream: any): void {
    this.broadcastToStream(streamKey, Events.STREAM_STARTED, { stream });
  }

  /**
   * Notifica que un stream ha finalizado
   */
  notifyStreamEnded(streamKey: string, stream: any, reason?: string): void {
    this.broadcastToStream(streamKey, Events.STREAM_ENDED, { 
      stream,
      reason 
    });
  }

  /**
   * Notifica que un viewer se unió al stream
   */
  notifyViewerJoined(streamKey: string, username: string, viewerCount: number): void {
    this.broadcastToStream(streamKey, Events.VIEWER_JOINED, {
      username,
      viewerCount
    });
  }

  /**
   * Notifica que un viewer salió del stream
   */
  notifyViewerLeft(streamKey: string, username: string, viewerCount: number): void {
    this.broadcastToStream(streamKey, Events.VIEWER_LEFT, {
      username,
      viewerCount
    });
  }

  /**
   * Actualiza el contador de viewers
   */
  notifyViewerCountUpdate(streamKey: string, viewerCount: number): void {
    this.broadcastToStream(streamKey, Events.VIEWER_COUNT_UPDATE, {
      viewerCount
    });
  }

  /**
   * Envía un mensaje de chat al stream
   */
  broadcastChatMessage(streamKey: string, message: any): void {
    this.broadcastToStream(streamKey, Events.CHAT_MESSAGE_BROADCAST, {
      message
    });
  }

  /**
   * Envía una reacción al stream
   */
  broadcastReaction(streamKey: string, reaction: any): void {
    this.broadcastToStream(streamKey, Events.REACTION_BROADCAST, {
      reaction
    });
  }

  /**
   * Notifica a un seguidor sobre un evento de stream
   */
  notifyFollower(
    socketId: string,
    type: 'started' | 'ended',
    data: {
      streamerId: string;
      streamerUsername: string;
      streamId: string;
      streamKey: string;
      startedAt?: Date;
      endedAt?: Date;
    }
  ): void {
    this.notifyUser(socketId, Events.STREAM_NOTIFICATION, {
      type,
      ...data
    });
  }

  /**
   * Envía señal WebRTC a un peer específico
   */
  sendWebRTCSignal(targetSocketId: string, event: string, data: any): void {
    this.notifyUser(targetSocketId, event, data);
  }

  /**
   * Notifica registro exitoso de usuario
   */
  notifyUserRegistered(socketId: string, user: any): void {
    this.notifyUser(socketId, Events.USER_REGISTERED, { user });
  }

  /**
   * Notifica creación exitosa de stream
   */
  notifyStreamCreated(socketId: string, stream: any): void {
    this.notifyUser(socketId, Events.STREAM_CREATED, { stream });
  }

  /**
   * Notifica que un usuario se unió exitosamente a un stream
   */
  notifyStreamJoined(socketId: string, stream: any): void {
    this.notifyUser(socketId, Events.STREAM_JOINED, { stream });
  }

  /**
   * Notifica suscripción exitosa
   */
  notifyUserSubscribed(socketId: string, targetUserId: string, targetUsername: string): void {
    this.notifyUser(socketId, Events.USER_SUBSCRIBED, {
      targetUserId,
      targetUsername
    });
  }

  /**
   * Notifica desuscripción exitosa
   */
  notifyUserUnsubscribed(socketId: string, targetUserId: string, targetUsername?: string): void {
    this.notifyUser(socketId, Events.USER_UNSUBSCRIBED, {
      targetUserId,
      targetUsername
    });
  }

  /**
   * Envía lista de suscripciones
   */
  sendSubscriptionsList(socketId: string, subscriptions: any[]): void {
    this.notifyUser(socketId, Events.SUBSCRIPTIONS_LIST, { subscriptions });
  }

  /**
   * Envía lista de usuarios
   */
  sendUsersList(socketId: string, users: any[]): void {
    this.notifyUser(socketId, Events.USERS_LIST, { users });
  }

  /**
   * Desconecta a todos los usuarios de un room
   */
  async leaveRoom(streamKey: string): Promise<void> {
    const sockets = await this.io.in(`stream:${streamKey}`).fetchSockets();
    sockets.forEach(socket => socket.leave(`stream:${streamKey}`));
  }
}
