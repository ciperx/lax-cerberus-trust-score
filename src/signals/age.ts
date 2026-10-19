import type { AgentRecord, SignalContribution } from '../types.js';
import { WEIGHTS } from '../weights.js';
import { parseTimestamp, wholeDaysBetween } from '../iso.js';

export interface AgeFacts {
  days: number | null;
}

export function readAge(record: AgentRecord): AgeFacts {
  const created = parseTimestamp(record.listingCreatedAt);
  const asOf = parseTimestamp(record.asOf);
  if (created === null || asOf === null) return { days: null };
  return { days: wholeDaysBetween(created, asOf) };
}

export function scoreListingAge(facts: AgeFacts): SignalContribution {
  if (facts.days === null) {
    return {
      points: 0,
      reason: 'Listing age is unknown because no valid listing date and as of date were supplied, so it earns 0 of 15 age points.',
    };
  }

  const band = WEIGHTS.ageBands.find((entry) => facts.days! >= entry.minDays);
  const points = band ? band.points : 0;

  return {
    points,
    reason: `Listing has been open for ${facts.days} days, which earns ${points} of 15 age points.`,
  };
}

export function scoreAge(record: AgentRecord): SignalContribution {
  return scoreListingAge(readAge(record));
}
