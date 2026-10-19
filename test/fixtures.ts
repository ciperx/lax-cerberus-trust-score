import type { AgentRecord, Tier } from '../src/types.js';
import { ageFields } from './helpers.js';

export interface Fixture {
  /** Score this record must produce. */
  score: number;
  tier: Tier;
  note: string;
  record: AgentRecord;
}

/**
 * Hand computed fixtures that land exactly on, just below, and at the extremes
 * of every tier boundary. Each fixture carries real evidence (accepted
 * deliveries) so the unproven evidence gate never interferes.
 */
export const boundaryFixtures: Fixture[] = [
  {
    score: 0,
    tier: 'unproven',
    note: 'floor, one rejection wipes the record',
    record: { ...ageFields(0), acceptedDeliveries: 0, rejectedDeliveries: 1, admissionTest: 'none' },
  },
  {
    score: 39,
    tier: 'unproven',
    note: 'top of unproven, one point below bronze',
    record: {
      ...ageFields(7),
      acceptedDeliveries: 2,
      rejectedDeliveries: 0,
      admissionTest: 'pass',
      aiaxReadiness: 0.13,
      acpScore: 7,
    },
  },
  {
    score: 40,
    tier: 'bronze',
    note: 'bottom of bronze',
    record: {
      ...ageFields(7),
      acceptedDeliveries: 2,
      rejectedDeliveries: 0,
      admissionTest: 'pass',
      aiaxReadiness: 0.2,
      acpScore: 7,
    },
  },
  {
    score: 59,
    tier: 'bronze',
    note: 'top of bronze, one point below silver',
    record: {
      ...ageFields(30),
      acceptedDeliveries: 10,
      rejectedDeliveries: 0,
      admissionTest: 'pass',
      aiaxReadiness: 0.4,
      acpScore: 14,
    },
  },
  {
    score: 60,
    tier: 'silver',
    note: 'bottom of silver',
    record: {
      ...ageFields(30),
      acceptedDeliveries: 10,
      rejectedDeliveries: 0,
      admissionTest: 'pass',
      aiaxReadiness: 0.4,
      acpScore: 17,
    },
  },
  {
    score: 79,
    tier: 'silver',
    note: 'top of silver, one point below gold',
    record: {
      ...ageFields(90),
      acceptedDeliveries: 25,
      rejectedDeliveries: 0,
      admissionTest: 'pass',
      aiaxReadiness: 0.8,
      acpScore: 40,
    },
  },
  {
    score: 80,
    tier: 'gold',
    note: 'bottom of gold',
    record: {
      ...ageFields(90),
      acceptedDeliveries: 25,
      rejectedDeliveries: 0,
      admissionTest: 'pass',
      aiaxReadiness: 0.8,
      acpScore: 43,
    },
  },
  {
    score: 100,
    tier: 'gold',
    note: 'ceiling, every signal maxed',
    record: {
      ...ageFields(90),
      acceptedDeliveries: 25,
      rejectedDeliveries: 0,
      admissionTest: 'pass',
      aiaxReadiness: 1,
      acpScore: 100,
    },
  },
];

/** Looks up a fixture by its expected score. */
export function fixtureAt(score: number): Fixture {
  const found = boundaryFixtures.find((entry) => entry.score === score);
  if (!found) throw new Error(`no fixture for score ${score}`);
  return found;
}
