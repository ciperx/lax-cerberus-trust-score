import { describe, expect, it } from 'vitest';
import { scoreAgent } from '../src/scoreAgent.js';
import { tierForScore } from '../src/tiers.js';
import { boundaryFixtures } from './fixtures.js';

describe('scoreAgent tier boundaries', () => {
  it.each(boundaryFixtures)(
    'scores $note at $score ($tier)',
    ({ record, score, tier }) => {
      const result = scoreAgent(record);

      expect(result.score).toBe(score);
      expect(result.tier).toBe(tier);
    },
  );

  it.each(boundaryFixtures)(
    'keeps score and tier consistent at $score',
    ({ record, score }) => {
      const result = scoreAgent(record);

      expect(tierForScore(result.score)).toBe(result.tier);
      expect(result.score).toBe(score);
    },
  );
});

describe('scoreAgent band edges', () => {
  it.each([
    { below: 39, above: 40, lower: 'unproven', upper: 'bronze' },
    { below: 59, above: 60, lower: 'bronze', upper: 'silver' },
    { below: 79, above: 80, lower: 'silver', upper: 'gold' },
  ])(
    'crosses from $lower to $upper between $below and $above',
    ({ below, above, lower, upper }) => {
      const low = boundaryFixtures.find((entry) => entry.score === below);
      const high = boundaryFixtures.find((entry) => entry.score === above);

      expect(low?.tier).toBe(lower);
      expect(high?.tier).toBe(upper);
      expect(scoreAgent(low!.record).tier).toBe(lower);
      expect(scoreAgent(high!.record).tier).toBe(upper);
      expect(scoreAgent(low!.record).score).toBeLessThan(scoreAgent(high!.record).score);
    },
  );
});
