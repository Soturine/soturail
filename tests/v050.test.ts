import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildRolePack, offloadContext, restoreOffload, routeContext, selectContext } from "../src/core/context-intelligence.js";
import { createFsSnapshot } from "../src/core/fs-evidence.js";
import { initHarnessContract, noteHarnessFailure } from "../src/core/harness-rail.js";
import { captureMemoryFromFile, recallMemory, rememberMemory } from "../src/core/memory-rail.js";
import { mcpExposureReport } from "../src/core/mcp-exposure.js";
import { decidePolicyItem, queuePolicyItem } from "../src/core/policy-rail.js";
import { createRunWorkspace } from "../src/core/run-workspace.js";

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v050-"));
  await writeFile(path.join(root, "README.md"), "# Demo\n\nSotuRail local-first Context OS for release workflows.\n", "utf8");
  await writeFile(path.join(root, "package.json"), "{\"scripts\":{\"build\":\"tsc\"}}\n", "utf8");
  await writeFile(path.join(root, "release.md"), "Release rule: verify the packed package before npm publish.\n", "utf8");
  return root;
}

describe("v0.5.0 MVP rails", () => {
  it("stores and recalls local memory records", async () => {
    const root = await tempProject();
    const record = await rememberMemory("Decision: verify packed package before publish", { tags: ["release"] }, root);
    const captured = await captureMemoryFromFile("release.md", { tags: ["release"] }, root);
    const matches = await recallMemory("packed package release", 5, root);
    expect(record.schemaVersion).toBe("soturail.memory.v1");
    expect(captured.filePath).toBe("release.md");
    expect(matches.some((match) => match.record.tags.includes("release"))).toBe(true);
  });

  it("selects context, offloads content and writes role packs", async () => {
    const root = await tempProject();
    const selection = await selectContext("release package", 5, root);
    const offload = await offloadContext("release.md", root);
    const restored = await restoreOffload(offload.id, root);
    const role = await buildRolePack("release-manager", root);
    expect(selection.items.length).toBeGreaterThan(0);
    expect(routeContext("prepare npm release").expert).toBe("release");
    expect(restored).toContain("packed package");
    expect(role.content).toContain("SotuRail Role Pack");
  });

  it("records harness failures and validates policy decisions", async () => {
    const root = await tempProject();
    const failure = await noteHarnessFailure("agent marked done before tests passed", { prevention: "workflow check" }, root);
    const contract = await initHarnessContract(root);
    const item = await queuePolicyItem("npm publish", "npm publish --access public", "public package state", undefined, root);
    const decision = await decidePolicyItem(item.id, "approved", root);
    expect(failure.schemaVersion).toBe("soturail.harness.failure.v1");
    expect(contract.created).toBe(true);
    expect(decision.queueId).toBe(item.id);
  });

  it("creates filesystem snapshots, run workspaces and MCP exposure reports", async () => {
    const root = await tempProject();
    const snapshot = await createFsSnapshot(root);
    const workspace = await createRunWorkspace("Try v0.5.0 rails", {}, root);
    const exposure = await mcpExposureReport();
    expect(snapshot.snapshot.files.some((file) => file.path === "README.md")).toBe(true);
    expect(workspace.record.schemaVersion).toBe("soturail.run.v1");
    expect(exposure.arbitraryShellExecutionExposed).toBe(false);
  });
});
