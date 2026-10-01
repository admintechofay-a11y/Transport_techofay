import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionText,
  onAction,
  className = '',
}) => {
  const ctaLabel = actionLabel || actionText;

  const renderIcon = () => {
    if (!Icon) return null;
    // Check if Icon is a React component (LucideIcon)
    if (typeof Icon === 'function' || (typeof Icon === 'object' && 'render' in (Icon as any))) {
      const LucideComponent = Icon as LucideIcon;
      return <LucideComponent className="w-8 h-8 text-slate-400 dark:text-slate-500 stroke-[1.75]" />;
    }
    return Icon;
  };

  return (
    <div className={`flex flex-col items-center justify-center py-20 px-8 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4 transition-colors">
          {renderIcon()}
        </div>
      )}
      <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">{title}</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs text-center mt-1">{description}</p>
      {ctaLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold shadow-sm hover:shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>{ctaLabel}</span>
        </button>
      )}
    </div>
  );
};
