"use client";

import type {
  HakiProfileResponse,
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
  hakiProfile,
  isMyTurn,
  hakiUsedThisTurn,
  observationUsesLeft,
  conquerorsUsesLeft,
  conquerorsCooldown,
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

  function getObservationInfo(): string {
    if (!hakiProfile) return "";
    if (hakiProfile.observationLevel >= 3) return "3×3 + cross / 2×2";
    if (hakiProfile.observationLevel >= 2) return "3×3 / 2×2";
    return "2×2 scan";
  }

  function getConquerorsInfo(): string {
    if (!hakiProfile) return "";
    if (hakiProfile.conquerorsLevel >= 3) return "Skip + X-shot";
    if (hakiProfile.conquerorsLevel >= 2) return "Skip 5 turns";
    return "Skip 3 turns";
  }

  function renderPips(total: number, remaining: number, filledColor: string) {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-all ${
              i < remaining
                ? `${filledColor} shadow-[0_0_4px_currentColor]`
                : "bg-gray-700/60"
            }`}
          />
        ))}
      </div>
    );
  }

  const obsTotalUses = hakiProfile.observationLevel >= 2 ? 2 : 1;
  const conqTotalUses = hakiProfile.conquerorsLevel >= 2 ? 2 : 1;

  return (
    <div className="flex flex-col gap-2 w-48 rounded-xl border border-border bg-surface-elevated/80 backdrop-blur-sm p-3">
      {/* Title */}
      <div className="flex items-center gap-1.5 pb-1.5 border-b border-border-light">
        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Haki
        </span>
      </div>

      {/* Observation Panel */}
      {hasObservation && (
        <div
          className={[
            "rounded-lg p-2.5 border transition-all",
            observationMode
              ? "border-blue-400/60 bg-blue-900/30 shadow-[0_0_12px_rgba(96,165,250,0.2)]"
              : "border-blue-900/40 bg-blue-950/20",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">👁</span>
            <div className="flex-1">
              <span className="text-xs font-semibold text-blue-300 block">
                Observation
              </span>
              <span className="text-[10px] text-blue-400/70">
                Lv.{hakiProfile.observationLevel} · {getObservationInfo()}
              </span>
            </div>
          </div>

          {/* Charges */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-text-muted">Charges</span>
            {renderPips(obsTotalUses, observationUsesLeft, "bg-blue-400 text-blue-400")}
          </div>

          {/* Action */}
          {observationMode ? (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-blue-300 animate-pulse text-center">
                Targeting...
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancelObservation}
                className="w-full text-blue-300 hover:text-blue-200 text-xs h-7"
              >
                Cancel <kbd className="ml-1 text-[9px] opacity-60 bg-blue-900/40 px-1 rounded">Esc</kbd>
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              disabled={!canUseObservation}
              onClick={onStartObservation}
              className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 text-xs h-7 border border-blue-800/40 disabled:opacity-30"
            >
              {observationUsesLeft === 0 ? "Depleted" : "👁 Scan"}
            </Button>
          )}
        </div>
      )}

      {/* Armament Panel (passive) */}
      {hasArmament && (
        <div className="rounded-lg p-2.5 border border-red-900/40 bg-red-950/15">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <div className="flex-1">
              <span className="text-xs font-semibold text-red-300 block">
                Armament
              </span>
              <span className="text-[10px] text-red-400/70">
                Lv.{hakiProfile.armamentLevel} · Passive
              </span>
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            <div className="h-1 flex-1 rounded-full bg-red-800/30">
              <div
                className="h-full rounded-full bg-red-500/60"
                style={{ width: `${(hakiProfile.armamentLevel / 3) * 100}%` }}
              />
            </div>
            <span className="text-[9px] text-red-400/50">auto</span>
          </div>
        </div>
      )}

      {/* Conqueror's Panel */}
      {hasConquerors && (
        <div
          className={[
            "rounded-lg p-2.5 border transition-all",
            conquerorsMode
              ? "border-purple-400/60 bg-purple-900/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
              : "border-purple-900/40 bg-purple-950/20",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">👑</span>
            <div className="flex-1">
              <span className="text-xs font-semibold text-purple-300 block">
                Conqueror&apos;s
              </span>
              <span className="text-[10px] text-purple-400/70">
                Lv.{hakiProfile.conquerorsLevel} · {getConquerorsInfo()}
              </span>
            </div>
          </div>

          {/* Charges */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-text-muted">Charges</span>
            {renderPips(conqTotalUses, conquerorsUsesLeft, "bg-purple-400 text-purple-400")}
          </div>

          {/* Cooldown indicator */}
          {conquerorsCooldown > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[10px] text-yellow-400/80">
                ⏳ Cooldown: {conquerorsCooldown} turns
              </span>
            </div>
          )}

          {/* Action */}
          {conquerorsMode ? (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-purple-300 animate-pulse text-center">
                Targeting...
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancelConquerors}
                className="w-full text-purple-300 hover:text-purple-200 text-xs h-7"
              >
                Cancel <kbd className="ml-1 text-[9px] opacity-60 bg-purple-900/40 px-1 rounded">Esc</kbd>
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              disabled={!canUseConquerors}
              onClick={onStartConquerors}
              className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 text-xs h-7 border border-purple-800/40 disabled:opacity-30"
            >
              👑 Dominate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
