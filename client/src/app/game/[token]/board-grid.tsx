"use client";

export type CellState = {
  type: "empty" | "ship" | "hit" | "miss" | "sunk";
};

interface BoardGridProps {
  title: string;
  cells: Map<string, CellState>;
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
  interactive?: boolean;
}

const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const COL_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function getCellClasses(state: CellState, interactive: boolean): string {
  const base = "board-cell h-8 w-8 flex items-center justify-center text-xs font-bold border border-border transition-colors";

  switch (state.type) {
    case "empty":
      return `${base} bg-sky-900/40 ${interactive ? "cursor-pointer hover:bg-sky-800/50" : ""}`;
    case "ship":
      return `${base} bg-teal-700 text-white`;
    case "hit":
      return `${base} bg-[var(--color-danger)] text-white`;
    case "miss":
      return `${base} bg-slate-700 text-text-muted opacity-70`;
    case "sunk":
      return `${base} bg-purple-800 text-white border-purple-900`;
    default:
      return base;
  }
}

function getCellContent(state: CellState): string {
  switch (state.type) {
    case "hit":
    case "sunk":
      return "✕";
    case "miss":
      return "○";
    default:
      return "";
  }
}

export function BoardGrid({
  title,
  cells,
  onCellClick,
  disabled = false,
  interactive = false,
}: BoardGridProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">
        {title}
      </h2>
      <div className={disabled ? "pointer-events-none opacity-60" : ""}>
        {/* Column labels */}
        <div className="flex">
          <div className="h-6 w-6" /> {/* Spacer for row labels */}
          {COL_LABELS.map((label) => (
            <div
              key={label}
              className="flex h-6 w-8 items-center justify-center text-xs font-medium text-text-muted"
            >
              {label}
            </div>
          ))}
        </div>
        {/* Grid rows */}
        {ROW_LABELS.map((rowLabel, rowIdx) => (
          <div key={rowLabel} className="flex">
            {/* Row label */}
            <div className="flex h-8 w-6 items-center justify-center text-xs font-medium text-text-muted">
              {rowLabel}
            </div>
            {/* Cells */}
            {COL_LABELS.map((_, colIdx) => {
              const key = cellKey(rowIdx, colIdx);
              const state = cells.get(key) ?? { type: "empty" as const };
              const isClickable = interactive && state.type === "empty";
              return (
                <div
                  key={key}
                  className={getCellClasses(state, isClickable)}
                  onClick={
                    isClickable && onCellClick
                      ? () => onCellClick(rowIdx, colIdx)
                      : undefined
                  }
                  role={isClickable ? "button" : undefined}
                  aria-label={
                    isClickable
                      ? `Fire at ${rowLabel}${colIdx + 1}`
                      : `Cell ${rowLabel}${colIdx + 1}: ${state.type}`
                  }
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={
                    isClickable && onCellClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onCellClick(rowIdx, colIdx);
                          }
                        }
                      : undefined
                  }
                >
                  {getCellContent(state)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
