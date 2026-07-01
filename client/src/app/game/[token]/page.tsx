"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { getGame } from "@/lib/api";
import type { GamePhase, GameStateResponse } from "@/lib/api/types";
import { ShipPlacement } from "./ship-placement";
import { BattleScreen } from "./battle-screen";
import { GameOverPanel } from "./game-over-panel";
import { Spinner, Alert, EmptyState, Badge } from "@/components/ui";

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
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  if (!gameState || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Phase: WAITING_OPPONENT
  if (gameState.phase === "WAITING_OPPONENT") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <EmptyState
          title="Waiting for opponent to join…"
          description="Share the game token:"
        >
          <Badge variant="neutral">{token}</Badge>
        </EmptyState>
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
        <EmptyState
          title="Waiting for opponent to deploy fleet…"
          description="Your ships are placed. The battle will begin once your opponent is ready."
        />
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
    const opponentName =
      gameState.bluePlayerName === user.name
        ? gameState.redPlayerName ?? "Unknown"
        : gameState.bluePlayerName;
    const myShots = gameState.opponentBoard?.shotsFired.length ?? 0;
    const myHits =
      gameState.opponentBoard?.shotsFired.filter(
        (s) => s.result === "HIT" || s.result === "SUNK",
      ).length ?? 0;
    const opponentShots = gameState.myBoard?.shotsReceived.length ?? 0;
    const opponentHits =
      gameState.myBoard?.shotsReceived.filter(
        (s) => s.result === "HIT" || s.result === "SUNK",
      ).length ?? 0;
    const durationSeconds =
      gameState.startedAt && gameState.endedAt
        ? (new Date(gameState.endedAt).getTime() -
            new Date(gameState.startedAt).getTime()) /
          1000
        : null;

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
        <GameOverPanel
          isWinner={isWinner}
          winnerName={gameState.winnerName ?? "Unknown"}
          opponentName={opponentName}
          myShots={myShots}
          myHits={myHits}
          opponentShots={opponentShots}
          opponentHits={opponentHits}
          durationSeconds={durationSeconds}
        />

        {gameState.myBoard && gameState.opponentBoard && (
          <BattleScreen
            gameState={gameState}
            user={user}
            gameToken={token}
            onGameStateUpdate={setGameState}
            readOnly
          />
        )}
      </div>
    );
  }

  return null;
}
