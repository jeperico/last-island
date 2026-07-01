'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, id, error, helperText, required, className = '', type = 'text', ...props },
  ref,
) {
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-primary"
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        name={id}
        type={type}
        required={required}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined
        }
        className={[
          'rounded-md border px-3 py-2 text-sm bg-surface text-text-primary placeholder:text-text-muted transition-colors',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-ring',
          hasError ? 'border-danger' : 'border-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {hasError && (
        <p id={`${id}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {!hasError && helperText && (
        <p id={`${id}-helper`} className="text-xs text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
});
