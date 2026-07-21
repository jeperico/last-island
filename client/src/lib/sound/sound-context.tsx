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
  playHit: () => void;
  playIncomingHit: () => void;
  playSunk: () => void;
  playAvatarHover: () => void;
  swapSoundtrack: () => void;
  resumeGlobalSoundtrack: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  musicVolume: number;
  setMusicVolume: (v: number) => void;
  sfxVolume: number;
  setSfxVolume: (v: number) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GLOBAL_SOUNDTRACK = "/audio/soundtracks/binks-sake.mp3";
const BATTLE_SOUNDTRACK = "/audio/soundtracks/rubber-bazooka.mp3";
const HIT_SOUND = "/audio/sfx/battle/shot.mp3";
const INCOMING_HIT_SOUND = "/audio/sfx/battle/hit.mp3";
const SUNK_SOUND = "/audio/sfx/battle/sunk.mp3";
const AVATAR_HOVER_SOUND = "/audio/sfx/ui/avatar-selector.mp3";
const DEFAULT_MUSIC_VOLUME = 0.8;
const DEFAULT_SFX_VOLUME = 0.8;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAvatarLaughPath(avatar: string | null): string {
  if (avatar) {
    return `/avatars/${avatar.toLowerCase()}/laugh.mp3`;
  }
  return GLOBAL_SOUNDTRACK;
}

function createSoundtrackAudio(src: string, muted: boolean, volume: number): HTMLAudioElement {
  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = volume;
  audio.muted = muted;
  audio.preload = "auto";
  return audio;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SoundContext = createContext<SoundContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sound_muted") === "true";
  });

  const [musicVolume, setMusicVolumeState] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_MUSIC_VOLUME;
    const saved = localStorage.getItem("music_volume");
    return saved !== null ? parseFloat(saved) : DEFAULT_MUSIC_VOLUME;
  });

  const [sfxVolume, setSfxVolumeState] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SFX_VOLUME;
    const saved = localStorage.getItem("sfx_volume");
    return saved !== null ? parseFloat(saved) : DEFAULT_SFX_VOLUME;
  });

  const soundtrackRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<string>(GLOBAL_SOUNDTRACK);

  const setMusicVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setMusicVolumeState(clamped);
    localStorage.setItem("music_volume", String(clamped));
    if (soundtrackRef.current) {
      soundtrackRef.current.volume = clamped;
    }
  }, []);

  const setSfxVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setSfxVolumeState(clamped);
    localStorage.setItem("sfx_volume", String(clamped));
  }, []);

  // Start global soundtrack on mount
  useEffect(() => {
    const audio = createSoundtrackAudio(GLOBAL_SOUNDTRACK, isMuted, musicVolume);
    soundtrackRef.current = audio;
    currentTrackRef.current = GLOBAL_SOUNDTRACK;

    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.src = "";
      soundtrackRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume playback on user interaction (autoplay policy workaround)
  useEffect(() => {
    function handleInteraction() {
      const soundtrack = soundtrackRef.current;
      if (soundtrack && soundtrack.paused && !isMuted) {
        soundtrack.play().catch(() => {});
      }
    }

    document.addEventListener("click", handleInteraction, { once: false });
    document.addEventListener("touchstart", handleInteraction, { once: false });
    document.addEventListener("keydown", handleInteraction, { once: false });

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [isMuted]);

  // Sync muted/volume state whenever isMuted changes
  useEffect(() => {
    const soundtrack = soundtrackRef.current;
    if (soundtrack) {
      soundtrack.muted = isMuted;
      soundtrack.volume = musicVolume;
      // If unmuting, try to resume
      if (!isMuted && soundtrack.paused) {
        soundtrack.play().catch(() => {});
      }
    }
  }, [isMuted, musicVolume]);

  // Play a one-shot laugh effect on top of the soundtrack
  const playLaugh = useCallback(
    (avatar: string | null) => {
      if (isMuted) return;
      const audio = new Audio(getAvatarLaughPath(avatar));
      audio.volume = sfxVolume;
      audio.play().catch(() => {});
    },
    [isMuted, sfxVolume],
  );

  // Play hit sound when a cannonball strikes an enemy ship
  const playHit = useCallback(() => {
    if (isMuted) return;
    const audio = new Audio(HIT_SOUND);
    audio.volume = sfxVolume;
    audio.play().catch(() => {});
  }, [isMuted, sfxVolume]);

  // Play sound when opponent hits your ship
  const playIncomingHit = useCallback(() => {
    if (isMuted) return;
    const audio = new Audio(INCOMING_HIT_SOUND);
    audio.volume = sfxVolume;
    audio.play().catch(() => {});
  }, [isMuted, sfxVolume]);

  // Play sunk sound when a ship is sent to Davy Jones
  const playSunk = useCallback(() => {
    if (isMuted) return;
    const audio = new Audio(SUNK_SOUND);
    audio.volume = sfxVolume;
    audio.play().catch(() => {});
  }, [isMuted, sfxVolume]);

  // Play hover sound on character selection panels
  const playAvatarHover = useCallback(() => {
    if (isMuted) return;
    const audio = new Audio(AVATAR_HOVER_SOUND);
    audio.volume = sfxVolume;
    audio.play().catch(() => {});
  }, [isMuted, sfxVolume]);

  // Swap the soundtrack to the battle track
  const swapSoundtrack = useCallback(
    () => {
      // Don't restart if already playing the battle track
      if (currentTrackRef.current === BATTLE_SOUNDTRACK && soundtrackRef.current && !soundtrackRef.current.paused) {
        return;
      }

      // Pause and clean up current
      if (soundtrackRef.current) {
        soundtrackRef.current.pause();
        soundtrackRef.current.src = "";
      }

      // Start battle track
      const audio = createSoundtrackAudio(BATTLE_SOUNDTRACK, isMuted, musicVolume);
      soundtrackRef.current = audio;
      currentTrackRef.current = BATTLE_SOUNDTRACK;

      audio.play().catch(() => {});
    },
    [isMuted, musicVolume],
  );

  // Resume the global Binks' Sake soundtrack
  const resumeGlobalSoundtrack = useCallback(() => {
    // Don't restart if already playing global
    if (currentTrackRef.current === GLOBAL_SOUNDTRACK && soundtrackRef.current && !soundtrackRef.current.paused) {
      return;
    }

    // Pause and clean up current
    if (soundtrackRef.current) {
      soundtrackRef.current.pause();
      soundtrackRef.current.src = "";
    }

    // Start global
    const audio = createSoundtrackAudio(GLOBAL_SOUNDTRACK, isMuted, musicVolume);
    soundtrackRef.current = audio;
    currentTrackRef.current = GLOBAL_SOUNDTRACK;

    audio.play().catch(() => {});
  }, [isMuted, musicVolume]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("sound_muted", String(next));
      return next;
    });
  }, []);

  return (
    <SoundContext value={{ playLaugh, playHit, playIncomingHit, playSunk, playAvatarHover, swapSoundtrack, resumeGlobalSoundtrack, isMuted, toggleMute, musicVolume, setMusicVolume, sfxVolume, setSfxVolume }}>
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
