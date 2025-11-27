const generateSessionId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  data?: unknown;
}

export interface KernelState {
  sessionId: string;
  startedAt: Date;
  commandCount: number;
  lastCommand?: { id: string; at: string };
  log: LogEntry[];
}

const MAX_LOG_ENTRIES = 200;

const state: KernelState = {
  sessionId: generateSessionId(),
  startedAt: new Date(),
  commandCount: 0,
  log: [],
};

const appendLog = (entry: LogEntry): void => {
  state.log.push(entry);
  if (state.log.length > MAX_LOG_ENTRIES) {
    state.log.splice(0, state.log.length - MAX_LOG_ENTRIES);
  }
};

const createLogEntry = (level: LogLevel, source: string, message: string, data?: unknown): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  source,
  message,
  data,
});

export const getKernelState = (): KernelState => ({
  ...state,
  startedAt: new Date(state.startedAt),
  log: [...state.log],
});

export const logInfo = (source: string, message: string, data?: unknown): void => {
  appendLog(createLogEntry('info', source, message, data));
};

export const logWarn = (source: string, message: string, data?: unknown): void => {
  appendLog(createLogEntry('warn', source, message, data));
};

export const logError = (source: string, message: string, data?: unknown): void => {
  appendLog(createLogEntry('error', source, message, data));
};

export const logDebug = (source: string, message: string, data?: unknown): void => {
  appendLog(createLogEntry('debug', source, message, data));
};

export const recordCommandExecution = (id: string, status: 'ok' | 'error', durationMs: number): void => {
  state.commandCount += 1;
  state.lastCommand = { id, at: new Date().toISOString() };
  const level: LogLevel = status === 'error' ? 'error' : 'info';
  appendLog(
    createLogEntry(level, `command.${id}`, `executed (status=${status}, durationMs=${Math.round(durationMs)})`),
  );
};
