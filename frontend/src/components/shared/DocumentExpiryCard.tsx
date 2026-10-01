import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, FileText, Eye } from 'lucide-react';
import { daysUntilExpiry, formatDate, getExpiryUrgency } from '@/lib/utils/date';
import { cn } from '@/lib/utils';

export interface DocumentExpiryCardProps {
  title: string;
  documentType?: string;
  documentNumber?: string;
  expiryDate?: string | null;
  expiresOn?: string | null;
  issuedDate?: string | null;
  downloadUrl?: string;
  onRenew?: () => void;
  onView?: () => void;
  className?: string;
}

export const DocumentExpiryCard: React.FC<DocumentExpiryCardProps> = ({
  title,
  documentType,
  documentNumber,
  expiryDate,
  expiresOn,
  issuedDate,
  downloadUrl,
  onRenew,
  onView,
  className,
}) => {
  const targetDate = expiryDate || expiresOn;
  const days = daysUntilExpiry(targetDate);
  const urgency = getExpiryUrgency(days);

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all duration-200 bg-white dark:bg-slate-900 hover:shadow-md',
        urgency === 'critical'
          ? 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20'
          : urgency === 'warning'
          ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20'
          : 'border-slate-200 dark:border-slate-800',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-2 rounded-lg',
              urgency === 'critical'
                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                : urgency === 'warning'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            )}
          >
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {title.replace(/_/g, ' ')}
              </h4>
              {documentType && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {documentType}
                </span>
              )}
            </div>
            {documentNumber && (
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                {documentNumber}
              </p>
            )}
          </div>
        </div>

        {/* Urgency Badge */}
        {targetDate ? (
          urgency === 'critical' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900">
              <AlertCircle className="w-3 h-3" />
              {days !== null && days <= 0 ? 'EXPIRED' : `${days}d left`}
            </span>
          ) : urgency === 'warning' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900">
              <AlertTriangle className="w-3 h-3" />
              {days}d left
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900">
              <CheckCircle2 className="w-3 h-3" />
              Valid
            </span>
          )
        ) : (
          <span className="text-[11px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
            No Expiry
          </span>
        )}
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
        <div>
          <span className="text-slate-400">Expires: </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {formatDate(targetDate)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onView && (
            <button
              type="button"
              onClick={onView}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </button>
          )}
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-navy-800 dark:text-navy-200 hover:underline"
            >
              Download
            </a>
          )}
          {onRenew && (
            <button
              type="button"
              onClick={onRenew}
              className="text-xs font-semibold text-saffron-600 hover:underline"
            >
              Renew
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
