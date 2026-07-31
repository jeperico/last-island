"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { placeShips, surrender, getGame, getHakiProfile, assignArmament } from "@/lib/api";
import type {
  GamePhase,
  Orientation,
  ShipType,
  PlaceShipsRequest,
  HakiProfileResponse,
  ShipResponse,
} from "@/lib/api/types";
import {
  PIRATE_FLEET,
  SHIP_SIZES,
  SHIP_DISPLAY_NAMES,
  getShipCells,
  isInBounds,
  hasOverlap,
  cellKey,
} from "@/lib/game";
import { Alert, Button, Modal } from "@/components/ui";
import { SurrenderModal } from "@/components/surrender-modal";

const GRID_SIZE = 10;
const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

interface ShipPlacementProps {
  gameToken: string;
  opponentName: string | null;
  onPlacementComplete: (gamePhase: GamePhase) => void;
  onArmamentStart?: () => void;
  initialPlacements?: Map<string, { row: number; col: number; orientation: Orientation }>;
}

interface PlacementEntry {
  row: number;
  col: number;
  orientation: Orientation;
}

export function ShipPlacement({
  gameToken,
  opponentName,
  onPlacementComplete,
  onArmamentStart,
  initialPlacements,
}: ShipPlacementProps) {
  const fleet = useMemo(() => PIRATE_FLEET, []);

  const [selectedShipType, setSelectedShipType] = useState<ShipType | null>(
    () => {
      if (initialPlacements && initialPlacements.size === PIRATE_FLEET.length) {
        return null;
      }
      return PIRATE_FLEET[0] ?? null;
    },
  );
  const [orientation, setOrientation] = useState<Orientation>("HORIZONTAL");
  const [placements, setPlacements] = useState<Map<ShipType, PlacementEntry>>(
    () => {
      if (initialPlacements) {
        const map = new Map<ShipType, PlacementEntry>();
        for (const [shipType, placement] of initialPlacements) {
          map.set(shipType as ShipType, placement);
        }
        return map;
      }
      return new Map();
    },
  );
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surrenderOpen, setSurrenderOpen] = useState(false);
  const [surrendering, setSurrendering] = useState(false);

  // Armament Haki state
  const [hakiProfile, setHakiProfile] = useState<HakiProfileResponse | null>(null);
  const [armamentStep, setArmamentStep] = useState(false);
  const [deployedShips, setDeployedShips] = useState<ShipResponse[]>([]);
  const [selectedShipIds, setSelectedShipIds] = useState<string[]>([]);
  const [armamentSubmitting, setArmamentSubmitting] = useState(false);

  const occupiedCells = useMemo(() => {
    const cells = new Set<string>();
    for (const [shipType, placement] of placements) {
      const size = SHIP_SIZES[shipType];
      const shipCells = getShipCells(
        placement.row,
        placement.col,
        size,
        placement.orientation,
      );
      for (const cell of shipCells) {
        cells.add(cellKey(cell.row, cell.col));
      }
    }
    return cells;
  }, [placements]);

  // Map from cellKey → shipType for placed ships (to identify clicks on placed ships)
  const cellToShipMap = useMemo(() => {
    const map = new Map<string, ShipType>();
    for (const [shipType, placement] of placements) {
      const size = SHIP_SIZES[shipType];
      const shipCells = getShipCells(
        placement.row,
        placement.col,
        size,
        placement.orientation,
      );
      for (const cell of shipCells) {
        map.set(cellKey(cell.row, cell.col), shipType);
      }
    }
    return map;
  }, [placements]);

  const allPlaced = placements.size === fleet.length;

  // Keyboard shortcut: R to toggle orientation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "r" || e.key === "R") {
        setOrientation((prev) =>
          prev === "HORIZONTAL" ? "VERTICAL" : "HORIZONTAL",
        );
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch Haki profile on mount (for armament step)
  // Fetch Haki profile on mount (for armament step)
  const hasFetchedHaki = useRef(false);
  useEffect(() => {
    if (hasFetchedHaki.current) return;
    hasFetchedHaki.current = true;
    getHakiProfile().then(setHakiProfile).catch(() => {});
  }, []);

  const toggleOrientation = useCallback(() => {
    setOrientation((prev) =>
      prev === "HORIZONTAL" ? "VERTICAL" : "HORIZONTAL",
    );
  }, []);

  // Compute hover preview cells and validity
  const hoverPreview = useMemo(() => {
    if (!hoveredCell || !selectedShipType) return null;

    const size = SHIP_SIZES[selectedShipType];
    const inBounds = isInBounds(
      hoveredCell.row,
      hoveredCell.col,
      size,
      orientation,
    );

    if (!inBounds) {
      // Still show cells for visual feedback, but mark as invalid
      const cells = getShipCells(
        hoveredCell.row,
        hoveredCell.col,
        size,
        orientation,
      );
      return { cells, valid: false };
    }

    const cells = getShipCells(
      hoveredCell.row,
      hoveredCell.col,
      size,
      orientation,
    );

    // Exclude currently selected ship's cells from overlap check
    const occupiedWithoutSelected = new Set(occupiedCells);
    const currentPlacement = placements.get(selectedShipType);
    if (currentPlacement) {
      const currentCells = getShipCells(
        currentPlacement.row,
        currentPlacement.col,
        SHIP_SIZES[selectedShipType],
        currentPlacement.orientation,
      );
      for (const cell of currentCells) {
        occupiedWithoutSelected.delete(cellKey(cell.row, cell.col));
      }
    }

    const overlaps = hasOverlap(cells, occupiedWithoutSelected);
    return { cells, valid: !overlaps };
  }, [hoveredCell, selectedShipType, orientation, occupiedCells, placements]);

  function handleCellClick(row: number, col: number) {
    // If no ship selected, check if clicking on a placed ship to remove it
    if (!selectedShipType) {
      const key = cellKey(row, col);
      const shipAtCell = cellToShipMap.get(key);
      if (shipAtCell) {
        const newPlacements = new Map(placements);
        newPlacements.delete(shipAtCell);
        setPlacements(newPlacements);
      }
      return;
    }

    const size = SHIP_SIZES[selectedShipType];

    if (!isInBounds(row, col, size, orientation)) return;

    const cells = getShipCells(row, col, size, orientation);

    // Exclude selected ship from overlap check
    const occupiedWithoutSelected = new Set(occupiedCells);
    const currentPlacement = placements.get(selectedShipType);
    if (currentPlacement) {
      const currentCells = getShipCells(
        currentPlacement.row,
        currentPlacement.col,
        SHIP_SIZES[selectedShipType],
        currentPlacement.orientation,
      );
      for (const cell of currentCells) {
        occupiedWithoutSelected.delete(cellKey(cell.row, cell.col));
      }
    }

    if (hasOverlap(cells, occupiedWithoutSelected)) return;

    const newPlacements = new Map(placements);
    newPlacements.set(selectedShipType, { row, col, orientation });
    setPlacements(newPlacements);

    // Auto-select next unplaced ship
    const nextShip = fleet.find(
      (s) => s !== selectedShipType && !newPlacements.has(s),
    );
    setSelectedShipType(nextShip ?? null);
  }

  function handleShipSelect(shipType: ShipType) {
    if (placements.has(shipType)) {
      // Remove from grid if already placed
      const newPlacements = new Map(placements);
      newPlacements.delete(shipType);
      setPlacements(newPlacements);
      setSelectedShipType(shipType);
    } else if (selectedShipType === shipType) {
      setSelectedShipType(null);
    } else {
      setSelectedShipType(shipType);
    }
  }

  function handleRandomize() {
    // Improved fleet deployment algorithm:
    // 1. Places ships largest-first for better space utilization
    // 2. Enforces a 1-cell gap between ships (harder to hit multiple ships)
    // 3. Uses edge/corner bias to spread ships across the board
    // 4. Retries full layout if placement fails

    function getBufferedCells(
      row: number,
      col: number,
      size: number,
      ori: Orientation,
    ): string[] {
      const buffered: string[] = [];
      const cells = getShipCells(row, col, size, ori);
      for (const c of cells) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = c.row + dr;
            const cl = c.col + dc;
            if (r >= 0 && r <= 9 && cl >= 0 && cl <= 9) {
              buffered.push(cellKey(r, cl));
            }
          }
        }
      }
      return buffered;
    }

    // Sort fleet by size descending — place large ships first
    const sortedFleet = [...fleet].sort(
      (a, b) => SHIP_SIZES[b] - SHIP_SIZES[a],
    );

    for (let layoutAttempt = 0; layoutAttempt < 100; layoutAttempt++) {
      const newPlacements = new Map<ShipType, PlacementEntry>();
      const occupied = new Set<string>(); // actual ship cells
      const buffer = new Set<string>(); // cells within 1 of a ship
      let allPlacedOk = true;

      for (const shipType of sortedFleet) {
        const size = SHIP_SIZES[shipType];
        let placed = false;

        // Collect all valid positions, then pick one at random
        const validPositions: { row: number; col: number; ori: Orientation }[] =
          [];

        for (const ori of ["HORIZONTAL", "VERTICAL"] as Orientation[]) {
          const maxRow = ori === "VERTICAL" ? 10 - size : 9;
          const maxCol = ori === "HORIZONTAL" ? 10 - size : 9;

          for (let row = 0; row <= maxRow; row++) {
            for (let col = 0; col <= maxCol; col++) {
              const cells = getShipCells(row, col, size, ori);
              const blocked = cells.some(
                (c) =>
                  occupied.has(cellKey(c.row, c.col)) ||
                  buffer.has(cellKey(c.row, c.col)),
              );
              if (!blocked) {
                validPositions.push({ row, col, ori });
              }
            }
          }
        }

        if (validPositions.length > 0) {
          // Pick a random valid position
          const pick =
            validPositions[Math.floor(Math.random() * validPositions.length)];
          newPlacements.set(shipType, {
            row: pick.row,
            col: pick.col,
            orientation: pick.ori,
          });
          const cells = getShipCells(pick.row, pick.col, size, pick.ori);
          for (const c of cells) {
            occupied.add(cellKey(c.row, c.col));
          }
          const bufferedCells = getBufferedCells(
            pick.row,
            pick.col,
            size,
            pick.ori,
          );
          for (const key of bufferedCells) {
            buffer.add(key);
          }
          placed = true;
        }

        if (!placed) {
          allPlacedOk = false;
          break;
        }
      }

      if (allPlacedOk) {
        setPlacements(newPlacements);
        setSelectedShipType(null);
        setError(null);
        return;
      }
    }
  }

  function handleReset() {
    setPlacements(new Map());
    setSelectedShipType(null);
    setError(null);
  }

  async function handleDeploy() {
    setError(null);
    setSubmitting(true);

    // If player has armament haki, show selection modal BEFORE sending placeShips
    if (hakiProfile && hakiProfile.armamentLevel >= 1) {
      // Build local ship list from placements for display in armament modal
      const localShips: ShipResponse[] = Array.from(placements.entries()).map(
        ([shipType, placement]) => ({
          id: shipType, // Use type as temporary identifier (resolved after placeShips)
          type: shipType,
          orientation: placement.orientation,
          row: placement.row,
          col: placement.col,
          size: SHIP_SIZES[shipType],
        }),
      );
      setDeployedShips(localShips);
      setSelectedShipIds([]);
      setArmamentStep(true);
      setSubmitting(false);
      onArmamentStart?.();
      return;
    }

    // No armament — place ships and proceed immediately
    const request: PlaceShipsRequest = {
      ships: Array.from(placements.entries()).map(([shipType, placement]) => ({
        type: shipType,
        row: placement.row,
        col: placement.col,
        orientation: placement.orientation,
      })),
    };

    try {
      const response = await placeShips(gameToken, request);
      onPlacementComplete(response.gamePhase);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deploy fleet");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSurrender() {
    setSurrendering(true);
    try {
      await surrender(gameToken);
      const updatedState = await getGame(gameToken);
      onPlacementComplete(updatedState.phase);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to surrender");
    } finally {
      setSurrendering(false);
      setSurrenderOpen(false);
    }
  }

  // Step 5: Armament ship selection toggle
  function handleArmamentToggle(shipIdentifier: string) {
    const maxSelections = (hakiProfile?.armamentLevel ?? 0) >= 2 ? 2 : 1;

    setSelectedShipIds((prev) => {
      if (prev.includes(shipIdentifier)) {
        return prev.filter((id) => id !== shipIdentifier);
      }
      if (maxSelections === 1) {
        // Level 1: always replace
        return [shipIdentifier];
      }
      if (prev.length < maxSelections) {
        return [...prev, shipIdentifier];
      }
      // At max for level 2: user must deselect first
      return prev;
    });
  }

  // Step 6: Confirm armament assignment — places ships AND assigns armament
  async function handleArmamentConfirm() {
    setArmamentSubmitting(true);
    setError(null);

    const request: PlaceShipsRequest = {
      ships: Array.from(placements.entries()).map(([shipType, placement]) => ({
        type: shipType,
        row: placement.row,
        col: placement.col,
        orientation: placement.orientation,
      })),
    };

    try {
      // Step 1: Place ships on the server
      const response = await placeShips(gameToken, request);

      // Step 2: Resolve selected ship types to actual server-assigned UUIDs
      const resolveShipId = (shipType: string): string => {
        const ship = response.ships.find((s) => s.type === shipType);
        return ship?.id ?? shipType;
      };

      // Step 3: Assign armament to selected ships
      try {
        await assignArmament(gameToken, {
          ship1Id: selectedShipIds[1] ? resolveShipId(selectedShipIds[1]) : resolveShipId(selectedShipIds[0]),
          ship2Id: selectedShipIds[1] ? resolveShipId(selectedShipIds[0]) : null,
        });
      } catch {
        // Graceful degradation: if assignArmament fails,
        // game proceeds without armament protection
      }

      onPlacementComplete(response.gamePhase);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deploy fleet");
      setArmamentStep(false);
    } finally {
      setArmamentSubmitting(false);
    }
  }

  function getCellState(
    row: number,
    col: number,
  ): "empty" | "placed" | "preview-valid" | "preview-invalid" {
    const key = cellKey(row, col);

    // Check hover preview
    if (hoverPreview) {
      const isInPreview = hoverPreview.cells.some(
        (c) =>
          c.row === row &&
          c.col === col &&
          c.row >= 0 &&
          c.row <= 9 &&
          c.col >= 0 &&
          c.col <= 9,
      );
      if (isInPreview) {
        return hoverPreview.valid ? "preview-valid" : "preview-invalid";
      }
    }

    // Check placed ships
    if (cellToShipMap.has(key)) {
      return "placed";
    }

    return "empty";
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-3">
      {/* Surrender — bottom center */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSurrenderOpen(true)}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs opacity-70 hover:opacity-100"
      >
        🏳️ Surrender
      </Button>

      <div className="relative overflow-hidden flex flex-col gap-4 items-center w-fit bg-surface/80 backdrop-blur-md rounded-2xl p-5 border border-border">
        {/* Teal accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-ocean/20 to-transparent rounded-t-2xl absolute top-0 left-0" />

        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-text-primary">
            ⚓ Deploy Your Fleet
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            {opponentName
              ? <>Battle against <span className="text-text-secondary font-medium">{opponentName}</span></>
              : "Position your fleet on the sea chart"}
          </p>
        </div>

        {error && (
          <Alert variant="error" className="w-full max-w-3xl">
            {error}
          </Alert>
        )}

        <div className="flex w-full max-w-4xl flex-col gap-6 md:flex-row md:gap-8">
          {/* Ship panel (left sidebar) — Fleet Manifest */}
          <div className="w-full shrink-0 md:w-52">
            <div className="rounded-xl border border-border bg-surface-elevated p-3">
              <h2 className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                🚢 Fleet Manifest
              </h2>
              <div className="divide-y divide-border-light">
                {fleet.map((shipType) => {
                  const isPlaced = placements.has(shipType);
                  const isSelected = selectedShipType === shipType;
                  const size = SHIP_SIZES[shipType];

                  return (
                    <button
                      key={shipType}
                      onClick={() => handleShipSelect(shipType)}
                      className={`flex w-full items-center gap-2 px-3 py-2 first:rounded-t-lg last:rounded-b-lg text-left text-sm transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/15 border-l-2 border-l-primary shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                          : isPlaced
                            ? "bg-success-bg border-l-2 border-l-success"
                            : "hover:bg-surface-secondary/60 border-l-2 border-l-transparent"
                      }`}
                    >
                      <div className="flex-1">
                        <span className="font-medium text-text-primary">
                          {SHIP_DISPLAY_NAMES[shipType]}
                        </span>
                        <span className="ml-1.5 text-xs text-text-muted">
                          ({size})
                        </span>
                        <div className="mt-1 flex gap-0.5">
                          {Array.from({ length: size }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-2.5 w-2.5 rounded-[2px] ${
                                isSelected
                                  ? "bg-primary"
                                  : isPlaced
                                    ? "bg-success"
                                    : "bg-text-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {isPlaced && (
                        <span className="text-success text-xs font-bold">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Orientation toggle */}
              <div className="mt-3 rounded-lg border border-border bg-surface-secondary/50 p-2.5">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
                  Orientation
                </span>
                <button
                  onClick={toggleOrientation}
                  className="w-full flex items-center justify-center gap-1 rounded-md bg-surface-elevated px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface transition-colors cursor-pointer"
                >
                  <span className="text-base">
                    {orientation === "HORIZONTAL" ? "→" : "↓"}
                  </span>
                  <span>
                    {orientation === "HORIZONTAL" ? "Horizontal" : "Vertical"}
                  </span>
                  <kbd className="ml-2 rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] font-mono text-text-muted border border-border-light">
                    R
                  </kbd>
                </button>
              </div>
            </div>
          </div>

          {/* Grid (center) */}
          <div className="flex flex-1 flex-col items-center">
            {/* Chart frame */}
            <div className="border border-border rounded-lg p-1 bg-surface-secondary/30">
              <div className="inline-block">
                {/* Column labels */}
                <div className="flex">
                  <div className="h-8 w-7 sm:w-8" /> {/* Corner spacer */}
                  {Array.from({ length: GRID_SIZE }).map((_, col) => (
                    <div
                      key={col}
                      className="flex h-8 w-7 sm:w-8 items-center justify-center text-[10px] font-mono text-text-muted"
                    >
                      {col + 1}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                {Array.from({ length: GRID_SIZE }).map((_, row) => (
                  <div key={row} className="flex">
                    {/* Row label */}
                    <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center text-[10px] font-mono text-text-muted">
                      {ROW_LABELS[row]}
                    </div>

                    {/* Cells */}
                    {Array.from({ length: GRID_SIZE }).map((_, col) => {
                      const state = getCellState(row, col);
                      return (
                        <div
                          key={col}
                          className={`h-7 w-7 sm:h-8 sm:w-8 cursor-pointer rounded-[2px] transition-all duration-100 ${
                            state === "placed"
                              ? "bg-teal-500/50 border border-teal-400/40 shadow-[inset_0_0_4px_rgba(45,212,191,0.3)]"
                              : state === "preview-valid"
                                ? "bg-green-500/40 border border-green-400/50 shadow-[0_0_6px_rgba(74,222,128,0.4)]"
                                : state === "preview-invalid"
                                  ? "bg-red-500/40 border border-red-400/50 shadow-[0_0_4px_rgba(248,113,113,0.3)]"
                                  : "bg-sky-950/50 border border-sky-900/40 hover:bg-sky-900/60"
                          }`}
                          onClick={() => handleCellClick(row, col)}
                          onMouseEnter={() => setHoveredCell({ row, col })}
                          onMouseLeave={() => setHoveredCell(null)}
                          role="button"
                          aria-label={`Cell ${ROW_LABELS[row]}${col + 1}${
                            state === "placed" ? " (ship placed)" : ""
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-3 rounded-lg border border-border bg-surface-secondary/30 p-2.5 w-full">
              <span className="text-[10px] text-text-muted font-medium mb-1.5 block">
                Actions
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleRandomize} className="flex-1">
                    ⚓ Auto-Deploy
                  </Button>
                  <Button variant="secondary" onClick={handleReset} className="flex-1">
                    🔄 Clear Sea
                  </Button>
                </div>
                <Button
                  variant="primary"
                  onClick={handleDeploy}
                  loading={submitting}
                  disabled={!allPlaced}
                  className="w-full"
                >
                  Deploy Fleet
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SurrenderModal
        open={surrenderOpen}
        onClose={() => setSurrenderOpen(false)}
        onConfirm={handleSurrender}
        loading={surrendering}
      />

      {/* Armament Haki selection modal */}
      <Modal open={armamentStep} onClose={() => setArmamentStep(false)} title="Armament Haki">
        <div className="bg-surface-elevated rounded-xl border border-border p-5 flex flex-col gap-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-text-primary">🛡️ Armament Haki</h3>
            <p className="text-xs text-red-400/80 font-semibold mt-0.5">
              Level {hakiProfile?.armamentLevel ?? 0}
            </p>
            <p className="text-sm text-text-secondary font-medium mt-1">
              Select {(hakiProfile?.armamentLevel ?? 0) >= 2 ? "2 ships to protect" : "1 ship to protect (3 hits)"}
            </p>
            {(hakiProfile?.armamentLevel ?? 0) >= 2 && (
              <p className="text-xs text-text-muted mt-1">
                {selectedShipIds.length === 0
                  ? "Select ship for full protection (unlimited)"
                  : selectedShipIds.length === 1
                    ? "Select ship for 3-hit protection"
                    : "✓ Both ships selected"}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {[...deployedShips].sort((a, b) => b.size - a.size).map((ship) => {
              const shipKey = ship.id || ship.type;
              const isSelected = ship.id
                ? selectedShipIds.includes(ship.id)
                : selectedShipIds.includes(ship.type);
              return (
                <button
                  key={shipKey}
                  type="button"
                  onClick={() => handleArmamentToggle(ship.id || ship.type)}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                    isSelected
                      ? "border-red-500 bg-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                      : "border-border bg-surface hover:bg-surface-secondary/60"
                  }`}
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: ship.size }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-3 w-3 rounded-[2px] ${
                          isSelected ? "bg-red-500" : "bg-text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`font-medium text-sm ${isSelected ? "text-red-300" : "text-text-primary"}`}>
                    {SHIP_DISPLAY_NAMES[ship.type]}
                  </span>
                  <span className="text-xs text-text-muted ml-auto">
                    Size {ship.size}
                  </span>
                  {isSelected && (
                    <span className="text-red-400 text-xs font-bold">
                      {(hakiProfile?.armamentLevel ?? 0) >= 2
                        ? selectedShipIds.indexOf(ship.id || ship.type) === 0
                          ? "∞"
                          : "3×"
                        : "3×"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <Button
              variant="danger"
              onClick={handleArmamentConfirm}
              loading={armamentSubmitting}
              disabled={
                selectedShipIds.length !== ((hakiProfile?.armamentLevel ?? 0) >= 2 ? 2 : 1)
              }
              className="w-full bg-red-900 hover:bg-red-800 text-red-100"
            >
              Activate Armament
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
