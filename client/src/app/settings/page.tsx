"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { updateProfile } from "@/lib/api";
import type { ApiError } from "@/lib/api/client";
import { useSound } from "@/lib/sound";
import {
  Alert,
  Spinner,
  AvatarIcon,
  getRankTier,
  tierStyles,
} from "@/components/ui";
import { formatBounty } from "@/lib/format";
import { trackAvatarSelected } from "@/lib/analytics";

// ─── Avatar options ──────────────────────────────────────────────────────────

const AVATAR_OPTIONS = [
  { key: "LUFFY", name: "Luffy", image: "/avatars/luffy/profile.jpg" },
  { key: "ZORO", name: "Zoro", image: "/avatars/zoro/profile.jpg" },
  { key: "ROBIN", name: "Robin", image: "/avatars/robin/profile.jpg" },
  { key: "CHOPPER", name: "Chopper", image: "/avatars/chopper/profile.jpg" },
  { key: "ACE", name: "Ace", image: "/avatars/ace/profile.jpg" },
  {
    key: "USOPP",
    name: "Usopp",
    image: "/avatars/usopp/profile.jpg",
  },
] as const;

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, isLoading } = useRequireAuth();
  const { refreshUser } = useAuth();
  const {
    isMuted,
    toggleMute,
    musicVolume,
    setMusicVolume,
    sfxVolume,
    setSfxVolume,
    playLaugh,
  } = useSound();

  const [error, setError] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState<string | null>(null);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  async function handleAvatarChange(avatarKey: string) {
    if (avatarKey === user!.avatar) return;

    playLaugh(avatarKey);
    setError(null);
    setSavingAvatar(avatarKey);
    try {
      await updateProfile({ avatar: avatarKey });
      await refreshUser();
      trackAvatarSelected(avatarKey, "settings");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "Failed to update avatar");
    } finally {
      setSavingAvatar(null);
    }
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

        {/* Error display */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Profile Hero Card */}
        <div
          className={`relative overflow-hidden rounded-xl ${rankStyle.border} ${rankStyle.glow} bg-surface p-6`}
        >
          {/* Background wallpaper */}
          {user.avatar && (
            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
              <Image
                src={`/avatars/${user.avatar.toLowerCase()}/banner.jpg`}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}

          <div className="relative flex items-center gap-5">
            <AvatarIcon avatar={user.avatar} rank={user.rank} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-text-primary truncate">
                {user.name}
              </h1>
              <p className="text-sm text-text-muted mt-0.5">{user.email}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-secondary text-xs font-semibold text-text-secondary">
                  {user.rank.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-bold text-secondary">
                  {formatBounty(user.bounty)} ₿
                </span>
                <span className="text-xs text-text-muted">
                  {user.wins}W · {user.losses}L
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Selection */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex gap-1 h-48 sm:h-56">
            {AVATAR_OPTIONS.map((option, index) => {
              const isSelected = user.avatar === option.key;
              const clipPath =
                index === 0
                  ? "polygon(0% 0%, 100% 0%, 85% 100%, 0% 100%)"
                  : index === AVATAR_OPTIONS.length - 1
                    ? "polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)"
                    : "polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)";
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleAvatarChange(option.key)}
                  disabled={savingAvatar !== null}
                  className={`group relative flex-1 overflow-hidden transition-all duration-300 cursor-pointer border-2 ${
                    isSelected
                      ? "border-primary shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                      : "border-transparent hover:border-primary/40"
                  } ${savingAvatar !== null ? "opacity-60" : ""}`}
                  style={{ clipPath }}
                >
                  {savingAvatar === option.key && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                      <Spinner size="sm" />
                    </div>
                  )}
                  {/* Avatar background image */}
                  <div
                    className={`absolute inset-0 bg-cover bg-top transition-all duration-300 ${
                      isSelected
                        ? "brightness-110 scale-105"
                        : "brightness-75 grayscale-[20%] group-hover:scale-105 group-hover:brightness-100 group-hover:grayscale-0"
                    }`}
                    style={{ backgroundImage: `url(${option.image})` }}
                  />
                  {/* Bottom overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-10">
                    <p
                      className={`text-center font-bold uppercase text-xs tracking-wide ${
                        isSelected ? "text-primary" : "text-text-primary"
                      }`}
                    >
                      {option.name}
                    </p>
                  </div>
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center z-10">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound Settings */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {/* Header with master toggle */}
          <div className={`flex items-center justify-between px-5 py-4 ${isMuted ? "bg-surface-secondary/50" : "bg-primary/5 border-b border-primary/20"}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{isMuted ? "🔇" : "🔊"}</span>
              <div>
                <p className="text-sm font-semibold text-text-primary">Sound</p>
                <p className="text-xs text-text-muted">{isMuted ? "All audio disabled" : "Audio enabled"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              className={[
                "relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer",
                isMuted ? "bg-border" : "bg-primary",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                  isMuted ? "translate-x-1" : "translate-x-6",
                ].join(" ")}
              />
            </button>
          </div>

          {/* Volume controls */}
          <div className={`p-5 space-y-5 transition-opacity ${isMuted ? "opacity-40 pointer-events-none" : ""}`}>
            {/* Music volume */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center text-lg shrink-0">
                🎵
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-text-primary">Music</p>
                  <span className="text-xs font-semibold text-primary tabular-nums">
                    {Math.round(musicVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(musicVolume * 100)}
                  onChange={(e) => setMusicVolume(parseInt(e.target.value) / 100)}
                  className="w-full h-2 bg-surface-secondary rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            {/* Effects volume */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center text-lg shrink-0">
                💥
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-text-primary">Effects</p>
                  <span className="text-xs font-semibold text-primary tabular-nums">
                    {Math.round(sfxVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(sfxVolume * 100)}
                  onChange={(e) => setSfxVolume(parseInt(e.target.value) / 100)}
                  className="w-full h-2 bg-surface-secondary rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
