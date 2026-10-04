import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { z } from "zod";
import type { GovernanceVerdict } from "./governance.js";
import { reason, type TrustReason } from "./trust-decision.js";
import { createWorkspaceFingerprint } from "./workspace-fingerprint.js";
import { WorkspaceGuard } from "./workspace-guard.js";

const SourceDigestSchema = z.object({ path: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/) });

export const ChangeContractSchema = z.object({
  schemaVersion: z.literal("soturail.change-contract.v1"),
  id: z.string().min(1),
  title: z.string().min(1),
  intent: z.string().min(1),
  risk: z.enum(["low", "medium", "high", "critical"]),
  /** Baseline: the workspace the contract (revision) was created against. Immutable provenance, not a freshness gate. */
  workspaceFingerprint: z.string().min(1),
  decisions: z.array(z.object({ id: z.string().min(1), decision: z.string().min(1), rationale: z.string().min(1) })),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  requiredChecks: z.array(z.string().min(1)),
  evidencePolicy: z.object({ runtimeEvidenceRequired: z.boolean(), independentReviewRequired: z.boolean(), humanApprovalRequired: z.boolean() }),
  createdAt: z.string().datetime(),
  // v1.6 lifecycle fields (optional so v1.5 contracts stay valid).
  revision: z.number().int().positive().optional(),
  baselineHead: z.string().min(1).optional(),
  /** Digest of the contract's foundation (intent, criteria, checks, risk, scope, sources, lineage). */
  foundationDigest: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  /** Requirement/source files the contract is based on, with digests at baseline. */
  foundationSources: z.array(SourceDigestSchema).optional(),
  /** Project-relative path prefixes the change set is expected to touch. */
  scope: z.array(z.string().min(1)).optional(),
  /** Commands whose current passing runs constitute runtime evidence. */
  runtimeChecks: z.array(z.string().min(1)).optional(),
  /** Objective acceptance criteria mapped to the commands that prove them. */
  criteriaEvidence: z.record(z.string(), z.array(z.string().min(1))).optional(),
  supersedes: z.object({ revision: z.number().int().positive(), path: z.string().min(1), foundationDigest: z.string().min(1), baselineWorkspaceFingerprint: z.string().min(1) }).optional(),
  revisionReason: z.string().min(1).optional()
});

export type ChangeContract = z.infer<typeof ChangeContractSchema>;

export interface ReadinessSnapshot {
  /** The workspace actually verified (current), not the contract baseline. */
  workspaceFingerprint: string;
  acceptanceCriteriaPassed: string[];
  checksPassed: string[];
  evidenceFreshness: "current" | "stale" | "unknown";
  runtimeEvidence: boolean;
  independentReview: boolean;
  humanApproval: boolean;
  blockers: string[];
  /** Coded blockers; when present they are used instead of mapping `blockers` strings. */
  blockerDetails?: TrustReason[];
}

export interface ReadinessVerdict {
  schemaVersion: "soturail.readiness.verdict.v1";
  verdict: "ready" | "not-ready";
  reasons: string[];
  /** Same reasons with stable codes (additive in v1.6). */
  details: TrustReason[];
  evaluatedAt: string;
  baselineWorkspaceFingerprint?: string;
  verifiedWorkspaceFingerprint?: string;
}

export interface DualGateVerdict {
  schemaVersion: "soturail.dual-gate.v1";
  authority: GovernanceVerdict["verdict"];
  readiness: ReadinessVerdict["verdict"];
  verdict: "allow" | "deny";
  reasons: string[];
}

export type ChangeContractInput = Omit<ChangeContract, "schemaVersion" | "workspaceFingerprint" | "createdAt" | "revision" | "baselineHead" | "foundationDigest" | "foundationSources" | "supersedes" | "revisionReason"> & {
  /** Project-relative requirement/source files to bind by digest. */
  sources?: string[];
};

export async function createChangeContract(input: ChangeContractInput, root = process.cwd(), lineage: { revision?: number; supersedes?: ChangeContract["supersedes"]; revisionReason?: string } = {}): Promise<ChangeContract> {
  const { sources, ...fields } = input;
  const workspace = await createWorkspaceFingerprint(root);
  const draft = ChangeContractSchema.parse({
    ...fields,
    schemaVersion: "soturail.change-contract.v1",
    workspaceFingerprint: workspace.fingerprint,
    createdAt: new Date().toISOString(),
    revision: lineage.revision ?? 1,
    ...(workspace.head && workspace.head !== "UNAVAILABLE" ? { baselineHead: workspace.head } : {}),
    ...(sources?.length ? { foundationSources: await digestSources(sources, root) } : {}),
    ...(lineage.supersedes ? { supersedes: lineage.supersedes } : {}),
    ...(lineage.revisionReason ? { revisionReason: lineage.revisionReason } : {})
  });
  return { ...draft, foundationDigest: contractFoundationDigest(draft) };
}

/** Digest of what the contract promises; editing any of it requires a revision. */
export function contractFoundationDigest(contract: ChangeContract): string {
  const foundation = {
    id: contract.id,
    title: contract.title,
    intent: contract.intent,
    risk: contract.risk,
    decisions: contract.decisions,
    acceptanceCriteria: contract.acceptanceCriteria,
    requiredChecks: contract.requiredChecks,
    evidencePolicy: contract.evidencePolicy,
    scope: contract.scope ?? [],
    runtimeChecks: contract.runtimeChecks ?? [],
    criteriaEvidence: contract.criteriaEvidence ?? {},
    foundationSources: contract.foundationSources ?? [],
    revision: contract.revision ?? 1,
    supersedes: contract.supersedes ?? null,
    baselineWorkspaceFingerprint: contract.workspaceFingerprint
  };
  return createHash("sha256").update(canonicalJson(foundation)).digest("hex");
}

export async function digestSources(sources: string[], root: string): Promise<Array<{ path: string; sha256: string }>> {
  const guard = new WorkspaceGuard(root);
  const result: Array<{ path: string; sha256: string }> = [];
  for (const source of sources) {
    const file = await guard.assertAllowedRead(source);
    result.push({ path: (await guard.projectRelative(file)), sha256: createHash("sha256").update(await fs.readFile(file)).digest("hex") });
  }
  return result;
}

/**
 * Readiness evaluates the current (verified) workspace. A baseline that differs
 * from the current workspace is the change set itself, not a blocker; foundation
 * changes surface as coded blockers from the lifecycle snapshot builder.
 */
export function evaluateReadiness(contract: ChangeContract, snapshot: ReadinessSnapshot): ReadinessVerdict {
  const details: TrustReason[] = snapshot.blockerDetails
    ? [...snapshot.blockerDetails]
    : snapshot.blockers.map((message) => reason(message.startsWith("Asserted check") ? "check_asserted_without_evidence" : "blocker", message));
  if (snapshot.evidenceFreshness !== "current") details.push(reason(snapshot.evidenceFreshness === "stale" ? "evidence_stale" : "evidence_missing", `Evidence freshness is ${snapshot.evidenceFreshness}.`));
  for (const criterion of contract.acceptanceCriteria) if (!snapshot.acceptanceCriteriaPassed.includes(criterion)) details.push(reason("criterion_unsatisfied", `Acceptance criterion not satisfied: ${criterion}`, criterion));
  for (const check of contract.requiredChecks) if (!snapshot.checksPassed.includes(check)) details.push(reason("check_missing", `Required check missing: ${check}`, check));
  if (contract.evidencePolicy.runtimeEvidenceRequired && !snapshot.runtimeEvidence) details.push(reason("runtime_evidence_required", "Runtime evidence is required."));
  if (contract.evidencePolicy.independentReviewRequired && !snapshot.independentReview) details.push(reason("independent_review_required", "Independent review is required."));
  if (contract.evidencePolicy.humanApprovalRequired && !snapshot.humanApproval) details.push(reason("human_approval_required", "Human approval is required."));
  const passed = details.length === 0;
  const final = passed ? [reason("passed", "All deterministic readiness requirements passed.")] : details;
  return {
    schemaVersion: "soturail.readiness.verdict.v1",
    verdict: passed ? "ready" : "not-ready",
    reasons: final.map((item) => item.message),
    details: final,
    evaluatedAt: new Date().toISOString(),
    baselineWorkspaceFingerprint: contract.workspaceFingerprint,
    verifiedWorkspaceFingerprint: snapshot.workspaceFingerprint
  };
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
