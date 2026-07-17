"use client";

import { useState } from "react";
import { activateObservation, activateConquerors } from "@/lib/api";
import type {
  HakiProfileResponse,
  ObservationResponse,
  ConquerorsActivationResponse,
  RevealedCell,
} from "@/lib/api/types";
import { Button } from "@/components/ui";

interface HakiBarProps {
  gameToken: string;
  hakiProfile: HakiProfileResponse | null;
  isMyTurn: boolean;
  hakiUsedThisTurn: boolean;
  observationUsesLeft: number;
  conquerorsUsesLeft: number;
  conquerorsCooldown: number;
  onHakiUsed: () => void;
  onObservationResult: (cells: RevealedCell[]) => void;
  onConquerorsResult: (result: ConquerorsActivationResponse) => void;
  onError: (msg: string) => void;
  // Observation targeting
  observationMode: boolean;
  onStartObservation: () => void;
  onCancelObservation: () => void;
  // Conquerors targeting
  conquerorsMode: boolean;
  onStartConquerors: () => void;
  onCancelConquerors: () => void;
}

export function HakiBar({
  gameToken,
  hakiProfile,
  isMyTurn,
  hakiUsedThisTurn,
  observationUsesLeft,
  conquerorsUsesLeft,
  conquerorsCooldown,
  onHakiUsed,
  onObservationResult,
  onConquerorsResult,
  onError,
  observationMode,
  onStartObservation,
  onCancelObservation,
  conquerorsMode,
  onStartConquerors,
  onCancelConquerors,
}: HakiBarProps) {
  if (!hakiProfile) return null;

  const hasObservation = hakiProfile.observationLevel > 0;
  const hasArmament = hakiProfile.armamentLevel > 0;
  const hasConquerors = hakiProfile.conquerorsLevel > 0;

  if (!hasObservation && !hasArmament && !hasConquerors) return null;

  const canUseObservation =
    isMyTurn && !hakiUsedThisTurn && hasObservation && observationUsesLeft > 0;
  const canUseConquerors =
    isMyTurn &&
    !hakiUsedThisTurn &&
    hasConquerors &&
    conquerorsUsesLeft > 0 &&
    conquerorsCooldown === 0;

  // Determine observation area size based on next use
  function getObservationInfo(): string {
    if (!hakiProfile) return "";
    const totalUses = hakiProfile.observationLevel >= 2 ? 2 : 1;
    const used = totalUses - observationUsesLeft;
    if (used === 0) return "2×2 scan";
    if (hakiProfile.observationLevel === 2) return "3×3 scan";
    if (hakiProfile.observationLevel === 3) return "3×3 + row/col";
    return "2×2 scan";
  }

  function getConquerorsInfo(): string {
    if (!hakiProfile) return "";
    const totalUses = hakiProfile.conquerorsLevel >= 2 ? 2 : 1;
    const used = totalUses - conquerorsUsesLeft;
    if (used === 0) return "Skip 3 turns";
    if (hakiProfile.conquerorsLevel === 2) return "Skip 5 turns";
    if (hakiProfile.conquerorsLevel === 3) return "Skip 5 + X-shot";
    return "Skip 3 turns";
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-surface-secondary/60 border border-border rounded-xl">
      <span className="text-xs text-text-muted font-semibold uppercase tracking-wide">
        Haki
      </span>

      {/* Observation */}
      {hasObservation && (
        <div className="flex items-center gap-1">
          {observationMode ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelObservation}
              className="text-warning border-warning"
            >
              ✕ Cancel
            </Button>
          ) : (
            <Button
              size="sm"
              variant={canUseObservation ? "secondary" : "ghost"}
              disabled={!canUseObservation}
              onClick={onStartObservation}
              title={getObservationInfo()}
            >
              👁 {observationUsesLeft}
            </Button>
          )}
        </div>
      )}

      {/* Armament (passive indicator) */}
      {hasArmament && (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted"
          title="Armament Haki — passive (triggers on opponent's hit)"
        >
          ✊ <span className="text-text-secondary">passive</span>
        </div>
      )}

      {/* Conqueror's */}
      {hasConquerors && (
        <div className="flex items-center gap-1">
          {conquerorsMode ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelConquerors}
              className="text-warning border-warning"
            >
              ✕ Cancel
            </Button>
          ) : (
            <Button
              size="sm"
              variant={canUseConquerors ? "secondary" : "ghost"}
              disabled={!canUseConquerors}
              onClick={onStartConquerors}
              title={
                conquerorsCooldown > 0
                  ? `Cooldown: ${conquerorsCooldown} turns`
                  : getConquerorsInfo()
              }
            >
              👑 {conquerorsUsesLeft}
              {conquerorsCooldown > 0 && (
                <span className="ml-1 text-warning text-xs">
                  ({conquerorsCooldown}cd)
                </span>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
