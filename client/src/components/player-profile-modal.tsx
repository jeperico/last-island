"use client";

import { Modal, AvatarIcon, getRankTier, tierStyles } from "@/components/ui";
import { formatBounty } from "@/lib/format";
import type { LeaderboardEntryResponse } from "@/interfaces/api";

interface PlayerProfileModalProps {
  open: boolean;
  onClose: () => void;
  player: LeaderboardEntryResponse | null;
}

const rankBg: Record<string, string> = {
  default: "bg-surface-secondary/60 text-text-muted",
  rising: "bg-blue-950/60 text-blue-300",
  elite: "bg-yellow-950/60 text-yellow-300",
  legendary: "bg-purple-950/60 text-purple-300",
  mythical: "bg-red-950/60 text-red-300",
  king: "bg-white/10 text-white",
};

export function PlayerProfileModal({ open, onClose, player }: PlayerProfileModalProps) {
  if (!player) return null;

  const tier = getRankTier(player.rank);
  const style = tierStyles[tier];

  // Derive losses from wins and winRate
  const totalGames = player.winRate > 0 ? Math.round(player.wins / player.winRate) : player.wins;
  const losses = totalGames - player.wins;

  const avatarKey = player.avatar?.toLowerCase();
  const avatarBg = avatarKey ? `/avatars/${avatarKey}/${avatarKey}-bg-02.jpg` : null;

  return (
    <Modal open={open} onClose={onClose} title="Player Profile">
      <div className={`bg-surface-elevated rounded-xl overflow-hidden border ${style.border} ${style.glow}`}>
        {/* Banner with avatar background */}
        <div className="relative h-40 overflow-hidden">
          {avatarBg && (
            <div
              className="absolute inset-0 bg-cover bg-top"
              style={{ backgroundImage: `url(${avatarBg})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-elevated)] via-black/60 to-black/20" />
        </div>

        {/* Avatar overlapping banner/content boundary */}
        <div className="flex justify-center -mt-10 relative z-10">
          <AvatarIcon avatar={player.avatar} rank={player.rank} size="lg" />
        </div>

        {/* Content */}
        <div className="pt-4 pb-6 px-6 flex flex-col items-center gap-3">
          {/* Player name */}
          <h3 className="text-text-primary font-bold text-xl text-center">
            {player.name}
          </h3>

          {/* Rank badge */}
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${rankBg[tier] || rankBg.default}`}>
            {player.rank.replace("_", " ")}
          </span>

          {/* Bounty */}
          <p className="text-secondary text-lg font-bold">
            {formatBounty(player.bounty)} ₿
          </p>

          {/* Stats grid */}
          <div className="w-full grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex flex-col items-center">
              <span className="text-text-primary font-bold text-lg">{player.wins}</span>
              <span className="text-text-muted text-xs">Wins</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-text-primary font-bold text-lg">{losses}</span>
              <span className="text-text-muted text-xs">Losses</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-text-primary font-bold text-lg">{Math.round(player.winRate * 100)}%</span>
              <span className="text-text-muted text-xs">Win Rate</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
