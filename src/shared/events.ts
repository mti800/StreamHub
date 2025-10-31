/**
 * Eventos del sistema Pub/Sub
 */

export const Events = {
  // Conexión
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Autenticación de usuario
  USER_REGISTER: 'user:register',
  USER_REGISTERED: 'user:registered',
  
  // Stream lifecycle
  STREAM_CREATE: 'stream:create',
  STREAM_CREATED: 'stream:created',
  STREAM_JOIN: 'stream:join',
  STREAM_JOINED: 'stream:joined',
  STREAM_START: 'stream:start',
  STREAM_STARTED: 'stream:started',
  STREAM_END: 'stream:end',
  STREAM_ENDED: 'stream:ended',
  STREAM_ERROR: 'stream:error',
  
  // WebRTC Signaling
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc:ice-candidate',
  
  // Stream Data (Multicast)
  STREAM_DATA: 'stream:data',
  STREAM_BUFFER: 'stream:buffer',
  STREAM_DATA_SEND: 'stream:data:send',
  
  // Chat
  CHAT_MESSAGE_SEND: 'chat:message:send',
  CHAT_MESSAGE_RECEIVED: 'chat:message:received',
  CHAT_MESSAGE_BROADCAST: 'chat:message:broadcast',
  
  // Reacciones
  REACTION_SEND: 'reaction:send',
  REACTION_BROADCAST: 'reaction:broadcast',
  
  // Viewers
  VIEWER_COUNT_UPDATE: 'viewer:count:update',
  VIEWER_JOINED: 'viewer:joined',
  VIEWER_LEFT: 'viewer:left'
} as const;

export type EventType = typeof Events[keyof typeof Events];
