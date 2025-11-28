import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { logInfo } from '../core/autonomy/kernel';

export interface SpatialState {
  supported: boolean;
  active: boolean;
  mode: 'none' | 'simulated' | 'xr-hinted';
  lastActivatedAt?: string;
}

interface SpatialContextValue extends SpatialState {
  enterSpatialMode: (modeOverride?: SpatialState['mode']) => SpatialState;
  exitSpatialMode: () => SpatialState;
  toggleSpatialMode: () => SpatialState;
}

type SpatialListener = (state: SpatialState) => void;

const listeners = new Set<SpatialListener>();
let spatialState: SpatialState = { supported: false, active: false, mode: 'none' };
let detectionLogged = false;

const notify = (): void => {
  listeners.forEach((listener) => listener({ ...spatialState }));
};

const applyState = (next: Partial<SpatialState>, options?: { silent?: boolean }): SpatialState => {
  const updated: SpatialState = {
    ...spatialState,
    ...next,
  };

  if (next.active === true && spatialState.active === false) {
    updated.lastActivatedAt = new Date().toISOString();
  }

  spatialState = updated;
  if (!options?.silent) {
    notify();
  }
  return spatialState;
};

const detectSpatialSupport = (): { supported: boolean; mode: SpatialState['mode']; hinted: boolean } => {
  if (typeof window === 'undefined') {
    return { supported: false, mode: 'none', hinted: false };
  }
  const url = new URL(window.location.href);
  const spatialFlag = url.searchParams.get('spatial');
  const hasNavigatorXr = typeof navigator !== 'undefined' && 'xr' in navigator;
  if (hasNavigatorXr || spatialFlag) {
    return { supported: true, mode: 'xr-hinted', hinted: true };
  }
  return { supported: false, mode: 'none', hinted: false };
};

const initializeSpatialState = (): SpatialState => {
  const detection = detectSpatialSupport();
  const initial: SpatialState = { supported: detection.supported, active: false, mode: detection.mode };
  applyState(initial, { silent: true });
  if (detection.hinted && !detectionLogged) {
    detectionLogged = true;
    logInfo('spatial', '[SPATIAL] XR hint detected (navigator.xr present or ?spatial flag).');
  }
  return { ...spatialState };
};

export const getSpatialState = (): SpatialState => ({ ...spatialState });

export const activateSpatialMode = (modeOverride?: SpatialState['mode']): SpatialState => {
  const targetMode = modeOverride ?? (spatialState.supported ? spatialState.mode : 'simulated');
  const next = applyState({ active: true, mode: targetMode });
  logInfo('spatial', `[SPATIAL] Mode set to active=${next.active}, type=${next.mode}.`);
  return next;
};

export const deactivateSpatialMode = (): SpatialState => {
  const next = applyState({ active: false });
  logInfo('spatial', `[SPATIAL] Mode set to active=${next.active}, type=${next.mode}.`);
  return next;
};

export const toggleSpatialModeState = (): SpatialState => {
  return spatialState.active ? deactivateSpatialMode() : activateSpatialMode();
};

export const subscribeSpatialState = (listener: SpatialListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const defaultContext: SpatialContextValue = {
  ...spatialState,
  enterSpatialMode: activateSpatialMode,
  exitSpatialMode: deactivateSpatialMode,
  toggleSpatialMode: toggleSpatialModeState,
};

const SpatialContext = createContext<SpatialContextValue>(defaultContext);

export const SpatialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SpatialState>(() => initializeSpatialState());

  useEffect(() => subscribeSpatialState(setState), []);

  const contextValue = useMemo<SpatialContextValue>(
    () => ({
      ...state,
      enterSpatialMode: activateSpatialMode,
      exitSpatialMode: deactivateSpatialMode,
      toggleSpatialMode: toggleSpatialModeState,
    }),
    [state],
  );

  useEffect(() => {
    const detection = detectSpatialSupport();
    applyState({ supported: detection.supported, mode: detection.mode });
    if (detection.hinted && !detectionLogged) {
      detectionLogged = true;
      logInfo('spatial', '[SPATIAL] XR hint detected (navigator.xr present or ?spatial flag).');
    }
  }, []);

  return <SpatialContext.Provider value={contextValue}>{children}</SpatialContext.Provider>;
};

export const useSpatial = (): SpatialContextValue => useContext(SpatialContext);
