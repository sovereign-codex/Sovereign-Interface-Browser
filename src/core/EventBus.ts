export type EventHandler<TPayload> = (payload: TPayload) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private listeners: { [K in keyof Events]?: Set<EventHandler<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]?.add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    this.listeners[event]?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners[event]?.forEach((handler) => handler(payload));
  }
}
