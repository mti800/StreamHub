/**
 * SubscriptionManager: Gestiona suscripciones entre usuarios
 * Usa Publisher para eventos de suscripción
 */

import { Publisher } from '../pubsub/Publisher';
import { eventBus } from '../pubsub/EventBus';
import { Events } from '../shared/events';

export class SubscriptionManager {
  // Mapa de suscripciones: followerId -> Set de followingIds
  private subscriptions: Map<string, Set<string>>;
  
  // Publisher para eventos de suscripción
  private publisher: Publisher;

  constructor() {
    this.subscriptions = new Map();
    this.publisher = new Publisher(eventBus);
  }

  /**
   * Usuario A sigue a Usuario B
   */
  subscribe(followerId: string, followingId: string): boolean {
    if (followerId === followingId) {
      return false; // No puede seguirse a sí mismo
    }

    if (!this.subscriptions.has(followerId)) {
      this.subscriptions.set(followerId, new Set());
    }

    const following = this.subscriptions.get(followerId)!;
    if (following.has(followingId)) {
      return false; // Ya está suscrito
    }

    following.add(followingId);
    
    // Publicar evento de suscripción
    this.publisher.publish(Events.USER_SUBSCRIBED, {
      followerId,
      followingId,
      subscribedAt: new Date()
    });
    
    console.log(`[SubscriptionManager] Usuario ${followerId} suscrito a ${followingId}`);
    return true;
  }

  /**
   * Usuario A deja de seguir a Usuario B
   */
  unsubscribe(followerId: string, followingId: string): boolean {
    const following = this.subscriptions.get(followerId);
    if (!following) {
      return false;
    }

    const wasUnsubscribed = following.delete(followingId);
    
    if (wasUnsubscribed) {
      // Publicar evento de desuscripción
      this.publisher.publish(Events.USER_UNSUBSCRIBED, {
        followerId,
        followingId,
        unsubscribedAt: new Date()
      });
      
      console.log(`[SubscriptionManager] Usuario ${followerId} desuscrito de ${followingId}`);
    }
    
    return wasUnsubscribed;
  }

  /**
   * Obtiene la lista de usuarios a los que sigue un usuario
   */
  getSubscriptions(userId: string): string[] {
    const following = this.subscriptions.get(userId);
    return following ? Array.from(following) : [];
  }

  /**
   * Obtiene la lista de seguidores de un usuario
   */
  getFollowers(userId: string): string[] {
    const followers: string[] = [];
    
    this.subscriptions.forEach((following, followerId) => {
      if (following.has(userId)) {
        followers.push(followerId);
      }
    });

    return followers;
  }

  /**
   * Verifica si un usuario sigue a otro
   */
  isSubscribed(followerId: string, followingId: string): boolean {
    const following = this.subscriptions.get(followerId);
    return following ? following.has(followingId) : false;
  }

  /**
   * Elimina todas las suscripciones de un usuario
   */
  removeUserSubscriptions(userId: string): void {
    this.subscriptions.delete(userId);
    
    // Eliminar al usuario de las listas de following de otros
    this.subscriptions.forEach(following => {
      following.delete(userId);
    });
  }

  /**
   * Obtiene estadísticas de un usuario
   */
  getUserStats(userId: string): { following: number; followers: number } {
    return {
      following: this.getSubscriptions(userId).length,
      followers: this.getFollowers(userId).length
    };
  }
}
