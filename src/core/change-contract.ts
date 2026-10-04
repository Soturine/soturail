import { createHash } from "node:crypto";
import { z } from "zod";
import { getWorkspacePaths, readJsonl } from "./config.js";
import type { GovernanceVerdict } from "./governance.js";
import type { RawRunRecord } from "./raw-store.js";
import { reason, type TrustReason } from "./trust-decision.js";
import { createWorkspaceFingerprint } from "./workspace-fingerprint.js";

export const ChangeContractSchema = z.object({
  schemaVersion: z.literal("soturail.change-contract.v1"),
  id: z.string().min(1),
  title: z.string().min(1),
  intent: z.string().min(1),
  risk: z.enum(["low", "medium", "high", "critical"]),
  workspaceFingerprint: z.string().min(1),
  decisions: z.array(z.object({ id: z.string().min(1), decision: z.string().min(1), rationale: z.string().min(1) })),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  requiredChecks: z.array(z.string().min(1)),
  evidencePolicy: z.object({ runtimeEvidenceRequired: z.boolean(), independentReviewRequired: z.boolean(), humanApprovalRequired: z.boolean() }),
  createdAt: z.string().datetime()
});

export type ChangeContract = z.infer<typeof ChangeContractSchema>;

export interface ReadinessSnapshot {
  workspaceFingerprint: string;
  acceptanceCriteriaPassed: string[];
  checksPassed: string[];
  evidenceFreshness: "current" | "stale" | "unknown";
  runtimeEvidence: boolean;
  independentReview: boolean;
  humanApproval: boolean;
  blockers: string[];
}

export interface ReadinessVerdict {
  schemaVersion: "soturail.readiness.verdict.v1";
  verdict: "ready" | "not-ready";
  reasons: string[];
  /** Same reasons with stable codes (additive in v1.6). */
  details: TrustReason[];
  evaluatedAt: string;
}

export interface EvidenceBackedSnapshot extends ReadinessSnapshot {
  /** How each required check was satisfied or not, from recorded runs only. */
  checkEvidence: Array<{ check: string; state: "current-pass" | "current-fail" | "stale" | "missing"; rawId?: string }>;
  /** Assertions the caller made; recorded for audit, never counted as evidence. */
  assertions: { criteria: string[]; checks: string[]; source: "caller" };
}

export interface DualGateVerdict {
  schemaVersion: "soturail.dual-gate.v1";
  authority: GovernanceVerdict["verdict"];
  readiness: ReadinessVerdict["verdict"];
  verdict: "allow" | "deny";
  reasons: string[];
}

export async function createChangeContract(input: Omit<ChangeContract, "schemaVersion" | "workspaceFingerprint" | "createdAt">, root = process.cwd()): Promise<ChangeContract> {
  const workspace = await createWorkspaceFingerprint(root);
  return ChangeContractSchema.parse({ ...input, schemaVersion: "soturail.change-contract.v1", workspaceFingerprint: workspace.fingerprint, createdAt: new Date().toISOString() });
}

export function evaluateReadiness(contract: ChangeContract, snapshot: ReadinessSnapshot): ReadinessVerdict {
  const details: TrustReason[] = snapshot.blockers.map((message) => reason(message.startsWith("Asserted check") ? "check_asserted_without_evidence" : "blocker", message));
  if (contract.workspaceFingerprint !== snapshot.workspaceFingerprint) details.push(reason("workspace_stale", "Contract workspace fingerprint is stale."));
  if (snapshot.evidenceFreshness !== "current") details.push(reason(snapshot.evidenceFreshness === "stale" ? "evidence_stale" : "evidence_missing", `Evidence freshness is ${snapshot.evidenceFreshness}.`));
  for (const criterion of contract.acceptanceCriteria) if (!snapshot.acceptanceCriteriaPassed.includes(criterion)) details.push(reason("criterion_unsatisfied", `Acceptance criterion not satisfied: ${criterion}`, criterion));
  for (const check of contract.requiredChecks) if (!snapshot.checksPassed.includes(check)) details.push(reason("check_missing", `Required check missing: ${check}`, check));
  if (contract.evidencePolicy.runtimeEvidenceRequired && !snapshot.runtimeEvidence) details.push(reason("runtime_evidence_required", "Runtime evidence is required."));
  if (contract.evidencePolicy.independentReviewRequired && !snapshot.independentReview) details.push(reason("independent_review_required", "Independent review is required."));
  if (contract.evidencePolicy.humanApprovalRequired && !snapshot.humanApproval) details.push(reason("human_approval_required", "Human approval is required."));
  const passed = details.length === 0;
  const final = passed ? [reason("passed", "All deterministic readiness requirements passed.")] : details;
  return { schemaVersion: "soturail.readiness.verdict.v1", verdict: passed ? "ready" : "not-ready", reasons: final.map((item) => item.message), details: final, evaluatedAt: new Date().toISOString() };
}

/**
 * Build the readiness snapshot from recorded evidence instead of caller claims.
 * A required check counts only when the latest recorded run of exactly that
 * command exited 0 against the current workspace fingerprint. Caller-asserted
 * checks that recorded evidence does not corroborate become blockers.
 */
export async function buildReadinessSnapshot(
  contract: ChangeContract,
  root = process.cwd(),
  attested: { criteria?: string[]; checks?: string[]; runtimeEvidence?: boolean; independentReview?: boolean; humanApproval?: boolean } = {}
): Promise<EvidenceBackedSnapshot> {
  const workspace = await createWorkspaceFingerprint(root);
  const runs = await readJsonl<RawRunRecord>(getWorkspacePaths(root).rawIndex);
  const latestRun = (check: string) => [...runs].reverse().find((run) => normalizeCommand(run.command) === normalizeCommand(check));
  const checkEvidence = contract.requiredChecks.map((check) => {
    const run = latestRun(check);
    if (!run) return { check, state: "missing" as const };
    if (run.workspace_fingerprint !== workspace.fingerprint) return { check, state: "stale" as const, rawId: run.raw_id };
    return { check, state: run.exit_code === 0 ? "current-pass" as const : "current-fail" as const, rawId: run.raw_id };
  });
  const checksPassed = checkEvidence.filter((item) => item.state === "current-pass").map((item) => item.check);
  const blockers = [
    ...checkEvidence.filter((item) => item.state === "current-fail").map((item) => `Required check failed in recorded run ${item.rawId}: ${item.check}`),
    ...(attested.checks ?? []).filter((check) => !checksPassed.some((passed) => normalizeCommand(passed) === normalizeCommand(check))).map((check) => `Asserted check has no current recorded passing run: ${check}`)
  ];
  const evidenceFreshness = checkEvidence.some((item) => item.state === "stale") ? "stale" : checkEvidence.every((item) => item.state.startsWith("current")) ? "current" : "unknown";
  return {
    workspaceFingerprint: workspace.fingerprint,
    acceptanceCriteriaPassed: attested.criteria ?? [],
    checksPassed,
    evidenceFreshness,
    runtimeEvidence: attested.runtimeEvidence === true,
    independentReview: attested.independentReview === true,
    humanApproval: attested.humanApproval === true,
    blockers,
    checkEvidence,
    assertions: { criteria: attested.criteria ?? [], checks: attested.checks ?? [], source: "caller" }
  };
}

function normalizeCommand(command: string): string {
  return command.trim().replace(/\s+/g, " ");
}

export function evaluateDualGate(authority: GovernanceVerdict, readiness: ReadinessVerdict): DualGateVerdict {
  const allow = authority.verdict === "allow" && readiness.verdict === "ready";
  return {
    schemaVersion: "soturail.dual-gate.v1",
    authority: authority.verdict,
    readiness: readiness.verdict,
    verdict: allow ? "allow" : "deny",
    reasons: allow ? ["Authority and readiness gates passed."] : [...authority.reasons, ...readiness.reasons]
  };
}

export function changeContractDigest(contract: ChangeContract): string {
  return createHash("sha256").update(canonicalJson(contract)).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
