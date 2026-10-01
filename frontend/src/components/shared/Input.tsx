import React from 'react';
import { LucideIcon, AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  icon: Icon,
  className,
  ...props
}) => (
  <div className="space-y-1">
    {label && (
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide block">
        {label}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      )}
      <input
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400
          ${Icon ? 'pl-9' : ''}
          ${
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-slate-300 focus:ring-[#F97316] focus:border-[#F97316]'
          }
          focus:outline-none focus:ring-2 focus:ring-offset-0 transition
          dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500
          ${className || ''}`}
        {...props}
      />
    </div>
    {error && (
      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{error}</span>
      </p>
    )}
    {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

export default Input;
