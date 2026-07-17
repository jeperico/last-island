"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { getHakiProfile, upgradeHaki } from "@/lib/api";
import type { ApiError } from "@/lib/api/client";
import type { HakiProfileResponse } from "@/lib/api/types";
import type { HakiType } from "@/types";
import { Alert, Button, Card, Spinner } from "@/components/ui";

// ─── Cost constants ──────────────────────────────────────────────────────────

const OBSERVATION_COSTS = [1, 1, 2];
const ARMAMENT_COSTS = [1, 1, 2];
const CONQUERORS_COSTS = [3, 3, 5];

// ─── Branch config ───────────────────────────────────────────────────────────

interface BranchConfig {
  type: HakiType;
  name: string;
  icon: string;
  description: string;
  costs: number[];
}

const BRANCHES: BranchConfig[] = [
  {
    type: "OBSERVATION",
    name: "Observation",
    icon: "👁",
    description:
      "Sense enemy positions. Reveals a random unfired cell on hit at Lv1, expands vision at higher levels.",
    costs: OBSERVATION_COSTS,
  },
  {
    type: "ARMAMENT",
    name: "Armament",
    icon: "✊",
    description:
      "Harden your shots. Ignore enemy evasion effects and deal bonus damage at higher levels.",
    costs: ARMAMENT_COSTS,
  },
  {
    type: "CONQUERORS",
    name: "Conqueror's",
    icon: "👑",
    description:
      "Dominate the battlefield. Skip enemy turns, unleash devastating X-pattern attacks at Lv3.",
    costs: CONQUERORS_COSTS,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLevel(profile: HakiProfileResponse, type: HakiType): number {
  switch (type) {
    case "OBSERVATION":
      return profile.observationLevel;
    case "ARMAMENT":
      return profile.armamentLevel;
    case "CONQUERORS":
      return profile.conquerorsLevel;
  }
}

function isConquerorUnlocked(profile: HakiProfileResponse): boolean {
  return (
    profile.observationLevel >= 1 &&
    profile.armamentLevel >= 1 &&
    (profile.observationLevel >= 3 || profile.armamentLevel >= 3)
  );
}

// ─── Level Pips ──────────────────────────────────────────────────────────────

function LevelPips({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border-2 transition-colors ${
            i < level
              ? "bg-primary border-primary"
              : "bg-transparent border-text-muted"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HakiPage() {
  const { isLoading } = useRequireAuth();

  const [profile, setProfile] = useState<HakiProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<HakiType | null>(null);

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;

    async function fetchProfile() {
      setLoadingProfile(true);
      try {
        const data = await getHakiProfile();
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) {
          const apiError = err as ApiError;
          setError(apiError.message ?? "Failed to load Haki profile");
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoading]);

  async function handleUpgrade(type: HakiType, targetLevel: number) {
    setError(null);
    setUpgrading(type);
    try {
      const updated = await upgradeHaki({ hakiType: type, targetLevel });
      setProfile(updated);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "Failed to upgrade Haki");
    } finally {
      setUpgrading(null);
    }
  }

  if (isLoading || loadingProfile) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-5xl space-y-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary bg-surface-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border hover:border-primary transition-all"
        >
          <span>←</span>
          <span>Grand Line</span>
        </Link>

        {/* Available points */}
        {profile && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Haki Skill Tree
            </h1>
            <p className="text-lg text-primary font-semibold">
              {profile.hakiPointsAvailable} point
              {profile.hakiPointsAvailable !== 1 ? "s" : ""} available
            </p>
            <p className="text-sm text-text-muted">
              {profile.hakiPoints} total earned ·{" "}
              {profile.bountyMilestonesReached} milestone
              {profile.bountyMilestonesReached !== 1 ? "s" : ""} reached
            </p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Branch cards grid */}
        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {BRANCHES.map((branch) => {
              const level = getLevel(profile, branch.type);
              const isMaxed = level >= 3;
              const nextCost = isMaxed ? null : branch.costs[level];
              const canAfford =
                nextCost !== null &&
                profile.hakiPointsAvailable >= nextCost;
              const isLocked =
                branch.type === "CONQUERORS" && !isConquerorUnlocked(profile);
              const isUpgrading = upgrading === branch.type;

              return (
                <Card
                  key={branch.type}
                  className={`relative flex flex-col ${
                    isLocked ? "opacity-60 border-text-muted" : ""
                  }`}
                >
                  {/* Locked overlay for Conqueror's */}
                  {isLocked && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-surface/80 backdrop-blur-sm p-4">
                      <span className="text-3xl mb-2">🔒</span>
                      <p className="text-sm text-text-secondary text-center font-medium">
                        Requires Observation Lv1 + Armament Lv1 + one Awakening
                        (Lv3)
                      </p>
                    </div>
                  )}

                  {/* Branch header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{branch.icon}</span>
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">
                        {branch.name}
                      </h2>
                      <p className="text-xs text-text-muted">
                        Level {level} / 3
                      </p>
                    </div>
                  </div>

                  {/* Level pips */}
                  <div className="mb-3">
                    <LevelPips level={level} />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-text-secondary mb-4 flex-1">
                    {branch.description}
                  </p>

                  {/* Upgrade button */}
                  {isMaxed ? (
                    <p className="text-sm font-semibold text-secondary text-center">
                      ✦ Awakened ✦
                    </p>
                  ) : (
                    <Button
                      variant="primary"
                      fullWidth
                      disabled={!canAfford || isLocked || isUpgrading}
                      loading={isUpgrading}
                      onClick={() => handleUpgrade(branch.type, level + 1)}
                    >
                      Upgrade Lv{level + 1} ({nextCost} pt
                      {nextCost !== null && nextCost > 1 ? "s" : ""})
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
