import { describe, expect, it } from 'vitest';
import { TIER_LADDER, tierForScore, tierRank, shiftTier } from '../src/tiers.js';
import type { Tier } from '../src/types.js';

interface Row {
  score: number;
  tier: Tier;
  note: string;
}

const rows: Row[] = [
  { score: 0, tier: 'unproven', note: 'floor' },
  { score: 1, tier: 'unproven', note: 'just above floor' },
  { score: 38, tier: 'unproven', note: 'two below bronze' },
  { score: 39, tier: 'unproven', note: 'top of unproven' },
  { score: 40, tier: 'bronze', note: 'bottom of bronze' },
  { score: 41, tier: 'bronze', note: 'just above bronze floor' },
  { score: 58, tier: 'bronze', note: 'two below silver' },
  { score: 59, tier: 'bronze', note: 'top of bronze' },
  { score: 60, tier: 'silver', note: 'bottom of silver' },
  { score: 61, tier: 'silver', note: 'just above silver floor' },
  { score: 78, tier: 'silver', note: 'two below gold' },
  { score: 79, tier: 'silver', note: 'top of silver' },
  { score: 80, tier: 'gold', note: 'bottom of gold' },
  { score: 81, tier: 'gold', note: 'just above gold floor' },
  { score: 99, tier: 'gold', note: 'near ceiling' },
  { score: 100, tier: 'gold', note: 'ceiling' },
];

describe('tierForScore', () => {
  it.each(rows)('score $score maps to $tier ($note)', ({ score, tier }) => {
    expect(tierForScore(score)).toBe(tier);
  });

  it.each([
    { input: -50, expected: 'unproven' as Tier, note: 'clamped up to 0' },
    { input: -0.4, expected: 'unproven' as Tier, note: 'clamped up to 0' },
    { input: 39.4, expected: 'unproven' as Tier, note: 'rounds down to 39' },
    { input: 39.5, expected: 'bronze' as Tier, note: 'rounds up to 40' },
    { input: 59.5, expected: 'silver' as Tier, note: 'rounds up to 60' },
    { input: 79.5, expected: 'gold' as Tier, note: 'rounds up to 80' },
    { input: 140, expected: 'gold' as Tier, note: 'clamped down to 100' },
    { input: Number.NaN, expected: 'unproven' as Tier, note: 'treated as 0' },
  ])('normalises $input to $expected ($note)', ({ input, expected }) => {
    expect(tierForScore(input)).toBe(expected);
  });

  it('never returns a tier outside the ladder', () => {
    for (let score = 0; score <= 100; score += 1) {
      expect(TIER_LADDER).toContain(tierForScore(score));
    }
  });

  it('is monotonic across the whole range', () => {
    let previous = -1;
    for (let score = 0; score <= 100; score += 1) {
      const rank = tierRank(tierForScore(score));
      expect(rank).toBeGreaterThanOrEqual(previous);
      previous = rank;
    }
  });
});

describe('tierRank and shiftTier', () => {
  it('assigns ascending ranks to the ladder', () => {
    expect(tierRank('unproven')).toBe(0);
    expect(tierRank('bronze')).toBe(1);
    expect(tierRank('silver')).toBe(2);
    expect(tierRank('gold')).toBe(3);
  });

  it('walks the ladder one rung at a time', () => {
    expect(shiftTier('unproven', 1)).toBe('bronze');
    expect(shiftTier('bronze', 1)).toBe('silver');
    expect(shiftTier('silver', 1)).toBe('gold');
    expect(shiftTier('gold', -1)).toBe('silver');
    expect(shiftTier('bronze', 0)).toBe('bronze');
  });

  it('cannot walk off either end', () => {
    expect(shiftTier('gold', 5)).toBe('gold');
    expect(shiftTier('unproven', -5)).toBe('unproven');
    expect(shiftTier('gold', -3)).toBe('unproven');
    expect(shiftTier('silver', -3)).toBe('unproven');
  });
});
