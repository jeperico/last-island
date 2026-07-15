"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "last-island-wallpaper";
const DEFAULT_WALLPAPER = 1;

export type WallpaperNumber = 1 | 2 | 3 | 4;

function getStoredWallpaper(): WallpaperNumber {
  if (typeof window === "undefined") return DEFAULT_WALLPAPER;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ["1", "2", "3", "4"].includes(stored)) {
    return parseInt(stored, 10) as WallpaperNumber;
  }
  return DEFAULT_WALLPAPER;
}

export function useWallpaper() {
  const [wallpaper, setWallpaperState] = useState<WallpaperNumber>(getStoredWallpaper);

  const setWallpaper = useCallback((num: WallpaperNumber) => {
    setWallpaperState(num);
    localStorage.setItem(STORAGE_KEY, String(num));
  }, []);

  /** Returns the bg image path for a given avatar and the current wallpaper selection */
  const getWallpaperPath = useCallback(
    (avatar: string | null): string | null => {
      if (!avatar) return null;
      const a = avatar.toLowerCase();
      return `/avatars/${a}/${a}-bg-0${wallpaper}.jpg`;
    },
    [wallpaper],
  );

  return { wallpaper, setWallpaper, getWallpaperPath };
}
