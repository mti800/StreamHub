/**
 * Patrón Factory + Strategy: Creación de mensajes y eventos
 */

import { IChatMessage, IReaction } from '../shared/types';
import {
  ChatMessageStrategy,
  SystemMessageStrategy,
  ReactionMessageStrategy,
  IMessageStrategy
} from './MessageStrategies';

export class MessageFactory {
  private static chatStrategy: IMessageStrategy<IChatMessage> = new ChatMessageStrategy();
  private static systemStrategy: IMessageStrategy<IChatMessage> = new SystemMessageStrategy();
  private static reactionStrategy: IMessageStrategy<IReaction> = new ReactionMessageStrategy();

  /**
   * Crea un mensaje de chat
   */
  static createChatMessage(
    streamId: string,
    userId: string,
    username: string,
    content: string
  ): IChatMessage {
    return this.chatStrategy.create(streamId, userId, username, content);
  }

  /**
   * Crea un mensaje del sistema
   */
  static createSystemMessage(
    streamId: string,
    content: string
  ): IChatMessage {
    return this.systemStrategy.create(streamId, content);
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
    return this.reactionStrategy.create(streamId, userId, username, emoji);
  }

  /**
   * Permite cambiar la estrategia de mensajes de chat
   */
  static setChatStrategy(strategy: IMessageStrategy<IChatMessage>): void {
    this.chatStrategy = strategy;
  }

  /**
   * Permite cambiar la estrategia de mensajes del sistema
   */
  static setSystemStrategy(strategy: IMessageStrategy<IChatMessage>): void {
    this.systemStrategy = strategy;
  }

  /**
   * Permite cambiar la estrategia de reacciones
   */
  static setReactionStrategy(strategy: IMessageStrategy<IReaction>): void {
    this.reactionStrategy = strategy;
  }
}
