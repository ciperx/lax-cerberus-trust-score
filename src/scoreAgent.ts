import type { AgentRecord, ScoreResult, SignalContribution } from './types.js';
import { WEIGHTS, SCORE_MAX, SCORE_MIN } from './weights.js';
import { clamp } from './num.js';
import { tierForScore, limitOutsideInfluence } from './tiers.js';
import { scoreAge } from './signals/age.js';
import { readDeliveries, scoreAccepted, scoreRejected } from './signals/deliveries.js';
import { readAdmission, scoreAdmission } from './signals/admission.js';
import { readAiax, scoreAiax } from './signals/aiax.js';
import { readAcp, scoreAcp } from './signals/acp.js';
import { hasEvidence } from './signals/evidence.js';
import { readOutside } from './outside.js';

/** Widest score an unevidenced listing may reach. Top of the unproven band. */
const UNPROVEN_CEILING = 39;

function collectSignals(record: AgentRecord): SignalContribution[] {
  const deliveries = readDeliveries(record);

  return [
    scoreAge(record),
    scoreAccepted(deliveries),
    scoreRejected(deliveries),
    scoreAdmission(readAdmission(record)),
    scoreAiax(readAiax(record)),
    scoreAcp(readAcp(record)),
  ];
}

/**
 * Scores an agent listing on a 0..100 scale.
 *
 * Pure and deterministic: no clock, no network, no randomness, and the input
 * record is never mutated. A listing with no evidence at all is valid input and
 * returns tier 'unproven' instead of throwing.
 */
export function scoreAgent(record?: AgentRecord | null, outside?: number | null): ScoreResult {
  const safeRecord: AgentRecord = record ?? {};

  const signals = collectSignals(safeRecord);
  const reasons = signals.map((signal) => signal.reason);

  const rawInternal = signals.reduce((total, signal) => total + signal.points, 0);
  let score = clamp(Math.round(rawInternal), SCORE_MIN, SCORE_MAX);

  if (!hasEvidence(safeRecord)) {
    score = Math.min(score, UNPROVEN_CEILING);
    reasons.push(
      'No delivery decisions and no completed admission test were recorded, so the listing stays unproven and cannot be promoted on readiness scores alone.',
    );
  }

  const second = readOutside(outside);

  if (second.invalid) {
    reasons.push('The outside score was ignored because it was not a finite number.');
  }

  if (second.clamped) {
    reasons.push(
      `The outside score was pulled into the 0 to 100 range before blending, giving ${second.value}.`,
    );
  }

  if (second.value !== null) {
    const blended = Math.round(
      score * (1 - WEIGHTS.outsideWeight) + second.value * WEIGHTS.outsideWeight,
    );

    reasons.push(
      `Outside score of ${second.value} was blended at 35 percent weight, which moves the internal score of ${score} to ${blended}.`,
    );

    const limited = limitOutsideInfluence(score, blended);

    if (limited !== blended) {
      reasons.push(
        `The outside opinion would have moved the tier from ${tierForScore(score)} to ${tierForScore(blended)}, so the score was held at ${limited} and the tier capped at ${tierForScore(limited)} to respect the one step rule.`,
      );
    }

    score = limited;
  }

  // The evidence gate is the last word, not the first. Blending an outside
  // opinion used to lift an unevidenced listing out of unproven, which is the
  // one thing this score exists to prevent.
  let finalScore = clamp(Math.round(score), SCORE_MIN, SCORE_MAX);

  if (!hasEvidence(safeRecord) && finalScore > UNPROVEN_CEILING) {
    finalScore = UNPROVEN_CEILING;
    reasons.push(
      `The blended score of ${score} was held at ${UNPROVEN_CEILING} because a listing with no delivery decisions and no completed admission test stays unproven no matter what a second opinion says.`,
    );
  }

  return {
    score: finalScore,
    tier: tierForScore(finalScore),
    reasons,
  };
}
