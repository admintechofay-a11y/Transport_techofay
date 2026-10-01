import React from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  action?: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  icon: Icon,
  className,
  action,
}) => {
  return (
    <div className={cn('p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4', className)}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-2 rounded-lg bg-saffron-50 dark:bg-saffron-950/60 text-saffron-600">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
            {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
};
