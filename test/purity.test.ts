import { afterEach, describe, expect, it, vi } from 'vitest';
import { scoreAgent } from '../src/scoreAgent.js';
import { boundaryFixtures } from './fixtures.js';
import type { AgentRecord } from '../src/types.js';
import { ageFields } from './helpers.js';

const record: AgentRecord = {
  ...ageFields(40),
  acceptedDeliveries: 8,
  rejectedDeliveries: 1,
  admissionTest: 'pass',
  aiaxReadiness: 0.6,
  acpScore: 55,
};

describe('determinism and purity', () => {
  it('returns identical results for repeated calls', () => {
    const first = scoreAgent(record, 77);
    const second = scoreAgent(record, 77);
    const third = scoreAgent(record, 77);

    expect(second).toEqual(first);
    expect(third).toEqual(first);
  });

  it('is independent of input object identity', () => {
    const clone: AgentRecord = JSON.parse(JSON.stringify(record));
    expect(scoreAgent(clone, 77)).toEqual(scoreAgent(record, 77));
  });

  it('does not mutate the record', () => {
    const frozen = Object.freeze({ ...record });
    const snapshot = JSON.stringify(frozen);

    scoreAgent(frozen, 88);

    expect(JSON.stringify(frozen)).toBe(snapshot);
  });

  it('does not mutate a deeply frozen record', () => {
    const frozen = Object.freeze({ ...record });
    expect(() => scoreAgent(frozen, 12)).not.toThrow();
    expect(frozen.acceptedDeliveries).toBe(8);
    expect(frozen.acpScore).toBe(55);
  });

  it('returns a fresh reasons array on every call', () => {
    const first = scoreAgent(record);
    const second = scoreAgent(record);

    expect(first.reasons).not.toBe(second.reasons);
    first.reasons.push('mutated');
    expect(scoreAgent(record).reasons).not.toContain('mutated');
  });

  it('never reads the wall clock', () => {
    const spy = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('scoreAgent must not read the clock');
    });

    try {
      expect(() => scoreAgent(record)).not.toThrow();
      expect(() => scoreAgent(record, 50)).not.toThrow();
    } finally {
      spy.mockRestore();
    }
  });

  it('produces the same score regardless of when it runs', () => {
    const spy = vi.spyOn(Date, 'now');
    spy.mockReturnValue(0);
    const atEpoch = scoreAgent(record, 60);

    spy.mockReturnValue(1_900_000_000_000);
    const later = scoreAgent(record, 60);

    spy.mockRestore();
    expect(later).toEqual(atEpoch);
  });

  it('is stable across every fixture', () => {
    for (const fixture of boundaryFixtures) {
      expect(scoreAgent(fixture.record, 45)).toEqual(scoreAgent(fixture.record, 45));
    }
  });
});

describe('output shape', () => {
  it.each(boundaryFixtures)('returns an integer score for $score', ({ record: fixtureRecord }) => {
    const result = scoreAgent(fixtureRecord, 33);

    expect(Number.isInteger(result.score)).toBe(true);
    expect(Object.keys(result).sort()).toEqual(['reasons', 'score', 'tier']);
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(typeof result.tier).toBe('string');
  });

  it('has no side effects on global state', () => {
    const before = Object.keys(globalThis).length;
    scoreAgent(record, 10);
    expect(Object.keys(globalThis).length).toBe(before);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
