"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
  ShipType,
  HakiProfileResponse,
  RevealedCell,
} from "@/lib/api/types";
import { getShipCells, cellKey, SHIP_SIZES } from "@/lib/game";
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
  opponentHakiMessage?: string | null;
}

export function BattleScreen({
  gameState,
  user,
  gameToken,
  onGameStateUpdate,
  readOnly,
  bgImage: bgImageProp,
  skipTurnsLeft = 0,
  onHakiNotification: _onHakiNotification,
  opponentHakiMessage,
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
  const [observationUsesConsumed, setObservationUsesConsumed] = useState(0);
  const [conquerorsUsesLeft, setConquerorsUsesLeft] = useState(0);
  const [conquerorsUsesConsumed, setConquerorsUsesConsumed] = useState(0);
  const [conquerorsCooldown, _setConquerorsCooldown] = useState(0);
  const [observationMode, setObservationMode] = useState(false);
  const [conquerorsMode, setConquerorsMode] = useState(false);
  const [revealedCells, setRevealedCells] = useState<RevealedCell[]>([]);
  const [hakiMessage, setHakiMessage] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Fetch Haki profile once
  const hasFetchedHaki = useRef(false);
  useEffect(() => {
    if (readOnly || hasFetchedHaki.current) return;
    hasFetchedHaki.current = true;
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

  const isMyTurn = gameState.currentTurnPlayerName === user.name;

  // Reset hakiUsedThisTurn and dismiss haki notification when the turn passes to opponent
  useEffect(() => {
    if (!isMyTurn) {
      setHakiUsedThisTurn(false);
      setHakiMessage(null);
    }
  }, [isMyTurn]);

  // Escape key cancels observation/conquerors mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (observationMode) setObservationMode(false);
        if (conquerorsMode) setConquerorsMode(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [observationMode, conquerorsMode]);

  // Pre-visualize scan preview at center of board when entering haki mode
  useEffect(() => {
    if (observationMode || conquerorsMode) {
      setHoveredCell({ row: 4, col: 4 });
    } else {
      setHoveredCell(null);
    }
  }, [observationMode, conquerorsMode]);

  const myAvatar =
    gameState.bluePlayerName === user.name
      ? gameState.bluePlayerAvatar
      : gameState.redPlayerAvatar;
  const opponentAvatar =
    gameState.bluePlayerName === user.name
      ? gameState.redPlayerAvatar
      : gameState.bluePlayerAvatar;
  const opponentName =
    gameState.bluePlayerName === user.name
      ? gameState.redPlayerName
      : gameState.bluePlayerName;

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
          type: rc.status === "HAS_SHIP" ? "revealed-ship" : "revealed-empty",
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
          setHakiMessage("⚡ Armament Haki hardens the hull! You'll lose a future turn.");
        }
        if (response.counterFire) {
          const cf = response.counterFire;
          setHakiMessage(`⚡ Counter-fire! Your board hit at (${cf.row + 1}, ${cf.col + 1})!`);
        }

        if (response.gameOver) {
          // Refetch full game state to trigger FINISHED phase in parent
          const updatedState = await getGame(gameToken);
          onGameStateUpdate(updatedState);
        } else {
          // Server-authoritative turn owner
          const newCurrentTurn =
            response.currentTurnPlayerName ?? gameState.currentTurnPlayerName;

          const updatedShotsFired: ShotCellResponse[] = [
            ...(gameState.opponentBoard?.shotsFired ?? []),
            ...optimisticShots.filter(
              (s) => !(gameState.opponentBoard?.shotsFired ?? []).some(
                (ss) => ss.row === s.row && ss.col === s.col
              )
            ),
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
        const message = err instanceof Error ? err.message : "Failed to fire shot";
        // If the error indicates stale game state (turn expired, game not in progress, etc.)
        // refetch game state silently instead of showing a confusing error
        const isStaleStateError =
          message.toLowerCase().includes("not started") ||
          message.toLowerCase().includes("not your turn") ||
          message.toLowerCase().includes("not in progress") ||
          message.toLowerCase().includes("has ended") ||
          message.toLowerCase().includes("expired");
        if (isStaleStateError) {
          try {
            const updatedState = await getGame(gameToken);
            onGameStateUpdate(updatedState);
          } catch {
            setError(message);
          }
        } else {
          setError(message);
        }
      } finally {
        setFiring(false);
      }
    },
    [isMyTurn, firing, allShotsFired, gameToken, onGameStateUpdate, playLaugh, playHit, playSunk, myAvatar, user, gameState],
  );

  // ─── Haki Handlers ────────────────────────────────────────────────────────

  // Determine if current observation use is AWAKENED (level 3, first use only)
  const isAwakenedObservation = useMemo(() => {
    if (!hakiProfile || hakiProfile.observationLevel < 3) return false;
    return observationUsesConsumed === 0; // first use at level 3 = AWAKENED
  }, [hakiProfile, observationUsesConsumed]);

  const handleObservationConfirm = useCallback(
    async (row: number, col: number) => {
      setObservationMode(false);
      try {
        const request: { row: number; col: number; revealRowIndex?: number; revealColIndex?: number } = { row, col };
        if (isAwakenedObservation) {
          request.revealRowIndex = row;
          request.revealColIndex = col;
        }
        const result = await activateObservation(gameToken, request);
        setRevealedCells((prev) => [...prev, ...result.revealedCells]);
        setObservationUsesLeft((prev) => prev - 1);
        setObservationUsesConsumed((prev) => prev + 1);
        setHakiUsedThisTurn(true);
        setHakiMessage(`Observation Haki reveals ${result.revealedCells.length} cells!`);
        setTimeout(() => setHakiMessage(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Observation failed");
      }
    },
    [gameToken, isAwakenedObservation],
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
        setConquerorsUsesConsumed((prev) => prev + 1);
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
    [gameToken, gameState.currentTurnPlayerName],
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

  const enemyBoardMode = observationMode
    ? "observation" as const
    : conquerorsMode
      ? "conquerors" as const
      : "normal" as const;

  // Compute observation/conquerors hover preview cells
  const observationPreviewCells = useMemo(() => {
    if (!hoveredCell) return undefined;
    if (!observationMode && !conquerorsMode) return undefined;

    const previewKeys = new Set<string>();

    if (observationMode && hakiProfile) {
      // First use: Level 2+ = 3×3, Level 1 = 2×2. Second use is always 2×2.
      const size = (observationUsesConsumed === 0 && hakiProfile.observationLevel >= 2) ? 3 : 2;
      for (let dr = 0; dr < size; dr++) {
        for (let dc = 0; dc < size; dc++) {
          const r = hoveredCell.row + dr;
          const c = hoveredCell.col + dc;
          if (r >= 0 && r <= 9 && c >= 0 && c <= 9) {
            previewKeys.add(cellKey(r, c));
          }
        }
      }
      // For AWAKENED: preview full row AND full column (cross pattern)
      if (isAwakenedObservation) {
        for (let c = 0; c <= 9; c++) {
          previewKeys.add(cellKey(hoveredCell.row, c));
        }
        for (let r = 0; r <= 9; r++) {
          previewKeys.add(cellKey(r, hoveredCell.col));
        }
      }
    }

    if (conquerorsMode) {
      // Conqueror's: center always shown; X-pattern diagonals only at level 3 first use
      previewKeys.add(cellKey(hoveredCell.row, hoveredCell.col));
      if (hakiProfile && hakiProfile.conquerorsLevel >= 3 && conquerorsUsesConsumed === 0) {
        const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of diagonals) {
          const r = hoveredCell.row + dr;
          const c = hoveredCell.col + dc;
          if (r >= 0 && r <= 9 && c >= 0 && c <= 9) {
            previewKeys.add(cellKey(r, c));
          }
        }
      }
    }

    return previewKeys.size > 0 ? previewKeys : undefined;
  }, [hoveredCell, observationMode, conquerorsMode, hakiProfile, observationUsesConsumed, isAwakenedObservation, conquerorsUsesConsumed]);

  const handleBoardCellHover = useCallback((row: number, col: number) => {
    if (observationMode || conquerorsMode) {
      setHoveredCell({ row, col });
    }
  }, [observationMode, conquerorsMode]);

  const handleBoardCellLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-4 py-4">
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

      {/* Main card */}
      <div className="relative z-10 flex flex-col items-center gap-4 bg-surface/80 backdrop-blur-md rounded-2xl px-5 py-4 border border-border">
        {/* Accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-ocean/20 to-transparent rounded-t-2xl" />

        {/* Turn indicator */}
        {!readOnly && (
          <div className="flex items-center gap-3 px-4 py-2 bg-surface-secondary/40 rounded-lg border border-border">
            <AvatarIcon avatar={isMyTurn ? myAvatar : opponentAvatar} size="md" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary font-medium">
                {isMyTurn ? user.name : opponentName}
              </span>
              {isMyTurn ? (
                <Badge variant="success">Your Turn — Fire!</Badge>
              ) : (
                <Badge variant="warning" pulse>
                  Opponent&apos;s Turn
                </Badge>
              )}
            </div>
            <CountdownTimer turnStartedAt={gameState.turnStartedAt} />
          </div>
        )}

        {/* Boards section with Haki sidebar */}
        <div className="flex items-start justify-center gap-4">
          {/* Haki Sidebar — left */}
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
                // Level 3 first use needs targeting for X-pattern (usesLeft === total means first use)
                const totalConqUses = hakiProfile.conquerorsLevel >= 2 ? 2 : 1;
                if (hakiProfile.conquerorsLevel >= 3 && conquerorsUsesLeft === totalConqUses) {
                  setConquerorsMode(true);
                } else {
                  handleConquerorsConfirm();
                }
              }}
              onCancelConquerors={() => setConquerorsMode(false)}
            />
          )}

          {/* Boards row */}
          <div className="flex flex-wrap items-start justify-center gap-5">
            {/* My Fleet card */}
            <div className="px-3 py-3 rounded-xl border border-teal-900/40 bg-teal-950/10">
              <BoardGrid title="⚓ My Fleet" cells={myBoardCells} mode="normal" />
            </div>

            {/* Enemy Waters card */}
            <div className="px-3 py-3 rounded-xl border border-amber-900/30 bg-amber-950/5">

              <BoardGrid
                title={observationMode ? "👁 Select Area to Scan" : conquerorsMode ? "👑 Select X-Pattern Target" : "🎯 Enemy Waters"}
                cells={opponentBoardCells}
                interactive={!readOnly}
                disabled={readOnly || (!isMyTurn && !observationMode && !conquerorsMode) || firing}
                onCellClick={handleCellClick}
                onCellHover={handleBoardCellHover}
                onCellLeave={handleBoardCellLeave}
                mode={enemyBoardMode}
                previewCells={observationPreviewCells}
              />
            </div>
          </div>
        </div>

        {/* Haki notification — removed from card flow, rendered as fixed toast below */}

        {/* Skip turns indicator */}
        {skipTurnsLeft > 0 && (
          <div className="px-4 py-1.5 bg-red-900/60 border border-red-500/40 rounded-lg text-sm text-red-200 text-center">
            🌊 Overwhelmed by Conqueror&apos;s Haki — {skipTurnsLeft} turns remaining
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
            className="text-xs text-text-muted hover:text-danger"
          >
            🏳️ Surrender
          </Button>
        )}
      </div>

      {/* Haki toast — fixed bottom center, sonner-style */}
      <div
        className={[
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none",
          "transition-all duration-300 ease-out",
          (hakiMessage || opponentHakiMessage)
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4",
        ].join(" ")}
        aria-live="polite"
      >
        <div className={[
          "pointer-events-auto px-5 py-3 backdrop-blur-md rounded-xl text-sm text-center whitespace-nowrap",
          opponentHakiMessage && !hakiMessage
            ? "bg-surface-elevated/95 border border-blue-500/50 shadow-[0_8px_32px_rgba(59,130,246,0.3)] text-blue-100"
            : "bg-surface-elevated/95 border border-purple-500/50 shadow-[0_8px_32px_rgba(168,85,247,0.3)] text-purple-100",
        ].join(" ")}>
          {hakiMessage ? `⚡ ${hakiMessage}` : opponentHakiMessage || ""}
        </div>
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

  // Build a set of hit positions for quick lookup
  const hitPositions = new Set<string>();
  for (const shot of gameState.myBoard.shotsReceived) {
    if (shot.result === "HIT" || shot.result === "SUNK") {
      hitPositions.add(cellKey(shot.row, shot.col));
    }
  }

  // Mark ship cells — check if ship is fully sunk (all cells hit)
  for (const ship of gameState.myBoard.ships) {
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
  for (const shot of gameState.myBoard.shotsReceived) {
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

    // Find contiguous hit/sunk cells forming a line of the right size through sunkShot
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
      // Fallback: just mark the sunk cell itself
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
      // Already in sunkCellKeys above, but just in case
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
  // Collect cells going backward from start
  const cells: string[] = [];
  let r = startRow;
  let c = startCol;
  // Go backward to find the start of the ship
  while (r - dr >= 0 && r - dr <= 9 && c - dc >= 0 && c - dc <= 9 && hitSet.has(`${r - dr},${c - dc}`)) {
    r -= dr;
    c -= dc;
  }
  // Now go forward collecting cells
  while (r >= 0 && r <= 9 && c >= 0 && c <= 9 && hitSet.has(`${r},${c}`)) {
    cells.push(`${r},${c}`);
    r += dr;
    c += dc;
  }
  // Check if we found exactly the right size and it includes the start cell
  if (cells.length >= size && cells.includes(`${startRow},${startCol}`)) {
    // If cells are longer than ship size, find the subset containing the start
    if (cells.length === size) return cells;
    // Find the right window of `size` cells that includes the start
    const startIdx = cells.indexOf(`${startRow},${startCol}`);
    for (let i = Math.max(0, startIdx - size + 1); i <= Math.min(startIdx, cells.length - size); i++) {
      const window = cells.slice(i, i + size);
      if (window.includes(`${startRow},${startCol}`)) return window;
    }
  }
  return null;
}
