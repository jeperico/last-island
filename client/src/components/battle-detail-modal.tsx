"use client";

import { useEffect, useState } from "react";
import type {
  BattleLogEntryResponse,
  GameStateResponse,
  MyBoardResponse,
  ShotCellResponse,
} from "@/lib/api/types";
import { getGame } from "@/lib/api";
import { cellKey, getShipCells } from "@/lib/game";
import { Modal, Spinner } from "@/components/ui";
import { BoardGrid, type CellState } from "../app/game/[token]/board-grid";

interface BattleDetailModalProps {
  entry: BattleLogEntryResponse | null;
  open: boolean;
  onClose: () => void;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function formatDuration(duration: string | null): string {
  if (!duration) return "—";
  return duration;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BattleDetailModal({
  entry,
  open,
  onClose,
}: BattleDetailModalProps) {
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entry || !open) {
      setGameState(null);
      return;
    }

    setLoading(true);
    getGame(entry.token)
      .then(setGameState)
      .catch(() => setGameState(null))
      .finally(() => setLoading(false));
  }, [entry, open]);

  if (!entry) return null;

  const isVictory = entry.result === "VICTORY";

  const myBoardCells = gameState?.myBoard
    ? buildMyBoardCells(gameState.myBoard)
    : new Map<string, CellState>();

  const opponentBoardCells = gameState?.opponentBoard
    ? buildOpponentBoardCells(gameState.opponentBoard.shotsFired)
    : new Map<string, CellState>();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Battle Details"
      className="max-w-4xl"
    >
      <div className="rounded-xl border border-border bg-surface-elevated overflow-hidden shadow-2xl">
        {/* Header banner — themed by result */}
        <div
          className={`relative px-6 py-5 ${
            isVictory
              ? "bg-gradient-to-r from-success/20 via-success/10 to-transparent border-b border-success/30"
              : "bg-gradient-to-r from-danger/20 via-danger/10 to-transparent border-b border-danger/30"
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">{isVictory ? "🏴‍☠️" : "💀"}</span>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xl font-bold ${isVictory ? "text-success" : "text-danger"}`}
                >
                  {isVictory ? "Victory" : "Defeat"}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-0.5">
                vs{" "}
                <span className="font-semibold text-text-primary">
                  {entry.opponentName}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border-light border-b border-border-light bg-surface-secondary/50">
          <StatItem emoji="🎯" value={String(entry.shotsFired)} label="Shots" />
          <StatItem emoji="🚢" value={String(entry.shipsSunk)} label="Sunk" />
          <StatItem
            emoji="⏱️"
            value={formatDuration(entry.duration)}
            label="Duration"
          />
          <StatItem emoji="📅" value={formatDate(entry.date)} label="Date" />
        </div>

        {/* Boards section */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-text-muted">Loading battle map...</p>
            </div>
          ) : (
            <>
              {(gameState?.myBoard || gameState?.opponentBoard) && (
                <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8">
                  {gameState?.myBoard && (
                    <div className="flex flex-col items-center gap-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        🛡️ My Fleet
                      </h3>
                      <div className="rounded-lg border border-border-light p-2 bg-surface-secondary/30">
                        <BoardGrid title="" cells={myBoardCells} />
                      </div>
                    </div>
                  )}
                  {gameState?.opponentBoard && (
                    <div className="flex flex-col items-center gap-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        ⚔️ Enemy Waters
                      </h3>
                      <div className="rounded-lg border border-border-light p-2 bg-surface-secondary/30">
                        <BoardGrid title="" cells={opponentBoardCells} />
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!gameState?.myBoard && !gameState?.opponentBoard && (
                <div className="flex flex-col items-center py-12 gap-2">
                  <span className="text-3xl">🗺️</span>
                  <p className="text-text-muted text-sm">
                    Board data unavailable for this battle.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── StatItem sub-component ──────────────────────────────────────────────────

function StatItem({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center py-3 px-2">
      <span className="text-base" aria-hidden="true">
        {emoji}
      </span>
      <span className="text-sm font-bold text-text-primary mt-1">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
    </div>
  );
}
