import { describe, expect, it } from 'vitest';
import { scoreAgent } from '../src/scoreAgent.js';
import type { AgentRecord } from '../src/types.js';
import { ageFields } from './helpers.js';

describe('unproven agents are never refused', () => {
  it('returns unproven for a missing record instead of throwing', () => {
    expect(() => scoreAgent()).not.toThrow();
    const result = scoreAgent();
    expect(result.tier).toBe('unproven');
    expect(result.score).toBe(0);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('returns unproven for a null record', () => {
    const result = scoreAgent(null);
    expect(result.tier).toBe('unproven');
    expect(result.score).toBe(0);
  });

  it('returns unproven for an empty record', () => {
    const result = scoreAgent({});
    expect(result.tier).toBe('unproven');
    expect(result.score).toBe(0);
  });

  it('returns unproven for a record with null fields only', () => {
    const result = scoreAgent({
      listingCreatedAt: null,
      asOf: null,
      acceptedDeliveries: null,
      rejectedDeliveries: null,
      admissionTest: null,
      aiaxReadiness: null,
      acpScore: null,
    });
    expect(result.tier).toBe('unproven');
    expect(result.score).toBe(0);
  });

  it('never throws on hostile field types', () => {
    const hostile = {
      listingCreatedAt: 42,
      asOf: { nope: true },
      acceptedDeliveries: Number.POSITIVE_INFINITY,
      rejectedDeliveries: Number.NaN,
      admissionTest: 'maybe',
      aiaxReadiness: 'high',
      acpScore: Number.NEGATIVE_INFINITY,
    } as unknown as AgentRecord;

    expect(() => scoreAgent(hostile)).not.toThrow();
    const result = scoreAgent(hostile);
    expect(result.tier).toBe('unproven');
    expect(Number.isInteger(result.score)).toBe(true);
  });

  it('caps a readiness only listing inside the unproven band', () => {
    const result = scoreAgent({
      ...ageFields(365),
      admissionTest: 'pending',
      aiaxReadiness: 1,
      acpScore: 100,
    });

    expect(result.score).toBe(39);
    expect(result.tier).toBe('unproven');
  });

  it('caps an admission pending listing inside the unproven band', () => {
    const result = scoreAgent({ ...ageFields(120), admissionTest: 'pending', acpScore: 100 });
    expect(result.score).toBe(39);
    expect(result.tier).toBe('unproven');
  });

  it('does not let an outside score promote an unevidenced listing', () => {
    const result = scoreAgent({}, 100);
    expect(result.tier).toBe('unproven');
    expect(result.score).toBeLessThan(40);
  });

  it('returns unproven for a failed admission with no deliveries', () => {
    const result = scoreAgent({ admissionTest: 'fail' });
    expect(result.tier).toBe('unproven');
    expect(result.score).toBe(0);
  });
});

describe('unproven ceiling', () => {
  it.each([
    { note: 'nothing at all', record: {} as AgentRecord },
    { note: 'age only', record: ageFields(400) as AgentRecord },
    { note: 'full readiness only', record: { aiaxReadiness: 1, acpScore: 100 } as AgentRecord },
    { note: 'pending admission', record: { admissionTest: 'pending' } as AgentRecord },
  ])('$note stays at or below 39', ({ record }) => {
    const result = scoreAgent(record);
    expect(result.score).toBeLessThanOrEqual(39);
    expect(result.tier).toBe('unproven');
  });
});
