import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionTo }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && <div className="text-5xl">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
