/**
 * Every number that shapes the score lives here so README and tests can point
 * at one source of truth.
 */

export interface AgeBand {
  /** Inclusive lower bound in whole days. */
  minDays: number;
  points: number;
}

export interface AcceptedBand {
  /** Inclusive lower bound of accepted deliveries. */
  min: number;
  points: number;
}

export const WEIGHTS = {
  /** Age ramp, highest matching band wins. Max 15. */
  ageBands: [
    { minDays: 90, points: 15 },
    { minDays: 30, points: 12 },
    { minDays: 7, points: 8 },
    { minDays: 1, points: 3 },
    { minDays: 0, points: 0 },
  ] as AgeBand[],
  ageMax: 15,

  /** Accepted delivery ramp. Max 25. */
  acceptedBands: [
    { min: 25, points: 25 },
    { min: 10, points: 22 },
    { min: 5, points: 18 },
    { min: 2, points: 12 },
    { min: 1, points: 6 },
    { min: 0, points: 0 },
  ] as AcceptedBand[],
  acceptedMax: 25,

  /** Each rejection costs 5 points, the penalty stops at 25. */
  rejectedPenaltyPerItem: 5,
  rejectedPenaltyCap: 25,

  admissionPass: 15,
  admissionFail: -10,

  aiaxMax: 15,
  acpMax: 30,

  /** Share of the final score owned by the outside second opinion. */
  outsideWeight: 0.35,
} as const;

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
