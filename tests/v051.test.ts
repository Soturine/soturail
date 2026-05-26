import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compareFormats } from "../src/core/format-compare.js";
import { contextBudget } from "../src/core/context-intelligence.js";
import { renderJsonValidation, validateJsonFile } from "../src/core/json-validator.js";
import { consolidateMemory, memoryRailDoctor, recallMemory, rememberMemory, renderRecall } from "../src/core/memory-rail.js";
import { createRunWorkspace, showRunWorkspace } from "../src/core/run-workspace.js";

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v051-"));
  await writeFile(path.join(root, "README.md"), "# Demo\n\nSotuRail local-first Context OS.\n", "utf8");
  await writeFile(path.join(root, "package.json"), "{\"scripts\":{\"build\":\"tsc\"}}\n", "utf8");
  return root;
}

describe("v0.5.1 polish", () => {
  it("renders richer memory recall and doctor output", async () => {
    const root = await tempProject();
    await rememberMemory("Decision: verify packed package before publish", { tags: ["release"], source: "manual" }, root);
    await rememberMemory("Decision: verify packed package before publish", { tags: ["release"], source: "manual" }, root);
    const consolidated = await consolidateMemory(root);
    const recall = renderRecall(await recallMemory("packed package release", 5, root));
    const doctor = await memoryRailDoctor(root);
    expect(consolidated.duplicatesRemoved).toBe(1);
    expect(recall).toContain("Confidence/privacy:");
    expect(recall).toContain("Reason:");
    expect(doctor).toContain("consolidated_records:");
    expect(doctor).toContain("approved_memory_export_status:");
  });

  it("reports context budget and run workspace evidence status", async () => {
    const root = await tempProject();
    const workspace = await createRunWorkspace("Try v0.5.1 polish", { role: "planner", selectedRolePack: ".soturail/context/role-packs/planner.md" }, root);
    const budget = await contextBudget("claude", true, root);
    const shown = await showRunWorkspace(workspace.record.runId, root);
    expect(budget).toContain("role_packs:");
    expect(budget).toContain("run_workspace_evidence:");
    expect(shown).toContain("summary_present: true");
    expect(shown).toContain("role_pack: .soturail/context/role-packs/planner.md");
  });

  it("validates strict JSON and compares format hints", async () => {
    const root = await tempProject();
    const payload = path.join(root, "payload.json");
    await writeFile(payload, `{"name":"first","name":"second","apiKey":"replace-me","items":[${Array.from({ length: 51 }, (_, index) => index).join(",")}]}\n`, "utf8");
    const validation = await validateJsonFile("payload.json", { strict: true }, root);
    const rendered = renderJsonValidation(validation);
    const compare = await compareFormats("payload.json", root);
    expect(validation.validJson).toBe(true);
    expect(validation.duplicateKeys.length).toBeGreaterThan(0);
    expect(validation.probableSecrets.length).toBeGreaterThan(0);
    expect(validation.hugeArrays.length).toBeGreaterThan(0);
    expect(rendered).toContain("result: warn");
    expect(compare.jsonTokens).toBeGreaterThan(0);
    expect(compare.warnings.length).toBeGreaterThan(0);
  });
});
