import { publish, subscribe } from './eventBus';

export type VoiceIntent =
  | { type: 'omnibar:command'; raw: string }
  | { type: 'system:heartbeat' }
  | { type: 'ui:open-panel'; id: string };

let heartbeatTimer: number | null = null;

/**
 * Voice node listens to omnibar / system events and forwards them
 * into the SIB/AVOT ecosystem.
 */
export function startVoiceNode() {
  if (heartbeatTimer !== null) return;

  // Heartbeat
  heartbeatTimer = window.setInterval(() => {
    publish<VoiceIntent>('sib:voice', { type: 'system:heartbeat' });
  }, 15000);

  // Omnibar example channel (to be wired from UI)
  subscribe<string>('sib:omnibar', raw => {
    publish<VoiceIntent>('sib:voice', { type: 'omnibar:command', raw });
  });
}
