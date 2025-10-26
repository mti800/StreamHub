/**
 * Patrón Factory: Creación de mensajes y eventos
 */

import { v4 as uuidv4 } from 'uuid';
import { IChatMessage, IReaction, MessageType } from '../shared/types';

export class MessageFactory {
  /**
   * Crea un mensaje de chat
   */
  static createChatMessage(
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

  /**
   * Crea un mensaje del sistema
   */
  static createSystemMessage(
    streamId: string,
    content: string
  ): IChatMessage {
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

  /**
   * Crea una reacción
   */
  static createReaction(
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
