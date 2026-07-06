"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { placeShips } from "@/lib/api";
import type {
  Filiation,
  GamePhase,
  Orientation,
  ShipType,
  PlaceShipsRequest,
} from "@/lib/api/types";
import {
  getFleetForFiliation,
  SHIP_SIZES,
  SHIP_DISPLAY_NAMES,
  getShipCells,
  isInBounds,
  hasOverlap,
  cellKey,
} from "@/lib/game";
import { Alert, Button } from "@/components/ui";

const GRID_SIZE = 10;
const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

interface ShipPlacementProps {
  gameToken: string;
  filiation: Filiation;
  onPlacementComplete: (gamePhase: GamePhase) => void;
}

interface PlacementEntry {
  row: number;
  col: number;
  orientation: Orientation;
}

export function ShipPlacement({
  gameToken,
  filiation,
  onPlacementComplete,
}: ShipPlacementProps) {
  const [selectedShipType, setSelectedShipType] = useState<ShipType | null>(
    null,
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

  const fleet = useMemo(() => getFleetForFiliation(filiation), [filiation]);

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
    setSelectedShipType(null);
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
    <div className="flex flex-1 flex-col items-center px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-foreground">
        Deploy Your Fleet
      </h1>

      {error && (
        <Alert variant="error" className="mb-4 w-full max-w-3xl">
          {error}
        </Alert>
      )}

      <div className="flex w-full max-w-4xl flex-col gap-6 md:flex-row">
        {/* Ship panel (left sidebar) */}
        <div className="w-full shrink-0 md:w-56">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Ships</h2>
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
                      ? "border-ocean bg-blue-900/30"
                      : isPlaced
                        ? "border-green-700 bg-green-900/30 opacity-70"
                        : "border-border hover:border-border-light hover:bg-surface-secondary"
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
                            isPlaced ? "bg-green-500" : "bg-text-muted"
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
              className="w-full rounded border border-border px-3 py-2 text-sm text-foreground hover:bg-surface-secondary"
            >
              Orientation:{" "}
              <span className="font-medium">
                {orientation === "HORIZONTAL" ? "→ Horizontal" : "↓ Vertical"}
              </span>
              <span className="ml-2 text-xs text-text-muted">(R)</span>
            </button>
          </div>
        </div>

        {/* Grid (center) */}
        <div className="flex flex-1 flex-col items-center">
          <div className="inline-block">
            {/* Column labels */}
            <div className="flex">
              <div className="h-8 w-8" /> {/* Corner spacer */}
              {Array.from({ length: GRID_SIZE }).map((_, col) => (
                <div
                  key={col}
                  className="flex h-8 w-8 items-center justify-center text-xs font-medium text-text-muted"
                >
                  {col + 1}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {Array.from({ length: GRID_SIZE }).map((_, row) => (
              <div key={row} className="flex">
                {/* Row label */}
                <div className="flex h-8 w-8 items-center justify-center text-xs font-medium text-text-muted">
                  {ROW_LABELS[row]}
                </div>

                {/* Cells */}
                {Array.from({ length: GRID_SIZE }).map((_, col) => {
                  const state = getCellState(row, col);
                  return (
                    <div
                      key={col}
                      className={`h-8 w-8 cursor-pointer border border-border transition-colors ${
                        state === "placed"
                          ? "bg-teal-600"
                          : state === "preview-valid"
                            ? "bg-green-400/60"
                            : state === "preview-invalid"
                              ? "bg-red-400/60"
                              : "bg-sky-900/40 hover:bg-sky-800/50"
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
          <div className="mt-4 flex gap-3">
            <Button
              variant="primary"
              onClick={handleDeploy}
              loading={submitting}
              disabled={!allPlaced}
            >
              Deploy Fleet
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
