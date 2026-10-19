import type { AgentRecord, SignalContribution } from '../types.js';
import { WEIGHTS } from '../weights.js';
import { toCount } from '../num.js';

export interface DeliveryFacts {
  accepted: number;
  rejected: number;
}

export function readDeliveries(record: AgentRecord): DeliveryFacts {
  return {
    accepted: toCount(record.acceptedDeliveries),
    rejected: toCount(record.rejectedDeliveries),
  };
}

export function scoreAccepted(facts: DeliveryFacts): SignalContribution {
  const band = WEIGHTS.acceptedBands.find((entry) => facts.accepted >= entry.min);
  const points = band ? band.points : 0;

  return {
    points,
    reason: `Agent has ${facts.accepted} accepted deliveries, which earns ${points} of 25 delivery points.`,
  };
}

export function scoreRejected(facts: DeliveryFacts): SignalContribution {
  if (facts.rejected === 0) {
    return {
      points: 0,
      reason: 'Agent has no rejected deliveries, so no rejection penalty applies.',
    };
  }

  const raw = facts.rejected * WEIGHTS.rejectedPenaltyPerItem;
  const points = -Math.min(raw, WEIGHTS.rejectedPenaltyCap);

  return {
    points,
    reason: `Agent has ${facts.rejected} rejected deliveries, which costs ${Math.abs(points)} points.`,
  };
}
