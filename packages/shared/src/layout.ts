export interface GridPosition {
  column: number;
  row: number;
  width: number;
  height: number;
}

export function normalizePosition(position: Partial<GridPosition>): GridPosition {
  return { column: position.column ?? 1, row: position.row ?? 1, width: position.width ?? 2, height: position.height ?? 2 };
}

export function fitsGrid(position: GridPosition, columns: number, rows: number) {
  return Number.isInteger(position.column) && Number.isInteger(position.row) && Number.isInteger(position.width) && Number.isInteger(position.height)
    && position.column >= 1 && position.row >= 1 && position.width >= 1 && position.height >= 1
    && position.column + position.width - 1 <= columns && position.row + position.height - 1 <= rows;
}

export function positionsOverlap(a: GridPosition, b: GridPosition) {
  return a.column < b.column + b.width && a.column + a.width > b.column && a.row < b.row + b.height && a.row + a.height > b.row;
}

export function canPlace(position: GridPosition, occupied: GridPosition[], columns: number, rows: number) {
  return fitsGrid(position, columns, rows) && !occupied.some((item) => positionsOverlap(position, item));
}
