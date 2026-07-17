"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  turnStartedAt: string | null;
  turnDurationSeconds?: number;
}

export function CountdownTimer({
  turnStartedAt,
  turnDurationSeconds = 60,
}: CountdownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!turnStartedAt) {
      setRemainingSeconds(0);
      return;
    }

    function computeRemaining(): number {
      const ts = turnStartedAt!.endsWith("Z") ? turnStartedAt! : turnStartedAt! + "Z";
      const deadline =
        new Date(ts).getTime() + turnDurationSeconds * 1000;
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((deadline - now) / 1000));
      return diff;
    }

    setRemainingSeconds(computeRemaining());

    const interval = setInterval(() => {
      const remaining = computeRemaining();
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [turnStartedAt, turnDurationSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isUrgent = remainingSeconds <= 15 && remainingSeconds > 0;

  return (
    <span
      className={`font-mono text-sm font-semibold ${
        isUrgent
          ? "text-danger animate-pulse"
          : "text-text-secondary"
      }`}
      aria-label={`Turn timer: ${display} remaining`}
    >
      ⏱️ {display}
    </span>
  );
}
