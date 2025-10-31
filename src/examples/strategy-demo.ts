/**
 * Ejemplo de uso del patrón Strategy en MessageFactory
 * 
 * Este archivo demuestra cómo usar las estrategias de mensajes
 * y cómo cambiar estrategias dinámicamente.
 */

import { MessageFactory } from '../factories/MessageFactory';
import { 
  AnnouncementMessageStrategy, 
  WhisperMessageStrategy,
  HighlightedMessageStrategy 
} from '../strategies/ExampleStrategies';

// Datos de ejemplo
const streamId = 'stream-123';
const userId = 'user-456';
const username = 'TestUser';

console.log('=== Demostración del Patrón Strategy ===\n');

// 1. Uso de estrategias pre-registradas
console.log('1. Mensajes usando estrategias por defecto:');
console.log('--------------------------------------------');

const chatMsg = MessageFactory.createChatMessage(
  streamId, userId, username, '¡Hola a todos!'
);
console.log('Chat:', chatMsg);

const systemMsg = MessageFactory.createSystemMessage(
  streamId, 'Usuario se ha conectado'
);
console.log('Sistema:', systemMsg);

const reaction = MessageFactory.createReaction(
  streamId, userId, username, '👍'
);
console.log('Reacción:', reaction);

console.log('\n2. Cambiando estrategias dinámicamente:');
console.log('----------------------------------------');

// Cambiar la estrategia de chat a una destacada
MessageFactory.setChatStrategy(new HighlightedMessageStrategy());
const highlightedMsg = MessageFactory.createChatMessage(
  streamId, userId, username, 'Mensaje importante'
);
console.log('Destacado:', highlightedMsg);

// Cambiar la estrategia de sistema a anuncios
MessageFactory.setSystemStrategy(new AnnouncementMessageStrategy());
const announcementMsg = MessageFactory.createSystemMessage(
  streamId, 'El stream comienza en 5 minutos'
);
console.log('Anuncio:', announcementMsg);

console.log('\n3. Estrategias de ejemplo disponibles:');
console.log('---------------------------------------');
console.log('📢 AnnouncementMessageStrategy - Para anuncios importantes');
console.log('🔒 WhisperMessageStrategy - Para mensajes privados');
console.log('⭐ HighlightedMessageStrategy - Para mensajes destacados');

console.log('\n4. Cómo añadir nuevas estrategias:');
console.log('-----------------------------------');
console.log(`
Pasos:
1. Crear nueva clase implementando IMessageStrategy<T>
2. Implementar el método create(...args): T
3. (Opcional) Añadir nuevo tipo al enum MessageType si es necesario
4. Usar con MessageFactory.setChatStrategy() o setSystemStrategy()
   O añadir un nuevo método específico en MessageFactory

Ver ejemplos en: src/strategies/ExampleStrategies.ts
`);

console.log('\n=== Ventajas del Patrón Strategy ===');
console.log('✅ Open/Closed Principle: Abierto a extensión, cerrado a modificación');
console.log('✅ Single Responsibility: Cada estrategia maneja un tipo específico');
console.log('✅ Testeable: Cada estrategia se puede testear independientemente');
console.log('✅ Flexible: Cambio dinámico de estrategias en runtime');
console.log('✅ Mantenible: Lógica encapsulada y organizada');

export { };
