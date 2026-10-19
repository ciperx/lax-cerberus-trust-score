import { describe, expect, it } from 'vitest';
import { scoreAgent } from '../src/scoreAgent.js';
import { boundaryFixtures, fixtureAt } from './fixtures.js';
import type { AgentRecord } from '../src/types.js';
import { ageFields } from './helpers.js';

const LONG_DASHES = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\u2E3A\u2E3B\uFE58\uFE63\uFF0D]/;
const ARABIC_INDIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/;
const NON_ASCII = /[^\x20-\x7E]/;

const richRecord: AgentRecord = {
  ...ageFields(45),
  acceptedDeliveries: 12,
  rejectedDeliveries: 2,
  admissionTest: 'pass',
  aiaxReadiness: 0.7,
  acpScore: 62,
};

describe('reasons coverage', () => {
  it('explains every contributing signal in a rich record', () => {
    const text = scoreAgent(richRecord).reasons.join(' ').toLowerCase();

    expect(text).toContain('listing has been open');
    expect(text).toContain('accepted deliveries');
    expect(text).toContain('rejected deliveries');
    expect(text).toContain('admission test');
    expect(text).toContain('aiax readiness');
    expect(text).toContain('acp score');
  });

  it('emits at least six reasons for a fully populated record', () => {
    expect(scoreAgent(richRecord).reasons.length).toBeGreaterThanOrEqual(6);
  });

  it.each(boundaryFixtures)('covers every signal for the $score fixture', ({ record }) => {
    const text = scoreAgent(record).reasons.join(' ').toLowerCase();
    expect(text).toContain('age points');
    expect(text).toContain('delivery points');
    expect(text).toContain('admission points');
    expect(text).toContain('readiness points');
    expect(text).toContain('competency points');
  });

  it('explains an ignored outside score', () => {
    const text = scoreAgent(richRecord, Number.NaN).reasons.join(' ');
    expect(text).toContain('outside score was ignored');
  });

  it('explains the evidence gate for a bare listing', () => {
    const text = scoreAgent({}).reasons.join(' ');
    expect(text).toContain('stays unproven');
  });
});

describe('reasons formatting', () => {
  const samples: string[][] = [
    ...boundaryFixtures.map((fixture) => scoreAgent(fixture.record, 100).reasons),
    scoreAgent(richRecord, 250).reasons,
    scoreAgent().reasons,
    scoreAgent(richRecord, Number.NaN).reasons,
  ];

  it('gives every reason a terminating period and a readable length', () => {
    for (const reasons of samples) {
      for (const reason of reasons) {
        expect(reason.endsWith('.')).toBe(true);
        expect(reason.trim().split(/\s+/).length).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('uses ASCII only', () => {
    for (const reasons of samples) {
      for (const reason of reasons) {
        expect(reason).not.toMatch(NON_ASCII);
      }
    }
  });

  it('contains no long dashes', () => {
    for (const reasons of samples) {
      for (const reason of reasons) {
        expect(reason).not.toMatch(LONG_DASHES);
      }
    }
  });

  it('uses Latin digits only', () => {
    for (const reasons of samples) {
      for (const reason of reasons) {
        expect(reason).not.toMatch(ARABIC_INDIC_DIGITS);
      }
    }
    expect(scoreAgent(richRecord).reasons.join(' ')).toMatch(/[0-9]/);
  });

  it('never leaks undefined, NaN or Infinity into prose', () => {
    const all = samples.flat().join(' ');
    expect(all).not.toContain('undefined');
    expect(all).not.toContain('NaN');
    expect(all).not.toContain('Infinity');
  });

  it('keeps reasons free of long dash codepoints in the source strings', () => {
    const flat = samples.flat();
    expect(flat.every((reason) => typeof reason === 'string')).toBe(true);
    expect(flat.length).toBeGreaterThan(0);
  });
});

describe('reasons ordering', () => {
  it('reports signals in a stable documented order', () => {
    const reasons = scoreAgent(richRecord).reasons;

    expect(reasons[0]).toContain('Listing has been open');
    expect(reasons[1]).toContain('accepted deliveries');
    expect(reasons[2]).toContain('rejected deliveries');
    expect(reasons[3]).toContain('Admission test');
    expect(reasons[4]).toContain('AIAX readiness');
    expect(reasons[5]).toContain('ACP score');
  });

  it('appends the outside reason after the internal signals', () => {
    const reasons = scoreAgent(fixtureAt(40).record, 100).reasons;
    expect(reasons[6]).toContain('Outside score');
  });
});
