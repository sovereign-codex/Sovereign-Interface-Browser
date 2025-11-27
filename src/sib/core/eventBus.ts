import { SovereignKernel } from './kernel';

export type BusHandler<T = unknown> = (payload: T) => void;

const channels = new Map<string, Set<BusHandler>>();

export function subscribe<T = unknown>(channel: string, handler: BusHandler<T>): () => void {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel)!.add(handler as BusHandler);
  return () => {
    channels.get(channel)?.delete(handler as BusHandler);
  };
}

export function publish<T = unknown>(channel: string, payload: T) {
  SovereignKernel.instance.send(channel, payload);
  const listeners = channels.get(channel);
  if (!listeners) return;
  for (const handler of listeners) {
    try {
      handler(payload);
    } catch {
      // keep bus resilient
    }
  }
}
