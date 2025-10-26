/**
 * Patrón Builder: Construcción de Streams
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { IStream, IStreamConfig, StreamStatus } from '../shared/types';

export class StreamBuilder {
  private stream: Partial<IStream>;

  constructor() {
    this.stream = {
      id: uuidv4(),
      streamKey: this.generateStreamKey(),
      status: StreamStatus.WAITING,
      createdAt: new Date(),
      viewerCount: 0
    };
  }

  /**
   * Genera una stream key única y segura
   */
  private generateStreamKey(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Establece el ID del streamer
   */
  withStreamer(streamerId: string): this {
    this.stream.streamerId = streamerId;
    return this;
  }

  /**
   * Establece el estado del stream
   */
  withStatus(status: StreamStatus): this {
    this.stream.status = status;
    return this;
  }

  /**
   * Marca el stream como iniciado
   */
  markAsStarted(): this {
    this.stream.status = StreamStatus.ACTIVE;
    this.stream.startedAt = new Date();
    return this;
  }

  /**
   * Marca el stream como finalizado
   */
  markAsEnded(): this {
    this.stream.status = StreamStatus.ENDED;
    this.stream.endedAt = new Date();
    return this;
  }

  /**
   * Incrementa el contador de viewers
   */
  incrementViewers(): this {
    this.stream.viewerCount = (this.stream.viewerCount || 0) + 1;
    return this;
  }

  /**
   * Decrementa el contador de viewers
   */
  decrementViewers(): this {
    this.stream.viewerCount = Math.max((this.stream.viewerCount || 0) - 1, 0);
    return this;
  }

  /**
   * Construye el objeto Stream final
   */
  build(): IStream {
    if (!this.stream.streamerId) {
      throw new Error('StreamBuilder: streamerId is required');
    }

    return this.stream as IStream;
  }

  /**
   * Método estático para crear un stream desde una configuración
   */
  static fromConfig(config: IStreamConfig): IStream {
    return new StreamBuilder()
      .withStreamer(config.streamerId)
      .build();
  }
}
