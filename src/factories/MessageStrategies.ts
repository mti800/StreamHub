/**
 * Message Strategies: Estrategias de creación de mensajes
 * Consolidado desde src/strategies/
 */

import { v4 as uuidv4 } from 'uuid';
import { IChatMessage, IReaction, MessageType } from '../shared/types';

/**
 * Interface para estrategias de creación de mensajes
 */
export interface IMessageStrategy<T> {
  create(...args: any[]): T;
}

/**
 * Estrategia para crear mensajes de chat
 */
export class ChatMessageStrategy implements IMessageStrategy<IChatMessage> {
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
      content,
      timestamp: new Date()
    };
  }
}

/**
 * Estrategia para crear mensajes del sistema
 */
export class SystemMessageStrategy implements IMessageStrategy<IChatMessage> {
  create(streamId: string, content: string): IChatMessage {
    return {
      id: uuidv4(),
      streamId,
      userId: 'system',
      username: 'Sistema',
      type: MessageType.SYSTEM,
      content,
      timestamp: new Date()
    };
  }
}

/**
 * Estrategia para crear reacciones
 */
export class ReactionMessageStrategy implements IMessageStrategy<IReaction> {
  create(
    streamId: string,
    userId: string,
    username: string,
    emoji: string
  ): IReaction {
    return {
      id: uuidv4(),
      streamId,
      userId,
      username,
      emoji,
      timestamp: new Date()
    };
  }
}

// ============================================================================
// ESTRATEGIAS DE EJEMPLO (para demostración del patrón Strategy)
// ============================================================================

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
