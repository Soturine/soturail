import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { executeRunCommand } from "../src/commands/run.js";
import { recordCandidate } from "../src/core/candidate-store.js";
import { buildReadinessSnapshot, createChangeContract, evaluateReadiness, type ChangeContract } from "../src/core/change-contract.js";
import { collectEvidence } from "../src/core/evidence-provenance.js";
import { ensureWorkspace } from "../src/core/config.js";

const exec = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })));
});

async function gitProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-trust-"));
  temporaryDirectories.push(dir);
  await exec("git", ["init", "-q"], { cwd: dir });
  await fs.writeFile(path.join(dir, ".gitignore"), ".soturail/\n");
  await fs.writeFile(path.join(dir, "app.ts"), "export const ok = true;\n");
  // The SotuRail config file is part of the fingerprint; create it before binding contracts.
  await ensureWorkspace(dir);
  return dir;
}

function sink(): PassThrough {
  const stream = new PassThrough();
  stream.resume();
  return stream;
}

const passCheck = `"${process.execPath}" -e "process.exit(0)"`;
const failCheck = `"${process.execPath}" -e "process.exit(3)"`;

async function contractFor(root: string, checks: string[]): Promise<ChangeContract> {
  return createChangeContract({
    id: "c1",
    title: "Change",
    intent: "Prove readiness from evidence",
    risk: "low",
    decisions: [],
    acceptanceCriteria: ["works"],
    requiredChecks: checks,
    evidencePolicy: { runtimeEvidenceRequired: false, independentReviewRequired: false, humanApprovalRequired: false }
  }, root);
}

describe("readiness comes from recorded evidence, not assertions", () => {
  it("rejects a caller asserting a check it never ran", async () => {
    const root = await gitProject();
    const contract = await contractFor(root, [passCheck]);
    const snapshot = await buildReadinessSnapshot(contract, root, { criteria: ["works"], checks: [passCheck] });
    const verdict = evaluateReadiness(contract, snapshot);
    expect(verdict.verdict).toBe("not-ready");
    expect(verdict.details.map((item) => item.code)).toEqual(expect.arrayContaining(["check_asserted_without_evidence", "check_missing"]));
    expect(snapshot.checkEvidence).toEqual([{ check: passCheck, state: "missing" }]);
    expect(snapshot.assertions.source).toBe("caller");
  });

  it("becomes ready only after a recorded passing run against the current workspace", async () => {
    const root = await gitProject();
    const contract = await contractFor(root, [passCheck]);
    await executeRunCommand([passCheck], { terminalStdout: sink(), terminalStderr: sink() }, root);
    const verdict = evaluateReadiness(contract, await buildReadinessSnapshot(contract, root, { criteria: ["works"] }));
    expect(verdict).toMatchObject({ verdict: "ready", details: [{ code: "passed" }] });
  });

  it("blocks on a recorded failing run and goes stale when the workspace changes", async () => {
    const root = await gitProject();
    const failing = await contractFor(root, [failCheck]);
    await executeRunCommand([failCheck], { terminalStdout: sink(), terminalStderr: sink() }, root);
    const failed = evaluateReadiness(failing, await buildReadinessSnapshot(failing, root, { criteria: ["works"], checks: [failCheck] }));
    expect(failed.verdict).toBe("not-ready");
    expect(failed.reasons.join("\n")).toMatch(/Required check failed in recorded run/);

    const passing = await contractFor(root, [passCheck]);
    await executeRunCommand([passCheck], { terminalStdout: sink(), terminalStderr: sink() }, root);
    await fs.writeFile(path.join(root, "app.ts"), "export const ok = false;\n");
    const snapshot = await buildReadinessSnapshot(passing, root, { criteria: ["works"] });
    expect(snapshot.checkEvidence[0]?.state).toBe("stale");
    expect(evaluateReadiness(passing, snapshot).details.map((item) => item.code)).toEqual(expect.arrayContaining(["evidence_stale", "workspace_stale"]));
  });
});

describe("semantic output cannot satisfy verification", () => {
  it("keeps high-confidence candidates out of readiness and evidence status", async () => {
    const root = await gitProject();
    const contract = await contractFor(root, [passCheck]);
    await recordCandidate({
      kind: "claim",
      statementOriginal: "I ran the tests and they pass.",
      producer: { kind: "semantic-worker", host: "claude", skill: "soturail-change", capability: "command.run" },
      confidence: { level: "high", basis: "model-self-report" },
      verificationState: "unverified"
    }, root);
    expect(evaluateReadiness(contract, await buildReadinessSnapshot(contract, root, { criteria: ["works"] })).verdict).toBe("not-ready");
    const { evidence } = await collectEvidence(root);
    expect(evidence.status).toBe("unverified");
    expect(evidence.semanticCandidates).toMatchObject({ total: 1, countsAsEvidence: false, bySkill: { "soturail-change": 1 }, byCapability: { "command.run": 1 } });
    expect(evidence.warnings.join("\n")).toContain("candidates are context, not evidence");
  });
});
