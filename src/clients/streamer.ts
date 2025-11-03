/**
 * Streamer Client: Cliente que transmite el stream
 */

import { BaseClient } from './BaseClient';
import { Events } from '../shared/events';
import { IStream, UserRole } from '../shared/types';

class StreamerClient extends BaseClient {
  /**
   * Configura los listeners específicos del streamer
   */
  protected setupSpecificListeners(): void {
    this.socket.on(Events.STREAM_CREATED, (data: { stream: IStream }) => {
      this.stream = data.stream;
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║        STREAM CREADO CON ÉXITO        ║');
      console.log('╚════════════════════════════════════════╝');
      console.log(`📺 Stream ID: ${this.stream.id}`);
      console.log(`🔑 Stream Key: ${this.stream.streamKey}`);
      console.log('\n⚠️  IMPORTANTE: Comparte esta Stream Key con tus viewers');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      this.promptStartStream();
    });

    this.socket.on(Events.STREAM_STARTED, (data: { stream: IStream }) => {
      this.isActive = true;
      console.log('\n🎬 ¡Stream iniciado! Estás transmitiendo en vivo');
      this.showStreamMenu();
    });

    this.socket.on(Events.STREAM_ENDED, () => {
      this.isActive = false;
      console.log('\n🛑 Stream finalizado');
      this.promptRestart('¿Crear otro stream?', () => {
        this.socket.emit(Events.STREAM_CREATE);
      });
    });

    this.socket.on(Events.VIEWER_JOINED, (data: { username: string; viewerCount: number }) => {
      console.log(`\n� ${data.username} se unió al stream`);
      console.log(`📊 Viewers actuales: ${data.viewerCount}`);
      this.showPrompt();
    });

    // WebRTC Signaling (simplificado para demo)
    this.socket.on(Events.WEBRTC_OFFER, (data: any) => {
      console.log(`\n📡 Recibida señal WebRTC de ${data.from}`);
      // En una implementación real, aquí se manejaría la conexión WebRTC
    });
  }

  /**
   * Callback después del registro de usuario
   */
  protected onUserRegistered(): void {
    this.promptCreateStream();
  }

  /**
   * Retorna el rol del usuario
   */
  protected getUserRole(): UserRole {
    return UserRole.STREAMER;
  }

  /**
   * Retorna el nombre del cliente
   */
  protected getClientName(): string {
    return '     STREAMER CLIENT     ';
  }

  /**
   * Solicita crear un stream
   */
  private promptCreateStream(): void {
    this.rl.question('\n📺 ¿Crear un nuevo stream? (s/n): ', (answer: string) => {
      if (answer.toLowerCase() === 's') {
        this.socket.emit(Events.STREAM_CREATE);
      } else {
        console.log('👋 ¡Hasta luego!');
        process.exit(0);
      }
    });
  }

  /**
   * Solicita iniciar el stream
   */
  private promptStartStream(): void {
    this.rl.question('\n🎬 ¿Iniciar transmisión? (s/n): ', (answer: string) => {
      if (answer.toLowerCase() === 's' && this.stream) {
        this.socket.emit(Events.STREAM_START, {
          streamKey: this.stream.streamKey
        });
      } else {
        console.log('Esperando para iniciar...');
        setTimeout(() => this.promptStartStream(), 1000);
      }
    });
  }

  /**
   * Muestra el menú del stream activo
   */
  private showStreamMenu(): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Comandos disponibles:');
    console.log('  /chat <mensaje>  - Enviar mensaje al chat');
    console.log('  /end             - Finalizar stream');
    console.log('  /viewers         - Ver número de viewers');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    this.showPrompt();
  }

  /**
   * Maneja comandos específicos del streamer
   */
  protected handleSpecificCommand(input: string): void {
    if (input === '/end') {
      this.endStream();
    } else {
      console.log('❌ Comando no reconocido. Usa /chat, /end o /viewers');
    }
  }

  /**
   * Finaliza el stream
   */
  private endStream(): void {
    if (this.stream) {
      this.socket.emit(Events.STREAM_END, {
        streamKey: this.stream.streamKey
      });
      console.log('\n🛑 Finalizando stream...');
    }
  }
}

// Iniciar cliente streamer
const client = new StreamerClient();
client.start();

export default StreamerClient;
