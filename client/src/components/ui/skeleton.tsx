interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = "", width, height }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={["animate-pulse rounded-md bg-surface-secondary", className]
        .filter(Boolean)
        .join(" ")}
      style={{ width, height }}
    />
  );
}
