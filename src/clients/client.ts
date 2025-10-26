/**
 * Cliente Unificado: Puede ser Streamer o Viewer
 */

import { io, Socket } from 'socket.io-client';
import * as readline from 'readline';
import { Events } from '../shared/events';
import { IStream, IUser, UserRole } from '../shared/types';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

class StreamHubClient {
  private socket: Socket;
  private user: IUser | null = null;
  private stream: IStream | null = null;
  private rl: readline.Interface;
  private isActive: boolean = false;
  private role: UserRole | null = null;

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
      this.promptRole();
    });

    this.socket.on(Events.USER_REGISTERED, (data: { user: IUser }) => {
      this.user = data.user;
      console.log(`✅ Registrado como: ${this.user.username} (${this.user.role})`);
      
      if (this.role === UserRole.STREAMER) {
        this.promptCreateStream();
      } else {
        this.promptStreamKey();
      }
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
      this.isActive = true;
      if (this.role === UserRole.STREAMER) {
        console.log('\n🎬 ¡Stream iniciado! Estás transmitiendo en vivo');
      } else {
        console.log('\n🎬 ¡El stream ha comenzado!');
      }
      this.showMenu();
    });

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
      this.showMenu();
    });

    this.socket.on(Events.STREAM_ENDED, (data: any) => {
      this.isActive = false;
      console.log('\n🛑 Stream finalizado');
      if (data.reason) {
        console.log(`   Razón: ${data.reason}`);
      }
      this.promptRestart();
    });

    this.socket.on(Events.VIEWER_JOINED, (data: { username: string; viewerCount: number }) => {
      if (data.username !== this.user?.username) {
        console.log(`\n👤 ${data.username} se unió al stream`);
        console.log(`📊 Viewers actuales: ${data.viewerCount}`);
        this.showPrompt();
      }
    });

    this.socket.on(Events.VIEWER_COUNT_UPDATE, (data: { viewerCount: number }) => {
      if (this.isActive && this.stream) {
        this.stream.viewerCount = data.viewerCount;
      }
    });

    this.socket.on(Events.CHAT_MESSAGE_BROADCAST, (data: { message: any }) => {
      const msg = data.message;
      if (msg.userId !== this.user?.id) {
        const prefix = msg.type === 'SYSTEM' ? '📢' : '💬';
        const displayName = msg.type === 'SYSTEM' ? msg.content : `[${msg.username}]: ${msg.content}`;
        console.log(`\n${prefix} ${displayName}`);
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
  }

  /**
   * Solicita elegir el rol
   */
  private promptRole(): void {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║       STREAMHUB - CLIENTE             ║');
    console.log('╚════════════════════════════════════════╝\n');
    this.rl.question('¿Qué quieres hacer?\n  1. Transmitir (Streamer)\n  2. Ver stream (Viewer)\n\nElige (1 o 2): ', (choice: string) => {
      if (choice === '1') {
        this.role = UserRole.STREAMER;
        this.promptUsername();
      } else if (choice === '2') {
        this.role = UserRole.VIEWER;
        this.promptUsername();
      } else {
        console.log('❌ Opción inválida');
        this.promptRole();
      }
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
          role: this.role
        });
      } else {
        console.log('❌ El nombre de usuario no puede estar vacío');
        this.promptUsername();
      }
    });
  }

  /**
   * Solicita crear un stream (solo streamer)
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
   * Solicita iniciar el stream (solo streamer)
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
   * Solicita la stream key (solo viewer)
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
   * Muestra el menú según el rol
   */
  private showMenu(): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Comandos disponibles:');
    console.log('  /chat <mensaje>  - Enviar mensaje al chat');
    
    if (this.role === UserRole.VIEWER) {
      console.log('  /react <emoji>   - Enviar reacción (ej: 👍 ❤️ 🔥)');
      console.log('  /leave           - Salir del stream');
    } else {
      console.log('  /end             - Finalizar stream');
    }
    
    console.log('  /viewers         - Ver número de viewers');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    this.showPrompt();
  }

  /**
   * Muestra el prompt
   */
  private showPrompt(): void {
    if (!this.isActive) return;

    this.rl.question('> ', (input: string) => {
      this.handleCommand(input.trim());
    });
  }

  /**
   * Maneja los comandos
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
    } else if (input.startsWith('/react ') && this.role === UserRole.VIEWER) {
      const emoji = input.substring(7);
      if (emoji && this.stream) {
        this.socket.emit(Events.REACTION_SEND, {
          streamKey: this.stream.streamKey,
          emoji: emoji
        });
        console.log(`${emoji} Reacción enviada`);
      }
    } else if (input === '/end' && this.role === UserRole.STREAMER) {
      this.endStream();
      return;
    } else if (input === '/leave' && this.role === UserRole.VIEWER) {
      this.leaveStream();
      return;
    } else if (input === '/viewers') {
      console.log(`📊 Viewers actuales: ${this.stream?.viewerCount || 0}`);
    } else {
      console.log('❌ Comando no reconocido');
    }

    this.showPrompt();
  }

  /**
   * Finaliza el stream (solo streamer)
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
   * Sale del stream (solo viewer)
   */
  private leaveStream(): void {
    this.isActive = false;
    this.socket.disconnect();
    console.log('\n👋 Has salido del stream');
    process.exit(0);
  }

  /**
   * Pregunta si desea reiniciar
   */
  private promptRestart(): void {
    const question = this.role === UserRole.STREAMER 
      ? '\n¿Crear otro stream? (s/n): '
      : '\n¿Ver otro stream? (s/n): ';

    this.rl.question(question, (answer: string) => {
      if (answer.toLowerCase() === 's') {
        this.stream = null;
        if (this.role === UserRole.STREAMER) {
          this.socket.emit(Events.STREAM_CREATE);
        } else {
          this.promptStreamKey();
        }
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
    console.log('🔗 Conectando a ' + SERVER_URL + '...\n');
  }
}

// Iniciar cliente
const client = new StreamHubClient();
client.start();

export default StreamHubClient;
