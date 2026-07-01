"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { fireShot, getGame } from "@/lib/api";
import type {
  GameStateResponse,
  UserResponse,
  ShotCellResponse,
} from "@/lib/api/types";
import { getShipCells, cellKey } from "@/lib/game";
import { BoardGrid, type CellState } from "./board-grid";

interface BattleScreenProps {
  gameState: GameStateResponse;
  user: UserResponse;
  gameToken: string;
  onGameStateUpdate: (state: GameStateResponse) => void;
}

export function BattleScreen({
  gameState,
  user,
  gameToken,
  onGameStateUpdate,
}: BattleScreenProps) {
  const [firing, setFiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticShots, setOptimisticShots] = useState<ShotCellResponse[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMyTurn = gameState.currentTurnPlayerName === user.name;

  // Merge server shots with optimistic shots
  const allShotsFired = useMemo(() => {
    const serverShots = gameState.opponentBoard?.shotsFired ?? [];
    const serverKeys = new Set(serverShots.map((s) => cellKey(s.row, s.col)));
    // Only include optimistic shots not yet in server state
    const newOptimistic = optimisticShots.filter(
      (s) => !serverKeys.has(cellKey(s.row, s.col)),
    );
    return [...serverShots, ...newOptimistic];
  }, [gameState.opponentBoard?.shotsFired, optimisticShots]);

  // Build My Board cell map
  const myBoardCells = buildMyBoardCells(gameState);

  // Build Opponent Board cell map
  const opponentBoardCells = buildOpponentBoardCells(allShotsFired);

  // Polling: active when it's not my turn
  useEffect(() => {
    if (isMyTurn || gameState.phase === "FINISHED") {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await getGame(gameToken);
        onGameStateUpdate(response);
        if (
          response.currentTurnPlayerName === user.name ||
          response.phase === "FINISHED"
        ) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isMyTurn, gameState.phase, gameToken, onGameStateUpdate, user.name]);

  const handleFire = useCallback(
    async (row: number, col: number) => {
      if (!isMyTurn || firing) return;

      // Check if cell already shot
      const key = cellKey(row, col);
      const existingShot = allShotsFired.find(
        (s) => cellKey(s.row, s.col) === key,
      );
      if (existingShot) return;

      setFiring(true);
      setError(null);

      try {
        const response = await fireShot(gameToken, { row, col });

        // Optimistically add the shot to local state
        const newShot: ShotCellResponse = {
          row,
          col,
          result: response.result,
          sunkShipType: response.sunkShipType,
        };
        setOptimisticShots((prev) => [...prev, newShot]);

        if (response.gameOver) {
          // Refetch full game state to trigger FINISHED phase in parent
          const updatedState = await getGame(gameToken);
          onGameStateUpdate(updatedState);
        } else {
          // Turn switches — refetch to get updated currentTurnPlayerName
          const updatedState = await getGame(gameToken);
          onGameStateUpdate(updatedState);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fire shot",
        );
      } finally {
        setFiring(false);
      }
    },
    [isMyTurn, firing, allShotsFired, gameToken, onGameStateUpdate],
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
      {/* Turn indicator */}
      <div className="flex items-center justify-center">
        {isMyTurn ? (
          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Your Turn — Fire!
          </span>
        ) : (
          <span className="animate-pulse rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Opponent&apos;s Turn — Waiting…
          </span>
        )}
      </div>

      {/* Grids */}
      <div className="flex flex-wrap items-start justify-center gap-8">
        <BoardGrid title="My Fleet" cells={myBoardCells} />
        <BoardGrid
          title="Enemy Waters"
          cells={opponentBoardCells}
          interactive={true}
          disabled={!isMyTurn || firing}
          onCellClick={handleFire}
        />
      </div>

      {/* Firing indicator */}
      {firing && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Firing…
        </p>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 font-bold hover:text-red-900 dark:hover:text-red-300"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function buildMyBoardCells(gameState: GameStateResponse): Map<string, CellState> {
  const cells = new Map<string, CellState>();

  if (!gameState.myBoard) return cells;

  // Mark ship cells
  for (const ship of gameState.myBoard.ships) {
    const shipCells = getShipCells(ship.row, ship.col, ship.size, ship.orientation);
    for (const cell of shipCells) {
      cells.set(cellKey(cell.row, cell.col), { type: "ship" });
    }
  }

  // Overlay shots received
  for (const shot of gameState.myBoard.shotsReceived) {
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
