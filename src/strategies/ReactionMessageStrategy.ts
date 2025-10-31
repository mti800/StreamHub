import { v4 as uuidv4 } from 'uuid';
import { IReaction } from '../shared/types';
import { IMessageStrategy } from './IMessageStrategy';

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
