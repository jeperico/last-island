import type { Orientation } from "@/lib/api/types";

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function getShipCells(
  row: number,
  col: number,
  size: number,
  orientation: Orientation,
): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i < size; i++) {
    if (orientation === "HORIZONTAL") {
      cells.push({ row, col: col + i });
    } else {
      cells.push({ row: row + i, col });
    }
  }
  return cells;
}

export function isInBounds(
  row: number,
  col: number,
  size: number,
  orientation: Orientation,
): boolean {
  if (row < 0 || row > 9 || col < 0 || col > 9) return false;
  if (orientation === "HORIZONTAL") {
    return col + size - 1 <= 9;
  } else {
    return row + size - 1 <= 9;
  }
}

export function hasOverlap(
  cells: { row: number; col: number }[],
  occupiedCells: Set<string>,
): boolean {
  return cells.some((cell) => occupiedCells.has(cellKey(cell.row, cell.col)));
}
