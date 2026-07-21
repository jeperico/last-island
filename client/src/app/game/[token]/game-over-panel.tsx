"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type {
  GameStateResponse,
  UserResponse,
  MyBoardResponse,
  ShotCellResponse,
  ShipType,
} from "@/lib/api/types";
import { getShipCells, cellKey, SHIP_SIZES } from "@/lib/game";
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

  // Build a set of hit positions for quick lookup
  const hitPositions = new Set<string>();
  for (const shot of myBoard.shotsReceived) {
    if (shot.result === "HIT" || shot.result === "SUNK") {
      hitPositions.add(cellKey(shot.row, shot.col));
    }
  }

  // Mark ship cells — check if ship is fully sunk (all cells hit)
  for (const ship of myBoard.ships) {
    const shipCells = getShipCells(
      ship.row,
      ship.col,
      ship.size,
      ship.orientation,
    );
    const isSunk = shipCells.every((c) => hitPositions.has(cellKey(c.row, c.col)));
    for (const cell of shipCells) {
      const key = cellKey(cell.row, cell.col);
      if (isSunk) {
        cells.set(key, { type: "sunk" });
      } else if (hitPositions.has(key)) {
        cells.set(key, { type: "hit" });
      } else {
        cells.set(key, { type: "ship" });
      }
    }
  }

  // Mark misses (shots that didn't hit any ship)
  for (const shot of myBoard.shotsReceived) {
    const key = cellKey(shot.row, shot.col);
    if (shot.result === "MISS" && !cells.has(key)) {
      cells.set(key, { type: "miss" });
    }
  }

  return cells;
}

function buildOpponentBoardCells(
  shotsFired: ShotCellResponse[],
): Map<string, CellState> {
  const cells = new Map<string, CellState>();

  // First pass: identify sunk ship types and their final-hit positions
  const sunkShots = shotsFired.filter((s) => s.result === "SUNK" && s.sunkShipType);

  // For each sunk ship, find all HIT/SUNK cells that belong to it
  // by tracing contiguous hit cells from the SUNK cell in a line
  const sunkCellKeys = new Set<string>();

  for (const sunkShot of sunkShots) {
    const shipSize = SHIP_SIZES[sunkShot.sunkShipType as ShipType] ?? 0;
    if (shipSize === 0) continue;

    const hitSet = new Set(
      shotsFired
        .filter((s) => s.result === "HIT" || s.result === "SUNK")
        .map((s) => `${s.row},${s.col}`),
    );

    // Try horizontal line
    const hCells = traceShipLine(sunkShot.row, sunkShot.col, 0, 1, shipSize, hitSet);
    // Try vertical line
    const vCells = traceShipLine(sunkShot.row, sunkShot.col, 1, 0, shipSize, hitSet);

    const shipCells = hCells ?? vCells;
    if (shipCells) {
      for (const key of shipCells) {
        sunkCellKeys.add(key);
      }
    } else {
      sunkCellKeys.add(cellKey(sunkShot.row, sunkShot.col));
    }
  }

  // Second pass: assign cell states
  for (const shot of shotsFired) {
    const key = cellKey(shot.row, shot.col);
    if (sunkCellKeys.has(key)) {
      cells.set(key, { type: "sunk" });
    } else if (shot.result === "HIT") {
      cells.set(key, { type: "hit" });
    } else if (shot.result === "MISS") {
      cells.set(key, { type: "miss" });
    } else if (shot.result === "SUNK") {
      cells.set(key, { type: "sunk" });
    }
  }

  return cells;
}

/**
 * Trace a contiguous line of hit cells through (startRow, startCol) in direction (dr, dc).
 * Returns the cell keys if exactly `size` cells are found in a line, otherwise null.
 */
function traceShipLine(
  startRow: number,
  startCol: number,
  dr: number,
  dc: number,
  size: number,
  hitSet: Set<string>,
): string[] | null {
  let r = startRow;
  let c = startCol;
  // Go backward to find the start of the ship
  while (r - dr >= 0 && r - dr <= 9 && c - dc >= 0 && c - dc <= 9 && hitSet.has(`${r - dr},${c - dc}`)) {
    r -= dr;
    c -= dc;
  }
  // Now go forward collecting cells
  const cells: string[] = [];
  while (r >= 0 && r <= 9 && c >= 0 && c <= 9 && hitSet.has(`${r},${c}`)) {
    cells.push(`${r},${c}`);
    r += dr;
    c += dc;
  }
  // Check if we found exactly the right size and it includes the start cell
  if (cells.length >= size && cells.includes(`${startRow},${startCol}`)) {
    if (cells.length === size) return cells;
    const startIdx = cells.indexOf(`${startRow},${startCol}`);
    for (let i = Math.max(0, startIdx - size + 1); i <= Math.min(startIdx, cells.length - size); i++) {
      const window = cells.slice(i, i + size);
      if (window.includes(`${startRow},${startCol}`)) return window;
    }
  }
  return null;
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
  const [closing, setClosing] = useState(false);

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

  // Haki levels
  const myObservation = (isBlue ? gameState.bluePlayerObservation : gameState.redPlayerObservation) ?? 0;
  const myArmament = (isBlue ? gameState.bluePlayerArmament : gameState.redPlayerArmament) ?? 0;
  const myConquerors = (isBlue ? gameState.bluePlayerConquerors : gameState.redPlayerConquerors) ?? 0;

  const oppObservation = (isBlue ? gameState.redPlayerObservation : gameState.bluePlayerObservation) ?? 0;
  const oppArmament = (isBlue ? gameState.redPlayerArmament : gameState.bluePlayerArmament) ?? 0;
  const oppConquerors = (isBlue ? gameState.redPlayerConquerors : gameState.bluePlayerConquerors) ?? 0;

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
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 250);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={handleClose}
      style={{
        animation: closing ? "character-select-out 250ms ease-in forwards" : undefined,
      }}
    >
      <div
        className="relative w-[90vw] max-w-7xl h-[90vh] max-h-[900px] rounded-xl overflow-hidden border border-border bg-surface"
        style={{ animation: closing ? "character-select-out 250ms ease-in forwards" : "character-select-in 300ms ease-out forwards" }}
        onClick={(e) => e.stopPropagation()}
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
            observation={myObservation}
            armament={myArmament}
            conquerors={myConquerors}
          />

          {/* Middle column */}
          <div className="flex flex-col items-center justify-between py-6 px-4 bg-surface-elevated overflow-hidden">
            {/* Victory/Defeat banner */}
            <p className={`text-4xl font-black uppercase tracking-widest mb-4 ${isWinner ? "text-success" : "text-danger"}`}>
              {isWinner ? "VICTORY" : "DEFEAT"}
            </p>

            {/* Top score card */}
            <div className={`w-full max-w-sm rounded-lg p-4 text-center ${isWinner ? "bg-success/10 border border-success/20" : "bg-danger/10 border border-danger/20"}`}>
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

              {/* +1 Haki Point badge */}
              {isWinner && (isWinner ? myWins : oppWins) <= 3 && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold bg-success/10 text-success border border-success/20">+1 Haki Point</span>
              )}
            </div>

            {/* Boards section */}
            <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
              <div className="flex gap-4 justify-center items-center" style={{ transform: "scale(0.7)" }}>
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
            observation={oppObservation}
            armament={oppArmament}
            conquerors={oppConquerors}
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
  observation,
  armament,
  conquerors,
}: {
  name: string;
  avatar: string | null;
  rank: string;
  bounty: number;
  wins: number;
  accuracy: number;
  isWinner: boolean;
  observation: number;
  armament: number;
  conquerors: number;
}) {
  const hasAvatar = avatar !== null;
  const avatarPath = hasAvatar
    ? `/avatars/${avatar.toLowerCase()}/full-body.jpg`
    : null;

  // Rank-based panel glow (same tier system as avatar-icon)
  function getRankPanelStyle(rank: string): string {
    switch (rank) {
      case "SUPER ROOKIE":
      case "CAPTAIN":
        return "ring-4 ring-inset ring-blue-500/60";
      case "SUPERNOVA":
      case "COMMODORE":
        return "ring-4 ring-inset ring-yellow-500/60 shadow-[inset_0_0_50px_rgba(234,179,8,0.25)]";
      case "SHICHIBUKAI":
      case "VICE ADMIRAL":
        return "ring-[5px] ring-inset ring-purple-500/70 shadow-[inset_0_0_60px_rgba(168,85,247,0.3)]";
      case "YONKO":
      case "ADMIRAL":
        return "ring-[6px] ring-inset ring-red-500/80 shadow-[inset_0_0_80px_rgba(239,68,68,0.35)]";
      case "PIRATE KING":
      case "FLEET ADMIRAL":
        return "ring-[6px] ring-inset ring-white/90 shadow-[inset_0_0_100px_rgba(255,255,255,0.4)]";
      default:
        return "";
    }
  }

  const rankGlow = getRankPanelStyle(rank);

  const borderColor = isWinner
    ? "border-b-[16px] border-b-success shadow-[0_4px_20px_rgba(34,197,94,0.3)]"
    : "border-b-[16px] border-b-danger/50";

  return (
    <div
      className={`relative flex flex-col justify-end overflow-hidden ${borderColor} ${rankGlow}`}
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

        {/* Haki levels */}
        {(observation > 0 || armament > 0 || conquerors > 0) && (
          <div className="flex items-center gap-2 text-xs mt-1">
            {observation > 0 && <span className="text-blue-400">👁 {observation}</span>}
            {armament > 0 && <span className="text-red-400">🦾 {armament}</span>}
            {conquerors > 0 && <span className="text-purple-400">👑 {conquerors}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
