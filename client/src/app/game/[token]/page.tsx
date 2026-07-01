"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { getGame } from "@/lib/api";
import type { GamePhase, GameStateResponse } from "@/lib/api/types";
import { ShipPlacement } from "./ship-placement";
import { BattleScreen } from "./battle-screen";

export default function GamePage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  useAuth();
  const params = useParams();
  const token = params.token as string;

  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  // Initial fetch on mount (after auth resolves)
  useEffect(() => {
    if (authLoading || !user) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let cancelled = false;

    async function load() {
      try {
        const response = await getGame(token);
        if (!cancelled) {
          setGameState(response);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load game state",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, token]);

  // Polling: re-check phase every 5 seconds when waiting for opponent actions
  useEffect(() => {
    if (!gameState) return;

    const shouldPoll =
      gameState.phase === "WAITING_OPPONENT" ||
      (gameState.phase === "PLACING_SHIPS" &&
        gameState.myBoard !== null &&
        gameState.myBoard.ships.length > 0);

    if (!shouldPoll) return;

    const interval = setInterval(async () => {
      try {
        const response = await getGame(token);
        setGameState(response);
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [gameState, token]);

  const refetchGame = useCallback(async () => {
    try {
      const response = await getGame(token);
      setGameState(response);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load game state",
      );
    }
  }, [token]);

  function handlePlacementComplete(gamePhase: GamePhase) {
    if (gameState) {
      setGameState({ ...gameState, phase: gamePhase });
    }
    // Re-fetch to get full updated state
    refetchGame();
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded border border-red-300 bg-red-50 px-6 py-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!gameState || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  // Phase: WAITING_OPPONENT
  if (gameState.phase === "WAITING_OPPONENT") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          Waiting for opponent to join…
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Share the game token: <span className="font-mono font-semibold">{token}</span>
        </p>
      </div>
    );
  }

  // Phase: PLACING_SHIPS
  if (gameState.phase === "PLACING_SHIPS") {
    const hasPlacedShips =
      gameState.myBoard !== null && gameState.myBoard.ships.length > 0;

    if (!hasPlacedShips) {
      return (
        <ShipPlacement
          gameToken={token}
          filiation={user.filiation}
          onPlacementComplete={handlePlacementComplete}
        />
      );
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          Waiting for opponent to deploy fleet…
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Your ships are placed. The battle will begin once your opponent is ready.
        </p>
      </div>
    );
  }

  // Phase: IN_PROGRESS
  if (gameState.phase === "IN_PROGRESS") {
    return (
      <BattleScreen
        gameState={gameState}
        user={user}
        gameToken={token}
        onGameStateUpdate={setGameState}
      />
    );
  }

  // Phase: FINISHED
  if (gameState.phase === "FINISHED") {
    const isWinner = gameState.winnerName === user.name;

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
        {isWinner ? (
          <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">
            You won! 🎉
          </h1>
        ) : (
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
            You lost. Better luck next time!
          </h1>
        )}

        {gameState.myBoard && gameState.opponentBoard && (
          <div className="flex flex-wrap items-start justify-center gap-8">
            <BattleScreen
              gameState={gameState}
              user={user}
              gameToken={token}
              onGameStateUpdate={setGameState}
            />
          </div>
        )}

        <Link
          href="/"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Back to Lobby
        </Link>
      </div>
    );
  }

  return null;
}
