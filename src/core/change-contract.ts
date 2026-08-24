import { createHash } from "node:crypto";
import { z } from "zod";
import type { GovernanceVerdict } from "./governance.js";
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
  evaluatedAt: string;
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
  const reasons = [...snapshot.blockers];
  if (contract.workspaceFingerprint !== snapshot.workspaceFingerprint) reasons.push("Contract workspace fingerprint is stale.");
  if (snapshot.evidenceFreshness !== "current") reasons.push(`Evidence freshness is ${snapshot.evidenceFreshness}.`);
  for (const criterion of contract.acceptanceCriteria) if (!snapshot.acceptanceCriteriaPassed.includes(criterion)) reasons.push(`Acceptance criterion not satisfied: ${criterion}`);
  for (const check of contract.requiredChecks) if (!snapshot.checksPassed.includes(check)) reasons.push(`Required check missing: ${check}`);
  if (contract.evidencePolicy.runtimeEvidenceRequired && !snapshot.runtimeEvidence) reasons.push("Runtime evidence is required.");
  if (contract.evidencePolicy.independentReviewRequired && !snapshot.independentReview) reasons.push("Independent review is required.");
  if (contract.evidencePolicy.humanApprovalRequired && !snapshot.humanApproval) reasons.push("Human approval is required.");
  return { schemaVersion: "soturail.readiness.verdict.v1", verdict: reasons.length === 0 ? "ready" : "not-ready", reasons: reasons.length ? reasons : ["All deterministic readiness requirements passed."], evaluatedAt: new Date().toISOString() };
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
