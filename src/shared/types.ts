/**
 * Tipos base del sistema
 */

export enum UserRole {
  STREAMER = 'STREAMER',
  VIEWER = 'VIEWER'
}

export enum StreamStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED'
}

export enum MessageType {
  CHAT = 'CHAT',
  REACTION = 'REACTION',
  SYSTEM = 'SYSTEM'
}

export interface IUser {
  id: string;
  username: string;
  role: UserRole;
  socketId?: string;
  createdAt: Date;
}

export interface IStream {
  id: string;
  streamKey: string;
  streamerId: string;
  status: StreamStatus;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  viewerCount: number;
}

export interface IChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  type: MessageType;
  content: string;
  timestamp: Date;
}

export interface IReaction {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  emoji: string;
  timestamp: Date;
}

export interface IStreamConfig {
  streamerId: string;
  title?: string;
  description?: string;
}

export interface IWebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  from: string;
  to: string;
  streamKey?: string;
}
