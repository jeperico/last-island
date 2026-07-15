"use client";

import { useState } from "react";

interface AvatarIconProps {
  avatar: string | null;
  filiation?: "PIRATE" | "MARINE" | null;
  rank?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  highlight?: "gold" | "none";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
} as const;

const wrapperSizeClasses = {
  sm: "w-8 h-8",
  md: "w-14 h-14",
  lg: "w-[4.5rem] h-[4.5rem]",
} as const;

// ─── Rank visual tiers ───────────────────────────────────────────────────────

type RankTier = "default" | "rising" | "elite" | "legendary" | "mythical" | "king";

function getRankTier(rank: string | null | undefined): RankTier {
  if (!rank) return "default";
  switch (rank) {
    case "ROOKIE":
    case "SEAMAN":
      return "default";
    case "SUPER_ROOKIE":
    case "CAPTAIN":
      return "rising";
    case "SUPERNOVA":
    case "COMMODORE":
      return "elite";
    case "SHICHIBUKAI":
    case "VICE_ADMIRAL":
      return "legendary";
    case "YONKO":
    case "ADMIRAL":
      return "mythical";
    case "PIRATE_KING":
    case "FLEET_ADMIRAL":
      return "king";
    default:
      return "default";
  }
}

// Border + glow styles per tier
const tierStyles: Record<RankTier, { border: string; glow: string; animate: string }> = {
  default: {
    border: "border-2 border-border",
    glow: "",
    animate: "",
  },
  rising: {
    border: "border-2 border-blue-500",
    glow: "",
    animate: "",
  },
  elite: {
    border: "border-2 border-yellow-500",
    glow: "shadow-[0_0_10px_rgba(234,179,8,0.6)]",
    animate: "",
  },
  legendary: {
    border: "border-[3px] border-purple-500",
    glow: "shadow-[0_0_14px_rgba(168,85,247,0.7)]",
    animate: "",
  },
  mythical: {
    border: "border-[3px] border-red-500",
    glow: "animate-[shadow-rotate_3s_linear_infinite]",
    animate: "",
  },
  king: {
    border: "border-[3px] border-white",
    glow: "animate-[shadow-rotate-king_2s_linear_infinite]",
    animate: "",
  },
};

// ─── Fallback images ─────────────────────────────────────────────────────────

const MARINE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%231a1a2e'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-size='24' fill='%234a4a6a'%3E⚓%3C/text%3E%3C/svg%3E";

const PIRATE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%231a1a2e'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-size='24' fill='%234a4a6a'%3E☠️%3C/text%3E%3C/svg%3E";

// ─── Component ───────────────────────────────────────────────────────────────

export function AvatarIcon({
  avatar,
  filiation,
  rank,
  size = "md",
  className = "",
  highlight = "none",
}: AvatarIconProps) {
  const [hasError, setHasError] = useState(false);

  const fallbackUri = filiation === "PIRATE" ? PIRATE_FALLBACK : MARINE_FALLBACK;

  const src = hasError
    ? fallbackUri
    : avatar
      ? `/avatars/${avatar.toLowerCase()}/profile.jpg`
      : "/avatars/default/profile.jpg";

  const tier = getRankTier(rank);
  const style = tierStyles[tier];

  // highlight="gold" overrides rank styling (used for winner displays)
  const borderClass = highlight === "gold"
    ? "border-[3px] border-yellow-400"
    : style.border;
  const glowClass = highlight === "gold"
    ? "shadow-[0_0_14px_rgba(234,179,8,0.7)]"
    : style.glow;
  const animateClass = highlight === "gold" ? "" : style.animate;

  // Show glow on sm only for legendary+ tiers (SHICHIBUKAI and above)
  const isHighTier = tier === "legendary" || tier === "mythical" || tier === "king";
  const showGlow = glowClass && (size !== "sm" || isHighTier);

  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center ${wrapperSizeClasses[size]} ${className}`}>
      {/* Glow layer */}
      {showGlow && (
        <div className={`absolute inset-0 rounded-full ${glowClass}`} />
      )}
      {/* Avatar image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={avatar ?? "Default avatar"}
        className={`rounded-full object-cover ${sizeClasses[size]} ${borderClass} ${animateClass}`}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
