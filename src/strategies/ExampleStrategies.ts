/**
 * Patrón Strategy: Ejemplo de nueva estrategia de mensaje
 * 
 * Este es un ejemplo de cómo añadir nuevos tipos de mensajes en el futuro.
 * Para usar esta estrategia:
 * 
 * 1. Añade el tipo al enum MessageType en types.ts (si es necesario)
 * 
 * 2. Cambia la estrategia en el MessageFactory:
 *    MessageFactory.setChatStrategy(new AnnouncementMessageStrategy());
 * 
 * 3. O crea un nuevo método en MessageFactory para el nuevo tipo
 */

import { v4 as uuidv4 } from 'uuid';
import { IMessageStrategy } from './IMessageStrategy';
import { IChatMessage, MessageType } from '../shared/types';

/**
 * Estrategia de ejemplo para mensajes de anuncio
 * Los anuncios podrían tener formato especial, prioridad, etc.
 */
export class AnnouncementMessageStrategy implements IMessageStrategy<IChatMessage> {
  create(
    streamId: string,
    userId: string,
    username: string,
    content: string
  ): IChatMessage {
    return {
      id: uuidv4(),
      streamId,
      userId,
      username,
      type: MessageType.SYSTEM,
      content: `📢 ANUNCIO: ${content}`,
      timestamp: new Date()
    };
  }
}

/**
 * Otro ejemplo: Mensajes privados/susurros
 */
export class WhisperMessageStrategy implements IMessageStrategy<IChatMessage> {
  create(
    streamId: string,
    userId: string,
    username: string,
    content: string,
    targetUser?: string
  ): IChatMessage {
    const target = targetUser || 'unknown';
    return {
      id: uuidv4(),
      streamId,
      userId,
      username,
      type: MessageType.CHAT,
      content: `🔒 [Privado a ${target}] ${content}`,
      timestamp: new Date()
    };
  }
}

/**
 * Otro ejemplo: Mensajes destacados/pinned
 */
export class HighlightedMessageStrategy implements IMessageStrategy<IChatMessage> {
  create(
    streamId: string,
    userId: string,
    username: string,
    content: string
  ): IChatMessage {
    return {
      id: uuidv4(),
      streamId,
      userId,
      username,
      type: MessageType.CHAT,
      content: `⭐ ${content} ⭐`,
      timestamp: new Date()
    };
  }
}
