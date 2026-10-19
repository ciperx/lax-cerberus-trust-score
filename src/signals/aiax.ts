import type { AgentRecord, SignalContribution } from '../types.js';
import { WEIGHTS } from '../weights.js';
import { clamp, isFiniteNumber } from '../num.js';

/** Reads a 0..1 readiness fraction, returning null when absent or unusable. */
export function readAiax(record: AgentRecord): number | null {
  const raw = record.aiaxReadiness;
  if (!isFiniteNumber(raw)) return null;
  return clamp(raw, 0, 1);
}

export function scoreAiax(readiness: number | null): SignalContribution {
  if (readiness === null) {
    return {
      points: 0,
      reason: 'AIAX readiness was not reported, so it earns 0 of 15 readiness points.',
    };
  }

  const points = Math.round(WEIGHTS.aiaxMax * readiness);

  return {
    points,
    reason: `AIAX readiness is ${readiness.toFixed(2)}, which earns ${points} of 15 readiness points.`,
  };
}
