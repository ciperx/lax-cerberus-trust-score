export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** Coerces anything into a non negative integer, defaulting to 0. */
export function toCount(value: unknown): number {
  if (!isFiniteNumber(value)) return 0;
  if (value <= 0) return 0;
  return Math.floor(value);
}

/** Rounds to an integer and clamps into an inclusive range. */
export function toBoundedInt(value: number, low: number, high: number): number {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded)) return low;
  return clamp(rounded, low, high);
}
