'use client';

import { type ReactNode } from 'react';

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  error: 'bg-danger-bg border-danger-border text-danger',
  success: 'bg-success-bg border-success-border text-success',
  warning: 'bg-warning-bg border-amber-300 text-warning',
  info: 'bg-blue-900/30 border-[var(--color-ocean)] text-[var(--color-ocean)]',
};

export function Alert({
  variant = 'error',
  children,
  dismissible = false,
  onDismiss,
  className = '',
}: AlertProps) {
  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-2 rounded-md border px-4 py-2 text-sm',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex-1">{children}</div>
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity cursor-pointer"
          aria-label="Dismiss"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
