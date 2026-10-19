export type Tier = 'unproven' | 'bronze' | 'silver' | 'gold';

export type AdmissionResult = 'pass' | 'fail' | 'pending' | 'none';

/**
 * Raw evidence about an agent listing. Every field is optional: a listing with
 * no evidence at all is valid input and must score as 'unproven'.
 */
export interface AgentRecord {
  /** ISO 8601 timestamp for when the listing was opened. */
  listingCreatedAt?: string | null;
  /** ISO 8601 timestamp used as "now". Supplied by the caller, never read from a clock. */
  asOf?: string | null;
  acceptedDeliveries?: number | null;
  rejectedDeliveries?: number | null;
  admissionTest?: AdmissionResult | null;
  /** 0..1 self reported readiness. */
  aiaxReadiness?: number | null;
  /** 0..100 external ACP score. */
  acpScore?: number | null;
}

export interface ScoreResult {
  /** Integer 0..100. Always agrees with `tier` through tierForScore. */
  score: number;
  tier: Tier;
  /** One human readable sentence per signal, in a stable order. */
  reasons: string[];
}

export interface SignalContribution {
  points: number;
  reason: string;
}
