"use client";

import { useState } from "react";
import Link from "next/link";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { updateProfile } from "@/lib/api";
import type { ApiError } from "@/lib/api/client";
import type { Filiation } from "@/lib/api/types";
import { useSound } from "@/lib/sound";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Alert,
  Spinner,
} from "@/components/ui";

// ─── Avatar options ──────────────────────────────────────────────────────────

const AVATAR_OPTIONS = [
  { key: "LUFFY", name: "Luffy", image: "/avatars/luffy/profile.jpg" },
  { key: "ZORO", name: "Zoro", image: "/avatars/zoro/profile.jpg" },
  { key: "ROBIN", name: "Robin", image: "/avatars/robin/profile.jpg" },
  { key: "CHOPPER", name: "Chopper", image: "/avatars/chopper/profile.jpg" },
  { key: "NAMI", name: "Nami", image: "/avatars/nami/profile.jpg" },
  { key: "ACE", name: "Ace", image: "/avatars/ace/profile.jpg" },
  { key: "DOFLAMINGO", name: "Doflamingo", image: "/avatars/doflamingo/profile.jpg" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAvatarImage(avatar: string | null): string {
  if (!avatar) return "/avatars/default/profile.jpg";
  const option = AVATAR_OPTIONS.find((o) => o.key === avatar);
  return option?.image ?? "/avatars/default/profile.jpg";
}

function formatBounty(bounty: number): string {
  if (bounty >= 1_000_000_000) {
    const b = bounty / 1_000_000_000;
    return `${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`;
  }
  if (bounty >= 1_000_000) {
    const m = bounty / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(0)}M`;
  }
  return bounty.toLocaleString();
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, isLoading } = useRequireAuth();
  const { logout, refreshUser } = useAuth();
  const { isMuted, toggleMute } = useSound();

  const [error, setError] = useState<string | null>(null);
  const [savingFiliation, setSavingFiliation] = useState<Filiation | null>(
    null,
  );
  const [savingAvatar, setSavingAvatar] = useState<string | null>(null);
  const [showMarineWarning, setShowMarineWarning] = useState(false);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  async function handleFiliationChange(newFiliation: Filiation) {
    if (newFiliation === user!.filiation) return;

    // If switching to marine from pirate, show warning first
    if (newFiliation === "MARINE" && user!.filiation === "PIRATE") {
      setShowMarineWarning(true);
    }

    setError(null);
    setSavingFiliation(newFiliation);
    try {
      await updateProfile({ filiation: newFiliation });
      await refreshUser();
      setShowMarineWarning(false);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "Failed to update filiation");
    } finally {
      setSavingFiliation(null);
    }
  }

  async function handleAvatarChange(avatarKey: string) {
    if (avatarKey === user!.avatar) return;

    setError(null);
    setSavingAvatar(avatarKey);
    try {
      await updateProfile({ avatar: avatarKey });
      await refreshUser();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "Failed to update avatar");
    } finally {
      setSavingAvatar(null);
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <PageHeader
          title="⚙️ Settings"
          actions={
            <Link
              href="/"
              className="text-sm text-text-secondary hover:text-primary transition-colors"
            >
              ← Grand Line
            </Link>
          }
        />

        {/* Error display */}
        {error && (
          <Alert
            variant="error"
            dismissible
            onDismiss={() => setError(null)}
            className="mb-4"
          >
            {error}
          </Alert>
        )}

        {/* Profile section */}
        <Card className="mb-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <img
              src={
                user.avatar
                  ? getAvatarImage(user.avatar)
                  : "/avatars/default/profile.jpg"
              }
              alt={`${user.name}'s avatar`}
              className="w-24 h-24 rounded-full border-2 border-border object-cover"
            />
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-text-primary truncate">
                {user.name}
              </h2>
              <p className="text-sm text-text-muted truncate">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge
                  variant={user.filiation === "PIRATE" ? "warning" : "neutral"}
                >
                  {user.filiation === "PIRATE" ? "🏴‍☠️ Pirate" : "⚓ Marine"}
                </Badge>
                <span className="text-sm text-text-secondary">
                  {user.rank.replace(/_/g, " ")}
                </span>
                <span className="text-sm text-secondary font-medium">
                  ₿ {formatBounty(user.bounty)}
                </span>
                <span className="text-sm text-text-muted">
                  {user.wins}W / {user.losses}L
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Filiation switch section */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Filiation
          </h3>

          {showMarineWarning && (
            <Alert variant="warning" className="mb-4">
              Switching to Marine will clear your avatar and recalculate your
              rank.
            </Alert>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleFiliationChange("PIRATE")}
              disabled={savingFiliation !== null}
              className={[
                "flex-1 py-3 px-4 rounded-lg border-2 text-center font-medium transition-all cursor-pointer",
                user.filiation === "PIRATE"
                  ? "border-primary ring-2 ring-primary bg-primary/10 text-text-primary"
                  : "border-border text-text-secondary hover:border-primary/50",
                savingFiliation !== null
                  ? "opacity-50 pointer-events-none"
                  : "",
              ].join(" ")}
            >
              {savingFiliation === "PIRATE" ? (
                <Spinner size="sm" />
              ) : (
                "🏴‍☠️ Pirate"
              )}
            </button>
            <button
              type="button"
              onClick={() => handleFiliationChange("MARINE")}
              disabled={savingFiliation !== null}
              className={[
                "flex-1 py-3 px-4 rounded-lg border-2 text-center font-medium transition-all cursor-pointer",
                user.filiation === "MARINE"
                  ? "border-primary ring-2 ring-primary bg-primary/10 text-text-primary"
                  : "border-border text-text-secondary hover:border-primary/50",
                savingFiliation !== null
                  ? "opacity-50 pointer-events-none"
                  : "",
              ].join(" ")}
            >
              {savingFiliation === "MARINE" ? (
                <Spinner size="sm" />
              ) : (
                "⚓ Marine"
              )}
            </button>
          </div>
        </Card>

        {/* Avatar selection section — only for pirates */}
        {user.filiation === "PIRATE" && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Choose Your Avatar
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
              {AVATAR_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleAvatarChange(option.key)}
                  disabled={savingAvatar !== null}
                  className={[
                    "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer",
                    user.avatar === option.key
                      ? "border-primary ring-2 ring-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                    savingAvatar !== null ? "opacity-70" : "",
                  ].join(" ")}
                >
                  {savingAvatar === option.key && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-lg">
                      <Spinner size="sm" />
                    </div>
                  )}
                  <img
                    src={option.image}
                    alt={option.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium text-text-secondary">
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Sound section */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Sound
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Sound effects & music</p>
              <p className="text-xs text-text-muted">
                Laughs, screams, and battle soundtrack
              </p>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              className={[
                "relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer",
                isMuted ? "bg-surface-secondary" : "bg-primary",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                  isMuted ? "translate-x-1" : "translate-x-6",
                ].join(" ")}
              />
            </button>
          </div>
        </Card>

        {/* Logout section */}
        <div className="pt-4">
          <Button variant="danger" fullWidth onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
