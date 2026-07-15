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

export function AvatarIcon({
  avatar,
  size = "md",
  className = "",
  highlight = "none",
}: AvatarIconProps) {
  const src = avatar
    ? `/avatars/${avatar.toLowerCase()}/profile.svg`
    : "/avatars/default/profile.svg";

  const highlightClass = highlight === "gold" ? "ring-2 ring-gold" : "";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={avatar ?? "Default avatar"}
      className={`rounded-full border-2 border-border object-cover ${sizeClasses[size]} ${highlightClass} ${className}`}
    />
  );
}
