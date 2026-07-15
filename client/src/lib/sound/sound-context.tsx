"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SoundContextValue {
  playLaugh: (avatar: string | null) => void;
  playSoundtrack: (avatar: string | null) => void;
  stopSoundtrack: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAudioPath(
  avatar: string | null,
  type: "laugh" | "soundtrack",
): string {
  if (avatar) {
    return `/avatars/${avatar.toLowerCase()}/${type}.mp3`;
  }
  return `/audio/default-${type}.mp3`;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SoundContext = createContext<SoundContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sound_muted") === "true";
  });
  const soundtrackRef = useRef<HTMLAudioElement | null>(null);
  const userInteractedRef = useRef(false);

  // Register one-time user interaction listener for autoplay policy
  useEffect(() => {
    function handleInteraction() {
      userInteractedRef.current = true;

      // If soundtrack was paused due to autoplay policy, resume it
      const soundtrack = soundtrackRef.current;
      if (soundtrack && soundtrack.paused && !isMuted) {
        soundtrack.play().catch(() => {});
      }

      // Remove listeners after first interaction
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    }

    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);
    document.addEventListener("keydown", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [isMuted]);

  const playLaugh = useCallback(
    (avatar: string | null) => {
      if (isMuted) return;
      const audio = new Audio(getAudioPath(avatar, "laugh"));
      audio.play().catch(() => {});
    },
    [isMuted],
  );

  const playSoundtrack = useCallback(
    (avatar: string | null) => {
      // Stop any existing soundtrack
      if (soundtrackRef.current) {
        soundtrackRef.current.pause();
        soundtrackRef.current = null;
      }

      const audio = new Audio(getAudioPath(avatar, "soundtrack"));
      audio.loop = true;
      audio.muted = isMuted;
      soundtrackRef.current = audio;

      // Attempt to play — may fail due to autoplay policy (will resume on interaction)
      audio.play().catch(() => {});
    },
    [isMuted],
  );

  const stopSoundtrack = useCallback(() => {
    if (soundtrackRef.current) {
      soundtrackRef.current.pause();
      soundtrackRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("sound_muted", String(next));

      // Apply to active soundtrack
      if (soundtrackRef.current) {
        soundtrackRef.current.muted = next;
      }

      return next;
    });
  }, []);

  return (
    <SoundContext value={{ playLaugh, playSoundtrack, stopSoundtrack, isMuted, toggleMute }}>
      {children}
    </SoundContext>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return ctx;
}
