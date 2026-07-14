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
          className="absolute top-3 right-3 z-20 text-text-muted hover:text-text-primary transition-colors text-xl leading-none cursor-pointer"
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
