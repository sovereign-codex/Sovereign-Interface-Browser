export interface BuildingState {
  id: string;
  level: number;
  status: string;
  lastAction?: string;
  metadata?: Record<string, unknown>;
  boundToIAmNode?: boolean;
}

export interface BuildingActionResult {
  ok: boolean;
  detail?: string;
  data?: unknown;
}

export interface BuildingModule {
  getState: () => BuildingState;
  levelUp: () => BuildingState;
  getDescription: () => string;
  runBuildingAction: (action: string, payload?: unknown) => BuildingActionResult;
  bindToIAmNode: () => void;
}

export interface BuildingMetadata {
  id: string;
  title: string;
  description: string;
  archetype: string;
  path: string;
}

export type GridCellStatus = 'empty' | 'occupied' | 'locked';

export interface GridCell {
  id: string;
  building: string | null;
  status: GridCellStatus;
  metadata?: Record<string, unknown>;
}

export type WorldGrid = GridCell[][];
