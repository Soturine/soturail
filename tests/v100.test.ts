import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { baselineSnapshot } from "../src/core/baseline-snapshot.js";
import { runBenchmarkRail } from "../src/core/benchmark-rail.js";
import { buildDashboard } from "../src/core/dashboard-rail.js";
import { writeReportResourceManifest } from "../src/core/mcp-resources.js";
import { writeNativeCandidateReport } from "../src/core/native-candidates.js";
import { collectObservability, observabilitySummary } from "../src/core/observability-rail.js";
import { buildReport } from "../src/core/report-rail.js";
import { runReleasePreflight } from "../src/core/release-preflight.js";
import { runArchitectureCheck, runCodeHealth } from "../src/core/code-health.js";
import { runSchemaCheck, runV1Readiness } from "../src/core/schema-readiness.js";
import { registerAgentsCommand } from "../src/commands/agents.js";
import { registerSelfCommand } from "../src/commands/self.js";
import { registerStatusCommand } from "../src/commands/status.js";
import { SOTURAIL_VERSION } from "../src/core/version.js";

describe("v1.0.0 stable context os contracts", () => {
  it("uses the stable v1 package/CLI version constant", () => {
    expect(SOTURAIL_VERSION).toBe("1.0.0");
  });

  it("emits valid status JSON and builds local report/dashboard artifacts", async () => {
    const root = await tempProject();
    const statusStdout = await captureCommand(root, registerStatusCommand, ["status", "--json"]);
    const status = JSON.parse(statusStdout) as { schemaVersion: string; version: string; warnings: unknown[]; nextCommands: unknown[] };
    const report = await buildReport(root);
    const dashboard = await buildDashboard(root);

    expect(status.schemaVersion).toBe("soturail.status.v1");
    expect(status.version).toBe("1.0.0");
    expect(Array.isArray(status.warnings)).toBe(true);
    expect(Array.isArray(status.nextCommands)).toBe(true);
    expect(JSON.parse(await readFile(report.paths.json, "utf8")).schemaVersion).toBe("soturail.report.v1");
    expect(existsSync(report.paths.markdown)).toBe(true);
    expect(existsSync(report.paths.html)).toBe(true);
    expect(existsSync(dashboard.index)).toBe(true);
  });

  it("runs strict schema, readiness, code-health and architecture gates", async () => {
    const root = await preparedProject();
    const schemas = await runSchemaCheck(root, { strict: true });
    const readiness = await runV1Readiness(root, { strict: true });
    const codeHealth = await runCodeHealth(root, { strict: true });
    const architecture = await runArchitectureCheck(root, { strict: true });

    expect(schemas.report.status).not.toBe("failed");
    expect(readiness.report.blockingIssues).toHaveLength(0);
    expect(codeHealth.report.summary.blockingIssues).toBe(0);
    expect(architecture.report.summary.blockingIssues).toBe(0);
    expect(JSON.parse(await readFile(schemas.jsonPath, "utf8")).schemaVersion).toBe("soturail.schema-check.v1");
    expect(JSON.parse(await readFile(readiness.jsonPath, "utf8")).schemaVersion).toBe("soturail.v1-readiness.v1");
  });

  it("exposes strict self commands and agent host matrix JSON", async () => {
    const root = await preparedProject();
    const schemaStdout = await captureCommand(root, registerSelfCommand, ["self", "schemas", "--check", "--strict", "--json"]);
    const readinessStdout = await captureCommand(root, registerSelfCommand, ["self", "readiness", "--v1", "--strict", "--json"]);
    const codeHealthStdout = await captureCommand(root, registerSelfCommand, ["self", "code-health", "--json"]);
    const architectureStdout = await captureCommand(root, registerSelfCommand, ["self", "architecture", "--check", "--json"]);
    const matrixStdout = await captureCommand(root, registerAgentsCommand, ["agents", "matrix", "--json"]);

    expect(JSON.parse(schemaStdout).strict).toBe(true);
    expect(JSON.parse(readinessStdout).blockingIssues).toHaveLength(0);
    expect(JSON.parse(codeHealthStdout).schemaVersion).toBe("soturail.code-health.v1");
    expect(JSON.parse(architectureStdout).schemaVersion).toBe("soturail.architecture.check.v1");
    const matrix = JSON.parse(matrixStdout) as { schemaVersion: string; hosts: Array<{ host: string; status: string }> };
    expect(matrix.schemaVersion).toBe("soturail.agents.matrix.v1");
    expect(matrix.hosts.some((host) => host.host.includes("Codex"))).toBe(true);
  });

  it("supports strict release preflight in test mode", async () => {
    const root = await preparedProject();
    const result = await runReleasePreflight(root, {
      runAudit: false,
      runPack: false,
      strict: true,
      cliCommand: [process.execPath, path.join(root, "dist", "cli.js"), "--version"]
    });

    expect(result.ok).toBe(true);
    expect(result.gates.some((gate) => gate.id === "strict_schema_check" && gate.ok)).toBe(true);
    expect(result.gates.some((gate) => gate.id === "clean_code_gate" && gate.ok)).toBe(true);
  });

  it("keeps v1 docs present and free from unrelated roadmap scope", async () => {
    const root = process.cwd();
    const docs = [
      "docs/quickstart.md",
      "docs/v1-contract.md",
      "docs/schema-contracts.md",
      "docs/agent-hosts.md",
      "docs/clean-code-guidelines.md",
      "docs/architecture-boundaries.md",
      "docs/stable-command-surface.md",
      "docs/deprecation-policy.md",
      "docs/migration-v1.md"
    ];

    for (const doc of docs) {
      expect(existsSync(path.join(root, doc))).toBe(true);
    }

    const scopeDocs = ["README.md", "ROADMAP.md", ...docs];
    for (const doc of scopeDocs) {
      const text = await readFile(path.join(root, doc), "utf8");
      expect(text).not.toMatch(/\b(SoturAI|trading|finance|backtest)\b/i);
    }
  });

  it("collects observability summary from local artifacts", async () => {
    const root = await preparedProject();
    await collectObservability(root);
    const summary = await observabilitySummary(root);
    expect(summary).toContain("SotuRail Observability Summary");
    const events = await readFile(path.join(root, ".soturail", "observability", "events.jsonl"), "utf8");
    for (const line of events.trim().split(/\r?\n/).filter(Boolean)) {
      expect(JSON.parse(line).schemaVersion).toBe("soturail.obs.event.v1");
    }
  });
});

async function preparedProject(): Promise<string> {
  const root = await tempProject();
  await runBenchmarkRail(root, "brain");
  await writeNativeCandidateReport(root);
  await baselineSnapshot(root, "check");
  await buildReport(root);
  await buildDashboard(root);
  await writeReportResourceManifest(root);
  await collectObservability(root);
  await runCodeHealth(root, { strict: true });
  await runArchitectureCheck(root, { strict: true });
  return root;
}

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v100-"));
  await mkdir(path.join(root, ".git"), { recursive: true });
  await mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await mkdir(path.join(root, ".github", "ISSUE_TEMPLATE"), { recursive: true });
  await mkdir(path.join(root, "dist", "core"), { recursive: true });
  await mkdir(path.join(root, "docs", "releases"), { recursive: true });
  await mkdir(path.join(root, "src", "commands"), { recursive: true });
  await mkdir(path.join(root, "src", "core"), { recursive: true });
  await writeFile(path.join(root, ".github", "workflows", "ci.yml"), "name: ci\n", "utf8");
  await writeFile(path.join(root, ".github", "ISSUE_TEMPLATE", "bug_report.md"), "# Bug\n", "utf8");
  await writeFile(path.join(root, ".github", "ISSUE_TEMPLATE", "feature_request.md"), "# Feature\n", "utf8");
  await writeFile(path.join(root, ".github", "pull_request_template.md"), "# PR\n", "utf8");
  await writeFile(path.join(root, "README.md"), "# SotuRail Fixture\n\nnpx soturail --help\nnpm install -g soturail\nsoturail --version\n", "utf8");
  await writeFile(path.join(root, "ROADMAP.md"), "# Roadmap\n\nv1.1.0 Host Compatibility Rail\n", "utf8");
  await writeFile(path.join(root, "CHANGELOG.md"), `# Changelog\n\n## [${SOTURAIL_VERSION}]\n\n- Stable fixture.\n`, "utf8");
  await writeFile(path.join(root, "LICENSE"), "All rights reserved.\n", "utf8");
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail-v100-fixture", version: SOTURAIL_VERSION, bin: { soturail: "dist/cli.js" }, files: ["dist", "README.md", "LICENSE", "docs"] }, null, 2), "utf8");
  await writeFile(path.join(root, "package-lock.json"), JSON.stringify({ name: "soturail-v100-fixture", version: SOTURAIL_VERSION, lockfileVersion: 3, packages: { "": { name: "soturail-v100-fixture", version: SOTURAIL_VERSION } } }, null, 2), "utf8");
  await writeFile(path.join(root, "dist", "cli.js"), `if (process.argv.includes('--version')) console.log('${SOTURAIL_VERSION}');\n`, "utf8");
  await writeFile(path.join(root, "dist", "core", "version.js"), `export const SOTURAIL_VERSION = "${SOTURAIL_VERSION}";\n`, "utf8");
  await writeFile(path.join(root, "src", "core", "version.ts"), `export const SOTURAIL_VERSION = "${SOTURAIL_VERSION}";\n`, "utf8");
  await writeFile(path.join(root, "src", "core", "release-preflight.ts"), `export const releaseNotesPath = "docs/releases/RELEASE_NOTES_v${SOTURAIL_VERSION}.md";\n`, "utf8");
  await writeFile(path.join(root, "src", "commands", "status.ts"), "export const statusCommand = true;\n", "utf8");
  for (const doc of [
    "status-command.md",
    "report-rail.md",
    "dashboard-rail.md",
    "stable-command-surface.md",
    "deprecation-policy.md",
    "migration-v1.md",
    "quickstart.md",
    "v1-contract.md",
    "schema-contracts.md",
    "agent-hosts.md",
    "clean-code-guidelines.md",
    "architecture-boundaries.md"
  ]) {
    await writeFile(path.join(root, "docs", doc), `# ${doc}\n\nSotuRail fixture.\n`, "utf8");
  }
  await writeFile(path.join(root, "docs", "releases", `RELEASE_NOTES_v${SOTURAIL_VERSION}.md`), "# Notes\n", "utf8");
  return root;
}

async function captureCommand(root: string, register: (program: Command) => void, argv: string[]): Promise<string> {
  const program = new Command();
  program.exitOverride();
  register(program);
  const previousCwd = process.cwd();
  const previousWrite = process.stdout.write;
  const previousExitCode = process.exitCode;
  let output = "";
  process.stdout.write = ((chunk: string | Uint8Array) => {
    output += chunk.toString();
    return true;
  }) as typeof process.stdout.write;
  process.chdir(root);
  process.exitCode = undefined;
  try {
    await program.parseAsync(["node", "test", ...argv], { from: "node" });
    return output;
  } finally {
    process.chdir(previousCwd);
    process.stdout.write = previousWrite;
    process.exitCode = previousExitCode;
  }
}
