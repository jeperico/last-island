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
  const mySunkShips = opponentHits; // opponent hits = my ships hit
  const opponentSunkShips = myHits; // my hits = opponent ships hit

  function formatDuration(seconds: number | null): string {
    if (seconds === null) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg px-4">
      {/* Victory / Defeat heading */}
      {isWinner ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">🏴‍☠️</span>
          <h1 className="text-3xl font-bold text-[var(--color-success)]">
            Victory!
          </h1>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">💀</span>
          <h1 className="text-3xl font-bold text-[var(--color-danger)]">
            Defeat
          </h1>
        </div>
      )}

      {/* Opponent subtitle */}
      <p className="text-text-muted text-sm">
        vs <span className="font-semibold text-text-primary">{opponentName}</span>
      </p>

      {/* Stats card */}
      <div className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden">
        {/* Duration banner */}
        <div className="flex items-center justify-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-2.5">
          <span className="text-base">⏱️</span>
          <span className="text-sm font-medium text-text-secondary">
            {formatDuration(durationSeconds)}
          </span>
        </div>

        {/* Player comparison */}
        <div className="grid grid-cols-3 px-4 py-3 border-b border-[var(--color-border-light)]">
          <div className="text-left">
            <p className="text-xs text-text-muted uppercase tracking-wide">You</p>
            <p className="text-sm font-semibold text-text-primary truncate">{winnerName === opponentName ? "—" : (isWinner ? winnerName : "You")}</p>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-xs font-bold text-text-muted">VS</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted uppercase tracking-wide">Enemy</p>
            <p className="text-sm font-semibold text-text-primary truncate">{opponentName}</p>
          </div>
        </div>

        {/* Stat rows */}
        <div className="divide-y divide-[var(--color-border-light)]">
          {/* Shots fired */}
          <StatRow
            icon="💣"
            label="Cannonballs"
            myValue={myShots}
            opponentValue={opponentShots}
          />

          {/* Hits */}
          <StatRow
            icon="🎯"
            label="Direct Hits"
            myValue={myHits}
            opponentValue={opponentHits}
            highlightBetter
          />

          {/* Accuracy */}
          <StatRow
            icon="🧭"
            label="Accuracy"
            myValue={`${myAccuracy}%`}
            opponentValue={`${opponentAccuracy}%`}
            myRaw={myAccuracy}
            opponentRaw={opponentAccuracy}
            highlightBetter
          />
        </div>

        {/* Winner banner */}
        <div className={`flex items-center justify-center gap-2 px-4 py-3 ${
          isWinner
            ? "bg-[var(--color-success-bg)] border-t border-[var(--color-success-border)]"
            : "bg-[var(--color-danger-bg)] border-t border-[var(--color-danger-border)]"
        }`}>
          <span className="text-base">{isWinner ? "👑" : "⚔️"}</span>
          <span className={`text-sm font-bold ${
            isWinner ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
          }`}>
            {winnerName} wins!
          </span>
        </div>
      </div>

      {/* Back to Lobby */}
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-ring"
      >
        Back to Grand Line
      </Link>
    </div>
  );
}

function StatRow({
  icon,
  label,
  myValue,
  opponentValue,
  myRaw,
  opponentRaw,
  highlightBetter = false,
}: {
  icon: string;
  label: string;
  myValue: number | string;
  opponentValue: number | string;
  myRaw?: number;
  opponentRaw?: number;
  highlightBetter?: boolean;
}) {
  const myNum = myRaw ?? (typeof myValue === "number" ? myValue : 0);
  const oppNum = opponentRaw ?? (typeof opponentValue === "number" ? opponentValue : 0);
  const myBetter = highlightBetter && myNum > oppNum;
  const oppBetter = highlightBetter && oppNum > myNum;

  return (
    <div className="grid grid-cols-3 items-center px-4 py-3">
      <div className={`text-left text-lg font-bold ${myBetter ? "text-[var(--color-success)]" : "text-text-primary"}`}>
        {myValue}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
          {label}
        </span>
      </div>
      <div className={`text-right text-lg font-bold ${oppBetter ? "text-[var(--color-danger)]" : "text-text-primary"}`}>
        {opponentValue}
      </div>
    </div>
  );
}
