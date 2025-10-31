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
  subscriptions?: string[]; // IDs de usuarios a los que está suscrito
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

export interface IStreamNotification {
  type: 'started' | 'ended';
  streamerId: string;
  streamerUsername: string;
  streamId: string;
  streamKey: string;
  startedAt?: Date;
  endedAt?: Date;
}

export interface IUserSubscription {
  userId: string;
  username: string;
  role: UserRole;
  isSubscribed: boolean;
  streamStatus?: 'active' | 'inactive';
  currentStreamKey?: string;
}

export interface ISubscription {
  followerId: string;
  followingId: string;
  createdAt: Date;
}
