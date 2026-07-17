"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { fireShot, getGame, surrender } from "@/lib/api";
import {
  getHakiProfile,
  activateObservation,
  activateConquerors,
} from "@/lib/api";
import type {
  GameStateResponse,
  UserResponse,
  ShotCellResponse,
  HakiProfileResponse,
  RevealedCell,
  ConquerorsActivationResponse,
} from "@/lib/api/types";
import { getShipCells, cellKey } from "@/lib/game";
import { Badge, Alert, Spinner, Button } from "@/components/ui";
import { CountdownTimer } from "@/components/ui";
import { AvatarIcon } from "@/components/ui";
import { BoardGrid, type CellState } from "./board-grid";
import { HakiBar } from "./haki-bar";
import { SurrenderModal } from "@/components/surrender-modal";
import { useSound } from "@/lib/sound";

interface BattleScreenProps {
  gameState: GameStateResponse;
  user: UserResponse;
  gameToken: string;
  onGameStateUpdate: (state: GameStateResponse) => void;
  readOnly?: boolean;
  bgImage?: string | null;
  skipTurnsLeft?: number;
  onHakiNotification?: (msg: string) => void;
}

export function BattleScreen({
  gameState,
  user,
  gameToken,
  onGameStateUpdate,
  readOnly,
  bgImage: bgImageProp,
  skipTurnsLeft = 0,
  onHakiNotification,
}: BattleScreenProps) {
  const [firing, setFiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticShots, setOptimisticShots] = useState<ShotCellResponse[]>(
    [],
  );
  const [surrenderOpen, setSurrenderOpen] = useState(false);
  const [surrendering, setSurrendering] = useState(false);
  const { playLaugh, playHit, playSunk } = useSound();

  // Haki state
  const [hakiProfile, setHakiProfile] = useState<HakiProfileResponse | null>(null);
  const [hakiUsedThisTurn, setHakiUsedThisTurn] = useState(false);
  const [observationUsesLeft, setObservationUsesLeft] = useState(0);
  const [conquerorsUsesLeft, setConquerorsUsesLeft] = useState(0);
  const [conquerorsCooldown, setConquerorsCooldown] = useState(0);
  const [observationMode, setObservationMode] = useState(false);
  const [conquerorsMode, setConquerorsMode] = useState(false);
  const [revealedCells, setRevealedCells] = useState<RevealedCell[]>([]);
  const [hakiMessage, setHakiMessage] = useState<string | null>(null);

  // Fetch Haki profile once
  useEffect(() => {
    if (readOnly) return;
    getHakiProfile()
      .then((profile) => {
        setHakiProfile(profile);
        // Init uses based on level
        const obsUses = profile.observationLevel >= 2 ? 2 : profile.observationLevel >= 1 ? 1 : 0;
        setObservationUsesLeft(obsUses);
        const conqUses = profile.conquerorsLevel >= 2 ? 2 : profile.conquerorsLevel >= 1 ? 1 : 0;
        setConquerorsUsesLeft(conqUses);
      })
      .catch(() => {/* no haki */});
  }, [readOnly]);

  // Reset hakiUsedThisTurn when turn changes
  useEffect(() => {
    setHakiUsedThisTurn(false);
  }, [gameState.currentTurnPlayerName]);

  const isMyTurn = gameState.currentTurnPlayerName === user.name;

  const myAvatar =
    gameState.bluePlayerName === user.name
      ? gameState.bluePlayerAvatar
      : gameState.redPlayerAvatar;
  const opponentAvatar =
    gameState.bluePlayerName === user.name
      ? gameState.redPlayerAvatar
      : gameState.bluePlayerAvatar;

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

  // Build Opponent Board cell map (with revealed cells from Observation)
  const opponentBoardCells = useMemo(() => {
    const cells = buildOpponentBoardCells(allShotsFired);
    // Overlay revealed cells from Observation Haki
    for (const rc of revealedCells) {
      const key = cellKey(rc.row, rc.col);
      if (!cells.has(key)) {
        // Only show reveal if not already shot
        cells.set(key, {
          type: rc.status === "HAS_SHIP" ? "ship" : "empty",
        });
      }
    }
    return cells;
  }, [allShotsFired, revealedCells]);

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

        if (response.result === "HIT") {
          playHit();
        }

        if (response.result === "SUNK") {
          playSunk();
          // Play laugh only on 1st and 4th sunk (count before this shot + 1)
          const sunkCount = allShotsFired.filter((s) => s.result === "SUNK").length + 1;
          if (sunkCount === 1 || sunkCount === 3) {
            playLaugh(myAvatar);
          }
        }

        // Handle Armament Haki trigger
        if (response.armamentTriggered) {
          setHakiMessage("⚡ Armament Haki deflects your momentum! Turn lost!");
          setTimeout(() => setHakiMessage(null), 3000);
        }
        if (response.counterFire) {
          const cf = response.counterFire;
          setHakiMessage(`⚡ Counter-fire! Your board hit at (${cf.row + 1}, ${cf.col + 1})!`);
          setTimeout(() => setHakiMessage(null), 3000);
        }

        if (response.gameOver) {
          // Refetch full game state to trigger FINISHED phase in parent
          const updatedState = await getGame(gameToken);
          onGameStateUpdate(updatedState);
        } else {
          // Optimistic local state update — no refetch needed
          const newCurrentTurn =
            response.result === "MISS"
              ? gameState.bluePlayerName === user.name
                ? gameState.redPlayerName
                : gameState.bluePlayerName
              : gameState.currentTurnPlayerName;

          const updatedShotsFired: ShotCellResponse[] = [
            ...(gameState.opponentBoard?.shotsFired ?? []),
            newShot,
          ];

          onGameStateUpdate({
            ...gameState,
            currentTurnPlayerName: newCurrentTurn,
            turnStartedAt: new Date().toISOString(),
            opponentBoard: {
              ...gameState.opponentBoard!,
              shotsFired: updatedShotsFired,
            },
          });
          setOptimisticShots([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fire shot");
      } finally {
        setFiring(false);
      }
    },
    [isMyTurn, firing, allShotsFired, gameToken, onGameStateUpdate, playLaugh, playHit, playSunk, myAvatar, user, gameState],
  );

  // ─── Haki Handlers ────────────────────────────────────────────────────────

  const handleObservationConfirm = useCallback(
    async (row: number, col: number) => {
      setObservationMode(false);
      try {
        const result = await activateObservation(gameToken, { row, col });
        setRevealedCells((prev) => [...prev, ...result.revealedCells]);
        setObservationUsesLeft((prev) => prev - 1);
        setHakiUsedThisTurn(true);
        setHakiMessage(`Observation Haki reveals ${result.revealedCells.length} cells!`);
        setTimeout(() => setHakiMessage(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Observation failed");
      }
    },
    [gameToken],
  );

  const handleConquerorsConfirm = useCallback(
    async (row?: number, col?: number) => {
      setConquerorsMode(false);
      try {
        const result = await activateConquerors(gameToken, {
          row: row ?? null,
          col: col ?? null,
        });
        setConquerorsUsesLeft((prev) => prev - 1);
        setHakiUsedThisTurn(true);
        if (result.xPatternShots) {
          const newShots: ShotCellResponse[] = result.xPatternShots.map((s) => ({
            row: s.row,
            col: s.col,
            result: s.result,
            sunkShipType: s.sunkShipType,
          }));
          setOptimisticShots((prev) => [...prev, ...newShots]);
        }
        setHakiMessage(`Conqueror's Haki! Opponent skips ${result.skipTurns} turns!`);
        setTimeout(() => setHakiMessage(null), 4000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Conqueror's failed");
      }
    },
    [gameToken],
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (observationMode) {
        handleObservationConfirm(row, col);
        return;
      }
      if (conquerorsMode) {
        handleConquerorsConfirm(row, col);
        return;
      }
      handleFire(row, col);
    },
    [observationMode, conquerorsMode, handleObservationConfirm, handleConquerorsConfirm, handleFire],
  );

  // ─── End Haki Handlers ──────────────────────────────────────────────────────

  const handleSurrender = useCallback(async () => {
    setSurrendering(true);
    try {
      await surrender(gameToken);
      const updatedState = await getGame(gameToken);
      onGameStateUpdate(updatedState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to surrender");
    } finally {
      setSurrendering(false);
      setSurrenderOpen(false);
    }
  }, [gameToken, onGameStateUpdate]);

  const bgImage = bgImageProp ?? (myAvatar
    ? `/avatars/${myAvatar.toLowerCase()}/${myAvatar.toLowerCase()}-bg-01.jpg`
    : null);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
      {/* Background image */}
      {bgImage && (
        <div
          className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden"
        >
          <div
            className="absolute top-1/2 left-1/2 w-[100vh] h-[100vw] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        </div>
      )}
      {/* Turn indicator (hidden when readOnly) */}
      <div className="relative z-10 flex flex-col items-center gap-6 bg-surface/80 backdrop-blur-sm rounded-2xl px-6 py-5">
      {!readOnly && (
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <AvatarIcon avatar={isMyTurn ? myAvatar : opponentAvatar} size="sm" />
            {isMyTurn ? (
              <Badge variant="success">Your Turn — Fire!</Badge>
            ) : (
              <Badge variant="warning" pulse>
                Opponent&apos;s Turn — Waiting…
              </Badge>
            )}
          </div>
          <CountdownTimer turnStartedAt={gameState.turnStartedAt} />
        </div>
      )}

      {/* Grids */}
      <div className="flex flex-wrap items-start justify-center gap-8">
        <BoardGrid title="My Fleet" cells={myBoardCells} />
        <BoardGrid
          title={observationMode ? "Select Area to Scan" : conquerorsMode ? "Select X-Pattern Target" : "Enemy Waters"}
          cells={opponentBoardCells}
          interactive={!readOnly}
          disabled={readOnly || (!isMyTurn && !observationMode && !conquerorsMode) || firing}
          onCellClick={handleCellClick}
        />
      </div>

      {/* Haki Bar */}
      {!readOnly && hakiProfile && (
        <HakiBar
          gameToken={gameToken}
          hakiProfile={hakiProfile}
          isMyTurn={isMyTurn}
          hakiUsedThisTurn={hakiUsedThisTurn}
          observationUsesLeft={observationUsesLeft}
          conquerorsUsesLeft={conquerorsUsesLeft}
          conquerorsCooldown={conquerorsCooldown}
          onHakiUsed={() => setHakiUsedThisTurn(true)}
          onObservationResult={(cells) => setRevealedCells((prev) => [...prev, ...cells])}
          onConquerorsResult={() => {}}
          onError={(msg) => setError(msg)}
          observationMode={observationMode}
          onStartObservation={() => setObservationMode(true)}
          onCancelObservation={() => setObservationMode(false)}
          conquerorsMode={conquerorsMode}
          onStartConquerors={() => {
            // If Lv3 awakened and it's the 2nd use, need target selection
            if (hakiProfile.conquerorsLevel >= 3 && conquerorsUsesLeft === 1) {
              setConquerorsMode(true);
            } else {
              handleConquerorsConfirm();
            }
          }}
          onCancelConquerors={() => setConquerorsMode(false)}
        />
      )}

      {/* Haki notification */}
      {hakiMessage && (
        <div className="px-4 py-2 bg-purple-900/60 border border-purple-500/40 rounded-lg text-sm text-purple-200 text-center animate-pulse">
          ⚡ {hakiMessage}
        </div>
      )}

      {/* Skip turns indicator */}
      {skipTurnsLeft > 0 && (
        <div className="px-4 py-2 bg-red-900/60 border border-red-500/40 rounded-lg text-sm text-red-200 text-center">
          🌊 Overwhelmed by Conqueror&apos;s Haki — {skipTurnsLeft} turns remaining
        </div>
      )}

      {/* Observation/Conquerors mode hint */}
      {(observationMode || conquerorsMode) && (
        <div className="px-3 py-1.5 bg-yellow-900/40 border border-yellow-500/30 rounded text-xs text-yellow-200 text-center">
          {observationMode && "👁 Click a cell on Enemy Waters to scan that area"}
          {conquerorsMode && "👑 Click a cell for X-pattern shot (center + 4 diagonals)"}
        </div>
      )}

      {/* Firing indicator — fixed height to prevent layout shift */}
      {!readOnly && (
        <div className="h-6 flex items-center justify-center">
          {firing && (
            <span className="flex items-center gap-2 text-sm text-text-muted">
              <Spinner size="sm" /> Firing…
            </span>
          )}
        </div>
      )}

      {/* Error banner */}
      {!readOnly && error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Surrender button */}
      {!readOnly && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSurrenderOpen(true)}
          className="text-text-muted hover:text-danger"
        >
          🏳️ Surrender
        </Button>
      )}
      </div>

      <SurrenderModal
        open={surrenderOpen}
        onClose={() => setSurrenderOpen(false)}
        onConfirm={handleSurrender}
        loading={surrendering}
      />
    </div>
  );
}

function buildMyBoardCells(
  gameState: GameStateResponse,
): Map<string, CellState> {
  const cells = new Map<string, CellState>();

  if (!gameState.myBoard) return cells;

  // Mark ship cells
  for (const ship of gameState.myBoard.ships) {
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
