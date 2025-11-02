# Guía: Añadir Nuevos Tipos de Mensajes

Esta guía explica cómo extender el sistema de mensajes usando el patrón Strategy implementado.

## 🎯 Arquitectura

El `MessageFactory` ahora usa el patrón **Strategy** para delegar la creación de mensajes a estrategias específicas. Esto permite:

- ✅ Añadir nuevos tipos de mensajes sin modificar código existente (Open/Closed Principle)
- ✅ Mantener cada estrategia enfocada en un solo tipo (Single Responsibility)
- ✅ Facilitar el testing de cada tipo de mensaje por separado
- ✅ Permitir registro dinámico de estrategias

## 📋 Pasos para Añadir un Nuevo Tipo de Mensaje

### 1. Definir el Tipo en el Enum

Edita `src/shared/types.ts` y añade el nuevo tipo:

```typescript
export enum MessageType {
  CHAT = 'CHAT',
  REACTION = 'REACTION',
  SYSTEM = 'SYSTEM',
  ANNOUNCEMENT = 'ANNOUNCEMENT', // ⬅️ Nuevo tipo
  WHISPER = 'WHISPER',           // ⬅️ Otro ejemplo
  HIGHLIGHTED = 'HIGHLIGHTED'     // ⬅️ Otro ejemplo
}
```

### 2. Crear la Estrategia

Edita `src/factories/MessageStrategies.ts` y añade tu nueva estrategia:

```typescript
export class AnnouncementMessageStrategy implements IMessageStrategy<IChatMessage> {
  create(
    streamId: string,
    userId: string,
    username: string,
    content: string
  ): IChatMessage {
    return {
      id: uuidv4(),
      streamId,
      userId,
      username,
      type: MessageType.ANNOUNCEMENT,
      content: `📢 ${content}`,
      timestamp: new Date()
    };
  }
}
```

### 3. Registrar la Estrategia

#### Opción A: Registro Estático

Edita `src/factories/MessageFactory.ts` y añade la estrategia:

```typescript
import { AnnouncementMessageStrategy } from './MessageStrategies';

private static strategies: Map<MessageType, IMessageStrategy> = new Map([
  [MessageType.CHAT, new ChatMessageStrategy()],
  [MessageType.SYSTEM, new SystemMessageStrategy()],
  [MessageType.REACTION, new ReactionMessageStrategy()],
  [MessageType.ANNOUNCEMENT, new AnnouncementMessageStrategy()], // ⬅️ Nueva
]);
```

#### Opción B: Registro Dinámico

En cualquier parte del código (ej: `src/server/index.ts`):

```typescript
import { MessageFactory } from './factories/MessageFactory';
import { AnnouncementMessageStrategy } from './strategies/AnnouncementMessageStrategy';
import { MessageType } from './shared/types';

// Registrar al iniciar la aplicación
MessageFactory.registerStrategy(
  MessageType.ANNOUNCEMENT, 
  new AnnouncementMessageStrategy()
);
```

### 4. Usar el Nuevo Tipo

#### Método Específico (Recomendado para uso frecuente)

Añade un método en `MessageFactory`:

```typescript
static createAnnouncement(
  streamId: string,
  userId: string,
  username: string,
  content: string
): IChatMessage {
  return this.createMessage(
    MessageType.ANNOUNCEMENT,
    streamId,
    userId,
    username,
    content
  );
}
```

Úsalo así:

```typescript
const announcement = MessageFactory.createAnnouncement(
  streamId,
  userId,
  username,
  'El stream comenzará en 5 minutos'
);
```

#### Método Genérico (Uso directo)

```typescript
const announcement = MessageFactory.createMessage(
  MessageType.ANNOUNCEMENT,
  streamId,
  userId,
  username,
  'El stream comenzará en 5 minutos'
);
```

## 🎨 Ejemplos de Estrategias

### Mensajes Privados (Whisper)

```typescript
export class WhisperMessageStrategy implements IMessageStrategy {
  createMessage(params: MessageParams): IChatMessage {
    const targetUser = params.metadata?.targetUser || 'unknown';
    
    return {
      id: uuidv4(),
      streamId: params.streamId,
      userId: params.userId,
      username: params.username,
      type: MessageType.WHISPER,
      content: `🔒 [Privado → ${targetUser}] ${params.content}`,
      timestamp: new Date()
    };
  }
}
```

Uso:

```typescript
const whisper = MessageFactory.createMessage(
  MessageType.WHISPER,
  streamId,
  userId,
  username,
  'Hola en privado'
);
```

### Mensajes con Formato Especial

```typescript
export class HighlightedMessageStrategy implements IMessageStrategy {
  createMessage(params: MessageParams): IChatMessage {
    // Aplicar formato especial
    const highlightedContent = `✨ ${params.content.toUpperCase()} ✨`;
    
    return {
      id: uuidv4(),
      streamId: params.streamId,
      userId: params.userId,
      username: `⭐ ${params.username}`,
      type: MessageType.HIGHLIGHTED,
      content: highlightedContent,
      timestamp: new Date()
    };
  }
}
```

### Mensajes con Validación

```typescript
export class ModeratedMessageStrategy implements IMessageStrategy {
  private badWords = ['spam', 'phishing'];
  
  createMessage(params: MessageParams): IChatMessage {
    // Validar contenido
    const hasBadWords = this.badWords.some(word => 
      params.content.toLowerCase().includes(word)
    );
    
    const cleanContent = hasBadWords 
      ? '[Mensaje bloqueado por moderación]'
      : params.content;
    
    return {
      id: uuidv4(),
      streamId: params.streamId,
      userId: params.userId,
      username: params.username,
      type: MessageType.CHAT,
      content: cleanContent,
      timestamp: new Date()
    };
  }
}
```

## 🔧 Uso con Metadata

La interfaz `MessageParams` incluye un campo opcional `metadata` para casos avanzados:

```typescript
export interface MessageParams {
  streamId: string;
  userId: string;
  username: string;
  content: string;
  metadata?: Record<string, any>; // ⬅️ Datos adicionales
}
```

Ejemplo de uso:

```typescript
export class PollMessageStrategy implements IMessageStrategy {
  createMessage(params: MessageParams): IChatMessage {
    const options = params.metadata?.options || [];
    const pollContent = `📊 ${params.content}\n${options.map((o: string, i: number) => 
      `${i + 1}. ${o}`
    ).join('\n')}`;
    
    return {
      id: uuidv4(),
      streamId: params.streamId,
      userId: params.userId,
      username: params.username,
      type: MessageType.POLL,
      content: pollContent,
      timestamp: new Date()
    };
  }
}
```

## 🧪 Testing de Estrategias

Cada estrategia puede testearse de forma independiente:

```typescript
import { ChatMessageStrategy } from '../strategies/ChatMessageStrategy';
import { MessageType } from '../shared/types';

describe('ChatMessageStrategy', () => {
  it('should create a chat message', () => {
    const strategy = new ChatMessageStrategy();
    const message = strategy.createMessage({
      streamId: 'stream-123',
      userId: 'user-456',
      username: 'TestUser',
      content: 'Hello World'
    });
    
    expect(message.type).toBe(MessageType.CHAT);
    expect(message.content).toBe('Hello World');
    expect(message.username).toBe('TestUser');
  });
});
```

## 📚 Ventajas del Patrón Strategy

1. **Extensibilidad**: Nuevos tipos sin modificar código existente
2. **Testabilidad**: Cada estrategia se puede testear aisladamente
3. **Mantenibilidad**: Lógica específica encapsulada en su propia clase
4. **Flexibilidad**: Registro dinámico de estrategias en runtime
5. **SOLID**: Cumple con Open/Closed y Single Responsibility

## 🚀 Próximos Pasos

## 📚 Recursos Adicionales

- Ver ejemplos en `src/factories/MessageStrategies.ts`
- Implementar tus propias estrategias según tus necesidades
- Considerar añadir estrategias compuestas (que usen otras estrategias)
- Implementar decoradores para añadir funcionalidad extra (filtros, logging, etc.)
