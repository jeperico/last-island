import { type ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-lg font-semibold text-text-secondary">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-text-muted">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
