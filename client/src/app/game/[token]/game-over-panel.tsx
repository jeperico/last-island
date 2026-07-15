"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type {
  GameStateResponse,
  UserResponse,
  MyBoardResponse,
  ShotCellResponse,
} from "@/lib/api/types";
import { getShipCells, cellKey } from "@/lib/game";
import { formatBounty } from "@/lib/format";
import { BoardGrid, type CellState } from "./board-grid";

// ─── Props ───────────────────────────────────────────────────────────────────

interface GameOverPanelProps {
  gameState: GameStateResponse;
  user: UserResponse;
  onClose: () => void;
}

// ─── Ship sizes (standard fleet) ─────────────────────────────────────────────

const FLEET_SHIP_SIZES = [5, 4, 3, 3, 2];

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

// ─── Ships sunk calculation ──────────────────────────────────────────────────

function countMyShipsLost(myBoard: MyBoardResponse): number {
  const hitPositions = new Set<string>();
  for (const shot of myBoard.shotsReceived) {
    if (shot.result === "HIT" || shot.result === "SUNK") {
      hitPositions.add(cellKey(shot.row, shot.col));
    }
  }

  let sunkCount = 0;
  for (const ship of myBoard.ships) {
    const shipCells = getShipCells(
      ship.row,
      ship.col,
      ship.size,
      ship.orientation,
    );
    const allHit = shipCells.every((cell) =>
      hitPositions.has(cellKey(cell.row, cell.col)),
    );
    if (allHit) sunkCount++;
  }
  return sunkCount;
}

function countOpponentShipsSunk(shotsFired: ShotCellResponse[]): number {
  // Count cells with SUNK result. Each ship's cells all become SUNK when the ship sinks.
  // However, some backends mark only the killing-blow cell as SUNK, leaving others as HIT.
  // So count HIT + SUNK cells and greedily assign to ship sizes.
  const hitOrSunkCells = shotsFired.filter(
    (s) => s.result === "SUNK" || s.result === "HIT",
  ).length;

  // Greedily assign to ships from the standard fleet
  let remaining = hitOrSunkCells;
  let count = 0;
  for (const size of FLEET_SHIP_SIZES) {
    if (remaining >= size) {
      remaining -= size;
      count++;
    } else {
      break;
    }
  }
  return count;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GameOverPanel({ gameState, user, onClose }: GameOverPanelProps) {
  // Data derivation
  const isBlue = user.name === gameState.bluePlayerName;

  const myName = isBlue ? gameState.bluePlayerName : (gameState.redPlayerName ?? "Unknown");
  const myAvatar = isBlue ? gameState.bluePlayerAvatar : gameState.redPlayerAvatar;
  const myRank = isBlue ? gameState.bluePlayerRank : gameState.redPlayerRank;
  const myBounty = (isBlue ? gameState.bluePlayerBounty : gameState.redPlayerBounty) ?? 0;
  const myWins = (isBlue ? gameState.bluePlayerWins : gameState.redPlayerWins) ?? 0;
  const myAccuracy = (isBlue ? gameState.bluePlayerAccuracy : gameState.redPlayerAccuracy) ?? 0;

  const oppName = isBlue ? (gameState.redPlayerName ?? "Unknown") : gameState.bluePlayerName;
  const oppAvatar = isBlue ? gameState.redPlayerAvatar : gameState.bluePlayerAvatar;
  const oppRank = isBlue ? gameState.redPlayerRank : gameState.bluePlayerRank;
  const oppBounty = (isBlue ? gameState.redPlayerBounty : gameState.bluePlayerBounty) ?? 0;
  const oppWins = (isBlue ? gameState.redPlayerWins : gameState.bluePlayerWins) ?? 0;
  const oppAccuracy = (isBlue ? gameState.redPlayerAccuracy : gameState.bluePlayerAccuracy) ?? 0;

  const isWinner = gameState.winnerName === user.name;
  const bountyDelta = gameState.bountyDelta ?? 0;

  // Compute previous bounty
  const prevBounty = isWinner ? myBounty - bountyDelta : myBounty + bountyDelta;

  // Ships sunk
  const mySunkCount = gameState.opponentBoard
    ? countOpponentShipsSunk(gameState.opponentBoard.shotsFired)
    : 0;
  const oppSunkCount = gameState.myBoard
    ? countMyShipsLost(gameState.myBoard)
    : 0;

  // Board cells
  const myBoardCells = gameState.myBoard
    ? buildMyBoardCells(gameState.myBoard)
    : new Map<string, CellState>();
  const opponentBoardCells = gameState.opponentBoard
    ? buildOpponentBoardCells(gameState.opponentBoard.shotsFired)
    : new Map<string, CellState>();

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function handleClose() {
    onClose();
  }

  // Format rank for display
  function displayRank(rank: string | null): string {
    if (!rank) return "Unknown";
    return rank.replace(/_/g, " ");
  }

  // Bounty delta display
  const deltaSign = isWinner ? "+" : "-";
  const deltaColor = isWinner ? "text-success" : "text-danger";

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className="relative w-[90vw] max-w-7xl h-[90vh] max-h-[900px] rounded-xl overflow-hidden border border-border bg-surface"
        style={{ animation: "character-select-in 300ms ease-out forwards" }}
      >
        {/* Close button (×) */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-surface-secondary/80 text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Three-column grid */}
        <div className="grid grid-cols-[1fr_2fr_1fr] h-full">
          {/* Left column — My player */}
          <PlayerColumn
            name={myName}
            avatar={myAvatar}
            rank={displayRank(myRank)}
            bounty={myBounty}
            wins={myWins}
            accuracy={myAccuracy}
            isWinner={isWinner}
          />

          {/* Middle column */}
          <div className="flex flex-col items-center justify-between py-6 px-4 bg-surface-elevated overflow-hidden">
            {/* Top score card */}
            <div className="w-full max-w-sm bg-surface-secondary/90 rounded-lg p-4 text-center">
              {/* Ships sunk comparison */}
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-2xl font-black text-text-primary">
                  {mySunkCount}
                </span>
                <span className="text-xl">⚔️</span>
                <span className="text-2xl font-black text-text-primary">
                  {oppSunkCount}
                </span>
              </div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3">
                Ships Sunk
              </p>

              {/* Bounty change */}
              {bountyDelta > 0 ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-text-secondary">₿</span>
                  <span className="text-text-secondary">
                    {formatBounty(prevBounty)}
                  </span>
                  <span className="text-text-muted">→</span>
                  <span className="text-text-primary font-bold">
                    {formatBounty(myBounty)}
                  </span>
                  <span className={`font-bold ${deltaColor}`}>
                    ({deltaSign}{formatBounty(bountyDelta)})
                  </span>
                </div>
              ) : (
                <p className="text-sm text-text-muted">—</p>
              )}
            </div>

            {/* Boards section */}
            <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
              <div className="flex gap-4 justify-center items-center" style={{ transform: "scale(0.85)" }}>
                {gameState.myBoard && (
                  <BoardGrid title="My Fleet" cells={myBoardCells} />
                )}
                {gameState.opponentBoard && (
                  <BoardGrid title="Enemy Waters" cells={opponentBoardCells} />
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Return to Grand Line
            </button>
          </div>

          {/* Right column — Opponent */}
          <PlayerColumn
            name={oppName}
            avatar={oppAvatar}
            rank={displayRank(oppRank)}
            bounty={oppBounty}
            wins={oppWins}
            accuracy={oppAccuracy}
            isWinner={!isWinner}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// ─── Player Column sub-component ─────────────────────────────────────────────

function PlayerColumn({
  name,
  avatar,
  rank,
  bounty,
  wins,
  accuracy,
  isWinner,
}: {
  name: string;
  avatar: string | null;
  rank: string;
  bounty: number;
  wins: number;
  accuracy: number;
  isWinner: boolean;
}) {
  const hasAvatar = avatar !== null;
  const avatarPath = hasAvatar
    ? `/avatars/${avatar.toLowerCase()}/full-body.jpg`
    : null;

  const borderColor = isWinner
    ? "border-b-4 border-b-success shadow-[0_4px_20px_rgba(34,197,94,0.3)]"
    : "border-b-4 border-b-danger/50";

  return (
    <div
      className={`relative flex flex-col justify-end overflow-hidden ${borderColor}`}
      style={
        avatarPath
          ? {
              backgroundImage: `url(${avatarPath})`,
              backgroundSize: "cover",
              backgroundPosition: "center bottom",
            }
          : undefined
      }
    >
      {/* Fallback background for null avatar */}
      {!hasAvatar && (
        <div className="absolute inset-0 bg-surface-elevated" />
      )}

      {/* Dark gradient overlay at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Stats overlay — bottom aligned */}
      <div className="relative z-10 p-4 flex flex-col gap-1">
        {/* Crown for winner */}
        {isWinner && (
          <span className="text-2xl mb-1">👑</span>
        )}

        {/* Name */}
        <p className="text-lg font-bold text-white truncate">{name}</p>

        {/* Rank */}
        <p className="text-xs text-gray-300 uppercase tracking-wider">
          {rank}
        </p>

        {/* Bounty */}
        <p className="text-sm text-secondary font-semibold">
          ₿ {formatBounty(bounty)}
        </p>

        {/* Wins + Accuracy */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
          <span>{wins}W</span>
          <span>•</span>
          <span>{accuracy}%</span>
        </div>
      </div>
    </div>
  );
}
