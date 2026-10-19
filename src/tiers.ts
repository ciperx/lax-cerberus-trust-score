import type { Tier } from './types.js';
import { SCORE_MAX, SCORE_MIN } from './weights.js';
import { clamp } from './num.js';

/** Ordered ladder. Index is the rank used by the one step rule. */
export const TIER_LADDER: readonly Tier[] = ['unproven', 'bronze', 'silver', 'gold'];

/** Inclusive score band for each tier. Bands tile 0..100 with no gaps. */
export const TIER_BANDS: Readonly<Record<Tier, readonly [number, number]>> = {
  unproven: [0, 39],
  bronze: [40, 59],
  silver: [60, 79],
  gold: [80, 100],
};

export function tierRank(tier: Tier): number {
  return TIER_LADDER.indexOf(tier);
}

export function tierForScore(score: number): Tier {
  const safe = Number.isFinite(score) ? Math.round(score) : SCORE_MIN;
  const bounded = clamp(safe, SCORE_MIN, SCORE_MAX);
  if (bounded >= 80) return 'gold';
  if (bounded >= 60) return 'silver';
  if (bounded >= 40) return 'bronze';
  return 'unproven';
}

/** Moves `steps` rungs along the ladder, never off either end. */
export function shiftTier(tier: Tier, steps: number): Tier {
  const target = clamp(tierRank(tier) + steps, 0, TIER_LADDER.length - 1);
  return TIER_LADDER[target] as Tier;
}

/**
 * Caps the influence of an outside opinion so the tier can move at most one
 * rung away from the internal verdict.
 *
 * Returns the adjusted score, chosen inside the adjacent band so that
 * tierForScore(adjusted) is exactly one rung from `internalScore`'s tier.
 */
export function limitOutsideInfluence(internalScore: number, blendedScore: number): number {
  const internalTier = tierForScore(internalScore);
  const blendedTier = tierForScore(blendedScore);

  const internalRank = tierRank(internalTier);
  const blendedRank = tierRank(blendedTier);
  const distance = blendedRank - internalRank;

  if (Math.abs(distance) <= 1) return blendedScore;

  const allowedTier = shiftTier(internalTier, distance > 0 ? 1 : -1);
  const band = TIER_BANDS[allowedTier];

  // Push the score to the edge of the allowed band nearest the blend.
  return distance > 0 ? band[1] : band[0];
}
