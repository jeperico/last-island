"use client";

import { useEffect, useState } from "react";
import { useSound } from "@/lib/sound";
import { Button } from "@/components/ui";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CharacterSelectProps {
  onConfirm: (avatar: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

interface CharacterOption {
  key: string;
  name: string;
  quote: string;
  image: string;
}

// ─── Character data ──────────────────────────────────────────────────────────

const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    key: "LUFFY",
    name: "Luffy",
    quote: "The man who will become Pirate King",
    image: "/avatars/luffy/full-body.jpg",
  },
  {
    key: "ZORO",
    name: "Zoro",
    quote: "Nothing happened.",
    image: "/avatars/zoro/full-body.jpg",
  },
  {
    key: "ROBIN",
    name: "Robin",
    quote: "I want to live!",
    image: "/avatars/robin/full-body.jpg",
  },
  {
    key: "CHOPPER",
    name: "Chopper",
    quote: "I'm not happy at all, you bastard!",
    image: "/avatars/chopper/full-body.jpg",
  },
  {
    key: "ACE",
    name: "Ace",
    quote: "I have no regrets in this life",
    image: "/avatars/ace/full-body.jpg",
  },
  {
    key: "DOFLAMINGO",
    name: "Doflamingo",
    quote: "Those who stand at the top decide what's wrong and what's right",
    image: "/avatars/doflamingo/full-body.jpg",
  },
];

// ─── Clip-path helpers ───────────────────────────────────────────────────────

function getClipPath(index: number, total: number): string {
  if (index === 0) {
    return "polygon(0% 0%, 100% 0%, 90% 100%, 0% 100%)";
  }
  if (index === total - 1) {
    return "polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)";
  }
  return "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CharacterSelect({
  onConfirm,
  onClose,
  isLoading,
}: CharacterSelectProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const { playLaugh } = useSound();

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function handleCharacterClick(key: string) {
    setSelected(key);
    playLaugh(key);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy/95"
      style={{ animation: "character-select-in 300ms ease-out forwards" }}
    >
      {/* Back button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 text-text-secondary hover:text-text-primary text-sm transition-colors cursor-pointer"
      >
        ← Back
      </button>

      {/* Title */}
      <h2 className="text-text-primary text-2xl font-bold mb-6">
        Choose Your Captain
      </h2>

      {/* Panels container */}
      <div className="flex w-full h-[70vh] gap-1 px-4">
        {CHARACTER_OPTIONS.map((char, index) => {
          const isSelected = selected === char.key;
          const hasSelection = selected !== null;

          return (
            <button
              key={char.key}
              type="button"
              onClick={() => handleCharacterClick(char.key)}
              className={`flex-1 relative overflow-hidden transition-all duration-300 cursor-pointer border-2 ${
                isSelected
                  ? "border-secondary shadow-[0_0_30px_rgba(245,158,11,0.6)]"
                  : "border-transparent"
              }`}
              style={{ clipPath: getClipPath(index, CHARACTER_OPTIONS.length) }}
              aria-pressed={isSelected}
              aria-label={`Select ${char.name}`}
            >
              {/* Background image */}
              <div
                className={`absolute inset-0 bg-cover bg-top transition-all duration-300 ${
                  isSelected
                    ? "brightness-100 grayscale-0"
                    : hasSelection
                      ? "brightness-30 grayscale-[50%]"
                      : "brightness-50 grayscale-[30%]"
                }`}
                style={{ backgroundImage: `url(${char.image})` }}
              />

              {/* Bottom overlay with character info */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16">
                <p className="text-text-primary font-bold uppercase text-sm tracking-wide">
                  {char.name}
                </p>
                <p className="text-text-secondary text-xs italic mt-1 line-clamp-2">
                  &ldquo;{char.quote}&rdquo;
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm area */}
      <div className="mt-6 h-12 flex items-center">
        {selected !== null && (
          <Button
            variant="primary"
            size="lg"
            loading={isLoading}
            onClick={() => onConfirm(selected)}
          >
            ⚓ Set Sail!
          </Button>
        )}
      </div>
    </div>
  );
}
