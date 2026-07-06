"use client";

import Link from "next/link";
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

  // Mark ship cells
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

  // Overlay shots received
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
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl px-4">
      {/* Section 1 — Banner */}
      {isWinner ? (
        <div className="flex flex-col items-center gap-2 print:text-black">
          <span className="text-5xl">🏴‍☠️</span>
          <h1 className="text-3xl font-bold text-success">Victory!</h1>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 print:text-black">
          <span className="text-5xl">💀</span>
          <h1 className="text-3xl font-bold text-danger">Defeat</h1>
        </div>
      )}

      {/* Opponent subtitle */}
      <p className="text-text-muted text-sm print:text-black">
        vs{" "}
        <span className="font-semibold text-text-primary">{opponentName}</span>
      </p>

      {/* Section 2 — Boards */}
      <div className="game-results-boards flex flex-wrap items-start justify-center gap-6 w-full">
        {myBoard && <BoardGrid title="My Fleet" cells={myBoardCells} />}
        {opponentBoard && (
          <BoardGrid title="Enemy Waters" cells={opponentBoardCells} />
        )}
      </div>

      {/* Section 3 — Stats card */}
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface-elevated overflow-hidden">
        {/* Duration banner */}
        <div className="flex items-center justify-center gap-2 border-b border-border bg-surface-secondary px-4 py-2.5">
          <span className="text-base">⏱️</span>
          <span className="text-sm font-medium text-text-secondary">
            {formatDuration(durationSeconds)}
          </span>
        </div>

        {/* Player comparison */}
        <div className="grid grid-cols-3 px-4 py-3 border-b border-border-light">
          <div className="text-left">
            <p className="text-xs text-text-muted uppercase tracking-wide">
              You
            </p>
            <p className="text-sm font-semibold text-text-primary truncate">
              {winnerName === opponentName
                ? "—"
                : isWinner
                  ? winnerName
                  : "You"}
            </p>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-xs font-bold text-text-muted">VS</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted uppercase tracking-wide">
              Enemy
            </p>
            <p className="text-sm font-semibold text-text-primary truncate">
              {opponentName}
            </p>
          </div>
        </div>

        {/* Stat rows */}
        <div className="divide-y divide-border-light">
          <StatRow
            icon="💣"
            label="Cannonballs"
            myValue={myShots}
            opponentValue={opponentShots}
          />
          <StatRow
            icon="🎯"
            label="Direct Hits"
            myValue={myHits}
            opponentValue={opponentHits}
            highlightBetter
          />
          <StatRow
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
          className={`flex items-center justify-center gap-2 px-4 py-3 ${
            isWinner
              ? "bg-success-bg border-t border-success-border"
              : "bg-danger-bg border-t border-danger-border"
          }`}
        >
          <span className="text-base">{isWinner ? "👑" : "⚔️"}</span>
          <span
            className={`text-sm font-bold ${
              isWinner ? "text-success" : "text-danger"
            }`}
          >
            {winnerName} wins!
          </span>
        </div>
      </div>

      {/* Section 4 — Navigation */}
      <div className="print:hidden">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-ring"
        >
          Back to Grand Line
        </Link>
      </div>
    </div>
  );
}

// ─── StatRow sub-component ───────────────────────────────────────────────────

function StatRow({
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
    <div className="grid grid-cols-3 items-center px-4 py-3">
      <div
        className={`text-left text-lg font-bold ${myBetter ? "text-success" : "text-text-primary"}`}
      >
        {myValue}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
          {label}
        </span>
      </div>
      <div
        className={`text-right text-lg font-bold ${oppBetter ? "text-danger" : "text-text-primary"}`}
      >
        {opponentValue}
      </div>
    </div>
  );
}
