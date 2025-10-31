/**
 * Ejemplo de uso del StreamDistributor con Multicast
 * Este archivo demuestra cómo usar el sistema multicast en la práctica
 */

import { Server } from 'socket.io';
import { StreamDistributor } from '../server/StreamDistributor';

// Simular uso del StreamDistributor
export function multicastExample(io: Server) {
  const distributor = new StreamDistributor(io);

  // 1. Streamer crea un stream
  const streamKey = 'demo-stream-abc123';
  distributor.registerStream(streamKey);
  console.log(`✅ Stream registrado: ${streamKey}`);

  // 2. Viewers se unen al stream
  const viewer1 = 'viewer-socket-1';
  const viewer2 = 'viewer-socket-2';
  const viewer3 = 'viewer-socket-3';

  distributor.addViewer(streamKey, viewer1);
  distributor.addViewer(streamKey, viewer2);
  distributor.addViewer(streamKey, viewer3);
  console.log(`✅ 3 viewers añadidos`);

  // 3. Streamer envía datos
  // En lugar de enviar a cada viewer individualmente (P2P):
  // ❌ io.to(viewer1).emit(...)
  // ❌ io.to(viewer2).emit(...)
  // ❌ io.to(viewer3).emit(...)
  
  // Ahora enviamos UNA SOLA VEZ y llega a TODOS (Multicast):
  const frameData = 'base64-encoded-video-frame-data...';
  const viewersReached = distributor.distributeStreamData(
    streamKey,
    frameData,
    'streamer-user-id'
  );
  console.log(`✅ Frame distribuido a ${viewersReached} viewers`);

  // 4. Obtener estadísticas
  const stats = distributor.getStreamStats(streamKey);
  console.log(`📊 Estadísticas:`, stats);
  // Output: { viewerCount: 3, bufferSize: 1 }

  // 5. Viewer se desconecta
  distributor.removeViewer(streamKey, viewer2);
  console.log(`✅ Viewer removido`);

  // 6. Stream finaliza
  distributor.unregisterStream(streamKey);
  console.log(`✅ Stream desregistrado`);
}

/**
 * Ejemplo de implementación en un controlador de Socket.IO
 */
export class StreamController {
  constructor(
    private io: Server,
    private distributor: StreamDistributor
  ) {}

  /**
   * Maneja cuando el streamer envía un frame
   */
  handleStreamerFrame(socket: any, data: { streamKey: string; frameData: string }) {
    // Validar que el usuario es el dueño del stream
    // ... validaciones ...

    // Distribuir el frame a TODOS los viewers (multicast)
    const viewerCount = this.distributor.distributeStreamData(
      data.streamKey,
      data.frameData,
      socket.id
    );

    // Opcional: Responder al streamer con confirmación
    socket.emit('stream:frame:sent', {
      success: true,
      viewersReached: viewerCount
    });
  }

  /**
   * Maneja cuando un viewer se une
   */
  handleViewerJoin(socket: any, streamKey: string) {
    // Añadir viewer al distributor
    const success = this.distributor.addViewer(streamKey, socket.id);

    if (success) {
      // El viewer recibirá automáticamente:
      // 1. Los últimos 30 frames del buffer (catchup)
      // 2. Nuevos frames en tiempo real (multicast)
      
      socket.emit('stream:joined', {
        success: true,
        message: 'Unido al stream'
      });
    } else {
      socket.emit('stream:error', {
        message: 'Stream no encontrado'
      });
    }
  }
}

/**
 * Comparación de Ancho de Banda
 */
export function bandwidthComparison() {
  console.log('\n📊 COMPARACIÓN DE ANCHO DE BANDA\n');
  
  const frameSize = 50; // KB por frame
  const fps = 30;
  const viewers = [1, 5, 10, 50, 100];

  console.log('WebRTC P2P (Anterior):');
  viewers.forEach(n => {
    const bandwidth = frameSize * fps * n; // KB/s
    const mbps = (bandwidth * 8 / 1024).toFixed(2); // Mbps
    console.log(`  ${n} viewers: ${mbps} Mbps upload needed`);
  });

  console.log('\nMulticast (Nuevo):');
  viewers.forEach(n => {
    const bandwidth = frameSize * fps; // KB/s (constante!)
    const mbps = (bandwidth * 8 / 1024).toFixed(2); // Mbps
    console.log(`  ${n} viewers: ${mbps} Mbps upload needed ✅`);
  });

  console.log('\n💡 Con multicast, el ancho de banda del streamer es CONSTANTE!\n');
}

// Ejecutar ejemplo de comparación
if (require.main === module) {
  bandwidthComparison();
}

/**
 * Output esperado:
 * 
 * 📊 COMPARACIÓN DE ANCHO DE BANDA
 * 
 * WebRTC P2P (Anterior):
 *   1 viewers: 11.72 Mbps upload needed
 *   5 viewers: 58.59 Mbps upload needed ❌
 *   10 viewers: 117.19 Mbps upload needed ❌
 *   50 viewers: 585.94 Mbps upload needed ❌
 *   100 viewers: 1171.88 Mbps upload needed ❌
 * 
 * Multicast (Nuevo):
 *   1 viewers: 11.72 Mbps upload needed ✅
 *   5 viewers: 11.72 Mbps upload needed ✅
 *   10 viewers: 11.72 Mbps upload needed ✅
 *   50 viewers: 11.72 Mbps upload needed ✅
 *   100 viewers: 11.72 Mbps upload needed ✅
 * 
 * 💡 Con multicast, el ancho de banda del streamer es CONSTANTE!
 */
