"use client";

import { type ReactNode, useEffect, useCallback } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, className, children }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Dialog"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className={`relative z-10 w-full animate-in zoom-in-95 duration-200 ${className ?? "max-w-md"}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-surface-secondary/90 to-surface/80 text-text-secondary hover:text-text-primary hover:from-surface-secondary hover:to-surface-secondary transition-colors text-xl leading-none cursor-pointer"
          aria-label="Close dialog"
        >
          ×
        </button>

        {title && (
          <h2 className="sr-only">{title}</h2>
        )}

        {children}
      </div>
    </div>
  );
}
