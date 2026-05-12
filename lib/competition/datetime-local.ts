/** Local `datetime-local`-style strings: `YYYY-MM-DDTHH:mm` (no timezone; interpreted in device local time). */

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function dateToDatetimeLocalValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function parseDatetimeLocalToDate(value: string): Date | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function formatCompetitionDatetimeButtonLabel(value: string): string {
  const d = parseDatetimeLocalToDate(value);
  if (!d) return '—';
  try {
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}
