/**
 * Subscriber: Se suscribe a eventos del sistema
 */

import { EventBus } from './EventBus';
import { EventType } from '../shared/events';

type Callback = (data?: any) => void;

export class Subscriber {
  private unsubscribers: Map<EventType, (() => void)[]>;

  constructor(private eventBus: EventBus) {
    this.unsubscribers = new Map();
  }

  /**
   * Suscribirse a un evento
   */
  subscribe(event: EventType, callback: Callback): void {
    console.log(`[Subscriber] Suscripción a evento: ${event}`);
    const unsubscribe = this.eventBus.subscribe(event, callback);

    if (!this.unsubscribers.has(event)) {
      this.unsubscribers.set(event, []);
    }
    this.unsubscribers.get(event)!.push(unsubscribe);
  }

  /**
   * Suscribirse a múltiples eventos
   */
  subscribeMany(subscriptions: Array<{ event: EventType; callback: Callback }>): void {
    subscriptions.forEach(({ event, callback }) => this.subscribe(event, callback));
  }

  /**
   * Desuscribirse de un evento específico
   */
  unsubscribe(event: EventType): void {
    const unsubscribers = this.unsubscribers.get(event);
    if (unsubscribers) {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      this.unsubscribers.delete(event);
    }
  }

  /**
   * Desuscribirse de todos los eventos
   */
  unsubscribeAll(): void {
    this.unsubscribers.forEach(unsubscribers => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    });
    this.unsubscribers.clear();
  }
}
