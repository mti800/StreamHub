/**
 * Patrón Factory: Creación de usuarios
 */

import { v4 as uuidv4 } from 'uuid';
import { IUser, UserRole } from '../shared/types';

export class UserFactory {
  /**
   * Crea un usuario Streamer
   */
  static createStreamer(username: string, socketId?: string): IUser {
    return {
      id: uuidv4(),
      username,
      role: UserRole.STREAMER,
      socketId,
      createdAt: new Date()
    };
  }

  /**
   * Crea un usuario Viewer
   */
  static createViewer(username: string, socketId?: string): IUser {
    return {
      id: uuidv4(),
      username,
      role: UserRole.VIEWER,
      socketId,
      createdAt: new Date()
    };
  }

  /**
   * Crea un usuario según el rol especificado
   */
  static createUser(username: string, role: UserRole, socketId?: string): IUser {
    if (role === UserRole.STREAMER) {
      return this.createStreamer(username, socketId);
    }
    return this.createViewer(username, socketId);
  }
}
