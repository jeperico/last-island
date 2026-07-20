"use client";

export type CellState = {
  type: "empty" | "ship" | "hit" | "miss" | "sunk" | "revealed-ship" | "revealed-empty";
};

interface BoardGridProps {
  title: string;
  cells: Map<string, CellState>;
  onCellClick?: (row: number, col: number) => void;
  onCellHover?: (row: number, col: number) => void;
  onCellLeave?: () => void;
  disabled?: boolean;
  interactive?: boolean;
  mode?: "normal" | "observation" | "conquerors";
  previewCells?: Set<string>;
}

const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const COL_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function getCellClasses(state: CellState, interactive: boolean, isPreview: boolean, mode: "normal" | "observation" | "conquerors"): string {
  const base =
    "board-cell h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center text-xs font-bold rounded-[2px] transition-all duration-200";

  // Preview cells for observation/conquerors
  if (isPreview) {
    if (mode === "observation") {
      return `${base} bg-blue-500/30 border border-blue-400/60 shadow-[0_0_8px_rgba(96,165,250,0.4)] cursor-pointer`;
    }
    if (mode === "conquerors") {
      return `${base} bg-purple-500/30 border border-purple-400/60 shadow-[0_0_8px_rgba(168,85,247,0.4)] cursor-pointer`;
    }
  }

  switch (state.type) {
    case "empty":
      return `${base} bg-sky-950/50 border border-sky-900/40 ${interactive ? "cursor-pointer hover:bg-sky-800/60 hover:shadow-[inset_0_0_6px_rgba(56,189,248,0.15)]" : ""}`;
    case "ship":
      return `${base} bg-teal-700/90 text-white border border-teal-500/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]`;
    case "hit":
      return `${base} bg-gradient-to-br from-red-600 to-orange-600 text-white border border-red-400/50 shadow-[0_0_8px_rgba(239,68,68,0.5)]`;
    case "miss":
      return `${base} bg-blue-900/50 text-blue-400/70 border border-blue-700/30`;
    case "sunk":
      return `${base} bg-gradient-to-br from-purple-700 to-purple-900 text-white border border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.5)]`;
    case "revealed-ship":
      return `${base} bg-purple-500/25 border border-purple-400/50 shadow-[0_0_6px_rgba(168,85,247,0.25)] ${interactive ? "cursor-pointer hover:bg-purple-500/40" : ""}`;
    case "revealed-empty":
      return `${base} bg-blue-400/15 border border-blue-400/35 ${interactive ? "cursor-pointer hover:bg-blue-400/25" : ""}`;
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

function getFrameClasses(mode: "normal" | "observation" | "conquerors"): string {
  const base = "border border-border rounded-lg p-1 bg-surface-secondary/30";
  switch (mode) {
    case "observation":
      return `${base} ring-2 ring-blue-400/40 shadow-[0_0_20px_rgba(96,165,250,0.15)]`;
    case "conquerors":
      return `${base} ring-2 ring-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)]`;
    default:
      return base;
  }
}

function getTitleClasses(mode: "normal" | "observation" | "conquerors"): string {
  const base = "text-sm font-semibold tracking-wide";
  switch (mode) {
    case "observation":
      return `${base} text-blue-300`;
    case "conquerors":
      return `${base} text-purple-300`;
    default:
      return `${base} text-text-primary`;
  }
}

export function BoardGrid({
  title,
  cells,
  onCellClick,
  onCellHover,
  onCellLeave,
  disabled = false,
  interactive = false,
  mode = "normal",
  previewCells,
}: BoardGridProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <h2 className={getTitleClasses(mode)}>{title}</h2>
      <div className={getFrameClasses(mode)}>
        <div className={disabled ? "pointer-events-none opacity-60" : ""}>
          {/* Column labels */}
          <div className="flex">
            <div className="h-6 w-6" /> {/* Spacer for row labels */}
            {COL_LABELS.map((label) => (
              <div
                key={label}
                className="flex h-6 w-7 sm:w-8 items-center justify-center text-xs font-mono font-medium text-text-muted"
              >
                {label}
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {ROW_LABELS.map((rowLabel, rowIdx) => (
            <div key={rowLabel} className="flex">
              {/* Row label */}
              <div className="flex h-7 sm:h-8 w-6 items-center justify-center text-xs font-mono font-medium text-text-muted">
                {rowLabel}
              </div>
              {/* Cells */}
              {COL_LABELS.map((_, colIdx) => {
                const key = cellKey(rowIdx, colIdx);
                const state = cells.get(key) ?? { type: "empty" as const };
                const isClickable = interactive && (state.type === "empty" || state.type === "revealed-ship" || state.type === "revealed-empty" || (mode !== "normal" && state.type !== "hit" && state.type !== "miss" && state.type !== "sunk"));
                const isPreview = previewCells?.has(key) ?? false;
                return (
                  <div
                    key={key}
                    className={getCellClasses(state, isClickable, isPreview, mode)}
                    onClick={
                      isClickable && onCellClick
                        ? () => onCellClick(rowIdx, colIdx)
                        : undefined
                    }
                    onMouseEnter={
                      interactive && onCellHover
                        ? () => onCellHover(rowIdx, colIdx)
                        : undefined
                    }
                    onMouseLeave={onCellLeave ?? undefined}
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
    </div>
  );
}
