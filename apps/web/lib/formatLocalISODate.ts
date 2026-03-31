/**
 * Local calendar date as YYYY-MM-DD for `<input type="date" />` (value / min / max).
 * Avoids UTC drift from `toISOString().split('T')[0]`.
 */
export function formatLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
