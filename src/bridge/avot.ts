import { logInfo } from '../core/autonomy/kernel';

interface BridgeState {
  status: 'idle' | 'connected' | 'error';
  lastMessage?: string;
  lastUpdated: string;
}

const state: BridgeState = {
  status: 'idle',
  lastUpdated: new Date().toISOString(),
};

export const bridgeStatus = (): BridgeState => ({ ...state });

export const dispatchToAVOT = (payload?: unknown): void => {
  state.status = 'connected';
  state.lastMessage = `Dispatched payload at ${new Date().toISOString()}`;
  state.lastUpdated = new Date().toISOString();
  logInfo('bridge.avot', 'Dispatching payload', { payload });
};

export const receiveFromAVOT = (payload?: unknown): void => {
  state.status = 'connected';
  state.lastMessage = `Received payload at ${new Date().toISOString()}`;
  state.lastUpdated = new Date().toISOString();
  logInfo('bridge.avot', 'Receiving payload', { payload });
};
