"use client";

import type {
  MyBoardResponse,
  OpponentBoardResponse,
  ShotCellResponse,
} from "@/lib/api/types";
import { getShipCells, cellKey } from "@/lib/game";
import { BoardGrid, type CellState } from "./board-grid";

interface GameOverPanelProps {
  isWinner: boolean;
  winnerName: string;
  opponentName: string;
  myShots: number;
  myHits: number;
  opponentShots: number;
  opponentHits: number;
  durationSeconds: number | null;
  myBoard: MyBoardResponse | null;
  opponentBoard: OpponentBoardResponse | null;
}

// ─── Cell-building helpers ───────────────────────────────────────────────────

function buildMyBoardCells(myBoard: MyBoardResponse): Map<string, CellState> {
  const cells = new Map<string, CellState>();

  for (const ship of myBoard.ships) {
    const shipCells = getShipCells(
      ship.row,
      ship.col,
      ship.size,
      ship.orientation,
    );
    for (const cell of shipCells) {
      cells.set(cellKey(cell.row, cell.col), { type: "ship" });
    }
  }

  for (const shot of myBoard.shotsReceived) {
    const key = cellKey(shot.row, shot.col);
    const existing = cells.get(key);
    if (shot.result === "SUNK") {
      cells.set(key, { type: "sunk" });
    } else if (existing?.type === "ship" || shot.result === "HIT") {
      cells.set(key, { type: "hit" });
    } else {
      cells.set(key, { type: "miss" });
    }
  }

  return cells;
}

function buildOpponentBoardCells(
  shotsFired: ShotCellResponse[],
): Map<string, CellState> {
  const cells = new Map<string, CellState>();

  for (const shot of shotsFired) {
    const key = cellKey(shot.row, shot.col);
    if (shot.result === "SUNK") {
      cells.set(key, { type: "sunk" });
    } else if (shot.result === "HIT") {
      cells.set(key, { type: "hit" });
    } else {
      cells.set(key, { type: "miss" });
    }
  }

  return cells;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GameOverPanel({
  isWinner,
  winnerName,
  opponentName,
  myShots,
  myHits,
  opponentShots,
  opponentHits,
  durationSeconds,
  myBoard,
  opponentBoard,
}: GameOverPanelProps) {
  const myAccuracy = myShots > 0 ? Math.round((myHits / myShots) * 100) : 0;
  const opponentAccuracy =
    opponentShots > 0 ? Math.round((opponentHits / opponentShots) * 100) : 0;

  const myBoardCells = myBoard
    ? buildMyBoardCells(myBoard)
    : new Map<string, CellState>();
  const opponentBoardCells = opponentBoard
    ? buildOpponentBoardCells(opponentBoard.shotsFired)
    : new Map<string, CellState>();

  function formatDuration(seconds: number | null): string {
    if (seconds === null) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-5xl h-full print:h-auto">
      {/* Header — result banner + opponent + duration */}
      <div
        className={`w-full flex items-center justify-between px-6 py-3 rounded-t-xl border border-b-0 ${
          isWinner
            ? "bg-gradient-to-r from-success/20 via-success/10 to-transparent border-success/30"
            : "bg-gradient-to-r from-danger/20 via-danger/10 to-transparent border-danger/30"
        } print:border-black print:bg-white`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl print:text-2xl">
            {isWinner ? "🏴‍☠️" : "💀"}
          </span>
          <div>
            <h1
              className={`text-xl font-bold ${isWinner ? "text-success" : "text-danger"} print:text-black`}
            >
              {isWinner ? "Victory!" : "Defeat"}
            </h1>
            <p className="text-xs text-text-muted print:text-black">
              vs{" "}
              <span className="font-semibold text-text-primary print:text-black">
                {opponentName}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-muted print:text-black">
            ⏱️ {formatDuration(durationSeconds)}
          </span>
        </div>
      </div>

      {/* Main content — boards + stats side by side */}
      <div className="w-full flex-1 flex flex-col lg:flex-row border border-border rounded-b-xl bg-surface-elevated overflow-hidden print:border-black">
        {/* Boards section */}
        <div className="flex-1 flex items-center justify-center gap-4 p-4 print:p-2">
          {myBoard && <BoardGrid title="My Fleet" cells={myBoardCells} />}
          {opponentBoard && (
            <BoardGrid title="Enemy Waters" cells={opponentBoardCells} />
          )}
        </div>

        {/* Stats sidebar */}
        <div className="lg:w-56 border-t lg:border-t-0 lg:border-l border-border-light bg-surface-secondary/50 flex flex-col print:border-black">
          {/* Player vs Player */}
          <div className="grid grid-cols-3 px-3 py-2 border-b border-border-light">
            <div className="text-left">
              <p className="text-[10px] text-text-muted uppercase">You</p>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-[10px] font-bold text-text-muted">VS</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-text-muted uppercase">Enemy</p>
            </div>
          </div>

          {/* Stat rows */}
          <div className="flex-1 flex flex-col justify-center divide-y divide-border-light">
            <CompactStatRow
              icon="💣"
              label="Shots"
              myValue={myShots}
              opponentValue={opponentShots}
            />
            <CompactStatRow
              icon="🎯"
              label="Hits"
              myValue={myHits}
              opponentValue={opponentHits}
              highlightBetter
            />
            <CompactStatRow
              icon="🧭"
              label="Accuracy"
              myValue={`${myAccuracy}%`}
              opponentValue={`${opponentAccuracy}%`}
              myRaw={myAccuracy}
              opponentRaw={opponentAccuracy}
              highlightBetter
            />
          </div>

          {/* Winner banner */}
          <div
            className={`flex items-center justify-center gap-2 px-3 py-2 ${
              isWinner
                ? "bg-success-bg border-t border-success-border"
                : "bg-danger-bg border-t border-danger-border"
            } print:bg-white print:border-black`}
          >
            <span className="text-sm">{isWinner ? "👑" : "⚔️"}</span>
            <span
              className={`text-xs font-bold ${
                isWinner ? "text-success" : "text-danger"
              } print:text-black`}
            >
              {winnerName} wins!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CompactStatRow sub-component ────────────────────────────────────────────

function CompactStatRow({
  icon,
  label,
  myValue,
  opponentValue,
  myRaw,
  opponentRaw,
  highlightBetter = false,
}: {
  icon: string;
  label: string;
  myValue: number | string;
  opponentValue: number | string;
  myRaw?: number;
  opponentRaw?: number;
  highlightBetter?: boolean;
}) {
  const myNum = myRaw ?? (typeof myValue === "number" ? myValue : 0);
  const oppNum =
    opponentRaw ?? (typeof opponentValue === "number" ? opponentValue : 0);
  const myBetter = highlightBetter && myNum > oppNum;
  const oppBetter = highlightBetter && oppNum > myNum;

  return (
    <div className="grid grid-cols-3 items-center px-3 py-2">
      <div
        className={`text-left text-sm font-bold ${myBetter ? "text-success" : "text-text-primary"} print:text-black`}
      >
        {myValue}
      </div>
      <div className="flex flex-col items-center gap-0">
        <span className="text-sm">{icon}</span>
        <span className="text-[9px] uppercase tracking-wider text-text-muted font-medium print:text-black">
          {label}
        </span>
      </div>
      <div
        className={`text-right text-sm font-bold ${oppBetter ? "text-danger" : "text-text-primary"} print:text-black`}
      >
        {opponentValue}
      </div>
    </div>
  );
}
