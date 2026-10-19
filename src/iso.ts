const MS_PER_DAY = 86_400_000;

/**
 * Parses an ISO 8601 timestamp into epoch milliseconds.
 * Returns null for anything unusable, including values that are not strings.
 * Date.parse is used only on caller supplied text, never on the wall clock.
 */
export function parseTimestamp(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Whole days between two timestamps. Negative spans (listing dated after the
 * as of moment) resolve to 0 so the age signal cannot be gamed backwards.
 */
export function wholeDaysBetween(fromMs: number, toMs: number): number {
  const span = toMs - fromMs;
  if (!Number.isFinite(span) || span <= 0) return 0;
  return Math.floor(span / MS_PER_DAY);
}
