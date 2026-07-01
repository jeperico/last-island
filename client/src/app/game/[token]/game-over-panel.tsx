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
        <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
          Victory! 🏴‍☠️
        </h1>
      ) : (
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">
          Defeat…
        </h1>
      )}

      {/* Opponent subtitle */}
      <p className="text-lg text-gray-600 dark:text-gray-300">
        vs <span className="font-semibold">{opponentName}</span>
      </p>

      {/* Stats grid */}
      <div className="grid w-full max-w-md grid-cols-3 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800/50">
        {/* Header row */}
        <div className="font-medium text-gray-500 dark:text-gray-400" />
        <div className="text-center font-medium text-gray-500 dark:text-gray-400">
          You
        </div>
        <div className="text-center font-medium text-gray-500 dark:text-gray-400">
          Opponent
        </div>

        {/* Duration row */}
        <div className="font-medium text-gray-700 dark:text-gray-300">
          Duration
        </div>
        <div className="col-span-2 text-center text-gray-700 dark:text-gray-300">
          {formatDuration(durationSeconds)}
        </div>

        {/* Shots row */}
        <div className="font-medium text-gray-700 dark:text-gray-300">
          Shots
        </div>
        <div className="text-center text-gray-700 dark:text-gray-300">
          {myShots}
        </div>
        <div className="text-center text-gray-700 dark:text-gray-300">
          {opponentShots}
        </div>

        {/* Hits row */}
        <div className="font-medium text-gray-700 dark:text-gray-300">
          Hits
        </div>
        <div className="text-center text-gray-700 dark:text-gray-300">
          {myHits}
        </div>
        <div className="text-center text-gray-700 dark:text-gray-300">
          {opponentHits}
        </div>

        {/* Accuracy row */}
        <div className="font-medium text-gray-700 dark:text-gray-300">
          Accuracy
        </div>
        <div className="text-center text-gray-700 dark:text-gray-300">
          {myAccuracy}%
        </div>
        <div className="text-center text-gray-700 dark:text-gray-300">
          {opponentAccuracy}%
        </div>

        {/* Winner row */}
        <div className="font-medium text-gray-700 dark:text-gray-300">
          Winner
        </div>
        <div className="col-span-2 text-center font-semibold text-green-600 dark:text-green-400">
          {winnerName}
        </div>
      </div>

      {/* Back to Lobby */}
      <Link
        href="/"
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Back to Lobby
      </Link>
    </div>
  );
}
