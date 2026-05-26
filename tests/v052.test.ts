import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lintAgentDocs } from "../src/core/agent-docs-hygiene.js";
import { compareFormats } from "../src/core/format-compare.js";
import { buildWorkflowEvidence } from "../src/core/evidence-pack.js";
import { contextBudget, routeContext } from "../src/core/context-intelligence.js";
import { validateJsonFile } from "../src/core/json-validator.js";
import { createRunWorkspace, showRunWorkspace } from "../src/core/run-workspace.js";
import { createWorkflow } from "../src/core/workflow-store.js";

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v052-"));
  await writeFile(path.join(root, "README.md"), "# Demo\n\nSotuRail local-first Context OS.\n", "utf8");
  await writeFile(path.join(root, "package.json"), "{\"scripts\":{\"build\":\"tsc\",\"test\":\"vitest run\"}}\n", "utf8");
  return root;
}

describe("v0.5.2 lightweight quality fixtures", () => {
  it("keeps JSON strict validation cheap but useful", async () => {
    const root = await tempProject();
    await writeFile(path.join(root, "invalid.json"), "{\"ok\": true,}\n", "utf8");
    await writeFile(
      path.join(root, "risky.json"),
      `{"name":"first","name":"second","apiKey":"replace-me","items":[${Array.from({ length: 51 }, (_, index) => index).join(",")}]}\n`,
      "utf8"
    );

    const invalid = await validateJsonFile("invalid.json", { strict: true }, root);
    const risky = await validateJsonFile("risky.json", { strict: true }, root);

    expect(invalid.result).toBe("fail");
    expect(invalid.validJson).toBe(false);
    expect(risky.result).toBe("warn");
    expect(risky.duplicateKeys.some((finding) => finding.key === "name")).toBe(true);
    expect(risky.probableSecrets.length).toBeGreaterThan(0);
    expect(risky.hugeArrays.length).toBeGreaterThan(0);
  });

  it("reports format hints, context routes and budget drivers", async () => {
    const root = await tempProject();
    await writeFile(path.join(root, "notes.md"), `${Array.from({ length: 85 }, (_, index) => `row ${index}: repeated release checklist`).join("\n")}\n`, "utf8");

    const compare = await compareFormats("notes.md", root);
    const budget = await contextBudget("claude", true, root);

    expect(compare.markdownTokens).toBeGreaterThan(0);
    expect(compare.compactSuggestion).toContain("compact");
    expect(routeContext("review security policy").expert).toBe("security");
    expect(routeContext("prepare npm release checklist").expert).toBe("release");
    expect(routeContext("document migration guide").expert).toBe("docs");
    for (const driver of ["root_agent_docs", "role_packs", "memory", "skills", "mcp_exposure", "run_workspace_evidence"]) {
      expect(budget).toContain(`${driver}:`);
    }
  });

  it("keeps workflow evidence and run workspace output readable", async () => {
    const root = await tempProject();
    const workflow = await createWorkflow("Smoke evidence", root, "2026-05-26T12:00:00.000Z");
    const evidence = await buildWorkflowEvidence(workflow.id, root);
    const run = await createRunWorkspace("Smoke run", { workflow: workflow.id, role: "reviewer", evidencePack: evidence.path }, root);
    const shown = await showRunWorkspace(run.record.runId, root);

    expect(evidence.content).toContain("schemaVersion: soturail.evidence.v1");
    expect(evidence.content).toContain(`workflow_id: ${workflow.id}`);
    expect(evidence.content).toContain("Policy Decisions");
    expect(shown).toContain("summary_present: true");
    expect(shown).toContain("handoff_present: true");
    expect(shown).toContain("evidence_pack:");
  });

  it("accepts short root agent docs with identity and safety notes", async () => {
    const root = await tempProject();
    await writeFile(
      path.join(root, "AGENTS.md"),
      "# Agent Notes\n\nSotuRail is a local-first Context OS.\n\nSafety: do not expose secrets or raw logs without approval.\n",
      "utf8"
    );

    const lint = await lintAgentDocs(root);

    expect(lint).toContain("findings_count: 0");
    expect(lint).toContain("No agent doc hygiene findings.");
  });
});
