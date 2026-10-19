import { isFiniteNumber, clamp } from './num.js';

export interface OutsideView {
  /** Normalised 0..100 value, or null when nothing usable was supplied. */
  value: number | null;
  /** True when a value was supplied but was not a finite number. */
  invalid: boolean;
  /** True when a finite value had to be pulled into the 0..100 range. */
  clamped: boolean;
}

/**
 * Normalises the optional second opinion. Missing and null input mean "no
 * second opinion". Unusable input is reported, never thrown.
 */
export function readOutside(outside: unknown): OutsideView {
  if (outside === undefined || outside === null) {
    return { value: null, invalid: false, clamped: false };
  }
  if (!isFiniteNumber(outside)) {
    return { value: null, invalid: true, clamped: false };
  }

  const bounded = clamp(outside, 0, 100);
  return { value: bounded, invalid: false, clamped: bounded !== outside };
}
