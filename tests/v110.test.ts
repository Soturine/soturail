import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { registerAgentsCommand } from "../src/commands/agents.js";
import { registerMcpCommand } from "../src/commands/mcp.js";
import { agentHostDoctor, agentHostDoctorAll, exportAgents } from "../src/core/agent-exporter.js";
import { buildAgentHostMatrix } from "../src/core/agent-runtime.js";
import { writeHostResourceManifest } from "../src/core/mcp-resources.js";
import { buildReport, reportAgent } from "../src/core/report-rail.js";
import { SOTURAIL_VERSION } from "../src/core/version.js";

describe("v1.1.0 host compatibility rail", () => {
  it("documents the v1.1 host matrix contract without removing v1 schema compatibility", () => {
    const matrix = buildAgentHostMatrix();
    const hosts = new Map(matrix.hosts.map((host) => [host.id, host]));

    expect(matrix.schemaVersion).toBe("soturail.agents.matrix.v1");
    expect(matrix.contractId).toBe("soturail.agent-host-matrix.v1");
    expect(hosts.get("codex")?.status).toBe("stable");
    expect(hosts.get("claude")?.status).toBe("stable");
    expect(hosts.get("cursor")?.status).toBe("stable");
    expect(hosts.get("generic")?.status).toBe("stable");
    expect(hosts.get("opencode")?.status).toBe("generic-compatible");
    expect(hosts.get("antigravity")?.status).toBe("experimental");
    expect(hosts.get("antigravity")?.priority).toBe("high");
    expect(hosts.get("gemini-legacy")?.status).toBe("legacy");
    expect(hosts.get("deepagents")?.status).toBe("experimental");
    expect(matrix.hosts.every((host) => host.mutationAllowedByDefault === false)).toBe(true);
  });

  it("writes host exports to legacy and v1.1 directories with safe handoff text", async () => {
    const root = await tempProject();
    const result = await exportAgents("opencode", root);
    const legacy = path.join(root, ".soturail", "exports", "agents", "opencode", "AGENTS.md");
    const modern = path.join(root, ".soturail", "agents", "opencode", "AGENTS.md");
    const text = await readFile(modern, "utf8");

    expect(result.written.some((file) => file.includes(".soturail"))).toBe(true);
    expect(existsSync(legacy)).toBe(true);
    expect(existsSync(modern)).toBe(true);
    expect(text).toContain("local-first Context OS");
    expect(text).toContain("not a cloud gateway");
    expect(text).toContain("MCP host manifest");
    expect(text).not.toContain(".soturail/raw");
    expect(text).not.toMatch(/\b(SoturAI|trading|backtest)\b/i);
  });

  it("exports DeepAgents role packs without claiming runtime execution", async () => {
    const root = await tempProject();
    await exportAgents("deepagents", root);
    const rolePack = await readFile(path.join(root, ".soturail", "agents", "deepagents", "role-pack.md"), "utf8");
    const subagents = await readFile(path.join(root, ".soturail", "agents", "deepagents", "subagents.md"), "utf8");

    expect(rolePack).toContain("role/context artifacts only");
    expect(rolePack).toContain("does not install dependencies");
    expect(subagents).toContain("These are prompt notes");
  });

  it("writes per-host doctor artifacts and all-host summaries", async () => {
    const root = await tempProject();
    const report = await agentHostDoctor("antigravity", root);
    const summary = await agentHostDoctorAll(root);
    const doctorJson = path.join(root, ".soturail", "agents", "antigravity", "doctor.json");
    const summaryJson = path.join(root, ".soturail", "agents", "doctor-summary.json");

    expect(report.schemaVersion).toBe("soturail.agent-host-doctor.v1");
    expect(report.host).toBe("antigravity");
    expect(report.blockingIssues).toHaveLength(0);
    expect(summary.hosts.some((host) => host.host === "gemini-legacy")).toBe(true);
    expect(JSON.parse(await readFile(doctorJson, "utf8")).host).toBe("antigravity");
    expect(JSON.parse(await readFile(summaryJson, "utf8")).schemaVersion).toBe("soturail.agent-host-doctor-summary.v1");
  });

  it("writes read-only MCP host manifests with no mutation resources", async () => {
    const root = await tempProject();
    await exportAgents("codex", root);
    await agentHostDoctor("codex", root);
    const result = await writeHostResourceManifest(root, "codex");
    const parsed = JSON.parse(await readFile(result.path, "utf8")) as typeof result.manifest;

    expect(parsed.schemaVersion).toBe("soturail.mcp.host-manifest.v1");
    expect(parsed.host).toBe("codex");
    expect(parsed.mutationAllowed).toBe(false);
    expect(parsed.arbitraryShellExecutionExposed).toBe(false);
    expect(parsed.resources.some((resource) => resource.id === "host-export")).toBe(true);
    expect(parsed.resources.every((resource) => !resource.path.includes(".soturail/raw"))).toBe(true);
  });

  it("supports expanded agent reports for OpenCode and Antigravity", async () => {
    const root = await tempProject();
    await buildReport(root);
    await reportAgent(root, "opencode");
    await reportAgent(root, "antigravity");
    const opencode = await readFile(path.join(root, ".soturail", "reports", "agent-opencode.md"), "utf8");
    const antigravity = await readFile(path.join(root, ".soturail", "reports", "agent-antigravity.md"), "utf8");

    expect(opencode).toContain("generic-compatible");
    expect(opencode).toContain("Do not assume full host-native support");
    expect(antigravity).toContain("experimental");
    expect(antigravity).toContain("Google-local config");
  });

  it("exposes host doctor and MCP manifest through CLI JSON commands", async () => {
    const root = await tempProject();
    const doctorStdout = await captureCommand(root, registerAgentsCommand, ["agents", "doctor", "--host", "codex", "--json"]);
    const manifestStdout = await captureCommand(root, registerMcpCommand, ["mcp", "resources", "host-manifest", "--host", "codex", "--json"]);
    const doctor = JSON.parse(doctorStdout);
    const manifest = JSON.parse(manifestStdout);

    expect(doctor.schemaVersion).toBe("soturail.agent-host-doctor.v1");
    expect(doctor.host).toBe("codex");
    expect(manifest.schemaVersion).toBe("soturail.mcp.host-manifest.v1");
    expect(manifest.mode).toBe("read-only");
  });
});

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v110-"));
  await mkdir(path.join(root, ".git"), { recursive: true });
  await mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await mkdir(path.join(root, "dist", "core"), { recursive: true });
  await mkdir(path.join(root, "docs", "releases"), { recursive: true });
  await mkdir(path.join(root, "src", "core"), { recursive: true });
  await writeFile(path.join(root, ".github", "workflows", "ci.yml"), "name: ci\n", "utf8");
  await writeFile(path.join(root, "README.md"), "# Host Compatibility Fixture\n\nsoturail status --agent\n", "utf8");
  await writeFile(path.join(root, "CHANGELOG.md"), `## [${SOTURAIL_VERSION}]\n\n- Host compatibility fixture.\n`, "utf8");
  await writeFile(path.join(root, "LICENSE"), "Apache-2.0\n", "utf8");
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail-host-fixture", version: SOTURAIL_VERSION, bin: { soturail: "dist/cli.js" }, files: ["dist", "README.md", "LICENSE", "docs"] }, null, 2), "utf8");
  await writeFile(path.join(root, "package-lock.json"), JSON.stringify({ name: "soturail-host-fixture", version: SOTURAIL_VERSION, lockfileVersion: 3, packages: { "": { name: "soturail-host-fixture", version: SOTURAIL_VERSION } } }, null, 2), "utf8");
  await writeFile(path.join(root, "dist", "cli.js"), `if (process.argv.includes('--version')) console.log('${SOTURAIL_VERSION}');\n`, "utf8");
  await writeFile(path.join(root, "src", "core", "version.ts"), `export const SOTURAIL_VERSION = "${SOTURAIL_VERSION}";\n`, "utf8");
  await writeFile(path.join(root, "docs", "releases", `RELEASE_NOTES_v${SOTURAIL_VERSION}.md`), "# Notes\n", "utf8");
  return root;
}

async function captureCommand(root: string, register: (program: Command) => void, args: string[]): Promise<string> {
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeOut: () => undefined, writeErr: () => undefined });
  let stdout = "";
  const originalCwd = process.cwd();
  const originalWrite = process.stdout.write;
  process.chdir(root);
  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout += chunk.toString();
    return true;
  }) as typeof process.stdout.write;
  try {
    register(program);
    await program.parseAsync(args, { from: "user" });
    return stdout;
  } finally {
    process.stdout.write = originalWrite;
    process.chdir(originalCwd);
  }
}
