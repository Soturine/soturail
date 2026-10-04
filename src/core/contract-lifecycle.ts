import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { artifactStore } from "./artifact-store.js";
import { ChangeContractSchema, contractFoundationDigest, createChangeContract, digestSources, type ChangeContract, type ChangeContractInput, type ReadinessSnapshot } from "./change-contract.js";
import { ensureWorkspace, getWorkspacePaths, readJsonl } from "./config.js";
import type { RawRunRecord } from "./raw-store.js";
import { reason, type TrustReason } from "./trust-decision.js";
import { createWorkspaceFingerprint } from "./workspace-fingerprint.js";
import { WorkspaceGuard } from "./workspace-guard.js";

const execFileAsync = promisify(execFile);

// Contract lifecycle: the baseline is immutable provenance; readiness evaluates
// the current workspace. Revisions preserve lineage instead of mutating files.
// Caller flags are assertions; only recorded runs and human receipts satisfy
// readiness.

export type AttestationKind = "human-approval" | "independent-review" | "criterion";

export const AttestationReceiptSchema = z.strictObject({
  schemaVersion: z.literal("soturail.contract-attestation.v1"),
  kind: z.enum(["human-approval", "independent-review", "criterion"]),
  contractId: z.string().min(1),
  contractRevision: z.number().int().positive(),
  contractFoundationDigest: z.string().regex(/^[a-f0-9]{64}$/),
  workspaceFingerprint: z.string().min(1),
  by: z.string().min(1),
  criterion: z.string().min(1).optional(),
  method: z.literal("interactive-cli-confirmation"),
  attestedAt: z.string().datetime()
});
export type AttestationReceipt = z.infer<typeof AttestationReceiptSchema>;

/** How each caller-controlled readiness input is classified. */
export const READINESS_INPUT_CLASSES = {
  "--check-passed": "UNVERIFIED_ASSERTION",
  "--criterion-passed": "UNVERIFIED_ASSERTION",
  "--runtime-evidence": "UNVERIFIED_ASSERTION",
  "--independent-review": "UNVERIFIED_ASSERTION",
  "--human-approved": "UNVERIFIED_ASSERTION",
  "recorded soturail run": "RECORDED_EVIDENCE",
  "contract attest (interactive)": "HUMAN_ATTESTATION",
  "soturail candidates record": "AGENT_CANDIDATE"
} as const;

export interface ContractIntegrity {
  state: "intact" | "revision-required" | "legacy";
  reasons: TrustReason[];
  changedFiles?: string[];
}

export interface LifecycleSnapshot extends ReadinessSnapshot {
  baselineWorkspaceFingerprint: string;
  integrity: ContractIntegrity;
  checkEvidence: Array<{ check: string; state: "current-pass" | "current-fail" | "stale" | "missing"; rawId?: string }>;
  satisfiedBy: { criteria: Record<string, "recorded-evidence" | "human-attestation">; runtimeEvidence: string[]; independentReview: string | null; humanApproval: string | null };
  assertions: { criteria: string[]; checks: string[]; runtimeEvidence: boolean; independentReview: boolean; humanApproval: boolean; source: "caller" };
}

export interface CallerAssertions {
  criteria?: string[];
  checks?: string[];
  runtimeEvidence?: boolean;
  independentReview?: boolean;
  humanApproval?: boolean;
}

export async function readContractFile(file: string, root = process.cwd()): Promise<{ contract: ChangeContract; path: string }> {
  const guard = new WorkspaceGuard(root);
  const absolute = await guard.assertAllowedRead(file);
  return { contract: ChangeContractSchema.parse(JSON.parse(await fs.readFile(absolute, "utf8"))), path: await guard.projectRelative(absolute) };
}

export function contractRevisionPath(id: string, revision: number): string {
  return revision <= 1 ? `${id}.json` : `${id}.r${revision}.json`;
}

/** Detect foundation changes that require a revision. A baseline != current workspace alone is not one. */
export async function contractIntegrity(contract: ChangeContract, root = process.cwd()): Promise<ContractIntegrity> {
  if (!contract.foundationDigest) {
    return { state: "legacy", reasons: [] };
  }
  const reasons: TrustReason[] = [];
  if (contract.foundationDigest !== contractFoundationDigest(contract)) reasons.push(reason("contract_modified", "Contract foundation was edited after creation; create a revision with `soturail contract revise`."));
  for (const source of contract.foundationSources ?? []) {
    const current = await digestSources([source.path], root).then((items) => items[0]?.sha256).catch(() => null);
    if (current !== source.sha256) reasons.push(reason("contract_source_changed", `Contract source ${current === null ? "is missing" : "changed"}: ${source.path}`, source.path));
  }
  let changedFiles: string[] | undefined;
  if (contract.scope?.length) {
    if (!contract.baselineHead) {
      reasons.push(reason("contract_scope_unverifiable", "Scope is declared but the contract has no baseline commit to diff against."));
    } else {
      changedFiles = await filesChangedSince(contract.baselineHead, root);
      const scope = contract.scope.map((item) => item.replace(/\\/g, "/").replace(/\/+$/, ""));
      const outside = changedFiles.filter((file) => !scope.some((prefix) => file === prefix || file.startsWith(`${prefix}/`)));
      for (const file of outside) reasons.push(reason("contract_scope_exceeded", `Change outside contract scope: ${file}`, file));
    }
  }
  const superseding = await findSupersedingRevision(contract, root);
  if (superseding) reasons.push(reason("contract_superseded", `Revision ${contract.revision ?? 1} is superseded by ${superseding}.`, superseding));
  return { state: reasons.length ? "revision-required" : "intact", reasons, ...(changedFiles ? { changedFiles } : {}) };
}

/**
 * Create a new revision with lineage. The previous revision file is never
 * modified; the new revision gets a fresh baseline at the current workspace.
 */
export async function reviseChangeContract(previous: ChangeContract, changes: Partial<ChangeContractInput>, revisionReason: string, root = process.cwd()): Promise<{ contract: ChangeContract; path: string }> {
  if (!revisionReason.trim()) throw new Error("A revision requires a reason.");
  const previousRevision = previous.revision ?? 1;
  const nextRevision = (await latestRevision(previous.id, root)) + 1;
  const keepSources = (previous.foundationSources ?? []).map((item) => item.path);
  const input: ChangeContractInput = {
    id: previous.id,
    title: changes.title ?? previous.title,
    intent: changes.intent ?? previous.intent,
    risk: changes.risk ?? previous.risk,
    decisions: changes.decisions ?? previous.decisions,
    acceptanceCriteria: changes.acceptanceCriteria ?? previous.acceptanceCriteria,
    requiredChecks: changes.requiredChecks ?? previous.requiredChecks,
    evidencePolicy: changes.evidencePolicy ?? previous.evidencePolicy,
    ...(changes.scope ?? previous.scope ? { scope: changes.scope ?? previous.scope ?? [] } : {}),
    ...(changes.runtimeChecks ?? previous.runtimeChecks ? { runtimeChecks: changes.runtimeChecks ?? previous.runtimeChecks ?? [] } : {}),
    ...(changes.criteriaEvidence ?? previous.criteriaEvidence ? { criteriaEvidence: changes.criteriaEvidence ?? previous.criteriaEvidence ?? {} } : {}),
    ...((changes.sources ?? keepSources).length ? { sources: changes.sources ?? keepSources } : {})
  };
  const contract = await createChangeContract(input, root, {
    revision: nextRevision,
    revisionReason,
    supersedes: {
      revision: previousRevision,
      path: `.soturail/contracts/${contractRevisionPath(previous.id, previousRevision)}`,
      foundationDigest: previous.foundationDigest ?? contractFoundationDigest(previous),
      baselineWorkspaceFingerprint: previous.workspaceFingerprint
    }
  });
  const target = path.join(getWorkspacePaths(root).contractsDir, contractRevisionPath(contract.id, nextRevision));
  await fs.mkdir(path.dirname(target), { recursive: true });
  // `wx`: a revision file is written once and never overwritten.
  await fs.writeFile(target, `${JSON.stringify(ChangeContractSchema.parse(contract), null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  return { contract, path: `.soturail/contracts/${contractRevisionPath(contract.id, nextRevision)}` };
}

/**
 * Record a human attestation receipt. Only an interactive human channel may
 * create one; MCP and non-interactive callers are refused. The receipt binds
 * the contract foundation and the current workspace, so any later change makes
 * it stale.
 */
export async function recordContractAttestation(
  contract: ChangeContract,
  input: { kind: AttestationKind; by: string; criterion?: string },
  root = process.cwd(),
  channel: { interactive: boolean; confirmedContractId?: string }
): Promise<{ receipt: AttestationReceipt; path: string }> {
  if (!channel.interactive) throw new Error("Human attestations require an interactive terminal; agents and non-interactive callers cannot create them.");
  if (channel.confirmedContractId !== contract.id) throw new Error("Attestation not confirmed: type the exact contract id to confirm.");
  if (!input.by.trim()) throw new Error("Attestation requires --by <name>.");
  if (input.kind === "criterion" && (!input.criterion || !contract.acceptanceCriteria.includes(input.criterion))) throw new Error("Criterion attestation requires one of the contract's acceptance criteria.");
  await ensureWorkspace(root);
  const workspace = await createWorkspaceFingerprint(root);
  const receipt = AttestationReceiptSchema.parse({
    schemaVersion: "soturail.contract-attestation.v1",
    kind: input.kind,
    contractId: contract.id,
    contractRevision: contract.revision ?? 1,
    contractFoundationDigest: contract.foundationDigest ?? contractFoundationDigest(contract),
    workspaceFingerprint: workspace.fingerprint,
    by: input.by.trim(),
    ...(input.criterion ? { criterion: input.criterion } : {}),
    method: "interactive-cli-confirmation",
    attestedAt: new Date().toISOString()
  });
  const name = `contract-${contract.id}-r${receipt.contractRevision}-${receipt.kind}-${createHash("sha256").update(JSON.stringify(receipt)).digest("hex").slice(0, 12)}.json`;
  const target = path.join(getWorkspacePaths(root).receiptsDir, name);
  await artifactStore.writeJson(target, receipt);
  return { receipt, path: `.soturail/receipts/${name}` };
}

/** Build readiness inputs from recorded runs, human receipts and contract integrity only. */
export async function buildReadinessSnapshot(contract: ChangeContract, root = process.cwd(), asserted: CallerAssertions = {}): Promise<LifecycleSnapshot> {
  const workspace = await createWorkspaceFingerprint(root);
  const runs = await readJsonl<RawRunRecord>(getWorkspacePaths(root).rawIndex);
  const runState = (command: string) => {
    const run = [...runs].reverse().find((item) => normalizeCommand(item.command) === normalizeCommand(command));
    if (!run) return { check: command, state: "missing" as const };
    if (run.workspace_fingerprint !== workspace.fingerprint) return { check: command, state: "stale" as const, rawId: run.raw_id };
    return { check: command, state: run.exit_code === 0 ? "current-pass" as const : "current-fail" as const, rawId: run.raw_id };
  };
  const passes = (command: string) => runState(command).state === "current-pass";

  const checkEvidence = contract.requiredChecks.map(runState);
  const runtimeEvidence = (contract.runtimeChecks ?? []).map(runState);
  const criteriaCommands = Object.values(contract.criteriaEvidence ?? {}).flat().map(runState);
  const receipts = await currentReceipts(contract, workspace.fingerprint, root);

  const satisfiedCriteria: LifecycleSnapshot["satisfiedBy"]["criteria"] = {};
  for (const criterion of contract.acceptanceCriteria) {
    const commands = contract.criteriaEvidence?.[criterion] ?? [];
    if (commands.length > 0 && commands.every(passes)) satisfiedCriteria[criterion] = "recorded-evidence";
    else if (receipts.some((item) => item.kind === "criterion" && item.criterion === criterion)) satisfiedCriteria[criterion] = "human-attestation";
  }
  const runtimeSatisfied = (contract.runtimeChecks ?? []).length > 0 && runtimeEvidence.every((item) => item.state === "current-pass");
  const review = receipts.find((item) => item.kind === "independent-review") ?? null;
  const approval = receipts.find((item) => item.kind === "human-approval") ?? null;
  const integrity = await contractIntegrity(contract, root);

  const checksPassed = checkEvidence.filter((item) => item.state === "current-pass").map((item) => item.check);
  const blockerDetails: TrustReason[] = [
    ...integrity.reasons,
    ...[...checkEvidence, ...runtimeEvidence, ...criteriaCommands].filter((item) => item.state === "current-fail").map((item) => reason("check_failed", `Recorded run ${item.rawId} failed: ${item.check}`, item.check)),
    ...(asserted.checks ?? []).filter((check) => !checksPassed.some((item) => normalizeCommand(item) === normalizeCommand(check))).map((check) => reason("check_asserted_without_evidence", `Asserted check has no current recorded passing run: ${check}`, check)),
    ...(asserted.criteria ?? []).filter((criterion) => !satisfiedCriteria[criterion]).map((criterion) => reason("criterion_asserted_without_evidence", `Asserted criterion has no recorded evidence or human attestation: ${criterion}`, criterion)),
    ...(asserted.runtimeEvidence && !runtimeSatisfied ? [reason("runtime_asserted_without_evidence", "Runtime evidence was asserted but no declared runtime check has a current passing run.")] : []),
    ...(asserted.independentReview && !review ? [reason("review_asserted_without_receipt", "Independent review was asserted without an attributable review receipt.")] : []),
    ...(asserted.humanApproval && !approval ? [reason("human_approval_asserted_without_receipt", "Human approval was asserted without a human attestation receipt.")] : [])
  ];
  const evidenceStates = [...checkEvidence, ...runtimeEvidence, ...criteriaCommands].map((item) => item.state);
  const evidenceFreshness = evidenceStates.includes("stale") ? "stale" : evidenceStates.every((state) => state.startsWith("current")) ? "current" : "unknown";
  return {
    workspaceFingerprint: workspace.fingerprint,
    baselineWorkspaceFingerprint: contract.workspaceFingerprint,
    acceptanceCriteriaPassed: Object.keys(satisfiedCriteria),
    checksPassed,
    evidenceFreshness,
    runtimeEvidence: runtimeSatisfied,
    independentReview: review !== null,
    humanApproval: approval !== null,
    blockers: blockerDetails.map((item) => item.message),
    blockerDetails,
    integrity,
    checkEvidence,
    satisfiedBy: { criteria: satisfiedCriteria, runtimeEvidence: runtimeSatisfied ? contract.runtimeChecks ?? [] : [], independentReview: review?.by ?? null, humanApproval: approval?.by ?? null },
    assertions: { criteria: asserted.criteria ?? [], checks: asserted.checks ?? [], runtimeEvidence: asserted.runtimeEvidence === true, independentReview: asserted.independentReview === true, humanApproval: asserted.humanApproval === true, source: "caller" }
  };
}

async function currentReceipts(contract: ChangeContract, fingerprint: string, root: string): Promise<AttestationReceipt[]> {
  const dir = getWorkspacePaths(root).receiptsDir;
  const digest = contract.foundationDigest ?? contractFoundationDigest(contract);
  const receipts: AttestationReceipt[] = [];
  for (const entry of await fs.readdir(dir).catch(() => [] as string[])) {
    if (!entry.startsWith(`contract-${contract.id}-`) || !entry.endsWith(".json")) continue;
    const parsed = AttestationReceiptSchema.safeParse(JSON.parse(await fs.readFile(path.join(dir, entry), "utf8").catch(() => "null")));
    if (!parsed.success) continue;
    const receipt = parsed.data;
    // Bound to this exact contract revision/foundation and to the current workspace.
    if (receipt.contractRevision === (contract.revision ?? 1) && receipt.contractFoundationDigest === digest && receipt.workspaceFingerprint === fingerprint) receipts.push(receipt);
  }
  return receipts;
}

async function latestRevision(id: string, root: string): Promise<number> {
  let latest = 0;
  for (const entry of await fs.readdir(getWorkspacePaths(root).contractsDir).catch(() => [] as string[])) {
    if (entry === `${id}.json`) latest = Math.max(latest, 1);
    const match = new RegExp(`^${escapeRegExp(id)}\\.r(\\d+)\\.json$`).exec(entry);
    if (match?.[1]) latest = Math.max(latest, Number(match[1]));
  }
  return Math.max(latest, 1);
}

async function findSupersedingRevision(contract: ChangeContract, root: string): Promise<string | null> {
  const dir = getWorkspacePaths(root).contractsDir;
  const revision = contract.revision ?? 1;
  for (const entry of await fs.readdir(dir).catch(() => [] as string[])) {
    if (!entry.startsWith(`${contract.id}.r`) || !entry.endsWith(".json")) continue;
    const parsed = ChangeContractSchema.safeParse(JSON.parse(await fs.readFile(path.join(dir, entry), "utf8").catch(() => "null")));
    if (parsed.success && parsed.data.id === contract.id && parsed.data.supersedes?.revision === revision) return `.soturail/contracts/${entry}`;
  }
  return null;
}

async function filesChangedSince(baselineHead: string, root: string): Promise<string[]> {
  const run = async (args: string[]) => (await execFileAsync("git", args, { cwd: root, windowsHide: true, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })).stdout;
  const tracked = await run(["diff", "--name-only", "-z", baselineHead]);
  const untracked = await run(["ls-files", "--others", "--exclude-standard", "-z"]);
  return [...new Set(`${tracked}\0${untracked}`.split("\0").filter(Boolean).map((file) => file.replace(/\\/g, "/")))]
    .filter((file) => !file.startsWith(".soturail/"))
    .sort();
}

function normalizeCommand(command: string): string {
  return command.trim().replace(/\s+/g, " ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
