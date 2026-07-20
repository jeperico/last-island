"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { getHakiProfile, upgradeHaki } from "@/lib/api";
import type { ApiError } from "@/lib/api/client";
import type { HakiProfileResponse } from "@/lib/api/types";
import type { HakiType } from "@/types";
import {
  Alert,
  Button,
  Spinner,
  AvatarIcon,
  getRankTier,
  tierStyles,
} from "@/components/ui";
import { formatBounty } from "@/lib/format";

// ─── Cost constants ──────────────────────────────────────────────────────────

const OBSERVATION_COSTS = [1, 1, 2];
const ARMAMENT_COSTS = [1, 1, 2];
const CONQUERORS_COSTS = [3, 3, 5];

// ─── Branch config ───────────────────────────────────────────────────────────

interface BranchColor {
  accent: string;
  bg: string;
  border: string;
  glow: string;
  pip: string;
}

interface BranchConfig {
  type: HakiType;
  name: string;
  icon: string;
  descriptions: string[];
  costs: number[];
  color: BranchColor;
}

const BRANCHES: BranchConfig[] = [
  {
    type: "OBSERVATION",
    name: "Observation",
    icon: "👁",
    descriptions: [
      "Reveals a random unfired cell on hit",
      "Expands vision radius around hits",
      "Full battlefield awareness on critical hits",
    ],
    costs: OBSERVATION_COSTS,
    color: {
      accent: "text-blue-400",
      bg: "from-blue-500/20",
      border: "border-blue-500/50",
      glow: "shadow-[0_0_12px_rgba(59,130,246,0.4)]",
      pip: "bg-blue-400",
    },
  },
  {
    type: "ARMAMENT",
    name: "Armament",
    icon: "✊",
    descriptions: [
      "Ignore enemy evasion effects",
      "Deal bonus damage on hardened shots",
      "Piercing strikes bypass all defenses",
    ],
    costs: ARMAMENT_COSTS,
    color: {
      accent: "text-red-400",
      bg: "from-red-500/20",
      border: "border-red-500/50",
      glow: "shadow-[0_0_12px_rgba(248,113,113,0.4)]",
      pip: "bg-red-400",
    },
  },
  {
    type: "CONQUERORS",
    name: "Conqueror's",
    icon: "👑",
    descriptions: [
      "Intimidate — skip enemy turn once per game",
      "Dominate — stun radius expands",
      "Supreme King — devastating X-pattern attack",
    ],
    costs: CONQUERORS_COSTS,
    color: {
      accent: "text-purple-400",
      bg: "from-purple-500/20",
      border: "border-purple-500/50",
      glow: "shadow-[0_0_12px_rgba(168,85,247,0.4)]",
      pip: "bg-purple-400",
    },
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

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ level, color }: { level: number; color: BranchColor }) {
  return (
    <div className="flex items-center gap-1 w-full">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-2.5 flex-1 rounded-full transition-all ${
            i < level
              ? `${color.pip} ${color.glow}`
              : "bg-surface-secondary"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HakiPage() {
  const { user, isLoading } = useRequireAuth();

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

  if (isLoading || !user || loadingProfile) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const tier = getRankTier(user.rank);
  const rankStyle = tierStyles[tier];

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-7xl space-y-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary bg-surface-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border hover:border-primary transition-all"
        >
          <span>←</span>
          <span>Grand Line</span>
        </Link>

        {/* Hero Card */}
        {profile && (
          <div
            className={`relative overflow-hidden rounded-xl ${rankStyle.border} ${rankStyle.glow} bg-surface p-6`}
          >
            {/* Background wallpaper */}
            {user.avatar && (
              <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                <div
                  className="absolute top-1/2 left-1/2 w-[100vh] h-[100vw] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(/avatars/${user.avatar.toLowerCase()}/${user.avatar.toLowerCase()}-bg-01.jpg)`,
                  }}
                />
              </div>
            )}

            <div className="relative flex items-center gap-5">
              <AvatarIcon avatar={user.avatar} rank={user.rank} size="lg" />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-text-primary truncate">
                  {user.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-secondary text-xs font-semibold text-text-secondary">
                    {user.rank.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-bold text-secondary">
                    {formatBounty(user.bounty)} ₿
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-primary">
                      {profile.hakiPointsAvailable}
                    </span>
                    <span className="text-xs text-text-muted">Available</span>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-text-primary">
                      {profile.hakiPoints}
                    </span>
                    <span className="text-xs text-text-muted">Total Earned</span>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-text-primary">
                      {profile.bountyMilestonesReached}
                    </span>
                    <span className="text-xs text-text-muted">
                      Milestone{profile.bountyMilestonesReached !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
                <div
                  key={branch.type}
                  className={`relative flex flex-col rounded-xl border overflow-hidden ${
                    isMaxed
                      ? `border-secondary/50 shadow-[0_0_16px_rgba(245,158,11,0.2)]`
                      : "border-border"
                  } bg-surface-elevated`}
                >
                  {/* Top accent strip */}
                  <div
                    className={`h-1 w-full bg-gradient-to-r ${branch.color.bg} to-transparent`}
                  />

                  {/* Card content */}
                  <div className="flex flex-col flex-1 p-5">
                    {/* Locked overlay for Conqueror's */}
                    {isLocked && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-surface/70 backdrop-blur-md p-4">
                        <div className="flex flex-col items-center border border-purple-500/20 rounded-xl p-6">
                          <span className="text-4xl mb-3">🔒</span>
                          <p className="text-sm text-text-secondary text-center font-medium">
                            Requires <span className="font-bold text-blue-400">Observation Lv1</span> +{" "}
                            <span className="font-bold text-red-400">Armament Lv1</span> + one{" "}
                            <span className="font-bold text-secondary">Awakening (Lv3)</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Branch header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{branch.icon}</span>
                      <div>
                        <h2 className={`text-lg font-bold ${branch.color.accent}`}>
                          {branch.name}
                        </h2>
                        <p className="text-xs text-text-muted">
                          Level {level} / 3
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <ProgressBar level={level} color={branch.color} />
                    </div>

                    {/* Per-level descriptions */}
                    <div className="mb-4 flex-1 space-y-1.5">
                      {branch.descriptions.map((desc, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span
                            className={`text-xs font-semibold shrink-0 w-7 ${
                              i < level ? branch.color.accent : "text-text-muted opacity-60"
                            }`}
                          >
                            Lv{i + 1}
                          </span>
                          <span
                            className={`text-xs ${
                              i < level ? "text-text-secondary" : "text-text-muted opacity-60"
                            }`}
                          >
                            {desc}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Upgrade button or Awakened state */}
                    {isMaxed ? (
                      <p className="text-sm font-bold text-secondary text-center py-2">
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
