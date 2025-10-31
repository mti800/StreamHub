import { v4 as uuidv4 } from 'uuid';
import { IChatMessage, MessageType } from '../shared/types';
import { IMessageStrategy } from './IMessageStrategy';

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
