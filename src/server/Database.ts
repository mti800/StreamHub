/**
 * Database: Manejo simple de SQLite para persistencia
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { IUser, IStream, UserRole, StreamStatus } from '../shared/types';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string = path.join(__dirname, '../../data/streamhub.db')) {
    // Crear directorio si no existe
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Mejor performance
    this.initTables();
  }

  /**
   * Crea las tablas si no existen
   */
  private initTables(): void {
    // Tabla de usuarios
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        socketId TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // Tabla de streams
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS streams (
        id TEXT PRIMARY KEY,
        streamKey TEXT UNIQUE NOT NULL,
        streamerId TEXT NOT NULL,
        status TEXT NOT NULL,
        viewerCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        startedAt TEXT,
        endedAt TEXT,
        FOREIGN KEY(streamerId) REFERENCES users(id)
      )
    `);

    // Tabla de suscripciones
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        followerId TEXT NOT NULL,
        followingId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (followerId, followingId),
        FOREIGN KEY(followerId) REFERENCES users(id),
        FOREIGN KEY(followingId) REFERENCES users(id)
      )
    `);

    console.log('[Database] Tablas inicializadas');
  }

  // ===== USERS =====

  saveUser(user: IUser): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO users (id, username, role, socketId, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      user.id,
      user.username,
      user.role,
      user.socketId || null,
      user.createdAt.toISOString()
    );
  }

  getUser(userId: string): IUser | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(userId) as any;
    
    if (!row) return undefined;
    
    return {
      id: row.id,
      username: row.username,
      role: row.role as UserRole,
      socketId: row.socketId || undefined,
      createdAt: new Date(row.createdAt)
    };
  }

  getUserByUsername(username: string): IUser | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    const row = stmt.get(username) as any;
    
    if (!row) return undefined;
    
    return {
      id: row.id,
      username: row.username,
      role: row.role as UserRole,
      socketId: row.socketId || undefined,
      createdAt: new Date(row.createdAt)
    };
  }

  getAllUsers(): IUser[] {
    const stmt = this.db.prepare('SELECT * FROM users');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      role: row.role as UserRole,
      socketId: row.socketId || undefined,
      createdAt: new Date(row.createdAt)
    }));
  }

  updateUserSocket(userId: string, socketId: string | null): void {
    const stmt = this.db.prepare('UPDATE users SET socketId = ? WHERE id = ?');
    stmt.run(socketId, userId);
  }

  // ===== STREAMS =====

  saveStream(stream: IStream): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO streams 
      (id, streamKey, streamerId, status, viewerCount, createdAt, startedAt, endedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      stream.id,
      stream.streamKey,
      stream.streamerId,
      stream.status,
      stream.viewerCount,
      stream.createdAt.toISOString(),
      stream.startedAt ? stream.startedAt.toISOString() : null,
      stream.endedAt ? stream.endedAt.toISOString() : null
    );
  }

  getStream(streamId: string): IStream | undefined {
    const stmt = this.db.prepare('SELECT * FROM streams WHERE id = ?');
    const row = stmt.get(streamId) as any;
    
    if (!row) return undefined;
    
    return this.rowToStream(row);
  }

  getStreamByKey(streamKey: string): IStream | undefined {
    const stmt = this.db.prepare('SELECT * FROM streams WHERE streamKey = ?');
    const row = stmt.get(streamKey) as any;
    
    if (!row) return undefined;
    
    return this.rowToStream(row);
  }

  getStreamsByStreamer(streamerId: string): IStream[] {
    const stmt = this.db.prepare('SELECT * FROM streams WHERE streamerId = ? ORDER BY createdAt DESC');
    const rows = stmt.all(streamerId) as any[];
    
    return rows.map(row => this.rowToStream(row));
  }

  getActiveStreams(): IStream[] {
    const stmt = this.db.prepare('SELECT * FROM streams WHERE status = ?');
    const rows = stmt.all(StreamStatus.ACTIVE) as any[];
    
    return rows.map(row => this.rowToStream(row));
  }

  private rowToStream(row: any): IStream {
    return {
      id: row.id,
      streamKey: row.streamKey,
      streamerId: row.streamerId,
      status: row.status as StreamStatus,
      viewerCount: row.viewerCount,
      createdAt: new Date(row.createdAt),
      startedAt: row.startedAt ? new Date(row.startedAt) : undefined,
      endedAt: row.endedAt ? new Date(row.endedAt) : undefined
    };
  }

  deleteOldStreams(olderThanHours: number): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const stmt = this.db.prepare(
      'DELETE FROM streams WHERE status = ? AND endedAt < ?'
    );
    const result = stmt.run(StreamStatus.ENDED, cutoff.toISOString());
    console.log(`[Database] Eliminados ${result.changes} streams antiguos`);
  }

  // ===== SUBSCRIPTIONS =====

  saveSubscription(followerId: string, followingId: string): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO subscriptions (followerId, followingId, createdAt)
      VALUES (?, ?, ?)
    `);
    stmt.run(followerId, followingId, new Date().toISOString());
  }

  deleteSubscription(followerId: string, followingId: string): void {
    const stmt = this.db.prepare(
      'DELETE FROM subscriptions WHERE followerId = ? AND followingId = ?'
    );
    stmt.run(followerId, followingId);
  }

  getSubscriptions(userId: string): string[] {
    const stmt = this.db.prepare('SELECT followingId FROM subscriptions WHERE followerId = ?');
    const rows = stmt.all(userId) as any[];
    return rows.map(row => row.followingId);
  }

  getFollowers(userId: string): string[] {
    const stmt = this.db.prepare('SELECT followerId FROM subscriptions WHERE followingId = ?');
    const rows = stmt.all(userId) as any[];
    return rows.map(row => row.followerId);
  }

  // ===== UTILITY =====

  close(): void {
    this.db.close();
    console.log('[Database] Conexión cerrada');
  }

  getStats() {
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const streamCount = this.db.prepare('SELECT COUNT(*) as count FROM streams').get() as any;
    const subscriptionCount = this.db.prepare('SELECT COUNT(*) as count FROM subscriptions').get() as any;

    return {
      users: userCount.count,
      streams: streamCount.count,
      subscriptions: subscriptionCount.count
    };
  }
}
