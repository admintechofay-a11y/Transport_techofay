import { format, isValid, parseISO, differenceInDays } from 'date-fns';

/**
 * Format date string safely
 */
export function formatDate(dateString: string | Date | null | undefined, pattern: string = 'dd MMM yyyy'): string {
  if (!dateString) return '-';
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(d) ? format(d, pattern) : '-';
  } catch {
    return '-';
  }
}

/**
 * Format datetime string safely
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  return formatDate(dateString, 'dd MMM yyyy, hh:mm a');
}

/**
 * Calculate days remaining until expiry
 */
export function daysUntilExpiry(expiryDate: string | Date | null | undefined): number | null {
  if (!expiryDate) return null;
  try {
    const target = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
    if (!isValid(target)) return null;
    return differenceInDays(target, new Date());
  } catch {
    return null;
  }
}

/**
 * Get urgency level for document expirations:
 * - 'critical' (< 7 days or expired) -> red
 * - 'warning'  (7 - 30 days)         -> orange
 * - 'safe'     (> 30 days)           -> green
 */
export function getExpiryUrgency(daysRemaining: number | null): 'critical' | 'warning' | 'safe' | 'unknown' {
  if (daysRemaining === null) return 'unknown';
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  return 'safe';
}
