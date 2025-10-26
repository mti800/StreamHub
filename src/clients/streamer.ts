/**
 * Streamer Client: Cliente que transmite el stream
 */

import { io, Socket } from 'socket.io-client';
import * as readline from 'readline';
import { Events } from '../shared/events';
import { IStream, IUser, UserRole } from '../shared/types';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

class StreamerClient {
  private socket: Socket;
  private user: IUser | null = null;
  private stream: IStream | null = null;
  private rl: readline.Interface;
  private isStreaming: boolean = false;

  constructor() {
    this.socket = io(SERVER_URL);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.setupSocketListeners();
  }

  /**
   * Configura los listeners de Socket.IO
   */
  private setupSocketListeners(): void {
    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor');
      this.promptUsername();
    });

    this.socket.on(Events.USER_REGISTERED, (data: { user: IUser }) => {
      this.user = data.user;
      console.log(`✅ Registrado como: ${this.user.username} (STREAMER)`);
      this.promptCreateStream();
    });

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
      this.isStreaming = true;
      console.log('\n🎬 ¡Stream iniciado! Estás transmitiendo en vivo');
      this.showStreamMenu();
    });

    this.socket.on(Events.STREAM_ENDED, () => {
      this.isStreaming = false;
      console.log('\n🛑 Stream finalizado');
      this.promptRestart();
    });

    this.socket.on(Events.VIEWER_JOINED, (data: { username: string; viewerCount: number }) => {
      console.log(`\n👤 ${data.username} se unió al stream`);
      console.log(`📊 Viewers actuales: ${data.viewerCount}`);
      this.showPrompt();
    });

    this.socket.on(Events.VIEWER_COUNT_UPDATE, (data: { viewerCount: number }) => {
      if (this.isStreaming) {
        console.log(`📊 Viewers actuales: ${data.viewerCount}`);
      }
    });

    this.socket.on(Events.CHAT_MESSAGE_BROADCAST, (data: { message: any }) => {
      const msg = data.message;
      if (msg.userId !== this.user?.id) {
        console.log(`\n💬 [${msg.username}]: ${msg.content}`);
        this.showPrompt();
      }
    });

    this.socket.on(Events.REACTION_BROADCAST, (data: { reaction: any }) => {
      const reaction = data.reaction;
      if (reaction.userId !== this.user?.id) {
        console.log(`\n${reaction.emoji} ${reaction.username}`);
        this.showPrompt();
      }
    });

    this.socket.on(Events.STREAM_ERROR, (data: { message: string }) => {
      console.error(`\n❌ Error: ${data.message}`);
      this.showPrompt();
    });

    this.socket.on('disconnect', () => {
      console.log('\n❌ Desconectado del servidor');
      process.exit(0);
    });

    // WebRTC Signaling (simplificado para demo)
    this.socket.on(Events.WEBRTC_OFFER, (data: any) => {
      console.log(`\n📡 Recibida señal WebRTC de ${data.from}`);
      // En una implementación real, aquí se manejaría la conexión WebRTC
    });
  }

  /**
   * Solicita el nombre de usuario
   */
  private promptUsername(): void {
    this.rl.question('\n👤 Ingresa tu nombre de usuario: ', (username: string) => {
      if (username.trim()) {
        this.socket.emit(Events.USER_REGISTER, {
          username: username.trim(),
          role: UserRole.STREAMER
        });
      } else {
        console.log('❌ El nombre de usuario no puede estar vacío');
        this.promptUsername();
      }
    });
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
   * Muestra el prompt y procesa comandos
   */
  private showPrompt(): void {
    if (!this.isStreaming) return;

    this.rl.question('> ', (input: string) => {
      this.handleCommand(input.trim());
    });
  }

  /**
   * Maneja los comandos del streamer
   */
  private handleCommand(input: string): void {
    if (!input) {
      this.showPrompt();
      return;
    }

    if (input.startsWith('/chat ')) {
      const message = input.substring(6);
      if (message && this.stream) {
        this.socket.emit(Events.CHAT_MESSAGE_SEND, {
          streamKey: this.stream.streamKey,
          content: message
        });
        console.log(`💬 Tú: ${message}`);
      }
    } else if (input === '/end') {
      this.endStream();
      return;
    } else if (input === '/viewers') {
      console.log(`📊 Viewers actuales: ${this.stream?.viewerCount || 0}`);
    } else {
      console.log('❌ Comando no reconocido. Usa /chat, /end o /viewers');
    }

    this.showPrompt();
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

  /**
   * Pregunta si desea reiniciar
   */
  private promptRestart(): void {
    this.rl.question('\n¿Crear otro stream? (s/n): ', (answer: string) => {
      if (answer.toLowerCase() === 's') {
        this.stream = null;
        this.socket.emit(Events.STREAM_CREATE);
      } else {
        console.log('👋 ¡Hasta luego!');
        process.exit(0);
      }
    });
  }

  /**
   * Inicia el cliente
   */
  start(): void {
    console.log('╔════════════════════════════════════════╗');
    console.log('║      STREAMER CLIENT - INICIADO       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`🔗 Conectando a ${SERVER_URL}...\n`);
  }
}

// Iniciar cliente streamer
const client = new StreamerClient();
client.start();

export default StreamerClient;
