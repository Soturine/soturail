import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { baselineSnapshot } from "../src/core/baseline-snapshot.js";
import { runBenchmarkRail } from "../src/core/benchmark-rail.js";
import { buildDashboard, dashboardDoctor } from "../src/core/dashboard-rail.js";
import { writeReportResourceManifest } from "../src/core/mcp-resources.js";
import { writeNativeCandidateReport } from "../src/core/native-candidates.js";
import { collectObservability, observabilitySummary } from "../src/core/observability-rail.js";
import { buildReport, exportReport, reportRedact } from "../src/core/report-rail.js";
import { runSchemaCheck, runV1Readiness } from "../src/core/schema-readiness.js";
import { buildStatus } from "../src/core/status-model.js";
import { registerNativeCommand } from "../src/commands/native.js";
import { registerSelfCommand } from "../src/commands/self.js";
import { registerStatusCommand } from "../src/commands/status.js";
import { SOTURAIL_VERSION } from "../src/core/version.js";

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v0101-"));
  await mkdir(path.join(root, ".git"), { recursive: true });
  await mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await mkdir(path.join(root, "dist", "core"), { recursive: true });
  await mkdir(path.join(root, "docs", "releases"), { recursive: true });
  await mkdir(path.join(root, "src", "core"), { recursive: true });
  await writeFile(path.join(root, "README.md"), "# Stability Fixture\n\nnpx soturail --help\nnpm install -g soturail\nsoturail --version\n", "utf8");
  await writeFile(path.join(root, "CHANGELOG.md"), `## [${SOTURAIL_VERSION}]\n\n- Stability fixture.\n`, "utf8");
  await writeFile(path.join(root, "LICENSE"), "MIT\n", "utf8");
  await writeFile(path.join(root, ".github", "workflows", "ci.yml"), "name: ci\n", "utf8");
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail-stability-fixture", version: SOTURAIL_VERSION, bin: { soturail: "dist/cli.js" }, files: ["dist", "README.md", "LICENSE", "docs"] }, null, 2), "utf8");
  await writeFile(path.join(root, "package-lock.json"), JSON.stringify({ name: "soturail-stability-fixture", version: SOTURAIL_VERSION, lockfileVersion: 3, packages: { "": { name: "soturail-stability-fixture", version: SOTURAIL_VERSION } } }, null, 2), "utf8");
  await writeFile(path.join(root, "dist", "cli.js"), `if (process.argv.includes('--version')) console.log('${SOTURAIL_VERSION}');\n`, "utf8");
  await writeFile(path.join(root, "dist", "core", "version.js"), `export const SOTURAIL_VERSION = "${SOTURAIL_VERSION}";\n`, "utf8");
  await writeFile(path.join(root, "src", "core", "version.ts"), `export const SOTURAIL_VERSION = "${SOTURAIL_VERSION}";\n`, "utf8");
  await writeFile(path.join(root, "docs", "status-command.md"), "# Status\n", "utf8");
  await writeFile(path.join(root, "docs", "report-rail.md"), "# Reports\n", "utf8");
  await writeFile(path.join(root, "docs", "dashboard-rail.md"), "# Dashboard\n", "utf8");
  await writeFile(path.join(root, "docs", "stable-command-surface.md"), "# Stable Surface\n", "utf8");
  await writeFile(path.join(root, "docs", "deprecation-policy.md"), "# Deprecation\n", "utf8");
  await writeFile(path.join(root, "docs", "migration-v1.md"), "# Migration v1\n", "utf8");
  await writeFile(path.join(root, "docs", "releases", `RELEASE_NOTES_v${SOTURAIL_VERSION}.md`), "# Notes\n", "utf8");
  return root;
}

describe("v0.10.1 JSON stability and v1 readiness", () => {
  it("emits parseable status JSON on stdout and disk", async () => {
    const root = await tempProject();
    const stdout = await captureCommand(root, registerStatusCommand, ["status", "--json"]);
    const parsed = JSON.parse(stdout) as { schemaVersion: string; version: string; nextCommands: string[] };
    const status = await buildStatus(root);
    const disk = JSON.parse(await readFile(status.paths.json, "utf8")) as typeof status.status;

    expect(parsed.schemaVersion).toBe("soturail.status.v1");
    expect(parsed.version).toBe(SOTURAIL_VERSION);
    expect(Array.isArray(parsed.nextCommands)).toBe(true);
    expect(disk.schemaVersion).toBe("soturail.status.v1");
    expect(disk.brain.brainStatus).toBeDefined();
  });

  it("writes parseable report, export, MCP, bench, native and baseline JSON artifacts", async () => {
    const root = await tempProject();
    await runBenchmarkRail(root, "brain");
    await writeNativeCandidateReport(root);
    await baselineSnapshot(root, "check");
    const report = await buildReport(root);
    const exported = await exportReport(root, "json");
    const manifest = await writeReportResourceManifest(root);
    const nativeStdout = await captureCommand(root, registerNativeCommand, ["native", "candidates", "--json"]);

    for (const filePath of [
      report.paths.json,
      exported.path,
      manifest.path,
      path.join(root, ".soturail", "bench", "latest.json"),
      path.join(root, ".soturail", "native", "candidates.json"),
      path.join(root, ".soturail", "baselines", "latest.json")
    ]) {
      const parsed = JSON.parse(await readFile(filePath, "utf8")) as { schemaVersion?: string; warnings?: unknown[]; nextCommands?: unknown[] };
      expect(parsed.schemaVersion).toBeTruthy();
    }

    const nativeJson = JSON.parse(nativeStdout) as { schemaVersion: string };
    expect(nativeJson.schemaVersion).toBe("soturail.native.candidates.v1");
  });

  it("redacts fake tokens without redacting normal package hashes", async () => {
    const root = await tempProject();
    await buildReport(root);
    const reportsDir = path.join(root, ".soturail", "reports");
    const normalHash = "sha512-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/==";
    await writeFile(path.join(reportsDir, "latest.md"), `token=ghp_abcdefghijklmnopqrstuvwxyz123456\nintegrity=${normalHash}\n`, "utf8");
    await writeFile(path.join(reportsDir, "latest.json"), JSON.stringify({ note: `integrity=${normalHash}`, token: "npm_abcdefghijklmnopqrstuvwxyz123456" }), "utf8");

    const output = await reportRedact(root);
    const redacted = await readFile(path.join(reportsDir, "latest.redacted.md"), "utf8");

    expect(output).toContain("redactions:");
    expect(redacted).not.toContain("ghp_abcdefghijklmnopqrstuvwxyz123456");
    expect(redacted).toContain(normalHash);
  });

  it("checks dashboard local data and de-duplicates observability events", async () => {
    const root = await tempProject();
    await runBenchmarkRail(root, "brain");
    await writeNativeCandidateReport(root);
    await baselineSnapshot(root, "check");
    await buildReport(root);
    await buildDashboard(root);

    const doctor = await dashboardDoctor(root);
    const first = await collectObservability(root);
    const second = await collectObservability(root);
    const summary = await observabilitySummary(root);
    const eventsRaw = await readFile(path.join(root, ".soturail", "observability", "events.jsonl"), "utf8");

    expect(doctor).toContain("report_json_parseable: true");
    expect(doctor).toContain("external_network_refs: false");
    expect(first.events.length).toBeGreaterThan(0);
    expect(second.events.length).toBe(0);
    expect(summary).toContain("Latest Warnings");
    for (const line of eventsRaw.trim().split(/\r?\n/)) {
      expect(JSON.parse(line).schemaVersion).toBe("soturail.obs.event.v1");
    }
  });

  it("runs schema checks and v1 readiness with valid JSON outputs", async () => {
    const root = await tempProject();
    await runBenchmarkRail(root, "brain");
    await writeNativeCandidateReport(root);
    await baselineSnapshot(root, "check");
    await buildReport(root);
    await writeReportResourceManifest(root);
    await collectObservability(root);

    const schema = await runSchemaCheck(root);
    const readiness = await runV1Readiness(root);
    const readinessStdout = await captureCommand(root, registerSelfCommand, ["self", "readiness", "--v1", "--json"]);
    const schemaStdout = await captureCommand(root, registerSelfCommand, ["self", "schemas", "--check", "--json"]);

    expect(JSON.parse(await readFile(schema.jsonPath, "utf8")).schemaVersion).toBe("soturail.schema-check.v1");
    expect(JSON.parse(await readFile(readiness.jsonPath, "utf8")).schemaVersion).toBe("soturail.v1-readiness.v1");
    expect(JSON.parse(readinessStdout).stableCommands).toContain("soturail status");
    expect(JSON.parse(schemaStdout).nextCommands).toContain("soturail status --json");
  });

  it("ships v1 readiness policy docs", () => {
    const root = process.cwd();

    expect(existsSync(path.join(root, "docs", "stable-command-surface.md"))).toBe(true);
    expect(existsSync(path.join(root, "docs", "deprecation-policy.md"))).toBe(true);
    expect(existsSync(path.join(root, "docs", "migration-v1.md"))).toBe(true);
  });
});

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
