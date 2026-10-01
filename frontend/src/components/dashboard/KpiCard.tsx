import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  label?: string;
  title?: string;
  value: string | number;
  subValue?: string;
  subtext?: string;
  badge?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  title,
  value,
  subValue,
  subtext,
  badge,
  icon: Icon,
  variant = 'primary',
  trend,
  trendValue,
  isLoading = false,
  onClick,
}) => {
  const cardTitle = title || label || '';
  const cardSubtext = subtext || subValue || '';

  const variantStyles = {
    primary: {
      border: 'border-slate-200 dark:border-slate-800',
      iconBg: 'bg-navy-50 text-navy-800 dark:bg-navy-950/60 dark:text-navy-300',
      badge: 'text-navy-700 dark:text-navy-300',
    },
    accent: {
      border: 'border-saffron-200 dark:border-saffron-900/40',
      iconBg: 'bg-saffron-50 text-saffron-600 dark:bg-saffron-950/60 dark:text-saffron-400',
      badge: 'text-saffron-600',
    },
    success: {
      border: 'border-emerald-200 dark:border-emerald-900/40',
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      badge: 'text-emerald-700 dark:text-emerald-400',
    },
    warning: {
      border: 'border-amber-200 dark:border-amber-900/40',
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      badge: 'text-amber-700 dark:text-amber-400',
    },
    danger: {
      border: 'border-rose-200 dark:border-rose-900/40',
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
      badge: 'text-rose-700 dark:text-rose-400',
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={cn(
        'group p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs transition-all duration-200 hover:shadow-md select-none',
        variantStyles.border,
        onClick && 'cursor-pointer hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              {cardTitle}
            </p>
            {badge && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                {badge}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2 mt-2 animate-pulse">
              <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {value}
                </h3>
                {trend && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight shrink-0',
                      trend === 'up' && 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
                      trend === 'down' && 'text-red-700 bg-red-50 dark:bg-red-950/60 dark:text-red-400',
                      trend === 'neutral' && 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                    {trend === 'down' && <TrendingDown className="w-3 h-3" />}
                    {trend === 'neutral' && <Minus className="w-3 h-3" />}
                    {trendValue && <span>{trendValue}</span>}
                  </span>
                )}
              </div>

              {cardSubtext && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {cardSubtext}
                </p>
              )}
            </>
          )}
        </div>

        <div
          className={cn(
            'p-3.5 rounded-xl shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-200',
            variantStyles.iconBg
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
