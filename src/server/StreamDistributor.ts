/**
 * StreamDistributor: Distribuye datos de streaming usando multicast
 * Patrón: Singleton + Observer
 */

import { Server } from 'socket.io';
import { Events } from '../shared/events';

export interface IStreamData {
  streamKey: string;
  data: string; // Base64 encoded media data
  timestamp: number;
}

export class StreamDistributor {
  private activeStreams: Map<string, Set<string>>; // streamKey -> Set<socketId>
  private streamBuffers: Map<string, IStreamData[]>; // Buffer para late joiners
  private readonly BUFFER_SIZE = 30; // Últimos 30 frames

  constructor(private io: Server) {
    this.activeStreams = new Map();
    this.streamBuffers = new Map();
  }

  /**
   * Registra un stream para distribución multicast
   */
  registerStream(streamKey: string): void {
    if (!this.activeStreams.has(streamKey)) {
      this.activeStreams.set(streamKey, new Set());
      this.streamBuffers.set(streamKey, []);
      console.log(`[StreamDistributor] Stream registrado: ${streamKey}`);
    }
  }

  /**
   * Desregistra un stream
   */
  unregisterStream(streamKey: string): void {
    this.activeStreams.delete(streamKey);
    this.streamBuffers.delete(streamKey);
    console.log(`[StreamDistributor] Stream desregistrado: ${streamKey}`);
  }

  /**
   * Viewer se une a un stream
   */
  addViewer(streamKey: string, viewerId: string): boolean {
    const viewers = this.activeStreams.get(streamKey);
    
    if (!viewers) {
      console.error(`[StreamDistributor] Stream no encontrado: ${streamKey}`);
      return false;
    }

    viewers.add(viewerId);
    console.log(`[StreamDistributor] Viewer ${viewerId} añadido a ${streamKey} (Total: ${viewers.size})`);

    // Enviar buffer de frames recientes al nuevo viewer
    this.sendBufferToViewer(streamKey, viewerId);

    return true;
  }

  /**
   * Viewer abandona un stream
   */
  removeViewer(streamKey: string, viewerId: string): boolean {
    const viewers = this.activeStreams.get(streamKey);
    
    if (!viewers) {
      return false;
    }

    const removed = viewers.delete(viewerId);
    if (removed) {
      console.log(`[StreamDistributor] Viewer ${viewerId} removido de ${streamKey} (Quedan: ${viewers.size})`);
    }

    return removed;
  }

  /**
   * Distribuye datos de stream a todos los viewers (MULTICAST)
   */
  distributeStreamData(streamKey: string, data: string, streamerId: string): number {
    const viewers = this.activeStreams.get(streamKey);

    if (!viewers || viewers.size === 0) {
      return 0;
    }

    const streamData: IStreamData = {
      streamKey,
      data,
      timestamp: Date.now()
    };

    // Guardar en buffer circular
    this.addToBuffer(streamKey, streamData);

    // Multicast: Enviar a TODOS los viewers simultáneamente
    // Socket.IO optimiza esto internamente usando rooms
    this.io.to(`stream:${streamKey}`).emit(Events.STREAM_DATA, streamData);

    return viewers.size;
  }

  /**
   * Añade datos al buffer circular
   */
  private addToBuffer(streamKey: string, data: IStreamData): void {
    const buffer = this.streamBuffers.get(streamKey);
    
    if (!buffer) {
      return;
    }

    buffer.push(data);

    // Mantener solo los últimos N frames
    if (buffer.length > this.BUFFER_SIZE) {
      buffer.shift();
    }
  }

  /**
   * Envía el buffer de frames recientes a un viewer que acaba de unirse
   */
  private sendBufferToViewer(streamKey: string, viewerId: string): void {
    const buffer = this.streamBuffers.get(streamKey);
    
    if (!buffer || buffer.length === 0) {
      return;
    }

    // Enviar frames en buffer al nuevo viewer
    this.io.to(viewerId).emit(Events.STREAM_BUFFER, {
      streamKey,
      frames: buffer
    });

    console.log(`[StreamDistributor] Enviados ${buffer.length} frames del buffer a ${viewerId}`);
  }

  /**
   * Obtiene el número de viewers de un stream
   */
  getViewerCount(streamKey: string): number {
    return this.activeStreams.get(streamKey)?.size || 0;
  }

  /**
   * Obtiene las estadísticas de un stream
   */
  getStreamStats(streamKey: string): { viewerCount: number; bufferSize: number } | null {
    const viewers = this.activeStreams.get(streamKey);
    const buffer = this.streamBuffers.get(streamKey);

    if (!viewers) {
      return null;
    }

    return {
      viewerCount: viewers.size,
      bufferSize: buffer?.length || 0
    };
  }

  /**
   * Obtiene todos los streams activos
   */
  getActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys());
  }

  /**
   * Limpia streams sin viewers
   */
  cleanupEmptyStreams(): number {
    let cleaned = 0;

    this.activeStreams.forEach((viewers, streamKey) => {
      if (viewers.size === 0) {
        this.unregisterStream(streamKey);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`[StreamDistributor] Limpiados ${cleaned} streams vacíos`);
    }

    return cleaned;
  }
}
