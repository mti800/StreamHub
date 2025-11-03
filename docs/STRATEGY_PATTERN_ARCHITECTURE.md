# Arquitectura del Patrón Strategy - MessageFactory

## 📊 Diagrama de Clases

```
┌─────────────────────────────────────────────────────────────┐
│                    <<interface>>                            │
│                   IMessageStrategy                          │
├─────────────────────────────────────────────────────────────┤
│ + createMessage(params: MessageParams): IChatMessage       │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ implements
            ┌───────────────┼───────────────┬────────────────┐
            │               │               │                │
┌───────────────────┐ ┌───────────────┐ ┌─────────────────┐ │
│ChatMessageStrategy│ │SystemMessage  │ │ReactionMessage  │ │
│                   │ │Strategy       │ │Strategy         │ │
├───────────────────┤ ├───────────────┤ ├─────────────────┤ │
│+ createMessage()  │ │+ createMessage│ │+ createMessage()│ │
│  returns CHAT     │ │  returns      │ │  returns        │ │
│  type message     │ │  SYSTEM msg   │ │  REACTION msg   │ │
└───────────────────┘ └───────────────┘ └─────────────────┘ │
                                                              │
                    ┌─────────────────────────────────────────┤
                    │        Futuras Estrategias              │
                    │   (fácil de añadir sin modificar        │
                    │    código existente)                    │
                    └─────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MessageFactory                           │
│                   (Context - Factory)                       │
├─────────────────────────────────────────────────────────────┤
│ - strategies: Map<MessageType, IMessageStrategy>           │
├─────────────────────────────────────────────────────────────┤
│ + registerStrategy(type, strategy): void                   │
│ + createMessage(type, ...params): IChatMessage             │
│ + createChatMessage(...params): IChatMessage               │
│ + createSystemMessage(...params): IChatMessage             │
│ + createReaction(...params): IReaction                     │
│ - createMessageWithStrategy(...params): IChatMessage       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ uses
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Map<MessageType, IMessageStrategy>             │
├─────────────────────────────────────────────────────────────┤
│ MessageType.CHAT      → ChatMessageStrategy                │
│ MessageType.SYSTEM    → SystemMessageStrategy              │
│ MessageType.REACTION  → ReactionMessageStrategy            │
│ MessageType.CUSTOM    → CustomStrategy (registrada)        │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Ejecución

```
┌──────────┐
│  Cliente │
└────┬─────┘
     │
     │ 1. MessageFactory.createChatMessage(...)
     │    o MessageFactory.createMessage(MessageType.CHAT, ...)
     ▼
┌────────────────────────┐
│   MessageFactory       │
│                        │
│ 2. Busca estrategia    │
│    en el Map           │
└────┬───────────────────┘
     │
     │ 3. strategies.get(MessageType.CHAT)
     ▼
┌────────────────────────┐
│ ChatMessageStrategy    │
│                        │
│ 4. createMessage()     │
│    - Genera UUID       │
│    - Aplica formato    │
│    - Retorna mensaje   │
└────┬───────────────────┘
     │
     │ 5. Retorna IChatMessage
     ▼
┌──────────┐
│  Cliente │
└──────────┘
```

## 🎯 Ventajas del Diseño

### 1. Open/Closed Principle
```
❌ ANTES (sin Strategy):
MessageFactory
├─ createChatMessage()
├─ createSystemMessage()
└─ createReaction()

Para añadir nuevo tipo → Modificar MessageFactory

✅ AHORA (con Strategy):
MessageFactory + Strategy Map
├─ ChatMessageStrategy
├─ SystemMessageStrategy
└─ ReactionMessageStrategy

Para añadir nuevo tipo → Crear nueva Strategy + registrarla
(Sin tocar código existente)
```

### 2. Single Responsibility
```
Cada estrategia tiene UNA responsabilidad:
- ChatMessageStrategy    → Solo mensajes de chat
- SystemMessageStrategy  → Solo mensajes del sistema
- ReactionMessageStrategy → Solo reacciones
```

### 3. Extensibilidad
```typescript
// Fácil de extender:
class AnnouncementStrategy implements IMessageStrategy {
  createMessage(params: MessageParams): IChatMessage {
    // Lógica específica para anuncios
  }
}

// Registrar y usar:
MessageFactory.registerStrategy(
  MessageType.ANNOUNCEMENT, 
  new AnnouncementStrategy()
);

const msg = MessageFactory.createMessage(
  MessageType.ANNOUNCEMENT, 
  streamId, 
  userId, 
  username, 
  'Anuncio importante'
);
```

## 📦 Casos de Uso

### Caso 1: Añadir validación a mensajes
```typescript
class ModeratedChatStrategy implements IMessageStrategy {
  private filter = new ContentFilter();
  
  createMessage(params: MessageParams): IChatMessage {
    const cleanContent = this.filter.clean(params.content);
    return {
      id: uuidv4(),
      type: MessageType.CHAT,
      content: cleanContent,
      // ... resto de campos
    };
  }
}
```

### Caso 2: Mensajes con formato especial
```typescript
class MarkdownMessageStrategy implements IMessageStrategy {
  createMessage(params: MessageParams): IChatMessage {
    const formattedContent = this.parseMarkdown(params.content);
    // ...
  }
}
```

### Caso 3: Mensajes con metadata
```typescript
class PollMessageStrategy implements IMessageStrategy {
  createMessage(params: MessageParams): IChatMessage {
    const options = params.metadata?.options || [];
    const pollContent = this.formatPoll(params.content, options);
    // ...
  }
}
```

## 🧪 Testing

### Ventaja: Cada estrategia se testea independientemente

```typescript
describe('ChatMessageStrategy', () => {
  it('should create chat message with correct type', () => {
    const strategy = new ChatMessageStrategy();
    const msg = strategy.createMessage({
      streamId: 'test-stream',
      userId: 'test-user',
      username: 'Tester',
      content: 'Hello'
    });
    
    expect(msg.type).toBe(MessageType.CHAT);
    expect(msg.content).toBe('Hello');
  });
});

describe('SystemMessageStrategy', () => {
  it('should create system message', () => {
    // Test específico para sistema
  });
});
```

## 🚀 Migración desde código anterior

### Antes (sin Strategy):
```typescript
// MessageFactory.ts
static createChatMessage(...): IChatMessage {
  return {
    id: uuidv4(),
    type: MessageType.CHAT,
    content,
    // ... lógica hardcodeada
  };
}
```

### Después (con Strategy):
```typescript
// MessageFactory.ts
static createChatMessage(...): IChatMessage {
  return this.createMessageWithStrategy(
    MessageType.CHAT,
    streamId, userId, username, content
  );
}

private static createMessageWithStrategy(...): IChatMessage {
  const strategy = this.strategies.get(type);
  return strategy.createMessage({ streamId, userId, username, content });
}
```

**Ventaja**: La API pública se mantiene igual (compatibilidad), pero ahora es extensible.

## 📚 Referencias

- **Patrón Strategy**: Gang of Four (GoF) Design Patterns
- **SOLID Principles**: Robert C. Martin
- **Open/Closed Principle**: Bertrand Meyer
