/**
 * Publisher: Publica eventos en el sistema
 */

import { EventBus } from './EventBus';
import { EventType } from '../shared/events';

export class Publisher {
  constructor(private eventBus: EventBus) {}

  /**
   * Publica un evento con datos opcionales
   */
  publish(event: EventType, data?: any): void {
    console.log(`[Publisher] Publicando evento: ${event}`, data ? '(con datos)' : '');
    this.eventBus.publish(event, data);
  }

  /**
   * Publica múltiples eventos
   */
  publishMany(events: Array<{ event: EventType; data?: any }>): void {
    events.forEach(({ event, data }) => this.publish(event, data));
  }
}
