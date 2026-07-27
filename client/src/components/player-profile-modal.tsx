"use client";

import { Modal, AvatarIcon, getRankTier, tierStyles } from "@/components/ui";
import { formatBounty } from "@/lib/format";
import type { LeaderboardEntryResponse } from "@/lib/api/types";

interface PlayerProfileModalProps {
  open: boolean;
  onClose: () => void;
  player: LeaderboardEntryResponse | null;
}

export function PlayerProfileModal({ open, onClose, player }: PlayerProfileModalProps) {
  if (!player) return null;

  const tier = getRankTier(player.rank);
  const styles = tierStyles[tier];

  const tierCardStyles: Record<string, string> = {
    default: "bg-gradient-to-b from-surface-elevated to-surface border border-border",
    rising: "bg-gradient-to-b from-blue-950 to-blue-950/60 border border-blue-500/60",
    elite: "bg-gradient-to-b from-yellow-950 to-yellow-950/60 border border-yellow-500/60",
    legendary: "bg-gradient-to-b from-purple-950 to-purple-950/60 border border-purple-500/60",
    mythical: "bg-gradient-to-b from-red-950 to-red-950/60 border border-red-500/60",
    king: "bg-gradient-to-b from-black to-gray-950/60 border border-gray-800",
  };

  const losses = player.losses;
  const winRatePercent = Math.round(player.winRate * 100);

  const avatarKey = player.avatar?.toLowerCase();
  const bannerImage = avatarKey ? `/avatars/${avatarKey}/banner.jpg` : null;

  return (
    <Modal open={open} onClose={onClose} title="Player Profile">
      <div className={`rounded-xl overflow-hidden ${tierCardStyles[tier] || tierCardStyles.default}`}>
        {/* Banner */}
        <div className="relative h-32 overflow-hidden">
          <div
            className="absolute inset-0 bg-surface-secondary bg-cover bg-center"
            style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content with avatar overlapping the banner */}
        <div className="flex flex-col items-center gap-4 px-6 pb-6 -mt-9">
          {/* Avatar with tier glow */}
          <div className={`rounded-full ${styles.glow} ${styles.animate}`}>
            <AvatarIcon avatar={player.avatar} rank={player.rank} size="lg" />
          </div>

          {/* Player name */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-text-muted">#{player.position}</span>
            <p className="text-xl font-bold text-text-primary">{player.name}</p>
          </div>

          {/* Rank badge */}
          <span
            className={`text-xs uppercase tracking-wide ${
              tier === "king"
                ? "text-white"
                : tier === "mythical"
                  ? "text-red-400"
                  : tier === "legendary"
                    ? "text-purple-400"
                    : tier === "elite"
                      ? "text-yellow-400"
                      : tier === "rising"
                        ? "text-blue-400"
                        : "text-text-secondary"
            }`}
          >
            {player.rank.replace("_", " ")}
          </span>

          {/* Bounty */}
          <p className="text-lg font-semibold text-secondary">
            {formatBounty(player.bounty)} ₿
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{player.wins}</p>
              <p className="text-sm text-text-secondary">Wins</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{losses}</p>
              <p className="text-sm text-text-secondary">Losses</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{winRatePercent}%</p>
              <p className="text-sm text-text-secondary">Win Rate</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
