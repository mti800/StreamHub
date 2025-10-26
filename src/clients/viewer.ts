/**
 * Viewer Client: Cliente que consume el stream
 */

import { io, Socket } from 'socket.io-client';
import * as readline from 'readline';
import { Events } from '../shared/events';
import { IStream, IUser, UserRole } from '../shared/types';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

class ViewerClient {
  private socket: Socket;
  private user: IUser | null = null;
  private stream: IStream | null = null;
  private rl: readline.Interface;
  private isWatching: boolean = false;

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
      console.log(`✅ Registrado como: ${this.user.username} (VIEWER)`);
      this.promptStreamKey();
    });

    this.socket.on(Events.STREAM_JOINED, (data: { stream: IStream }) => {
      this.stream = data.stream;
      this.isWatching = true;
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
      this.isWatching = false;
      console.log('\n🛑 Stream finalizado');
      if (data.reason) {
        console.log(`   Razón: ${data.reason}`);
      }
      this.promptRestart();
    });

    this.socket.on(Events.VIEWER_JOINED, (data: { username: string; viewerCount: number }) => {
      if (data.username !== this.user?.username) {
        console.log(`\n👤 ${data.username} se unió al stream`);
        this.showPrompt();
      }
    });

    this.socket.on(Events.VIEWER_COUNT_UPDATE, (data: { viewerCount: number }) => {
      if (this.isWatching) {
        console.log(`👥 Viewers actuales: ${data.viewerCount}`);
      }
    });

    this.socket.on(Events.CHAT_MESSAGE_BROADCAST, (data: { message: any }) => {
      const msg = data.message;
      const prefix = msg.type === 'SYSTEM' ? '📢' : '💬';
      const displayName = msg.type === 'SYSTEM' ? msg.content : `[${msg.username}]: ${msg.content}`;
      console.log(`\n${prefix} ${displayName}`);
      this.showPrompt();
    });

    this.socket.on(Events.REACTION_BROADCAST, (data: { reaction: any }) => {
      const reaction = data.reaction;
      console.log(`\n${reaction.emoji} ${reaction.username}`);
      this.showPrompt();
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
    this.socket.on(Events.WEBRTC_ANSWER, (data: any) => {
      console.log(`\n📡 Recibida respuesta WebRTC del streamer`);
      // En una implementación real, aquí se establecería la conexión WebRTC
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
          role: UserRole.VIEWER
        });
      } else {
        console.log('❌ El nombre de usuario no puede estar vacío');
        this.promptUsername();
      }
    });
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
   * Muestra el prompt y procesa comandos
   */
  private showPrompt(): void {
    if (!this.isWatching) return;

    this.rl.question('> ', (input: string) => {
      this.handleCommand(input.trim());
    });
  }

  /**
   * Maneja los comandos del viewer
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
    } else if (input.startsWith('/react ')) {
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
      return;
    } else if (input === '/viewers') {
      console.log(`👥 Viewers actuales: ${this.stream?.viewerCount || 0}`);
    } else {
      console.log('❌ Comando no reconocido. Usa /chat, /react, /leave o /viewers');
    }

    this.showPrompt();
  }

  /**
   * Sale del stream
   */
  private leaveStream(): void {
    this.isWatching = false;
    this.socket.disconnect();
    console.log('\n👋 Has salido del stream');
    process.exit(0);
  }

  /**
   * Pregunta si desea reiniciar
   */
  private promptRestart(): void {
    this.rl.question('\n¿Ver otro stream? (s/n): ', (answer: string) => {
      if (answer.toLowerCase() === 's') {
        this.stream = null;
        this.promptStreamKey();
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
    console.log('║       VIEWER CLIENT - INICIADO        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`🔗 Conectando a ${SERVER_URL}...\n`);
  }
}

// Iniciar cliente viewer
const client = new ViewerClient();
client.start();

export default ViewerClient;
