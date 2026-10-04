import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { executeRunCommand } from "../src/commands/run.js";
import { ChangeContractSchema, createChangeContract, evaluateReadiness, type ChangeContract, type ChangeContractInput } from "../src/core/change-contract.js";
import { ensureWorkspace, getWorkspacePaths } from "../src/core/config.js";
import { buildReadinessSnapshot, READINESS_INPUT_CLASSES, recordContractAttestation, reviseChangeContract } from "../src/core/contract-lifecycle.js";
import { listMcpTools } from "../src/core/mcp-tools.js";

const exec = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })));
});

const passCheck = `"${process.execPath}" -e "process.exit(0)"`;
const git = (root: string, args: string[]) => exec("git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: root });

async function committedProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-lifecycle-"));
  temporaryDirectories.push(root);
  await git(root, ["init", "-q"]);
  await fs.writeFile(path.join(root, ".gitignore"), ".soturail/\n");
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "auth.ts"), "export const ttl = 30;\n");
  await fs.writeFile(path.join(root, "docs", "spec.md"), "Sessions expire after 30 minutes.\n");
  await fs.writeFile(path.join(root, "README.md"), "# demo\n");
  await git(root, ["add", "-A"]);
  await git(root, ["commit", "-q", "-m", "baseline"]);
  await ensureWorkspace(root);
  return root;
}

function sink(): PassThrough {
  const stream = new PassThrough();
  stream.resume();
  return stream;
}

async function run(root: string, command = passCheck): Promise<void> {
  await executeRunCommand([command], { terminalStdout: sink(), terminalStderr: sink() }, root);
}

async function saveContract(root: string, overrides: Partial<ChangeContractInput> = {}): Promise<ChangeContract> {
  const contract = await createChangeContract({
    id: "auth-ttl",
    title: "Shorten session TTL",
    intent: "Sessions expire after 15 minutes",
    risk: "low",
    decisions: [],
    acceptanceCriteria: ["ttl is 15"],
    requiredChecks: [passCheck],
    criteriaEvidence: { "ttl is 15": [passCheck] },
    evidencePolicy: { runtimeEvidenceRequired: false, independentReviewRequired: false, humanApprovalRequired: false },
    scope: ["src"],
    sources: ["docs/spec.md"],
    ...overrides
  }, root);
  const file = path.join(getWorkspacePaths(root).contractsDir, "auth-ttl.json");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(ChangeContractSchema.parse(contract), null, 2));
  return contract;
}

const implement = (root: string) => fs.writeFile(path.join(root, "src", "auth.ts"), "export const ttl = 15;\n");

describe("contract baseline vs verification freshness", () => {
  it("1. contract at A, implementation to B, current evidence at B -> ready", async () => {
    const root = await committedProject();
    const contract = await saveContract(root);
    await implement(root);
    await run(root);
    const snapshot = await buildReadinessSnapshot(contract, root);
    const verdict = evaluateReadiness(contract, snapshot);
    expect(verdict.verdict).toBe("ready");
    expect(verdict.baselineWorkspaceFingerprint).toBe(contract.workspaceFingerprint);
    expect(verdict.verifiedWorkspaceFingerprint).not.toBe(contract.workspaceFingerprint);
    expect(snapshot.satisfiedBy.criteria).toEqual({ "ttl is 15": "recorded-evidence" });
  });

  it("2. evidence recorded at A does not count after the workspace moves to B", async () => {
    const root = await committedProject();
    const contract = await saveContract(root);
    await run(root);
    await implement(root);
    const snapshot = await buildReadinessSnapshot(contract, root);
    expect(snapshot.checkEvidence[0]?.state).toBe("stale");
    const verdict = evaluateReadiness(contract, snapshot);
    expect(verdict.verdict).toBe("not-ready");
    expect(verdict.details.map((item) => item.code)).toEqual(expect.arrayContaining(["evidence_stale", "check_missing", "criterion_unsatisfied"]));
  });

  it("3. foundation, source or scope changes require a revision", async () => {
    const root = await committedProject();
    const contract = await saveContract(root);
    await implement(root);
    await run(root);
    const edited = { ...contract, intent: "Sessions never expire" };
    expect((await buildReadinessSnapshot(edited, root)).integrity.reasons.map((item) => item.code)).toContain("contract_modified");

    await fs.writeFile(path.join(root, "docs", "spec.md"), "Sessions expire after 60 minutes.\n");
    await fs.writeFile(path.join(root, "README.md"), "# demo changed outside scope\n");
    await run(root);
    const snapshot = await buildReadinessSnapshot(contract, root);
    const codes = snapshot.integrity.reasons.map((item) => item.code);
    expect(snapshot.integrity.state).toBe("revision-required");
    expect(codes).toEqual(expect.arrayContaining(["contract_source_changed", "contract_scope_exceeded"]));
    expect(evaluateReadiness(contract, snapshot).verdict).toBe("not-ready");
  });

  it("4. a revision preserves lineage, never rewrites the original, and supersedes it", async () => {
    const root = await committedProject();
    const original = await saveContract(root);
    const originalFile = path.join(getWorkspacePaths(root).contractsDir, "auth-ttl.json");
    const before = await fs.readFile(originalFile, "utf8");
    await fs.writeFile(path.join(root, "docs", "spec.md"), "Sessions expire after 15 minutes.\n");
    const revised = await reviseChangeContract(original, { scope: ["src", "docs"] }, "Spec updated to the agreed 15 minute TTL", root);
    expect(await fs.readFile(originalFile, "utf8")).toBe(before);
    expect(revised.path).toBe(".soturail/contracts/auth-ttl.r2.json");
    expect(revised.contract).toMatchObject({
      revision: 2,
      revisionReason: "Spec updated to the agreed 15 minute TTL",
      supersedes: { revision: 1, path: ".soturail/contracts/auth-ttl.json", foundationDigest: original.foundationDigest, baselineWorkspaceFingerprint: original.workspaceFingerprint }
    });
    expect(revised.contract.workspaceFingerprint).not.toBe(original.workspaceFingerprint);
    // The superseded revision can no longer become ready.
    expect((await buildReadinessSnapshot(original, root)).integrity.reasons.map((item) => item.code)).toContain("contract_superseded");
    await expect(reviseChangeContract(original, {}, "", root)).rejects.toThrow(/reason/);
    await implement(root);
    await run(root);
    expect(evaluateReadiness(revised.contract, await buildReadinessSnapshot(revised.contract, root)).verdict).toBe("ready");
  });
});

describe("caller attestations are not trusted states", () => {
  it("classifies every caller flag as an unverified assertion", () => {
    for (const flag of ["--check-passed", "--criterion-passed", "--runtime-evidence", "--independent-review", "--human-approved"] as const) {
      expect(READINESS_INPUT_CLASSES[flag]).toBe("UNVERIFIED_ASSERTION");
    }
  });

  it("5. --human-approved without a human receipt cannot satisfy human approval", async () => {
    const root = await committedProject();
    const contract = await saveContract(root, { evidencePolicy: { runtimeEvidenceRequired: false, independentReviewRequired: false, humanApprovalRequired: true } });
    await implement(root);
    await run(root);
    const asserted = evaluateReadiness(contract, await buildReadinessSnapshot(contract, root, { humanApproval: true }));
    expect(asserted.verdict).toBe("not-ready");
    expect(asserted.details.map((item) => item.code)).toEqual(expect.arrayContaining(["human_approval_asserted_without_receipt", "human_approval_required"]));
    // Non-interactive callers (agents, MCP, scripts) cannot create receipts.
    await expect(recordContractAttestation(contract, { kind: "human-approval", by: "agent" }, root, { interactive: false, confirmedContractId: contract.id })).rejects.toThrow(/interactive/);
    await expect(recordContractAttestation(contract, { kind: "human-approval", by: "Ana" }, root, { interactive: true, confirmedContractId: "wrong" })).rejects.toThrow(/confirm/);
    expect(listMcpTools().some((tool) => /attest|approv/i.test(tool.name))).toBe(false);
    // A real interactive receipt satisfies it, bound to the current workspace.
    await recordContractAttestation(contract, { kind: "human-approval", by: "Ana" }, root, { interactive: true, confirmedContractId: contract.id });
    const approved = await buildReadinessSnapshot(contract, root);
    expect(approved.satisfiedBy.humanApproval).toBe("Ana");
    expect(evaluateReadiness(contract, approved).verdict).toBe("ready");
    // Any later change makes the approval stale.
    await fs.writeFile(path.join(root, "src", "auth.ts"), "export const ttl = 14;\n");
    await run(root);
    expect((await buildReadinessSnapshot(contract, root)).humanApproval).toBe(false);
  });

  it("6. --independent-review without an attributable receipt is not a verified review", async () => {
    const root = await committedProject();
    const contract = await saveContract(root, { evidencePolicy: { runtimeEvidenceRequired: false, independentReviewRequired: true, humanApprovalRequired: false } });
    await implement(root);
    await run(root);
    const verdict = evaluateReadiness(contract, await buildReadinessSnapshot(contract, root, { independentReview: true }));
    expect(verdict.details.map((item) => item.code)).toEqual(expect.arrayContaining(["review_asserted_without_receipt", "independent_review_required"]));
    // A forged receipt for another revision/foundation is ignored.
    const receipts = getWorkspacePaths(root).receiptsDir;
    await fs.mkdir(receipts, { recursive: true });
    await fs.writeFile(path.join(receipts, "contract-auth-ttl-r1-independent-review-forged.json"), JSON.stringify({ schemaVersion: "soturail.contract-attestation.v1", kind: "independent-review", contractId: "auth-ttl", contractRevision: 1, contractFoundationDigest: "0".repeat(64), workspaceFingerprint: "x", by: "agent", method: "interactive-cli-confirmation", attestedAt: new Date().toISOString() }));
    expect((await buildReadinessSnapshot(contract, root)).independentReview).toBe(false);
  });

  it("7. checks, runtime evidence and criteria cannot be self-asserted", async () => {
    const root = await committedProject();
    const contract = await saveContract(root, { runtimeChecks: [passCheck], criteriaEvidence: {}, evidencePolicy: { runtimeEvidenceRequired: true, independentReviewRequired: false, humanApprovalRequired: false } });
    await implement(root);
    const snapshot = await buildReadinessSnapshot(contract, root, { checks: [passCheck], criteria: ["ttl is 15"], runtimeEvidence: true });
    const codes = evaluateReadiness(contract, snapshot).details.map((item) => item.code);
    expect(codes).toEqual(expect.arrayContaining(["check_asserted_without_evidence", "criterion_asserted_without_evidence", "runtime_asserted_without_evidence", "check_missing", "criterion_unsatisfied", "runtime_evidence_required"]));
    expect(snapshot.assertions).toMatchObject({ checks: [passCheck], criteria: ["ttl is 15"], runtimeEvidence: true, source: "caller" });
    // A semantic criterion is satisfied only by a human attestation.
    await run(root);
    await recordContractAttestation(contract, { kind: "criterion", by: "Ana", criterion: "ttl is 15" }, root, { interactive: true, confirmedContractId: contract.id });
    const attested = await buildReadinessSnapshot(contract, root);
    expect(attested.satisfiedBy.criteria).toEqual({ "ttl is 15": "human-attestation" });
    expect(evaluateReadiness(contract, attested).verdict).toBe("ready");
  });
});
