// Shared infrastructure for trust decisions. Authority, readiness, evidence
// and freshness keep distinct meanings and verdict types; they share only the
// typed reason shape so every blocker is auditable by a stable code.

export const REASON_CODES = [
  "workspace_stale",
  "evidence_stale",
  "evidence_missing",
  "check_missing",
  "check_failed",
  "check_asserted_without_evidence",
  "criterion_unsatisfied",
  "runtime_evidence_required",
  "independent_review_required",
  "human_approval_required",
  "blocker",
  "passed"
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];

export interface TrustReason {
  code: ReasonCode;
  message: string;
  /** Optional reference to the artifact or command the reason is about. */
  ref?: string;
}

export function reason(code: ReasonCode, message: string, ref?: string): TrustReason {
  return ref === undefined ? { code, message } : { code, message, ref };
}
