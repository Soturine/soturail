import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { agentDoctor, exportAgents, installAgent } from "../src/core/agent-exporter.js";
import { agentStatus, listAgentCapabilities, renderAgentCapabilities, renderAgentStatus } from "../src/core/agent-runtime.js";

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v060-"));
  await writeFile(path.join(root, "README.md"), "# Demo\n\nSotuRail local-first Context OS.\n", "utf8");
  await writeFile(path.join(root, "package.json"), "{\"scripts\":{\"build\":\"tsc\",\"test\":\"vitest run\"}}\n", "utf8");
  return root;
}

describe("v0.6.0 agent runtime integration", () => {
  it("renders a host capability matrix and stable JSON data", () => {
    const text = renderAgentCapabilities();
    const json = listAgentCapabilities();

    expect(text).toContain("SotuRail Agent Host Capability Matrix");
    expect(text).toContain("Claude");
    expect(text).toContain("Deep Agents JS-style Host");
    expect(text).toContain("arbitrary_shell_execution: not exposed");
    expect(text).toContain("recommended_payloads:");
    expect(json.some((capability) => capability.id === "deepagents-js" && capability.maturity === "experimental")).toBe(true);
    expect(json.some((capability) => capability.id === "codex" && capability.promptOnlyFallback === "supported")).toBe(true);
  });

  it("reports local agent runtime status without requiring files to exist", async () => {
    const root = await tempProject();
    await mkdir(path.join(root, ".cursor", "rules"), { recursive: true });
    await writeFile(path.join(root, "CLAUDE.md"), "# Claude\n\nSotuRail safety notes.\n", "utf8");

    const status = await agentStatus(root);
    const text = renderAgentStatus(status);

    expect(status.schemaVersion).toBe("soturail.agent-status.v1");
    expect(status.detectedFiles.some((item) => item.path === "CLAUDE.md" && item.present)).toBe(true);
    expect(text).toContain("Detected agent files:");
    expect(text).toContain("context_packs:");
    expect(text).toContain("soturail agents install --agent claude --dry-run");
  });

  it("extends doctor verbose output with host, policy and dry-run guidance", async () => {
    const root = await tempProject();
    const output = await agentDoctor(root, { verbose: true });

    expect(output).toContain("SotuRail Agent Integration Doctor");
    expect(output).toContain("Host capability summary:");
    expect(output).toContain("Dry-run install suggestions:");
    expect(output).toContain("soturail agents install --agent cursor --dry-run");
    expect(output).toContain("No arbitrary shell execution is exposed through SotuRail MCP.");
  });

  it("keeps install previews dry-run-first and policy-aware", async () => {
    const root = await tempProject();

    for (const agent of ["claude", "cursor", "gemini"] as const) {
      const result = await installAgent(agent, { dryRun: true }, root);
      const output = result.lines.join("\n");
      expect(output).toContain(`agent: ${agent}`);
      expect(output).toContain("Would write");
      expect(output).toContain("Backup:");
      expect(output).toContain("Policy warnings:");
      expect(output).toContain("Apply after review:");
    }
  });

  it("creates backups before real project-local installs", async () => {
    const root = await tempProject();
    await writeFile(path.join(root, "GEMINI.md"), "existing gemini guidance\n", "utf8");

    const result = await installAgent("gemini", { mode: "prompt-only" }, root);
    const backup = await readFile(path.join(root, "GEMINI.md.soturail.bak"), "utf8");

    expect(result.lines.join("\n")).toContain("Create backup GEMINI.md.soturail.bak");
    expect(backup).toBe("existing gemini guidance\n");
  });

  it("exports deep agents artifacts as context/config only", async () => {
    const root = await tempProject();
    const deep = await exportAgents("deepagents", root);
    const deepJs = await exportAgents("deepagents-js", root);

    expect(deep.written).toContain(path.normalize(".soturail/exports/agents/deepagents/deepagents.md"));
    expect(deep.written).toContain(path.normalize(".soturail/exports/agents/deepagents/runtime-config.json"));
    expect(deepJs.written).toContain(path.normalize(".soturail/exports/agents/deepagents-js/deepagents-js.md"));

    const content = await readFile(path.join(root, ".soturail", "exports", "agents", "deepagents", "deepagents.md"), "utf8");
    expect(content).toContain("does not run a Deep Agents runtime");
    expect(content).toContain("Context/config artifacts only.");
    expect(content).toContain("Memory exports should be approved-memory-only");
  });
});
