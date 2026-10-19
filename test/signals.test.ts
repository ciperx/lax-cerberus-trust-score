import { describe, expect, it } from 'vitest';
import { scoreAge, scoreListingAge, readAge } from '../src/signals/age.js';
import { readDeliveries, scoreAccepted, scoreRejected } from '../src/signals/deliveries.js';
import { readAdmission, scoreAdmission } from '../src/signals/admission.js';
import { readAiax, scoreAiax } from '../src/signals/aiax.js';
import { readAcp, scoreAcp } from '../src/signals/acp.js';
import { hasEvidence } from '../src/signals/evidence.js';
import type { AgentRecord } from '../src/types.js';
import { ageFields, AS_OF } from './helpers.js';

describe('listing age signal', () => {
  it.each([
    { days: 0, points: 0 },
    { days: 1, points: 3 },
    { days: 6, points: 3 },
    { days: 7, points: 8 },
    { days: 29, points: 8 },
    { days: 30, points: 12 },
    { days: 89, points: 12 },
    { days: 90, points: 15 },
    { days: 400, points: 15 },
  ])('$days days earns $points', ({ days, points }) => {
    const result = scoreAge(ageFields(days));
    expect(result.points).toBe(points);
    expect(result.reason).toContain(`${days} days`);
  });

  it('earns nothing without a usable date pair', () => {
    expect(scoreAge({}).points).toBe(0);
    expect(scoreAge({ listingCreatedAt: AS_OF }).points).toBe(0);
    expect(scoreAge({ asOf: AS_OF }).points).toBe(0);
    expect(scoreAge({ listingCreatedAt: 'not a date', asOf: AS_OF }).points).toBe(0);
  });

  it('never rewards a listing dated in the future', () => {
    const result = scoreAge({ listingCreatedAt: '2027-01-01T00:00:00.000Z', asOf: AS_OF });
    expect(result.points).toBe(0);
  });

  it('reads whole days only', () => {
    expect(readAge(ageFields(45)).days).toBe(45);
    expect(scoreListingAge({ days: null }).points).toBe(0);
  });
});

describe('accepted delivery signal', () => {
  it.each([
    { accepted: 0, points: 0 },
    { accepted: 1, points: 6 },
    { accepted: 2, points: 12 },
    { accepted: 4, points: 12 },
    { accepted: 5, points: 18 },
    { accepted: 9, points: 18 },
    { accepted: 10, points: 22 },
    { accepted: 24, points: 22 },
    { accepted: 25, points: 25 },
    { accepted: 1000, points: 25 },
  ])('$accepted accepted earns $points', ({ accepted, points }) => {
    expect(scoreAccepted({ accepted, rejected: 0 }).points).toBe(points);
  });

  it('treats negative and fractional counts as zero and whole numbers', () => {
    expect(readDeliveries({ acceptedDeliveries: -5 }).accepted).toBe(0);
    expect(readDeliveries({ acceptedDeliveries: 4.9 }).accepted).toBe(4);
    expect(readDeliveries({ acceptedDeliveries: Number.NaN }).accepted).toBe(0);
  });
});

describe('rejected delivery signal', () => {
  it.each([
    { rejected: 0, points: 0 },
    { rejected: 1, points: -5 },
    { rejected: 3, points: -15 },
    { rejected: 5, points: -25 },
    { rejected: 9, points: -25 },
    { rejected: 500, points: -25 },
  ])('$rejected rejected costs $points', ({ rejected, points }) => {
    expect(scoreRejected({ accepted: 0, rejected }).points).toBe(points);
  });

  it('explains the absence of rejections', () => {
    expect(scoreRejected({ accepted: 3, rejected: 0 }).reason).toContain('no rejected deliveries');
  });
});

describe('admission signal', () => {
  it.each([
    { input: 'pass', points: 15 },
    { input: 'fail', points: -10 },
    { input: 'pending', points: 0 },
    { input: 'none', points: 0 },
  ] as const)('$input earns $points', ({ input, points }) => {
    expect(scoreAdmission(input).points).toBe(points);
  });

  it('normalises case and whitespace', () => {
    expect(readAdmission({ admissionTest: ' PASS ' } as unknown as AgentRecord)).toBe('pass');
    expect(readAdmission({ admissionTest: 'Fail' } as unknown as AgentRecord)).toBe('fail');
  });

  it('treats unknown values as none', () => {
    expect(readAdmission({ admissionTest: 'maybe' } as unknown as AgentRecord)).toBe('none');
    expect(readAdmission({})).toBe('none');
  });
});

describe('AIAX readiness signal', () => {
  it.each([
    { readiness: 0, points: 0 },
    { readiness: 0.2, points: 3 },
    { readiness: 0.4, points: 6 },
    { readiness: 0.5, points: 8 },
    { readiness: 0.8, points: 12 },
    { readiness: 1, points: 15 },
  ])('$readiness earns $points', ({ readiness, points }) => {
    expect(scoreAiax(readiness).points).toBe(points);
  });

  it('clamps readiness into 0..1', () => {
    expect(readAiax({ aiaxReadiness: 5 })).toBe(1);
    expect(readAiax({ aiaxReadiness: -2 })).toBe(0);
    expect(readAiax({ aiaxReadiness: Number.NaN })).toBeNull();
    expect(scoreAiax(null).points).toBe(0);
  });
});

describe('ACP signal', () => {
  it.each([
    { acp: 0, points: 0 },
    { acp: 14, points: 4 },
    { acp: 17, points: 5 },
    { acp: 40, points: 12 },
    { acp: 43, points: 13 },
    { acp: 50, points: 15 },
    { acp: 100, points: 30 },
  ])('$acp earns $points', ({ acp, points }) => {
    expect(scoreAcp(acp).points).toBe(points);
  });

  it('clamps acp into 0..100', () => {
    expect(readAcp({ acpScore: 250 })).toBe(100);
    expect(readAcp({ acpScore: -1 })).toBe(0);
    expect(readAcp({ acpScore: Number.NaN })).toBeNull();
    expect(scoreAcp(null).points).toBe(0);
  });
});

describe('evidence gate', () => {
  const cases: Array<{ note: string; record: AgentRecord; expected: boolean }> = [
    { note: 'empty record', record: {}, expected: false },
    { note: 'age only', record: ageFields(20), expected: false },
    { note: 'readiness only', record: { aiaxReadiness: 1, acpScore: 100 }, expected: false },
    { note: 'pending admission', record: { admissionTest: 'pending' }, expected: false },
    { note: 'passed admission', record: { admissionTest: 'pass' }, expected: true },
    { note: 'failed admission', record: { admissionTest: 'fail' }, expected: true },
    { note: 'one accepted delivery', record: { acceptedDeliveries: 1 }, expected: true },
    { note: 'one rejected delivery', record: { rejectedDeliveries: 1 }, expected: true },
  ];

  it.each(cases)('$note counts as evidence: $expected', ({ record, expected }) => {
    expect(hasEvidence(record)).toBe(expected);
  });
});
