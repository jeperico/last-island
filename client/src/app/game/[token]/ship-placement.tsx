"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { placeShips, surrender, getGame } from "@/lib/api";
import type {
  GamePhase,
  Orientation,
  ShipType,
  PlaceShipsRequest,
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
import { Alert, Button } from "@/components/ui";
import { SurrenderModal } from "@/components/surrender-modal";

const GRID_SIZE = 10;
const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

interface ShipPlacementProps {
  gameToken: string;
  onPlacementComplete: (gamePhase: GamePhase) => void;
}

interface PlacementEntry {
  row: number;
  col: number;
  orientation: Orientation;
}

export function ShipPlacement({
  gameToken,
  onPlacementComplete,
}: ShipPlacementProps) {
  const fleet = useMemo(() => PIRATE_FLEET, []);

  const [selectedShipType, setSelectedShipType] = useState<ShipType | null>(
    () => PIRATE_FLEET[0] ?? null,
  );
  const [orientation, setOrientation] = useState<Orientation>("HORIZONTAL");
  const [placements, setPlacements] = useState<Map<ShipType, PlacementEntry>>(
    new Map(),
  );
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surrenderOpen, setSurrenderOpen] = useState(false);
  const [surrendering, setSurrendering] = useState(false);

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
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-6">
      {/* Surrender — bottom center */}
      <button
        type="button"
        onClick={() => setSurrenderOpen(true)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-danger bg-surface/80 border border-danger/30 hover:bg-danger/10 px-4 py-2 rounded-lg transition-colors cursor-pointer"
      >
        🏳️ Surrender
      </button>

      <div className="flex flex-col gap-10 items-center w-fit bg-surface/80 backdrop-blur-sm rounded-2xl p-6">
        <h1 className="mb-4 text-xl font-bold text-foreground">
          Deploy Your Fleet
        </h1>

        {error && (
          <Alert variant="error" className="mb-4 w-full max-w-3xl">
            {error}
          </Alert>
        )}

        <div className="flex w-full max-w-4xl flex-col gap-24 md:flex-row">
          {/* Ship panel (left sidebar) */}
          <div className="w-full shrink-0 md:w-56">
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              Ships
            </h2>
            <div className="space-y-2">
              {fleet.map((shipType) => {
                const isPlaced = placements.has(shipType);
                const isSelected = selectedShipType === shipType;
                const size = SHIP_SIZES[shipType];

                return (
                  <button
                    key={shipType}
                    onClick={() => handleShipSelect(shipType)}
                    className={`flex w-full items-center gap-2 rounded border px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-blue-950"
                        : isPlaced
                          ? "border-green-700 bg-green-950"
                          : "border-border bg-surface-secondary hover:border-border-light hover:bg-surface"
                    }`}
                  >
                    <div className="flex-1">
                      <span className="font-medium text-foreground">
                        {SHIP_DISPLAY_NAMES[shipType]}
                      </span>
                      <div className="mt-1 flex gap-0.5">
                        {Array.from({ length: size }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2.5 w-2.5 rounded-sm ${
                              isPlaced ? "bg-green-500" : "bg-slate-400"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {isPlaced && (
                      <span className="text-xs text-green-400">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Orientation toggle */}
            <div className="mt-4">
              <button
                onClick={toggleOrientation}
                className="w-full rounded border border-border bg-surface-secondary px-3 py-2 text-sm text-foreground hover:bg-surface"
              >
                Orientation:{" "}
                <span className="font-medium">
                  {orientation === "HORIZONTAL" ? "→ Horizontal" : "↓ Vertical"}
                </span>
                <span className="ml-2 text-xs text-text-secondary">(R)</span>
              </button>
            </div>
          </div>

          {/* Grid (center) */}
          <div className="flex flex-1 flex-col items-center">
            <div className="inline-block">
              {/* Column labels */}
              <div className="flex">
                <div className="h-8 w-7 sm:w-8" /> {/* Corner spacer */}
                {Array.from({ length: GRID_SIZE }).map((_, col) => (
                  <div
                    key={col}
                    className="flex h-8 w-7 sm:w-8 items-center justify-center text-xs font-medium text-text-secondary"
                  >
                    {col + 1}
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {Array.from({ length: GRID_SIZE }).map((_, row) => (
                <div key={row} className="flex">
                  {/* Row label */}
                  <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center text-xs font-medium text-text-secondary">
                    {ROW_LABELS[row]}
                  </div>

                  {/* Cells */}
                  {Array.from({ length: GRID_SIZE }).map((_, col) => {
                    const state = getCellState(row, col);
                    return (
                      <div
                        key={col}
                        className={`h-7 w-7 sm:h-8 sm:w-8 cursor-pointer border border-border transition-colors ${
                          state === "placed"
                            ? "bg-teal-600/60"
                            : state === "preview-valid"
                              ? "bg-green-500/60"
                              : state === "preview-invalid"
                                ? "bg-red-500/60"
                                : "bg-sky-950/40 hover:bg-sky-900/40"
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

            {/* Action buttons */}
            <div className="mt-4 flex flex-col gap-2 w-full">
              <div className="flex gap-3">
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

      <SurrenderModal
        open={surrenderOpen}
        onClose={() => setSurrenderOpen(false)}
        onConfirm={handleSurrender}
        loading={surrendering}
      />
    </div>
  );
}
