import { WorldGrid, GridCell, GridCellStatus } from '../core/types';

const GRID_SIZE = 3;

const createCellId = (row: number, col: number): string => `cell-${row}-${col}`;

const defaultGrid: WorldGrid = [
  [
    { id: createCellId(0, 0), building: 'Workshop', status: 'occupied' },
    { id: createCellId(0, 1), building: null, status: 'empty' },
    { id: createCellId(0, 2), building: 'Observatory', status: 'occupied' },
  ],
  [
    { id: createCellId(1, 0), building: null, status: 'empty' },
    { id: createCellId(1, 1), building: 'TownHall', status: 'occupied' },
    { id: createCellId(1, 2), building: null, status: 'empty' },
  ],
  [
    { id: createCellId(2, 0), building: 'Gardens', status: 'occupied' },
    { id: createCellId(2, 1), building: 'GuardTower', status: 'occupied' },
    { id: createCellId(2, 2), building: 'PortalGate', status: 'occupied' },
  ],
];

let grid: WorldGrid = defaultGrid.map((row) => row.map((cell) => ({ ...cell })));

const cloneGrid = (): WorldGrid => grid.map((row) => row.map((cell) => ({ ...cell })));

const validateCoords = (row: number, col: number): void => {
  if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE) {
    throw new Error(`Grid coordinates out of bounds: (${row}, ${col})`);
  }
};

export const getGrid = (): WorldGrid => cloneGrid();

export const setCell = (
  row: number,
  col: number,
  payload: Partial<Omit<GridCell, 'id'>> & { status?: GridCellStatus },
): WorldGrid => {
  validateCoords(row, col);
  const existing = grid[row][col];
  grid[row][col] = {
    ...existing,
    ...payload,
    id: existing.id,
    status: payload.status ?? existing.status,
    metadata: payload.metadata ? { ...existing.metadata, ...payload.metadata } : existing.metadata,
  };
  return getGrid();
};

export const moveBuilding = (fromRow: number, fromCol: number, toRow: number, toCol: number): WorldGrid => {
  validateCoords(fromRow, fromCol);
  validateCoords(toRow, toCol);

  const source = grid[fromRow][fromCol];
  const target = grid[toRow][toCol];

  grid[toRow][toCol] = {
    ...target,
    building: source.building,
    status: source.building ? 'occupied' : target.status,
  };

  grid[fromRow][fromCol] = {
    ...source,
    building: null,
    status: 'empty',
  };

  return getGrid();
};

export const listBuildings = (): GridCell[] =>
  cloneGrid()
    .flat()
    .filter((cell) => Boolean(cell.building));
