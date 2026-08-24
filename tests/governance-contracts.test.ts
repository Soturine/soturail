import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { CAPABILITY_REGISTRY, capabilityRegistryDigest, createCapabilityEpoch } from "../src/core/capability-registry.js";
import { createChangeContract, evaluateDualGate, evaluateReadiness } from "../src/core/change-contract.js";
import { createSharedContextArtifact } from "../src/core/context-artifact.js";
import { createExecutionEnvelope, verifyExecutionEnvelope } from "../src/core/execution-envelope.js";
import { AgtAcsGovernanceProvider, NativeMinimalGovernanceProvider } from "../src/core/governance.js";
import { createRunWorkspace } from "../src/core/run-workspace.js";
import { createWorkspaceFingerprint } from "../src/core/workspace-fingerprint.js";

const exec = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("capability and governance foundations", () => {
  it("keeps stable unique capabilities and phase-scoped epochs", () => {
    expect(new Set(CAPABILITY_REGISTRY.map((item) => item.id)).size).toBe(CAPABILITY_REGISTRY.length);
    expect(capabilityRegistryDigest()).toMatch(/^[a-f0-9]{64}$/);
    expect(createCapabilityEpoch("plan").id).not.toBe(createCapabilityEpoch("release").id);
  });

  it("fails closed for unknown, rejected and approval-gated authority", async () => {
    const provider = new NativeMinimalGovernanceProvider();
    const base = { actor: { id: "codex", type: "agent" as const }, workspaceFingerprint: "workspace", payloadDigest: sha256("payload") };
    await expect(provider.evaluate("test", { ...base, capability: "project.read", approval: "not-required" })).resolves.toMatchObject({ verdict: "allow" });
    await expect(provider.evaluate("test", { ...base, capability: "unknown", approval: "not-required" })).resolves.toMatchObject({ verdict: "deny" });
    await expect(provider.evaluate("test", { ...base, capability: "command.run", approval: "missing" })).resolves.toMatchObject({ verdict: "deny" });
    await expect(provider.evaluate("test", { ...base, capability: "command.run", approval: "approved" })).resolves.toMatchObject({ verdict: "allow" });
    await expect(new AgtAcsGovernanceProvider().evaluate("test", { ...base, capability: "project.read", approval: "not-required" })).resolves.toMatchObject({ verdict: "unavailable" });
  });
});

describe("contracts, dual gate and execution envelope", () => {
  it("allows only when both authority and readiness pass", async () => {
    const root = await temporaryGitProject();
    const workspace = await createWorkspaceFingerprint(root);
    const contract = await createChangeContract({
      id: "chg-1",
      title: "Guarded read",
      intent: "Read a file safely",
      risk: "medium",
      decisions: [],
      acceptanceCriteria: ["guard passes"],
      requiredChecks: ["test"],
      evidencePolicy: { runtimeEvidenceRequired: false, independentReviewRequired: false, humanApprovalRequired: false }
    }, root);
    const authority = await new NativeMinimalGovernanceProvider().evaluate("execute", { actor: { id: "codex", type: "agent" }, capability: "project.read", workspaceFingerprint: workspace.fingerprint, approval: "not-required", payloadDigest: sha256("payload") });
    const ready = evaluateReadiness(contract, { workspaceFingerprint: workspace.fingerprint, acceptanceCriteriaPassed: ["guard passes"], checksPassed: ["test"], evidenceFreshness: "current", runtimeEvidence: false, independentReview: false, humanApproval: false, blockers: [] });
    const notReady = evaluateReadiness(contract, { workspaceFingerprint: workspace.fingerprint, acceptanceCriteriaPassed: [], checksPassed: [], evidenceFreshness: "stale", runtimeEvidence: false, independentReview: false, humanApproval: false, blockers: [] });

    expect(evaluateDualGate(authority, ready).verdict).toBe("allow");
    expect(evaluateDualGate(authority, notReady).verdict).toBe("deny");
    expect(evaluateDualGate({ ...authority, verdict: "deny" }, ready).verdict).toBe("deny");
  });

  it("attests only the exact evaluated payload digest", async () => {
    const root = await temporaryGitProject();
    const workspace = await createWorkspaceFingerprint(root);
    const contract = await createChangeContract({ id: "chg-2", title: "Exact action", intent: "Bind evaluation to execution", risk: "high", decisions: [], acceptanceCriteria: ["digest match"], requiredChecks: [], evidencePolicy: { runtimeEvidenceRequired: false, independentReviewRequired: false, humanApprovalRequired: false } }, root);
    const governance = await new NativeMinimalGovernanceProvider().evaluate("execute", { actor: { id: "codex", type: "agent" }, capability: "project.read", workspaceFingerprint: workspace.fingerprint, approval: "not-required", payloadDigest: sha256("placeholder") });
    const payload = { file: "README.md", mode: "read" };
    const envelope = createExecutionEnvelope({ runId: "run-1", phase: "implement", actor: { id: "codex", type: "agent" }, capability: "project.read", payload, workspaceFingerprint: workspace.fingerprint, contract, governance });

    expect(verifyExecutionEnvelope(envelope, payload)).toMatchObject({ valid: true, status: "ATTESTED" });
    expect(verifyExecutionEnvelope(envelope, { ...payload, file: ".env" })).toMatchObject({ valid: false, status: "NOT_ATTESTED" });
  });
});

describe("bounded context and run manifests", () => {
  it("enforces a hard byte budget and records truncation", async () => {
    const root = await temporaryGitProject();
    const workspace = await createWorkspaceFingerprint(root);
    const artifact = createSharedContextArtifact([
      { id: "large", content: "x".repeat(1000), priority: 10, classification: "COMPRESSIBLE" },
      { id: "footer", content: "dynamic-footer", priority: 1000, classification: "LOSSLESS_ONLY" }
    ], workspace, { maxBytes: 200, maxTokens: 1000 });
    expect(Buffer.byteLength(artifact.payload)).toBeLessThanOrEqual(200);
    expect(artifact.budget.hardLimitRespected).toBe(true);
    expect(artifact.selected.some((item) => item.id === "large" && item.truncated)).toBe(true);
    expect(artifact.payload.endsWith("dynamic-footer")).toBe(true);
  });

  it("writes a run manifest with explicit unknown states and capability epoch", async () => {
    const root = await temporaryGitProject();
    const created = await createRunWorkspace("manifest fixture", { targetAgent: "codex", skills: ["review"] }, root);
    const manifest = JSON.parse(await fs.readFile(path.join(created.path, "manifest.json"), "utf8")) as Record<string, any>;
    expect(manifest.schemaVersion).toBe("soturail.run-manifest.v1");
    expect(manifest.workspace.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.capabilityEpoch.id).toMatch(/^epoch-implement-/);
    expect(manifest.unknowns).toContain("models.implementer");
    expect(manifest.mcp[0].protocol).toBe("2026-07-28");
  });
});

describe("control-plane documentation drift", () => {
  it("keeps current runtime, MCP, security and product-boundary claims aligned", async () => {
    const root = process.cwd();
    const [packageText, readme, architecture, mcp, security, release] = await Promise.all([
      fs.readFile(path.join(root, "package.json"), "utf8"),
      fs.readFile(path.join(root, "README.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "architecture", "architecture.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "rails", "hosts", "mcp.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "security", "security-model.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "releases", "RELEASE_NOTES_v1.5.0.md"), "utf8")
    ]);
    const packageJson = JSON.parse(packageText) as { version: string; engines: { node: string } };
    expect(packageJson).toMatchObject({ version: "1.5.0", engines: { node: ">=22" } });
    expect(readme).toContain("SotuRail governs engineering readiness and verified context; it does not replace the coding model/runtime.");
    expect(architecture).toContain("SotuRail v1.5");
    expect(mcp).toContain("2026-07-28");
    expect(`${mcp}\n${security}`).not.toMatch(/allow_raw=true/);
    expect(release).toContain("SotuRail v1.5.0");
  });
});

async function temporaryGitProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-governance-"));
  temporaryDirectories.push(root);
  await fs.writeFile(path.join(root, "README.md"), "fixture\n", "utf8");
  await fs.writeFile(path.join(root, ".gitignore"), ".soturail/\n", "utf8");
  await exec("git", ["init", "-q"], { cwd: root, windowsHide: true });
  await exec("git", ["config", "user.email", "test@example.com"], { cwd: root, windowsHide: true });
  await exec("git", ["config", "user.name", "SotuRail Test"], { cwd: root, windowsHide: true });
  await exec("git", ["add", "."], { cwd: root, windowsHide: true });
  await exec("git", ["commit", "-qm", "fixture"], { cwd: root, windowsHide: true });
  return root;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
