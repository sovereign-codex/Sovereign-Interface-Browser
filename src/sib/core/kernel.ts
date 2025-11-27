export type SovereignIdentity = {
  id: string;
  label?: string;
  createdAt: string;
};

export type KernelEvent =
  | { type: 'boot'; at: string }
  | { type: 'identity:updated'; identity: SovereignIdentity }
  | { type: 'channel:message'; channel: string; payload: unknown };

type Listener = (event: KernelEvent) => void;

export class SovereignKernel {
  private static _instance: SovereignKernel | null = null;

  static get instance(): SovereignKernel {
    if (!this._instance) this._instance = new SovereignKernel();
    return this._instance;
  }

  private listeners: Set<Listener> = new Set();
  private _identity: SovereignIdentity;

  private constructor() {
    this._identity = {
      id: 'sib-local-' + Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    };
    this.emit({ type: 'boot', at: new Date().toISOString() });
  }

  get identity(): SovereignIdentity {
    return this._identity;
  }

  updateIdentity(partial: Partial<SovereignIdentity>) {
    this._identity = { ...this._identity, ...partial };
    this.emit({ type: 'identity:updated', identity: this._identity });
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: KernelEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // swallow to keep kernel stable
      }
    }
  }

  send(channel: string, payload: unknown) {
    this.emit({ type: 'channel:message', channel, payload });
  }
}
