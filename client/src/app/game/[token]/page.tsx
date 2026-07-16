"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { getGame } from "@/lib/api";
import type { GamePhase, GameStateResponse } from "@/lib/api/types";
import { useGameEvents } from "@/lib/game";
import { useSound } from "@/lib/sound";
import { ShipPlacement } from "./ship-placement";
import { BattleScreen } from "./battle-screen";
import { GameOverPanel } from "./game-over-panel";
import { Spinner, Alert } from "@/components/ui";
import { useWallpaper } from "@/lib/hooks";
import { WallpaperModal } from "@/components/wallpaper-modal";

export default function GamePage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  useAuth();
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const { swapSoundtrack, resumeGlobalSoundtrack, playLaugh } = useSound();
  const prevPhaseRef = useRef<GamePhase | null>(null);
  const { wallpaper, setWallpaper, getWallpaperPath } = useWallpaper();
  const [wallpaperModalOpen, setWallpaperModalOpen] = useState(false);

  // Initial fetch on mount (after auth resolves)
  useEffect(() => {
    if (authLoading || !user) return;

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

  // SSE: subscribe to real-time game events
  const sseEnabled = gameState !== null && gameState.phase !== "FINISHED" && gameState.phase !== "CANCELLED";



  // Soundtrack lifecycle: play battle music on mount, resume global on unmount
  useEffect(() => {
    swapSoundtrack();
    return () => { resumeGlobalSoundtrack(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Game-over audio: fire once on IN_PROGRESS → FINISHED transition
  useEffect(() => {
    if (prevPhaseRef.current === "IN_PROGRESS" && gameState?.phase === "FINISHED" && user) {
      const myAvatar = gameState.bluePlayerName === user.name
        ? gameState.bluePlayerAvatar : gameState.redPlayerAvatar;
      resumeGlobalSoundtrack();
      if (gameState.winnerName === user.name) {
        playLaugh(myAvatar);
      }
    }
    prevPhaseRef.current = gameState?.phase ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  useGameEvents(
    token,
    {
      onOpponentJoined: () => {
        refetchGame();
      },
      onShipsPlaced: () => {
        refetchGame();
      },
      onShotReceived: (data) => {
        refetchGame();
      },
      onGameOver: (data) => {
        resumeGlobalSoundtrack();
        const myAvatar = gameState?.bluePlayerName === user?.name
          ? gameState?.bluePlayerAvatar : gameState?.redPlayerAvatar;
        if (data.winnerName === user?.name) {
          playLaugh(myAvatar ?? null);
        }
        refetchGame();
      },
      onTurnExpired: () => {
        refetchGame();
      },
      onGameExpired: () => {
        resumeGlobalSoundtrack();
        refetchGame();
      },
      onSurrender: () => {
        resumeGlobalSoundtrack();
        refetchGame();
      },
    },
    sseEnabled,
  );

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

  // Derive the user's avatar from game state
  const myAvatar = gameState.bluePlayerName === user.name
    ? gameState.bluePlayerAvatar
    : gameState.redPlayerAvatar;

  // Render phase content
  function renderPhaseContent() {
    if (!gameState || !user) return null;

    // Phase: WAITING_OPPONENT
    if (gameState.phase === "WAITING_OPPONENT") {
      const bgImage = getWallpaperPath(myAvatar);
      return (
        <div className="relative flex flex-1 flex-col items-center justify-center px-4 gap-6">
          {bgImage && (
            <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
              <div
                className="absolute top-1/2 left-1/2 w-[100vh] h-[100vw] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgImage})` }}
              />
            </div>
          )}
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-6xl animate-[bounce_3s_ease-in-out_infinite]">
              ⛵
            </span>
            <h1 className="text-xl font-bold text-text-primary">
              Scanning the horizon…
            </h1>
            <p className="text-sm text-text-muted max-w-sm">
              Waiting for an opponent from the Grand Line…
            </p>
          </div>
        </div>
      );
    }

    // Phase: PLACING_SHIPS
    if (gameState.phase === "PLACING_SHIPS") {
      const hasPlacedShips =
        gameState.myBoard !== null && gameState.myBoard.ships.length > 0;

      if (!hasPlacedShips) {
        const bgImage = getWallpaperPath(myAvatar);
        return (
          <div className="relative flex flex-1 flex-col h-full">
            {bgImage && (
              <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
                <div
                  className="absolute top-1/2 left-1/2 w-[100vh] h-[100vw] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-cover bg-center"
                  style={{ backgroundImage: `url(${bgImage})` }}
                />
              </div>
            )}
            <ShipPlacement
              gameToken={token}
              onPlacementComplete={handlePlacementComplete}
            />
          </div>
        );
      }

      const bgImage = getWallpaperPath(myAvatar);
      return (
        <div className="relative flex flex-1 flex-col items-center justify-center px-4 gap-6">
          {bgImage && (
            <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
              <div
                className="absolute top-1/2 left-1/2 w-[100vh] h-[100vw] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgImage})` }}
              />
            </div>
          )}
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-6xl animate-pulse">🧭</span>
            <h1 className="text-xl font-bold text-text-primary">
              Fleet deployed, Captain!
            </h1>
            <p className="text-sm text-text-muted max-w-sm">
              Your vessels are in position. The enemy is still plotting their
              formation. The clash begins once both fleets set sail.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs text-text-muted font-medium">
              Opponent preparing fleet…
            </span>
          </div>
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
          bgImage={getWallpaperPath(myAvatar)}
        />
      );
    }

    // Phase: FINISHED
    if (gameState.phase === "FINISHED") {
      return <GameOverPanel gameState={gameState} user={user} onClose={() => router.push("/")} />;
    }

    // Phase: CANCELLED
    if (gameState.phase === "CANCELLED") {
      const opponentName =
        gameState.bluePlayerName === user.name
          ? (gameState.redPlayerName ?? "Unknown")
          : gameState.bluePlayerName;

      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">🏳️</span>
            <h1 className="text-3xl font-bold text-warning">W.O.</h1>
            <p className="text-sm text-text-muted max-w-sm">
              The battle against{" "}
              <span className="font-semibold text-text-primary">
                {opponentName}
              </span>{" "}
              ended by walkover. No contest recorded, Captain.
            </p>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="relative flex flex-1 flex-col h-full">
      {/* Persistent back link — top-left */}
      <Link
        href="/"
        className="print:hidden absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary bg-surface-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border hover:border-primary transition-all"
      >
        <span>←</span>
        <span>Grand Line</span>
      </Link>

      {/* Wallpaper picker — top-right */}
      {myAvatar && (
        <button
          type="button"
          onClick={() => setWallpaperModalOpen(true)}
          className="print:hidden absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary bg-surface-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border hover:border-primary transition-all cursor-pointer"
        >
          <span>🎨</span>
          <span>Wallpaper</span>
        </button>
      )}

      {renderPhaseContent()}

      <WallpaperModal
        open={wallpaperModalOpen}
        onClose={() => setWallpaperModalOpen(false)}
        avatar={myAvatar}
        current={wallpaper}
        onSelect={setWallpaper}
      />
    </div>
  );
}
