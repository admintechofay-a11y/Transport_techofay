import React from 'react';
import { cn } from '@/lib/utils';
import { getStatusConfig } from '@/lib/utils/status-colors';

interface StatusBadgeProps {
  status: string | null | undefined;
  entity?: 'load' | 'lr' | 'bilty' | 'vehicle' | 'driver' | 'payment';
  className?: string;
  showDot?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md';
}

interface DirectStatusStyle {
  label: string;
  className: string;
  dotColor?: string;
  isUrgent?: boolean;
  canPing?: boolean;
}

function getDirectStatusStyle(status: string): DirectStatusStyle | null {
  const norm = status.toLowerCase().replace(/[\s-]+/g, '_');

  switch (norm) {
    case 'active':
      return {
        label: 'Active',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
        dotColor: 'bg-emerald-500',
        canPing: true,
      };
    case 'on_trip':
      return {
        label: 'On Trip',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
        dotColor: 'bg-emerald-500',
        canPing: true,
      };
    case 'available':
      return {
        label: 'Available',
        className: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
        dotColor: 'bg-blue-500',
      };
    case 'pending':
      return {
        label: 'Pending',
        className: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
        dotColor: 'bg-amber-500',
      };
    case 'generated':
      return {
        label: 'Generated',
        className: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
        dotColor: 'bg-amber-500',
      };
    case 'completed':
      return {
        label: 'Completed',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
        dotColor: 'bg-emerald-500',
      };
    case 'verified':
      return {
        label: 'Verified',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
        dotColor: 'bg-emerald-500',
      };
    case 'delivered':
      return {
        label: 'Delivered',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
        dotColor: 'bg-emerald-500',
      };
    case 'cancelled':
    case 'canceled':
      return {
        label: 'Cancelled',
        className: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60',
        dotColor: 'bg-red-500',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        className: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60',
        dotColor: 'bg-red-500',
      };
    case 'under_maintenance':
    case 'maintenance':
      return {
        label: 'Maintenance',
        className: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dotColor: 'bg-slate-500',
      };
    case 'inactive':
      return {
        label: 'Inactive',
        className: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dotColor: 'bg-slate-500',
      };
    case 'issued':
      return {
        label: 'Issued',
        className: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60',
        dotColor: 'bg-purple-500',
      };
    case 'draft':
      return {
        label: 'Draft',
        className: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60',
        dotColor: 'bg-purple-500',
      };
    case 'overdue':
      return {
        label: 'Overdue',
        className: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 font-bold',
        dotColor: 'bg-red-600',
        isUrgent: true,
      };
    case 'expired':
      return {
        label: 'Expired',
        className: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 font-bold',
        dotColor: 'bg-red-600',
        isUrgent: true,
      };
    default:
      return null;
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  entity,
  className,
  showDot = false,
  animated = false,
  size = 'md',
}) => {
  const rawStatus = (status || '').trim();
  const directStyle = rawStatus ? getDirectStatusStyle(rawStatus) : null;
  const fallbackConfig = !directStyle ? getStatusConfig(status, entity || 'load') : null;

  const label = directStyle?.label || fallbackConfig?.label || rawStatus || 'Unknown';
  const badgeClass = directStyle?.className || fallbackConfig?.className || 'bg-gray-100 text-gray-700 border border-gray-200';
  const dotColor = directStyle?.dotColor || fallbackConfig?.dotColor;
  const isUrgent = directStyle?.isUrgent;
  const canPing = directStyle?.canPing;

  // Determine if ping animation should run
  const shouldPing = animated && canPing;

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-0.5'
    : 'text-[11px] px-2.5 py-0.5';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full capitalize transition-colors leading-none',
        sizeClasses,
        badgeClass,
        className
      )}
    >
      {/* Animated Ping Dot */}
      {shouldPing && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}

      {/* Urgent Dot */}
      {isUrgent && !shouldPing && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
        </span>
      )}

      {/* Normal Dot if requested and not pinging */}
      {showDot && !shouldPing && !isUrgent && dotColor && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
      )}

      <span>{label}</span>
    </span>
  );
};
