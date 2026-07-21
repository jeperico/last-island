"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { getGame, cancelGame } from "@/lib/api";
import type { GamePhase, GameStateResponse } from "@/lib/api/types";
import { useGameEvents } from "@/lib/game";
import { useSound } from "@/lib/sound";
import { ShipPlacement } from "./ship-placement";
import { BattleScreen } from "./battle-screen";
import { GameOverPanel } from "./game-over-panel";
import { Spinner, Alert, AvatarIcon } from "@/components/ui";
import { formatBounty } from "@/lib/format";
import { SHIP_DISPLAY_NAMES, SHIP_SIZES } from "@/lib/game/ship-config";
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
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [isAssigningArmament, setIsAssigningArmament] = useState(false);
  const [opponentHakiMessage, setOpponentHakiMessage] = useState<string | null>(null);


  const { swapSoundtrack, resumeGlobalSoundtrack, playLaugh, playSunk, playIncomingHit } = useSound();
  const prevPhaseRef = useRef<GamePhase | null>(null);
  const { wallpaper, setWallpaper, getWallpaperPath } = useWallpaper();
  const [wallpaperModalOpen, setWallpaperModalOpen] = useState(false);

  // Initial fetch on mount (after auth resolves)
  const hasFetchedGame = useRef(false);
  useEffect(() => {
    if (authLoading || !user || hasFetchedGame.current) return;
    hasFetchedGame.current = true;

    async function load() {
      try {
        const response = await getGame(token);
        setGameState(response);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load game state",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authLoading, user, token]);

  // SSE: subscribe to real-time game events
  const sseEnabled = gameState !== null && gameState.phase !== "FINISHED" && gameState.phase !== "CANCELLED";



  // Soundtrack lifecycle: swap to battle music when PLACING_SHIPS begins, resume global on unmount
  const hasSwappedRef = useRef(false);
  useEffect(() => {
    if (!hasSwappedRef.current && gameState?.phase && gameState.phase !== "WAITING_OPPONENT") {
      swapSoundtrack();
      hasSwappedRef.current = true;
    }
  }, [gameState?.phase, swapSoundtrack]);

  useEffect(() => {
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
    if (gameState?.phase === "CANCELLED") {
      resumeGlobalSoundtrack();
    }
    prevPhaseRef.current = gameState?.phase ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  useGameEvents(
    token,
    {
      onConnected: () => {
        // Refetch on every SSE (re)connection to catch missed events
        refetchGame();
      },
      onOpponentJoined: () => {
        refetchGame();
      },
      onShipsPlaced: () => {
        refetchGame();
      },
      onShotReceived: (data) => {
        if (data.result === "HIT") {
          playIncomingHit();
        }
        if (data.result === "SUNK") {
          playSunk();
          // Play opponent's laugh when they sink one of your ships
          const opponentAvatar = gameState?.bluePlayerName === user?.name
            ? gameState?.redPlayerAvatar : gameState?.bluePlayerAvatar;
          playLaugh(opponentAvatar ?? null);
        }
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
      onObservationHakiUsed: () => {
        setOpponentHakiMessage("👁 Opponent used Observation Haki — they're scanning your fleet!");
        setTimeout(() => setOpponentHakiMessage(null), 5000);
      },
      onArmamentHakiDefended: () => {
        setOpponentHakiMessage("🛡️ Armament Haki hardened your hull — opponent loses a turn!");
        setTimeout(() => setOpponentHakiMessage(null), 5000);
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
        <div className="flex flex-1 flex-col items-center justify-center px-4 gap-8">
          {bgImage && (
            <div className="absolute inset-0 -z-10 opacity-15 pointer-events-none overflow-hidden">
              <div
                className="absolute top-1/2 left-1/2 w-[100vh] h-[100vw] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgImage})` }}
              />
            </div>
          )}

          {/* Card */}
          <div className="flex flex-col items-center gap-6 bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 max-w-md w-full">
            {/* Player identity section */}
            <div className="flex flex-col items-center gap-2">
              <AvatarIcon avatar={user.avatar} rank={user.rank} size="lg" />
              <span className="text-lg font-bold text-text-primary">{user.name}</span>
              <span className="text-sm text-text-secondary">{user.rank.replace(/_/g, " ")}</span>
              <span className="text-secondary text-sm font-semibold">
                {formatBounty(user.bounty)} ₿
              </span>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 text-center">
              <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-surface-secondary/60">
                <span className="text-sm font-bold text-text-primary">{user.wins + user.losses}</span>
                <span className="text-xs text-text-muted">Battles</span>
              </div>
              <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-surface-secondary/60">
                <span className="text-sm font-bold text-success">{user.wins}</span>
                <span className="text-xs text-text-muted">Victories</span>
              </div>
              <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-surface-secondary/60">
                <span className="text-sm font-bold text-text-primary">
                  {user.wins + user.losses > 0
                    ? `${Math.round((user.wins / (user.wins + user.losses)) * 100)}%`
                    : "—"}
                </span>
                <span className="text-xs text-text-muted">Win Rate</span>
              </div>
            </div>

            {/* Waiting status */}
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              <span className="text-xs text-text-muted font-medium">
                Searching for opponents…
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Phase: PLACING_SHIPS
    if (gameState.phase === "PLACING_SHIPS" || isAssigningArmament) {
      const hasPlacedShips =
        gameState.myBoard !== null && gameState.myBoard.ships.length > 0;

      if (!hasPlacedShips || isRedeploying || isAssigningArmament) {
        const bgImage = getWallpaperPath(myAvatar);
        return (
          <div className="flex flex-1 flex-col h-full">
            {bgImage && (
              <div className="absolute inset-0 -z-10 opacity-15 pointer-events-none overflow-hidden">
                <div
                  className="absolute top-1/2 left-1/2 w-[100vh] h-[100vw] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-cover bg-center"
                  style={{ backgroundImage: `url(${bgImage})` }}
                />
              </div>
            )}
            <ShipPlacement
              gameToken={token}
              onPlacementComplete={(gamePhase) => {
                setIsRedeploying(false);
                setIsAssigningArmament(false);
                handlePlacementComplete(gamePhase);
              }}
              onArmamentStart={() => setIsAssigningArmament(true)}
            />
          </div>
        );
      }

      const bgImage = getWallpaperPath(myAvatar);
      return (
        <div className="flex flex-1 flex-col items-center justify-center px-4 gap-8">
          {bgImage && (
            <div className="absolute inset-0 -z-10 opacity-15 pointer-events-none overflow-hidden">
              <div
                className="absolute top-1/2 left-1/2 w-[100vh] h-[100vw] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgImage})` }}
              />
            </div>
          )}

          {/* Card */}
          <div className="flex flex-col items-center gap-6 bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 max-w-md w-full">
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-pulse">🧭</span>
              <h1 className="text-xl font-bold text-text-primary">
                Fleet deployed, Captain!
              </h1>
            </div>

            {/* Fleet manifest */}
            <div className="w-full bg-surface-secondary/50 rounded-lg p-3 border border-border">
              <div className="flex flex-col gap-2">
                {gameState.myBoard!.ships.map((ship) => (
                  <div key={ship.type} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">
                      {SHIP_DISPLAY_NAMES[ship.type]}
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: SHIP_SIZES[ship.type] }).map((_, i) => (
                        <span
                          key={i}
                          className="w-2.5 h-2.5 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              <span className="text-xs text-text-muted font-medium">
                Opponent preparing fleet…
              </span>
            </div>

            {/* Redeploy button */}
            <button
              type="button"
              onClick={() => setIsRedeploying(true)}
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              <span>🔄</span>
              <span>Redeploy Fleet</span>
            </button>
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
          opponentHakiMessage={opponentHakiMessage}
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

      const bgImage = getWallpaperPath(myAvatar);

      return (
        <div className="flex flex-1 flex-col items-center justify-center px-4 gap-8">
          {bgImage && (
            <div className="absolute inset-0 -z-10 opacity-15 pointer-events-none overflow-hidden">
              <div
                className="absolute top-1/2 left-1/2 w-[100vh] h-[100vw] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgImage})` }}
              />
            </div>
          )}

          {/* Card */}
          <div className="flex flex-col items-center gap-6 bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 max-w-md w-full">
            <span className="text-6xl">🏳️</span>
            <h1 className="text-3xl font-bold text-warning">W.O.</h1>
            <p className="text-sm text-text-muted max-w-sm text-center">
              The battle against{" "}
              <span className="font-bold text-text-primary">
                {opponentName}
              </span>{" "}
              ended by walkover. No contest recorded, Captain.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-4 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Return to Grand Line
            </button>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="relative flex flex-1 flex-col h-full">
      {/* Persistent back link — top-left */}
      {gameState.phase === "WAITING_OPPONENT" && gameState.bluePlayerName === user.name ? (
        <button
          type="button"
          onClick={async () => {
            try {
              await cancelGame(token);
            } catch {
              // fire-and-forget — navigate regardless
            }
            router.push("/");
          }}
          className="print:hidden absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary bg-surface-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border hover:border-primary transition-all cursor-pointer"
        >
          <span>←</span>
          <span>Grand Line</span>
        </button>
      ) : (
        <Link
          href="/"
          className="print:hidden absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary bg-surface-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border hover:border-primary transition-all"
        >
          <span>←</span>
          <span>Grand Line</span>
        </Link>
      )}

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
