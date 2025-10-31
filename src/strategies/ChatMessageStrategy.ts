import { v4 as uuidv4 } from 'uuid';
import { IChatMessage, MessageType } from '../shared/types';
import { IMessageStrategy } from './IMessageStrategy';

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
