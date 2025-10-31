/**
 * Interface para estrategias de creación de mensajes
 */

export interface IMessageStrategy<T> {
  create(...args: any[]): T;
}
