const MS_PER_DAY = 86_400_000;

/** Fixed reference moment. Tests never read the wall clock. */
export const AS_OF = '2026-06-01T00:00:00.000Z';

/** Builds a listing date that is exactly `days` before AS_OF. */
export function agedDays(days: number): string {
  return new Date(Date.parse(AS_OF) - days * MS_PER_DAY).toISOString();
}

/** Age fields for a record, as a plain object to spread into fixtures. */
export function ageFields(days: number): { listingCreatedAt: string; asOf: string } {
  return { listingCreatedAt: agedDays(days), asOf: AS_OF };
}
