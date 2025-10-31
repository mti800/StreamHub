/**
 * Factory simple para creación de Streams
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { IStream, IStreamConfig, StreamStatus } from '../shared/types';

export class StreamFactory {
  /**
   * Crea un nuevo stream con la configuración básica
   */
  static create(streamerId: string): IStream {
    if (!streamerId) {
      throw new Error('StreamFactory: streamerId is required');
    }

    return {
      id: uuidv4(),
      streamerId,
      streamKey: this.generateStreamKey(),
      status: StreamStatus.WAITING,
      createdAt: new Date(),
      viewerCount: 0
    };
  }

  /**
   * Crea un stream desde una configuración
   */
  static fromConfig(config: IStreamConfig): IStream {
    return this.create(config.streamerId);
  }

  /**
   * Genera una stream key única y segura
   */
  private static generateStreamKey(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
