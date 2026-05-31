import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { compressOutputWithEngine } from "../compressors/index.js";
import { compareFormats } from "./format-compare.js";
import { appendJsonl, defaultConfig, ensureWorkspace, getWorkspacePaths, readJsonl, relativeToRoot, writeJson } from "./config.js";
import { scanRepository } from "./file-scanner.js";
import { validateJsonFile } from "./json-validator.js";
import { detectNativeEngine } from "./native-engine.js";
import { consolidateBrain, scanBrain, staleBrain } from "./project-brain.js";
import { reverseClaims } from "./reverse-specification.js";
import { sha256Text } from "./rail-utils.js";
import { buildWorkflowEvidence } from "./evidence-pack.js";
import { createWorkflowPlan } from "./workflow-store.js";
import { runReleasePreflight } from "./release-preflight.js";
import { SOTURAIL_VERSION } from "./version.js";

export type BenchmarkRailSuite = "all" | "brain" | "reducers" | "filesystem" | "release";

export type BenchmarkRailCategory =
  | "brain-scan"
  | "brain-stale"
  | "brain-consolidate"
  | "reverse-claims"
  | "reducer-large-log"
  | "jsonl-read-write"
  | "range-hash"
  | "file-scan"
  | "workflow-evidence"
  | "format-compare"
  | "json-validate"
  | "release-preflight";

export interface BenchmarkRailCase {
  id: string;
  category: BenchmarkRailCategory;
  operation: string;
  durationMs: number;
  recordsRead: number;
  recordsWritten: number;
  filesScanned: number;
  engine: "typescript" | "native";
  status: "passed" | "failed" | "warning";
  warnings: string[];
}

export interface BenchmarkRailReport {
  schemaVersion: "soturail.bench.v1";
  id: string;
  createdAt: string;
  suite: BenchmarkRailSuite;
  version: string;
  environment: {
    platform: string;
    node: string;
    nativeAvailable: boolean;
    engine: "typescript" | "native";
  };
  cases: BenchmarkRailCase[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    totalDurationMs: number;
  };
}

const categorySuites: Record<Exclude<BenchmarkRailSuite, "all">, BenchmarkRailCategory[]> = {
  brain: ["brain-scan", "brain-stale", "brain-consolidate", "reverse-claims", "jsonl-read-write", "range-hash"],
  reducers: ["reducer-large-log", "format-compare", "json-validate"],
  filesystem: ["file-scan", "workflow-evidence"],
  release: ["release-preflight"]
};

export function benchmarkSuites(): Array<{ suite: BenchmarkRailSuite; categories: BenchmarkRailCategory[] }> {
  return [
    { suite: "all", categories: allCategories() },
    ...Object.entries(categorySuites).map(([suite, categories]) => ({
      suite: suite as BenchmarkRailSuite,
      categories
    }))
  ];
}

export function renderBenchmarkList(): string {
  return [
    "SotuRail bench list",
    "schemaVersion: soturail.bench.v1",
    "suite_labels: all, brain, reducers, filesystem, release",
    "",
    ...benchmarkSuites().flatMap((suite) => [
      `## ${suite.suite}`,
      ...suite.categories.map((category) => `- ${category}`),
      ""
    ]),
    "Rules:",
    "- Benchmarks are local and deterministic smoke fixtures by default.",
    "- Timing values are evidence, not release claims by themselves.",
    "- Native acceleration remains optional and benchmark-gated."
  ].join("\n") + "\n";
}

export async function runBenchmarkRail(root = process.cwd(), suite: BenchmarkRailSuite = "all"): Promise<BenchmarkRailReport> {
  await ensureWorkspace(root);
  const native = await detectNativeEngine(root);
  const fixtureRoot = await createBenchmarkProject();
  const categories = suite === "all" ? allCategories() : categorySuites[suite];
  const cases: BenchmarkRailCase[] = [];
  for (const category of categories) {
    cases.push(await runCase(category, fixtureRoot));
  }
  const report: BenchmarkRailReport = {
    schemaVersion: "soturail.bench.v1",
    id: `bench_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    suite,
    version: SOTURAIL_VERSION,
    environment: {
      platform: `${process.platform}/${process.arch}`,
      node: process.version,
      nativeAvailable: native.available,
      engine: "typescript"
    },
    cases,
    summary: {
      passed: cases.filter((item) => item.status === "passed").length,
      failed: cases.filter((item) => item.status === "failed").length,
      warnings: cases.filter((item) => item.status === "warning").length + cases.reduce((sum, item) => sum + item.warnings.length, 0),
      totalDurationMs: Number(cases.reduce((sum, item) => sum + item.durationMs, 0).toFixed(3))
    }
  };
  await writeBenchmarkRailReports(root, report);
  return report;
}

export async function readBenchmarkRailReport(root = process.cwd()): Promise<string> {
  const latest = path.join(getWorkspacePaths(root).workspace, "bench", "latest.md");
  const markdown = await fs.readFile(latest, "utf8").catch(() => "");
  if (markdown) return `${await benchmarkReportPreamble(root)}${markdown}`;
  return fs.readFile(path.join(root, "benchmarks", "reports", "latest.md"), "utf8")
    .catch(() => "No benchmark report found. Run: soturail bench run\n");
}

export async function compareBenchmarkRail(root = process.cwd()): Promise<string> {
  const latestPath = path.join(getWorkspacePaths(root).workspace, "bench", "latest.json");
  const latest = await fs.readFile(latestPath, "utf8").catch(() => "");
  if (!latest) {
    return "SotuRail bench compare\nresult: no latest benchmark report\nnext: soturail bench run --suite brain\n";
  }
  const report = JSON.parse(latest) as BenchmarkRailReport;
  const candidateRows = report.cases.map((item) => {
    const classification = item.durationMs >= 25 || item.recordsRead >= 50 || item.filesScanned >= 30 ? "candidate" : "baseline";
    return `- ${item.category}: ${classification} (${item.durationMs}ms, records_read=${item.recordsRead}, files_scanned=${item.filesScanned})`;
  });
  return [
    "SotuRail bench compare",
    `latest: ${relativeToRoot(root, latestPath)}`,
    `suite: ${report.suite}`,
    `report_version: ${report.version}`,
    `cases: ${report.cases.length}`,
    "comparison: latest local TypeScript baseline only",
    "native_claim: no native speedup claimed without a native report",
    "note: timing is evidence, not a release claim by itself",
    "",
    ...candidateRows,
    ""
  ].join("\n");
}

export function renderBenchmarkRun(report: BenchmarkRailReport, root = process.cwd()): string {
  const paths = benchmarkReportPaths(root);
  return [
    "SotuRail bench run",
    `schemaVersion: ${report.schemaVersion}`,
    `suite: ${report.suite}`,
    `version: ${report.version}`,
    `cases_count: ${report.cases.length}`,
    `passed: ${report.summary.passed}`,
    `failed: ${report.summary.failed}`,
    `warnings: ${report.summary.warnings}`,
    `totalDurationMs: ${report.summary.totalDurationMs}`,
    `json: ${relativeToRoot(root, paths.latestJson)}`,
    `markdown: ${relativeToRoot(root, paths.latestMd)}`,
    `versioned_json: ${relativeToRoot(root, paths.versionedJson)}`,
    `versioned_markdown: ${relativeToRoot(root, paths.versionedMd)}`
  ].join("\n") + "\n";
}

async function benchmarkReportPreamble(root: string): Promise<string> {
  const jsonPath = path.join(getWorkspacePaths(root).workspace, "bench", "latest.json");
  const raw = await fs.readFile(jsonPath, "utf8").catch(() => "");
  if (!raw) return "";
  try {
    const report = JSON.parse(raw) as BenchmarkRailReport;
    const ageMs = Math.max(0, Date.now() - Date.parse(report.createdAt));
    const ageHours = Number((ageMs / 3_600_000).toFixed(2));
    const stale = report.version !== SOTURAIL_VERSION || ageHours > 24;
    return [
      "SotuRail bench report",
      `current_cli_version: ${SOTURAIL_VERSION}`,
      `report_version: ${report.version}`,
      `report_age_hours: ${ageHours}`,
      `stale_benchmark_warning: ${stale}`,
      "note: timing is evidence, not a release claim by itself.",
      ""
    ].join("\n");
  } catch {
    return "SotuRail bench report\nstale_benchmark_warning: true\nreason: latest benchmark JSON is not parseable\n\n";
  }
}

export function parseBenchmarkSuite(value: string | undefined): BenchmarkRailSuite {
  if (!value || value === "all") return "all";
  if (value === "brain" || value === "reducers" || value === "filesystem" || value === "release") return value;
  throw new Error(`Unknown benchmark suite "${value}". Supported: all, brain, reducers, filesystem, release.`);
}

async function runCase(category: BenchmarkRailCategory, root: string): Promise<BenchmarkRailCase> {
  const start = performance.now();
  try {
    const details = await caseOperation(category, root);
    return {
      id: `${category}-small`,
      category,
      operation: operationName(category),
      durationMs: elapsed(start),
      recordsRead: details.recordsRead,
      recordsWritten: details.recordsWritten,
      filesScanned: details.filesScanned,
      engine: "typescript",
      status: details.warnings.length > 0 ? "warning" : "passed",
      warnings: details.warnings
    };
  } catch (error) {
    return {
      id: `${category}-small`,
      category,
      operation: operationName(category),
      durationMs: elapsed(start),
      recordsRead: 0,
      recordsWritten: 0,
      filesScanned: 0,
      engine: "typescript",
      status: "failed",
      warnings: [error instanceof Error ? error.message : String(error)]
    };
  }
}

async function caseOperation(category: BenchmarkRailCategory, root: string): Promise<{ recordsRead: number; recordsWritten: number; filesScanned: number; warnings: string[] }> {
  switch (category) {
    case "brain-scan": {
      const result = await scanBrain(root);
      return { recordsRead: 0, recordsWritten: result.claimsAdded, filesScanned: 8, warnings: [] };
    }
    case "brain-stale": {
      await scanBrain(root);
      await fs.appendFile(path.join(root, "src", "core", "release-preflight.ts"), "\n// benchmark drift\n", "utf8");
      const result = await staleBrain(root);
      return { recordsRead: result.freshness.checkedRecords, recordsWritten: result.freshness.events.length, filesScanned: 1, warnings: result.freshness.warnings };
    }
    case "brain-consolidate": {
      await scanBrain(root);
      const paths = getWorkspacePaths(root);
      const claims = await readJsonl<Record<string, unknown>>(paths.brainClaimsFile);
      const first = claims[0];
      if (first) await appendJsonl(paths.brainClaimsFile, { ...first, id: "claim_bench_duplicate" });
      const result = await consolidateBrain(root, { dryRun: true });
      return { recordsRead: result.report.claimsRead, recordsWritten: result.report.canonicalClaims, filesScanned: 0, warnings: [] };
    }
    case "reverse-claims": {
      const result = await reverseClaims("./src", root);
      return { recordsRead: result.claims.length, recordsWritten: result.claims.length, filesScanned: 6, warnings: [] };
    }
    case "reducer-large-log": {
      const raw = Array.from({ length: 220 }, (_, index) => `FAIL tests/unit-${index}.test.ts AssertionError at src/app.ts:${index + 1}`).join("\n");
      const reduced = await compressOutputWithEngine("vitest run", raw, "bench-v090-reducer", "ts", root);
      return { recordsRead: 1, recordsWritten: 1, filesScanned: 0, warnings: reduced.summary.includes("AssertionError") ? [] : ["reducer summary did not preserve AssertionError"] };
    }
    case "jsonl-read-write": {
      const file = path.join(getWorkspacePaths(root).workspace, "bench", "jsonl-fixture.jsonl");
      for (let index = 0; index < 12; index += 1) await appendJsonl(file, { index, value: `record-${index}` });
      const records = await readJsonl<Record<string, unknown>>(file);
      return { recordsRead: records.length, recordsWritten: 12, filesScanned: 1, warnings: records.length === 12 ? [] : ["jsonl record count mismatch"] };
    }
    case "range-hash": {
      const text = await fs.readFile(path.join(root, "src", "core", "release-preflight.ts"), "utf8");
      const hashes = Array.from({ length: 20 }, (_, index) => sha256Text(text.slice(index, index + 120)));
      return { recordsRead: hashes.length, recordsWritten: hashes.length, filesScanned: 1, warnings: hashes.every(Boolean) ? [] : ["empty hash"] };
    }
    case "file-scan": {
      const repo = await scanRepository(root, defaultConfig);
      return { recordsRead: repo.files.length, recordsWritten: repo.files.length, filesScanned: repo.total_files, warnings: [] };
    }
    case "workflow-evidence": {
      const plan = await createWorkflowPlan("Benchmark workflow evidence", root);
      const evidence = await buildWorkflowEvidence(plan.record.id, root);
      return { recordsRead: 1, recordsWritten: 1, filesScanned: evidence.content.includes("Workflow") ? 1 : 0, warnings: [] };
    }
    case "format-compare": {
      const file = path.join(root, "payload.json");
      await fs.writeFile(file, JSON.stringify({ evidence: "ERR_BENCH", command: "npm test", items: [1, 2, 3] }, null, 2), "utf8");
      const report = await compareFormats("payload.json", root);
      return { recordsRead: 1, recordsWritten: 1, filesScanned: 1, warnings: report.warnings };
    }
    case "json-validate": {
      await fs.writeFile(path.join(root, "payload.json"), "{\"ok\":true,\"items\":[1,2,3]}\n", "utf8");
      const result = await validateJsonFile("payload.json", { strict: true }, root);
      return { recordsRead: 1, recordsWritten: 1, filesScanned: 1, warnings: result.result === "pass" ? [] : result.probableSecrets };
    }
    case "release-preflight": {
      const result = await runReleasePreflight(root, { runAudit: false, runPack: false, cliCommand: [process.execPath, path.join(root, "dist", "cli.js"), "--version"] });
      return { recordsRead: result.gates.length, recordsWritten: result.gates.length, filesScanned: 6, warnings: result.ok ? [] : result.gates.filter((gate) => !gate.ok).map((gate) => gate.id) };
    }
  }
}

async function writeBenchmarkRailReports(root: string, report: BenchmarkRailReport): Promise<void> {
  const paths = benchmarkReportPaths(root);
  await fs.mkdir(path.dirname(paths.latestJson), { recursive: true });
  await fs.mkdir(path.dirname(paths.versionedJson), { recursive: true });
  await writeJson(paths.latestJson, report);
  await fs.writeFile(paths.latestMd, renderBenchmarkMarkdown(report, root), "utf8");
  await writeJson(paths.versionedJson, report);
  await fs.writeFile(paths.versionedMd, renderBenchmarkMarkdown(report, root), "utf8");
}

function benchmarkReportPaths(root: string): { latestJson: string; latestMd: string; versionedJson: string; versionedMd: string } {
  return {
    latestJson: path.join(getWorkspacePaths(root).workspace, "bench", "latest.json"),
    latestMd: path.join(getWorkspacePaths(root).workspace, "bench", "latest.md"),
    versionedJson: path.join(root, "benchmarks", "reports", `bench-v${SOTURAIL_VERSION}.json`),
    versionedMd: path.join(root, "benchmarks", "reports", `bench-v${SOTURAIL_VERSION}.md`)
  };
}

function renderBenchmarkMarkdown(report: BenchmarkRailReport, root: string): string {
  return [
    "# SotuRail Benchmark Rail 2 Report",
    "",
    "SotuRail does not claim native speedups unless a local benchmark report proves them.",
    "Native acceleration is optional. TypeScript remains the portable baseline.",
    "",
    `schemaVersion: ${report.schemaVersion}`,
    `id: ${report.id}`,
    `suite: ${report.suite}`,
    `version: ${report.version}`,
    `createdAt: ${report.createdAt}`,
    `platform: ${report.environment.platform}`,
    `node: ${report.environment.node}`,
    `nativeAvailable: ${report.environment.nativeAvailable}`,
    `engine: ${report.environment.engine}`,
    `passed: ${report.summary.passed}`,
    `failed: ${report.summary.failed}`,
    `warnings: ${report.summary.warnings}`,
    `totalDurationMs: ${report.summary.totalDurationMs}`,
    "",
    "| case | category | operation | durationMs | recordsRead | recordsWritten | filesScanned | engine | status | warnings |",
    "|---|---|---|---:|---:|---:|---:|---|---|---|",
    ...report.cases.map((item) =>
      `| ${item.id} | ${item.category} | ${item.operation} | ${item.durationMs} | ${item.recordsRead} | ${item.recordsWritten} | ${item.filesScanned} | ${item.engine} | ${item.status} | ${item.warnings.join("; ") || "none"} |`
    ),
    "",
    "## Report Paths",
    "",
    `- latest_json: ${relativeToRoot(root, benchmarkReportPaths(root).latestJson)}`,
    `- latest_markdown: ${relativeToRoot(root, benchmarkReportPaths(root).latestMd)}`,
    `- versioned_json: ${relativeToRoot(root, benchmarkReportPaths(root).versionedJson)}`,
    `- versioned_markdown: ${relativeToRoot(root, benchmarkReportPaths(root).versionedMd)}`,
    ""
  ].join("\n");
}

async function createBenchmarkProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-bench-v090-"));
  await fs.mkdir(path.join(root, "src", "core"), { recursive: true });
  await fs.mkdir(path.join(root, "src", "commands"), { recursive: true });
  await fs.mkdir(path.join(root, "docs", "releases"), { recursive: true });
  await fs.mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await fs.mkdir(path.join(root, "dist"), { recursive: true });
  await fs.writeFile(path.join(root, "README.md"), "npx soturail --help\nnpm install -g soturail\nsoturail --version\n", "utf8");
  await fs.writeFile(path.join(root, "CHANGELOG.md"), "## [0.9.0]\n\n- Benchmark fixture.\n", "utf8");
  await fs.writeFile(path.join(root, "LICENSE"), "MIT\n", "utf8");
  await fs.writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail", version: "0.9.0", engines: { node: ">=20" } }, null, 2), "utf8");
  await fs.writeFile(path.join(root, "package-lock.json"), JSON.stringify({ name: "soturail", version: "0.9.0", lockfileVersion: 3, packages: { "": { name: "soturail", version: "0.9.0" } } }, null, 2), "utf8");
  await fs.writeFile(path.join(root, "dist", "cli.js"), "if (process.argv.includes('--version')) console.log('0.9.0');\n", "utf8");
  await fs.writeFile(path.join(root, ".github", "workflows", "ci.yml"), "name: ci\n", "utf8");
  await fs.writeFile(path.join(root, "src", "cli.ts"), "registerBrainCommand(program);\nregisterReverseCommand(program);\nregisterWorkflowCommand(program);\n", "utf8");
  await fs.writeFile(path.join(root, "src", "core", "version.ts"), "export const SOTURAIL_VERSION = \"0.9.0\";\n", "utf8");
  await fs.writeFile(path.join(root, "src", "core", "release-preflight.ts"), "export const releaseNotesPath = \"docs/releases/RELEASE_NOTES_v0.9.0.md\";\n", "utf8");
  await fs.writeFile(path.join(root, "src", "core", "agent-runtime.ts"), "export const policy = \"No arbitrary shell execution through MCP by default.\";\n", "utf8");
  await fs.writeFile(path.join(root, "src", "core", "workflow-store.ts"), "export const workflowStorage = \".soturail/workflows/\";\n", "utf8");
  await fs.writeFile(path.join(root, "src", "core", "diagram-validator.ts"), "export const diagramNote = \"lightweight Mermaid validation, not a full parser\";\n", "utf8");
  await fs.writeFile(path.join(root, "src", "commands", "brain.ts"), "program.command(\"brain\");\n", "utf8");
  await fs.writeFile(path.join(root, "src", "commands", "reverse.ts"), "program.command(\"reverse\");\n", "utf8");
  await fs.writeFile(path.join(root, "docs", "releases", "README.md"), "# Release Notes\n\nRelease notes live under docs/releases/.\n", "utf8");
  await fs.writeFile(path.join(root, "docs", "releases", "RELEASE_NOTES_v0.9.0.md"), "# Notes\n", "utf8");
  await ensureWorkspace(root);
  return root;
}

function allCategories(): BenchmarkRailCategory[] {
  return [...new Set(Object.values(categorySuites).flat())];
}

function operationName(category: BenchmarkRailCategory): string {
  return category.replace(/-/g, " ");
}

function elapsed(start: number): number {
  return Number(Math.max(0, performance.now() - start).toFixed(3));
}
