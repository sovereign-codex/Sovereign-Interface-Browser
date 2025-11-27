import { publish } from '../core/eventBus';

export type AVOTMessage = {
  from: 'SIB' | 'AVOT';
  channel: string;
  payload: unknown;
  at: string;
};

/**
 * Minimal AVOT bridge stub; can later be wired to real backends.
 */
export function sendToAVOT(channel: string, payload: unknown) {
  const message: AVOTMessage = {
    from: 'SIB',
    channel,
    payload,
    at: new Date().toISOString(),
  };
  publish('avot:tx', message);
}
