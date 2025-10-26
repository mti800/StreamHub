/**
 * Patrón Publisher-Subscriber: Sistema de eventos
 */

import { EventType } from '../shared/events';

type Callback = (data?: any) => void;

export class EventBus {
  private subscribers: Map<EventType, Set<Callback>>;

  constructor() {
    this.subscribers = new Map();
  }

  /**
   * Suscribirse a un evento
   */
  subscribe(event: EventType, callback: Callback): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    this.subscribers.get(event)!.add(callback);

    // Retorna función para desuscribirse
    return () => this.unsubscribe(event, callback);
  }

  /**
   * Desuscribirse de un evento
   */
  unsubscribe(event: EventType, callback: Callback): void {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(event);
      }
    }
  }

  /**
   * Publicar un evento
   */
  publish(event: EventType, data?: any): void {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en callback del evento ${event}:`, error);
        }
      });
    }
  }

  /**
   * Limpiar todos los suscriptores de un evento
   */
  clearEvent(event: EventType): void {
    this.subscribers.delete(event);
  }

  /**
   * Limpiar todos los suscriptores
   */
  clearAll(): void {
    this.subscribers.clear();
  }

  /**
   * Obtener número de suscriptores de un evento
   */
  getSubscriberCount(event: EventType): number {
    return this.subscribers.get(event)?.size || 0;
  }
}

// Instancia singleton del EventBus
export const eventBus = new EventBus();
