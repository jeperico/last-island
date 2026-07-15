"use client";

import { useState } from "react";

interface AvatarIconProps {
  avatar: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  highlight?: "gold" | "none";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
} as const;

// Inline SVG data URI fallback — dark circle with anchor silhouette
const FALLBACK_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%231a1a2e'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-size='24' fill='%234a4a6a'%3E⚓%3C/text%3E%3C/svg%3E";

export function AvatarIcon({
  avatar,
  size = "md",
  className = "",
  highlight = "none",
}: AvatarIconProps) {
  const [hasError, setHasError] = useState(false);

  const src = hasError
    ? FALLBACK_DATA_URI
    : avatar
      ? `/avatars/${avatar.toLowerCase()}/profile.jpg`
      : "/avatars/default/profile.jpg";

  const highlightClass = highlight === "gold" ? "ring-2 ring-gold" : "";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={avatar ?? "Default avatar"}
      className={`rounded-full border-2 border-border object-cover ${sizeClasses[size]} ${highlightClass} ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
