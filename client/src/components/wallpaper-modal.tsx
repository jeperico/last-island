"use client";

import { Modal } from "@/components/ui";
import type { WallpaperNumber } from "@/lib/hooks";

interface WallpaperModalProps {
  open: boolean;
  onClose: () => void;
  avatar: string | null;
  current: WallpaperNumber;
  onSelect: (num: WallpaperNumber) => void;
}

const WALLPAPER_OPTIONS: WallpaperNumber[] = [1, 2, 3, 4];

export function WallpaperModal({
  open,
  onClose,
  avatar,
  current,
  onSelect,
}: WallpaperModalProps) {
  if (!avatar) return null;

  const a = avatar.toLowerCase();

  return (
    <Modal open={open} onClose={onClose} title="Choose Wallpaper" className="max-w-sm">
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 text-center">
          🎨 Choose Wallpaper
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {WALLPAPER_OPTIONS.map((num) => {
            const path = `/avatars/${a}/${a}-bg-0${num}.jpg`;
            const isSelected = current === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => {
                  onSelect(num);
                  onClose();
                }}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-text-muted"
                }`}
              >
                <div
                  className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${path})` }}
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="text-lg">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
