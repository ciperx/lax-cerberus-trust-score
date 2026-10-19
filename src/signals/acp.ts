import type { AgentRecord, SignalContribution } from '../types.js';
import { WEIGHTS } from '../weights.js';
import { clamp, isFiniteNumber } from '../num.js';

/** Reads a 0..100 ACP score, returning null when absent or unusable. */
export function readAcp(record: AgentRecord): number | null {
  const raw = record.acpScore;
  if (!isFiniteNumber(raw)) return null;
  return clamp(raw, 0, 100);
}

export function scoreAcp(acp: number | null): SignalContribution {
  if (acp === null) {
    return {
      points: 0,
      reason: 'No ACP score was supplied, so it earns 0 of 30 competency points.',
    };
  }

  const points = Math.round((WEIGHTS.acpMax * acp) / 100);

  return {
    points,
    reason: `ACP score is ${acp} out of 100, which earns ${points} of 30 competency points.`,
  };
}
