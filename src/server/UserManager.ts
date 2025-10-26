/**
 * UserManager: Gestiona los usuarios conectados
 */

import { IUser, UserRole } from '../shared/types';
import { UserFactory } from '../factories/UserFactory';

export class UserManager {
  private users: Map<string, IUser>;
  private socketToUser: Map<string, string>;

  constructor() {
    this.users = new Map();
    this.socketToUser = new Map();
  }

  /**
   * Registra un nuevo usuario
   */
  registerUser(username: string, role: UserRole, socketId: string): IUser {
    const user = UserFactory.createUser(username, role, socketId);
    
    this.users.set(user.id, user);
    this.socketToUser.set(socketId, user.id);

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
   * Elimina un usuario
   */
  removeUser(userId: string): void {
    const user = this.users.get(userId);
    if (user && user.socketId) {
      this.socketToUser.delete(user.socketId);
    }
    this.users.delete(userId);
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
   * Obtiene todos los usuarios
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
}
