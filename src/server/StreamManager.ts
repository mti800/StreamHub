/**
 * StreamManager: Gestiona los streams activos
 */

import { IStream, StreamStatus, IStreamConfig } from '../shared/types';
import { StreamFactory } from '../factories/StreamFactory';

export class StreamManager {
  private streams: Map<string, IStream>;
  private streamKeyToId: Map<string, string>;
  private streamerToStream: Map<string, string>;

  constructor() {
    this.streams = new Map();
    this.streamKeyToId = new Map();
    this.streamerToStream = new Map();
  }

  /**
   * Crea un nuevo stream
   */
  createStream(config: IStreamConfig): IStream {
    // Verificar si el streamer ya tiene un stream activo
    const existingStreamId = this.streamerToStream.get(config.streamerId);
    if (existingStreamId) {
      const existingStream = this.streams.get(existingStreamId);
      if (existingStream && existingStream.status !== StreamStatus.ENDED) {
        throw new Error('El streamer ya tiene un stream activo');
      }
    }

    const stream = StreamFactory.fromConfig(config);
    
    this.streams.set(stream.id, stream);
    this.streamKeyToId.set(stream.streamKey, stream.id);
    this.streamerToStream.set(config.streamerId, stream.id);

    return stream;
  }

  /**
   * Obtiene un stream por su ID
   */
  getStream(streamId: string): IStream | undefined {
    return this.streams.get(streamId);
  }

  /**
   * Obtiene un stream por su stream key
   */
  getStreamByKey(streamKey: string): IStream | undefined {
    const streamId = this.streamKeyToId.get(streamKey);
    return streamId ? this.streams.get(streamId) : undefined;
  }

  /**
   * Obtiene el stream de un streamer
   */
  getStreamByStreamer(streamerId: string): IStream | undefined {
    const streamId = this.streamerToStream.get(streamerId);
    return streamId ? this.streams.get(streamId) : undefined;
  }

  /**
   * Inicia un stream
   */
  startStream(streamKey: string): IStream | undefined {
    const stream = this.getStreamByKey(streamKey);
    if (!stream) return undefined;

    const updatedStream = {
      ...stream,
      status: StreamStatus.ACTIVE,
      startedAt: new Date()
    };

    this.streams.set(stream.id, updatedStream);
    return updatedStream;
  }

  /**
   * Finaliza un stream
   */
  endStream(streamKey: string): IStream | undefined {
    const stream = this.getStreamByKey(streamKey);
    if (!stream) return undefined;

    const updatedStream = { ...stream };
    updatedStream.status = StreamStatus.ENDED;
    updatedStream.endedAt = new Date();

    this.streams.set(stream.id, updatedStream);
    return updatedStream;
  }

  /**
   * Incrementa el contador de viewers
   */
  addViewer(streamKey: string): number {
    const stream = this.getStreamByKey(streamKey);
    if (!stream) return 0;

    stream.viewerCount++;
    return stream.viewerCount;
  }

  /**
   * Decrementa el contador de viewers
   */
  removeViewer(streamKey: string): number {
    const stream = this.getStreamByKey(streamKey);
    if (!stream) return 0;

    stream.viewerCount = Math.max(stream.viewerCount - 1, 0);
    return stream.viewerCount;
  }

  /**
   * Obtiene todos los streams activos
   */
  getActiveStreams(): IStream[] {
    return Array.from(this.streams.values())
      .filter(stream => stream.status === StreamStatus.ACTIVE);
  }

  /**
   * Limpia streams finalizados antiguos
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    this.streams.forEach((stream, id) => {
      if (stream.status === StreamStatus.ENDED && stream.endedAt && stream.endedAt < cutoffTime) {
        this.streams.delete(id);
        this.streamKeyToId.delete(stream.streamKey);
        this.streamerToStream.delete(stream.streamerId);
      }
    });
  }
}
