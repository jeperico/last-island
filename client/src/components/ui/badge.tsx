import { type ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "neutral" | "danger";

interface BadgeProps {
  variant?: BadgeVariant;
  pulse?: boolean;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-success-bg text-success border border-success-border",
  warning: "bg-warning-bg text-warning border border-warning/30",
  neutral: "bg-surface-secondary text-text-secondary border border-border",
  danger: "bg-danger-bg text-danger border border-danger-border",
};

export function Badge({
  variant = "neutral",
  pulse = false,
  children,
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        pulse ? "animate-pulse" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
