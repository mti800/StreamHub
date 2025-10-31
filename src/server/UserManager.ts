/**
 * UserManager: Gestiona los usuarios conectados
 */

import { IUser, UserRole } from '../shared/types';
import { UserFactory } from '../factories/UserFactory';

export class UserManager {
  private users: Map<string, IUser>;
  private socketToUser: Map<string, string>;
  private usernameToUser: Map<string, string>; // Para buscar por username

  constructor() {
    this.users = new Map();
    this.socketToUser = new Map();
    this.usernameToUser = new Map();
  }

  /**
   * Registra un nuevo usuario o reconecta uno existente
   */
  registerUser(username: string, role: UserRole, socketId: string): IUser {
    // Buscar si el usuario ya existe por username
    const existingUserId = this.usernameToUser.get(username.toLowerCase());
    
    if (existingUserId) {
      const existingUser = this.users.get(existingUserId);
      if (existingUser) {
        // Usuario existente reconectándose
        console.log(`[UserManager] Usuario reconectado: ${username}`);
        
        // Actualizar socketId
        if (existingUser.socketId) {
          this.socketToUser.delete(existingUser.socketId);
        }
        existingUser.socketId = socketId;
        this.socketToUser.set(socketId, existingUser.id);
        
        return existingUser;
      }
    }
    
    // Usuario nuevo
    const user = UserFactory.createUser(username, role, socketId);
    
    this.users.set(user.id, user);
    this.socketToUser.set(socketId, user.id);
    this.usernameToUser.set(username.toLowerCase(), user.id);

    console.log(`[UserManager] Usuario nuevo registrado: ${username}`);
    return user;
  }

  /**
   * Obtiene un usuario por su ID
   */
  getUser(userId: string): IUser | undefined {
    return this.users.get(userId);
  }

  /**
   * Obtiene un usuario por su socket ID
   */
  getUserBySocket(socketId: string): IUser | undefined {
    const userId = this.socketToUser.get(socketId);
    return userId ? this.users.get(userId) : undefined;
  }

  /**
   * Desconecta un usuario (no lo elimina, solo actualiza su estado)
   */
  disconnectUser(userId: string): void {
    const user = this.users.get(userId);
    if (user && user.socketId) {
      this.socketToUser.delete(user.socketId);
      user.socketId = undefined;
      console.log(`[UserManager] Usuario desconectado (persistido): ${user.username}`);
    }
  }

  /**
   * Desconecta un usuario por socket ID
   */
  disconnectUserBySocket(socketId: string): IUser | undefined {
    const user = this.getUserBySocket(socketId);
    if (user) {
      this.disconnectUser(user.id);
    }
    return user;
  }

  /**
   * Elimina un usuario completamente (solo para casos especiales)
   */
  removeUser(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      if (user.socketId) {
        this.socketToUser.delete(user.socketId);
      }
      this.usernameToUser.delete(user.username.toLowerCase());
      this.users.delete(userId);
      console.log(`[UserManager] Usuario eliminado completamente: ${user.username}`);
    }
  }

  /**
   * Elimina un usuario por socket ID
   */
  removeUserBySocket(socketId: string): IUser | undefined {
    const user = this.getUserBySocket(socketId);
    if (user) {
      this.removeUser(user.id);
    }
    return user;
  }

  /**
   * Verifica si un usuario está conectado
   */
  isUserConnected(userId: string): boolean {
    const user = this.users.get(userId);
    return user ? user.socketId !== undefined : false;
  }

  /**
   * Obtiene todos los usuarios conectados
   */
  getConnectedUsers(): IUser[] {
    return Array.from(this.users.values())
      .filter(user => user.socketId !== undefined);
  }

  /**
   * Obtiene todos los usuarios (conectados y desconectados)
   */
  getAllUsers(): IUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Obtiene usuarios por rol
   */
  getUsersByRole(role: UserRole): IUser[] {
    return Array.from(this.users.values())
      .filter(user => user.role === role);
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getStats(): { total: number; connected: number; disconnected: number } {
    const total = this.users.size;
    const connected = this.getConnectedUsers().length;
    return {
      total,
      connected,
      disconnected: total - connected
    };
  }
}
