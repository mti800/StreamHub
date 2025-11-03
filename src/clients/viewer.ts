/**
 * Viewer Client: Cliente que consume el stream
 */

import { BaseClient } from './BaseClient';
import { Events } from '../shared/events';
import { IStream, UserRole } from '../shared/types';

class ViewerClient extends BaseClient {
  /**
   * Configura los listeners específicos del viewer
   */
  protected setupSpecificListeners(): void {
    this.socket.on(Events.STREAM_JOINED, (data: { stream: IStream }) => {
      this.stream = data.stream;
      this.isActive = true;
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║     CONECTADO AL STREAM CON ÉXITO     ║');
      console.log('╚════════════════════════════════════════╝');
      console.log(`📺 Stream ID: ${this.stream.id}`);
      console.log(`👥 Viewers: ${this.stream.viewerCount}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🎬 Estás viendo el stream en vivo\n');
      this.showViewerMenu();
    });

    this.socket.on(Events.STREAM_STARTED, (data: { stream: IStream }) => {
      console.log('\n🎬 ¡El stream ha comenzado!');
      this.showPrompt();
    });

    this.socket.on(Events.STREAM_ENDED, (data: any) => {
      this.isActive = false;
      console.log('\n🛑 Stream finalizado');
      if (data.reason) {
        console.log(`   Razón: ${data.reason}`);
      }
      this.promptRestart('¿Ver otro stream?', () => this.promptStreamKey());
    });

    this.socket.on(Events.VIEWER_JOINED, (data: { username: string; viewerCount: number }) => {
      if (data.username !== this.user?.username) {
        console.log(`\n👤 ${data.username} se unió al stream`);
        this.showPrompt();
      }
    });

    // WebRTC Signaling (simplificado para demo)
    this.socket.on(Events.WEBRTC_ANSWER, (data: any) => {
      console.log(`\n📡 Recibida respuesta WebRTC del streamer`);
      // En una implementación real, aquí se establecería la conexión WebRTC
    });
  }

  /**
   * Callback después del registro de usuario
   */
  protected onUserRegistered(): void {
    this.promptStreamKey();
  }

  /**
   * Retorna el rol del usuario
   */
  protected getUserRole(): UserRole {
    return UserRole.VIEWER;
  }

  /**
   * Retorna el nombre del cliente
   */
  protected getClientName(): string {
    return '      VIEWER CLIENT      ';
  }

  /**
   * Solicita la stream key para unirse
   */
  private promptStreamKey(): void {
    this.rl.question('\n🔑 Ingresa la Stream Key para unirte: ', (streamKey: string) => {
      if (streamKey.trim()) {
        this.socket.emit(Events.STREAM_JOIN, {
          streamKey: streamKey.trim()
        });
      } else {
        console.log('❌ La Stream Key no puede estar vacía');
        this.promptStreamKey();
      }
    });
  }

  /**
   * Muestra el menú del viewer
   */
  private showViewerMenu(): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Comandos disponibles:');
    console.log('  /chat <mensaje>  - Enviar mensaje al chat');
    console.log('  /react <emoji>   - Enviar reacción (ej: 👍 ❤️ 😂)');
    console.log('  /leave           - Salir del stream');
    console.log('  /viewers         - Ver número de viewers');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    this.showPrompt();
  }

  /**
   * Maneja comandos específicos del viewer
   */
  protected handleSpecificCommand(input: string): void {
    if (input.startsWith('/react ')) {
      const emoji = input.substring(7);
      if (emoji && this.stream) {
        this.socket.emit(Events.REACTION_SEND, {
          streamKey: this.stream.streamKey,
          emoji: emoji
        });
        console.log(`${emoji} Reacción enviada`);
      }
    } else if (input === '/leave') {
      this.leaveStream();
    } else {
      console.log('❌ Comando no reconocido. Usa /chat, /react, /leave o /viewers');
    }
  }

  /**
   * Sale del stream
   */
  private leaveStream(): void {
    this.isActive = false;
    this.socket.disconnect();
    console.log('\n👋 Has salido del stream');
    process.exit(0);
  }
}

// Iniciar cliente viewer
const client = new ViewerClient();
client.start();

export default ViewerClient;
