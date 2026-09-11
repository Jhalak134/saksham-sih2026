// lib/format.ts

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactNumber(value: number): string {
  // e.g. 12480 -> "12,480" (Indian numbering)
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value}%`;
}

export function formatTrend(value: number): { label: string; direction: 'up' | 'down' | 'flat' } {
  if (value > 0) return { label: `▲ ${value}%`, direction: 'up' };
  if (value < 0) return { label: `▼ ${Math.abs(value)}%`, direction: 'down' };
  return { label: `${value}%`, direction: 'flat' };
}