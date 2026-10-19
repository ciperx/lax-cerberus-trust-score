import { describe, expect, it } from 'vitest';
import { scoreAgent } from '../src/scoreAgent.js';
import { tierRank, limitOutsideInfluence } from '../src/tiers.js';
import { boundaryFixtures, fixtureAt } from './fixtures.js';

describe('outside score moves the tier by at most one step', () => {
  it('allows a single step up', () => {
    const result = scoreAgent(fixtureAt(40).record, 100);

    expect(result.score).toBe(61);
    expect(result.tier).toBe('silver');
    expect(tierRank(result.tier) - tierRank('bronze')).toBe(1);
  });

  it('caps a two step climb at one step', () => {
    const result = scoreAgent(fixtureAt(39).record, 100);

    expect(result.score).toBe(59);
    expect(result.tier).toBe('bronze');
    expect(tierRank(result.tier) - tierRank('unproven')).toBe(1);
  });

  it('caps a two step fall at one step', () => {
    const result = scoreAgent(fixtureAt(80).record, 0);

    expect(result.score).toBe(60);
    expect(result.tier).toBe('silver');
    expect(tierRank('gold') - tierRank(result.tier)).toBe(1);
  });

  it('allows a single step down', () => {
    const result = scoreAgent(fixtureAt(79).record, 0);

    expect(result.score).toBe(51);
    expect(result.tier).toBe('bronze');
    expect(tierRank('silver') - tierRank(result.tier)).toBe(1);
  });

  it('never moves more than one rank across every fixture and outside value', () => {
    const outsideValues = [0, 1, 20, 39, 40, 50, 60, 61, 79, 80, 99, 100];

    for (const fixture of boundaryFixtures) {
      const base = scoreAgent(fixture.record);

      for (const outside of outsideValues) {
        const result = scoreAgent(fixture.record, outside);
        const delta = Math.abs(tierRank(result.tier) - tierRank(base.tier));

        expect(delta).toBeLessThanOrEqual(1);
      }
    }
  });

  it('keeps every blended score inside 0..100', () => {
    for (const fixture of boundaryFixtures) {
      for (const outside of [-100, 0, 50, 100, 500]) {
        const result = scoreAgent(fixture.record, outside);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('outside score handling', () => {
  it('is ignored when absent', () => {
    const base = scoreAgent(fixtureAt(60).record);
    expect(scoreAgent(fixtureAt(60).record, undefined)).toEqual(base);
    expect(scoreAgent(fixtureAt(60).record, null)).toEqual(base);
  });

  it('is ignored when not a finite number', () => {
    const base = scoreAgent(fixtureAt(60).record);

    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const result = scoreAgent(fixtureAt(60).record, bad);
      expect(result.score).toBe(base.score);
      expect(result.tier).toBe(base.tier);
      expect(result.reasons.join(' ')).toContain('ignored');
    }
  });

  it('clamps an out of range outside score and says so', () => {
    const high = scoreAgent(fixtureAt(60).record, 250);
    expect(high.score).toBe(74);
    expect(high.reasons.join(' ')).toContain('pulled into the 0 to 100 range');

    const low = scoreAgent(fixtureAt(60).record, -40);
    expect(low.score).toBe(40);
    expect(low.tier).toBe('bronze');
  });

  it('explains when the one step cap engages', () => {
    const result = scoreAgent(fixtureAt(39).record, 100);
    const text = result.reasons.join(' ');

    expect(text).toContain('one step rule');
    expect(text).toContain('capped at bronze');
  });

  it('does not mention the cap when the blend stays within one step', () => {
    const result = scoreAgent(fixtureAt(40).record, 100);
    expect(result.reasons.join(' ')).not.toContain('one step rule');
  });
});

describe('limitOutsideInfluence', () => {
  it.each([
    { internal: 39, blended: 60, expected: 59, note: 'two up becomes one up' },
    { internal: 39, blended: 70, expected: 59, note: 'three up becomes one up' },
    { internal: 80, blended: 20, expected: 60, note: 'three down becomes one down' },
    { internal: 40, blended: 61, expected: 61, note: 'one up is left alone' },
    { internal: 79, blended: 51, expected: 51, note: 'one down is left alone' },
    { internal: 60, blended: 60, expected: 60, note: 'unchanged' },
    { internal: 100, blended: 100, expected: 100, note: 'ceiling' },
    { internal: 0, blended: 0, expected: 0, note: 'floor' },
  ])('$note', ({ internal, blended, expected }) => {
    expect(limitOutsideInfluence(internal, blended)).toBe(expected);
  });
});
