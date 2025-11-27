import { logInfo } from '../core/autonomy/kernel';

export type AVOTNode = {
  id: string;
  label: string;
  role: 'convergence' | 'guardian' | 'quill' | 'harmonia' | 'initiate' | 'custom';
  status: 'offline' | 'available' | 'active';
};

interface BridgeState {
  status: 'idle' | 'connected' | 'error';
  lastMessage?: string;
  lastUpdated: string;
}

const state: BridgeState = {
  status: 'idle',
  lastUpdated: new Date().toISOString(),
};

const topology: AVOTNode[] = [
  { id: 'avot-convergence', label: 'Convergence', role: 'convergence', status: 'available' },
  { id: 'avot-guardian', label: 'Guardian', role: 'guardian', status: 'active' },
  { id: 'avot-quill', label: 'Quill', role: 'quill', status: 'offline' },
  { id: 'avot-harmonia', label: 'Harmonia', role: 'harmonia', status: 'available' },
];

export const bridgeStatus = (): BridgeState => ({ ...state });

export const getClusterTopology = (): AVOTNode[] => topology.map((node) => ({ ...node }));

export const pingNode = async (nodeId: string): Promise<'ok' | 'timeout' | 'error'> => {
  const node = topology.find((n) => n.id === nodeId);
  const latency = 150 + Math.random() * 350;
  await new Promise((resolve) => setTimeout(resolve, latency));
  if (!node) {
    logInfo('bridge.avot', `Ping target not found: ${nodeId}`);
    return 'error';
  }
  const outcome = node.status === 'offline' ? 'timeout' : 'ok';
  logInfo('bridge.avot', `Ping ${nodeId}`, { latency, outcome });
  return outcome;
};

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
