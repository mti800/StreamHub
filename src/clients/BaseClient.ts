/**
 * BaseClient: Clase base para clientes de StreamHub
 * Elimina duplicación entre Viewer y Streamer
 */

import { io, Socket } from 'socket.io-client';
import * as readline from 'readline';
import { Events } from '../shared/events';
import { IStream, IUser, UserRole } from '../shared/types';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

export abstract class BaseClient {
  protected socket: Socket;
  protected user: IUser | null = null;
  protected stream: IStream | null = null;
  protected rl: readline.Interface;
  protected isActive: boolean = false;

  constructor() {
    this.socket = io(SERVER_URL);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.setupBaseListeners();
    this.setupSpecificListeners();
  }

  /**
   * Configura listeners comunes a todos los clientes
   */
  private setupBaseListeners(): void {
    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor');
      this.promptUsername();
    });

    this.socket.on(Events.USER_REGISTERED, (data: { user: IUser }) => {
      this.user = data.user;
      console.log(`✅ Registrado como: ${this.user.username} (${this.user.role})`);
      this.onUserRegistered();
    });

    this.socket.on(Events.STREAM_ERROR, (data: { message: string }) => {
      console.error(`\n❌ Error: ${data.message}`);
      this.showPrompt();
    });

    this.socket.on('disconnect', () => {
      console.log('\n❌ Desconectado del servidor');
      process.exit(0);
    });

    this.socket.on(Events.CHAT_MESSAGE_BROADCAST, (data: { message: any }) => {
      this.handleChatMessage(data.message);
    });

    this.socket.on(Events.REACTION_BROADCAST, (data: { reaction: any }) => {
      this.handleReaction(data.reaction);
    });

    this.socket.on(Events.VIEWER_COUNT_UPDATE, (data: { viewerCount: number }) => {
      if (this.isActive) {
        console.log(`👥 Viewers actuales: ${data.viewerCount}`);
      }
    });
  }

  /**
   * Solicita el nombre de usuario
   */
  protected promptUsername(): void {
    this.rl.question('\n👤 Ingresa tu nombre de usuario: ', (username: string) => {
      if (username.trim()) {
        this.socket.emit(Events.USER_REGISTER, {
          username: username.trim(),
          role: this.getUserRole()
        });
      } else {
        console.log('❌ El nombre de usuario no puede estar vacío');
        this.promptUsername();
      }
    });
  }

  /**
   * Muestra el prompt y procesa comandos
   */
  protected showPrompt(): void {
    if (!this.isActive) return;

    this.rl.question('> ', (input: string) => {
      this.handleCommand(input.trim());
    });
  }

  /**
   * Maneja comandos comunes
   */
  protected handleCommand(input: string): void {
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
    } else if (input === '/viewers') {
      console.log(`👥 Viewers actuales: ${this.stream?.viewerCount || 0}`);
    } else {
      this.handleSpecificCommand(input);
    }

    this.showPrompt();
  }

  /**
   * Maneja mensajes de chat
   */
  protected handleChatMessage(message: any): void {
    const isOwnMessage = message.userId === this.user?.id;
    if (isOwnMessage) return;

    const prefix = message.type === 'SYSTEM' ? '📢' : '💬';
    const displayName = message.type === 'SYSTEM' 
      ? message.content 
      : `[${message.username}]: ${message.content}`;
    console.log(`\n${prefix} ${displayName}`);
    this.showPrompt();
  }

  /**
   * Maneja reacciones
   */
  protected handleReaction(reaction: any): void {
    const isOwnReaction = reaction.userId === this.user?.id;
    if (isOwnReaction) return;

    console.log(`\n${reaction.emoji} ${reaction.username}`);
    this.showPrompt();
  }

  /**
   * Pregunta si desea reiniciar
   */
  protected promptRestart(question: string, onRestart: () => void): void {
    this.rl.question(`\n${question} (s/n): `, (answer: string) => {
      if (answer.toLowerCase() === 's') {
        this.stream = null;
        onRestart();
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
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
    console.log('╔════════════════════════════════════════╗');
    console.log(`║  ${this.getClientName()}  ║`);
    console.log('╚════════════════════════════════════════╝');
    console.log(`🔗 Conectando a ${SERVER_URL}...\n`);
  }

  // Métodos abstractos que deben implementar las subclases
  protected abstract getUserRole(): UserRole;
  protected abstract setupSpecificListeners(): void;
  protected abstract onUserRegistered(): void;
  protected abstract handleSpecificCommand(input: string): void;
  protected abstract getClientName(): string;
}
