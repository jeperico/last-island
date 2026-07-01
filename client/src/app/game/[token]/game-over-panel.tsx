"use client";

import Link from "next/link";

interface GameOverPanelProps {
  isWinner: boolean;
  winnerName: string;
  opponentName: string;
  myShots: number;
  myHits: number;
  opponentShots: number;
  opponentHits: number;
  durationSeconds: number | null;
}

export function GameOverPanel({
  isWinner,
  winnerName,
  opponentName,
  myShots,
  myHits,
  opponentShots,
  opponentHits,
  durationSeconds,
}: GameOverPanelProps) {
  const myAccuracy = myShots > 0 ? Math.round((myHits / myShots) * 100) : 0;
  const opponentAccuracy =
    opponentShots > 0 ? Math.round((opponentHits / opponentShots) * 100) : 0;

  function formatDuration(seconds: number | null): string {
    if (seconds === null) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Victory / Defeat heading */}
      {isWinner ? (
        <h1 className="text-3xl font-bold text-[var(--color-success)]">
          Victory! 🏴‍☠️
        </h1>
      ) : (
        <h1 className="text-3xl font-bold text-[var(--color-danger)]">
          Defeat…
        </h1>
      )}

      {/* Opponent subtitle */}
      <p className="text-lg text-text-secondary">
        vs <span className="font-semibold">{opponentName}</span>
      </p>

      {/* Stats grid */}
      <div className="grid w-full max-w-md grid-cols-3 gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 text-sm">
        {/* Header row */}
        <div className="font-medium text-text-muted" />
        <div className="text-center font-medium text-text-muted">
          You
        </div>
        <div className="text-center font-medium text-text-muted">
          Opponent
        </div>

        {/* Duration row */}
        <div className="font-medium text-text-secondary">
          Duration
        </div>
        <div className="col-span-2 text-center text-text-secondary">
          {formatDuration(durationSeconds)}
        </div>

        {/* Shots row */}
        <div className="font-medium text-text-secondary">
          Shots
        </div>
        <div className="text-center text-text-secondary">
          {myShots}
        </div>
        <div className="text-center text-text-secondary">
          {opponentShots}
        </div>

        {/* Hits row */}
        <div className="font-medium text-text-secondary">
          Hits
        </div>
        <div className="text-center text-text-secondary">
          {myHits}
        </div>
        <div className="text-center text-text-secondary">
          {opponentHits}
        </div>

        {/* Accuracy row */}
        <div className="font-medium text-text-secondary">
          Accuracy
        </div>
        <div className="text-center text-text-secondary">
          {myAccuracy}%
        </div>
        <div className="text-center text-text-secondary">
          {opponentAccuracy}%
        </div>

        {/* Winner row */}
        <div className="font-medium text-text-secondary">
          Winner
        </div>
        <div className="col-span-2 text-center font-semibold text-[var(--color-success)]">
          {winnerName}
        </div>
      </div>

      {/* Back to Lobby */}
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-ring"
      >
        Back to Lobby
      </Link>
    </div>
  );
}
