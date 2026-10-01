/**
 * Format numbers into Indian Rupee currency string: e.g. ₹12,50,000
 */
export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }

  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format weights in Tonnes or Kg
 */
export function formatWeight(weight: number | string | null | undefined, unit: string = 'Tonnes'): string {
  if (weight === null || weight === undefined) return '-';
  return `${Number(weight).toLocaleString('en-IN')} ${unit}`;
}
