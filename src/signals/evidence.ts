import type { AgentRecord } from '../types.js';
import { readDeliveries } from './deliveries.js';
import { readAdmission } from './admission.js';

/**
 * A listing only counts as evidenced once somebody has actually judged it:
 * at least one delivery decision, or a completed admission test.
 * Without that, no amount of self reported readiness can promote it.
 */
export function hasEvidence(record: AgentRecord): boolean {
  const { accepted, rejected } = readDeliveries(record);
  if (accepted + rejected > 0) return true;

  const admission = readAdmission(record);
  return admission === 'pass' || admission === 'fail';
}
