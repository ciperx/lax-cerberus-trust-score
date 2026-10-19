import type { AgentRecord, AdmissionResult, SignalContribution } from '../types.js';
import { WEIGHTS } from '../weights.js';

const VALID: readonly AdmissionResult[] = ['pass', 'fail', 'pending', 'none'];

export function readAdmission(record: AgentRecord): AdmissionResult {
  const raw = record.admissionTest;
  if (typeof raw !== 'string') return 'none';
  const normalised = raw.trim().toLowerCase() as AdmissionResult;
  return VALID.includes(normalised) ? normalised : 'none';
}

export function scoreAdmission(result: AdmissionResult): SignalContribution {
  switch (result) {
    case 'pass':
      return {
        points: WEIGHTS.admissionPass,
        reason: `Admission test passed, which earns ${WEIGHTS.admissionPass} admission points.`,
      };
    case 'fail':
      return {
        points: WEIGHTS.admissionFail,
        reason: `Admission test failed, which deducts ${Math.abs(WEIGHTS.admissionFail)} admission points.`,
      };
    case 'pending':
      return {
        points: 0,
        reason: 'Admission test is still pending, so it earns 0 admission points.',
      };
    default:
      return {
        points: 0,
        reason: 'No admission test result was recorded, so it earns 0 admission points.',
      };
  }
}
