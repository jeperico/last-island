"use client";

import { useSound } from "@/lib/sound";

export function SoundToggle() {
  const { isMuted, toggleMute } = useSound();

  return (
    <button
      onClick={toggleMute}
      className="fixed top-3 left-3 z-50 w-9 h-9 flex items-center justify-center rounded-lg bg-surface-secondary/80 backdrop-blur-sm border border-border text-text-secondary hover:bg-surface-elevated hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
      aria-label={isMuted ? "Unmute sound" : "Mute sound"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}
