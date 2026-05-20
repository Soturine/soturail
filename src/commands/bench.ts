import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";
import type { Command } from "commander";
import { reduceAgentResponse } from "../compressors/agent-response-reducer.js";
import { compressOutputWithEngine } from "../compressors/index.js";
import { ensureWorkspace, writeJson } from "../core/config.js";
import { ingestDocument } from "../core/document-ingest.js";
import { MetricsStore } from "../core/metrics-store.js";
import { detectNativeEngine, type ReducerEngine } from "../core/native-engine.js";
import { extractRules } from "../core/rule-extractor.js";
import { estimateTokens } from "../core/token-estimator.js";
import { validateRules } from "../core/rule-validator.js";

const execFileAsync = promisify(execFile);

interface BenchOptions {
  engine?: ReducerEngine;
  tool?: string;
}

interface BenchResult {
  name: string;
  category: "terminal_compression" | "agent_response_compression" | "json_tool_payload_compression" | "knowledge_structuring" | "native_performance";
  engine: string;
  raw_bytes: number;
  reduced_bytes: number;
  estimated_raw_tokens: number;
  estimated_reduced_tokens: number;
  compression_ratio_percent: number | null;
  wall_time_ms: number;
  preserved_error_lines_count: number;
  preserved_file_paths_count: number;
  raw_id: string | null;
  raw_sha256: string;
  reduced_sha256: string;
  quality_passed: boolean;
  details: Record<string, unknown>;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

interface BenchmarkDirs {
  fixtures: string;
  results: string;
  reports: string;
}

function benchDirs(root: string): BenchmarkDirs {
  return {
    fixtures: path.resolve(root, "benchmarks", "fixtures"),
    results: path.resolve(root, "benchmarks", "results"),
    reports: path.resolve(root, "benchmarks", "reports")
  };
}

async function writeFixture(root: string, name: string, content: string): Promise<void> {
  const dirs = benchDirs(root);
  await fs.mkdir(dirs.fixtures, { recursive: true });
  await fs.writeFile(path.resolve(dirs.fixtures, name), content, "utf8");
}

export async function prepareBenchmarks(root = process.cwd()): Promise<string> {
  const gitDiff = [
    "On branch main",
    "Changes not staged for commit:",
    " modified: src/app.ts",
    " deleted: src/old.ts",
    "diff --git a/src/app.ts b/src/app.ts",
    "index 1111111..2222222 100644",
    "--- a/src/app.ts",
    "+++ b/src/app.ts",
    "@@ -1,3 +1,5 @@",
    " export function app() {",
    "-  return 1;",
    "+  return 2;",
    "+  console.log('changed');",
    " }",
    ...Array.from({ length: 300 }, (_, index) => `+ repeated diff noise ${index}`)
  ].join("\n");
  const testOutput = [
    "FAIL tests/app.test.ts > app > returns expected value",
    "AssertionError: expected 1 to equal 2",
    "Expected: 2",
    "Received: 1",
    "    at tests/app.test.ts:12:10",
    "Traceback (most recent call last):",
    "  File \"tests/test_app.py\", line 7, in test_app",
    "AssertionError: boom",
    ...Array.from({ length: 250 }, () => "PASS tests/noise.test.ts")
  ].join("\n");
  const noisyJson = JSON.stringify({
    status: "error",
    message: "Permission denied",
    path: "src/app.ts",
    items: Array.from({ length: 120 }, (_, index) => ({ id: index, ok: index !== 77, error: index === 77 ? "timeout" : null }))
  }, null, 2);
  const noisyLog = [
    ...Array.from({ length: 150 }, () => "server ok healthcheck passed"),
    "WARN permission refused for src/secret.ts:4",
    "ERROR timeout while reading src/app.ts:22",
    ...Array.from({ length: 150 }, () => "server ok healthcheck passed")
  ].join("\n");
  const largeCode = [
    ...Array.from({ length: 80 }, (_, index) => `export function helper${index}() { return ${index}; }`),
    "export class CriticalService { run() { return 'ok'; } }",
    ...Array.from({ length: 80 }, (_, index) => `def py_helper_${index}(): return ${index}`),
    "public class App { public void run() {} }"
  ].join("\n");
  const verboseAi = [
    "I think the main issue is probably that tests are failing because src/app.ts:12 returns the wrong value.",
    "Security warning: do not run rm -rf or git push automatically.",
    "Run npm test after changing src/app.ts.",
    "```ts",
    "export function app() {",
    "  return 2;",
    "}",
    "```",
    ...Array.from({ length: 40 }, () => "Basically, this is just extra explanation that can be shorter.")
  ].join("\n");
  const rulesDoc = [
    "# Runtime",
    "- Project must run on Node.js 20 or newer.",
    "- README.md must include a section named Quick start.",
    "- LICENSE must be present.",
    "- .github/workflows/ci.yml is required for CI workflow.",
    "# Security",
    "- git push must never be run automatically through soturail run."
  ].join("\n");

  await writeFixture(root, "noisy-git-diff.txt", gitDiff);
  await writeFixture(root, "noisy-test-output.txt", testOutput);
  await writeFixture(root, "noisy-json.json", noisyJson);
  await writeFixture(root, "noisy-log.txt", noisyLog);
  await writeFixture(root, "large-code-file.txt", largeCode);
  await writeFixture(root, "verbose-ai-answer.md", verboseAi);
  await writeFixture(root, "rules-doc.md", rulesDoc);

  return "Benchmark fixtures prepared in benchmarks/fixtures.\n";
}

async function readFixture(root: string, name: string): Promise<string> {
  return fs.readFile(path.resolve(benchDirs(root).fixtures, name), "utf8");
}

function compressionPercent(rawTokens: number, reducedTokens: number): number {
  return rawTokens === 0 ? 0 : Number((((rawTokens - reducedTokens) / rawTokens) * 100).toFixed(2));
}

async function terminalResult(root: string, fixture: string, command: string, engine: ReducerEngine): Promise<BenchResult> {
  const raw = await readFixture(root, fixture);
  const start = performance.now();
  const reduced = await compressOutputWithEngine(command, raw, `bench-${fixture}`, engine, root);
  const wall = performance.now() - start;
  const text = reduced.summary;
  const rawTokens = estimateTokens(raw);
  const reducedTokens = estimateTokens(text);
  const quality = qualityCheck(fixture, text);
  if (!quality.ok) {
    throw new Error(`Benchmark quality check failed for ${fixture}: ${quality.reason}`);
  }
  return {
    name: fixture,
    category: "terminal_compression",
    engine: reduced.engine,
    raw_bytes: Buffer.byteLength(raw),
    reduced_bytes: Buffer.byteLength(text),
    estimated_raw_tokens: rawTokens,
    estimated_reduced_tokens: reducedTokens,
    compression_ratio_percent: compressionPercent(rawTokens, reducedTokens),
    wall_time_ms: Number(wall.toFixed(3)),
    preserved_error_lines_count: (text.match(/\b(error|warn|fail|assertion|timeout|denied|refused)\b/gi) ?? []).length,
    preserved_file_paths_count: (text.match(/(?:src|tests)[\\/][\w.-]+(?::\d+(?::\d+)?)?/g) ?? []).length,
    raw_id: null,
    raw_sha256: sha256(raw),
    reduced_sha256: sha256(text),
    quality_passed: true,
    details: { compressor: reduced.compressor }
  };
}

async function jsonResult(root: string, engine: ReducerEngine): Promise<BenchResult> {
  const raw = await readFixture(root, "noisy-json.json");
  const start = performance.now();
  const reduced = await compressOutputWithEngine("cat output.json", raw, "bench-noisy-json", engine, root);
  const wall = performance.now() - start;
  const text = reduced.summary;
  const rawTokens = estimateTokens(raw);
  const reducedTokens = estimateTokens(text);
  const quality = qualityCheck("noisy-json.json", text);
  if (!quality.ok) {
    throw new Error(`Benchmark quality check failed for noisy-json.json: ${quality.reason}`);
  }
  return {
    name: "noisy-json.json",
    category: "json_tool_payload_compression",
    engine: reduced.engine,
    raw_bytes: Buffer.byteLength(raw),
    reduced_bytes: Buffer.byteLength(text),
    estimated_raw_tokens: rawTokens,
    estimated_reduced_tokens: reducedTokens,
    compression_ratio_percent: compressionPercent(rawTokens, reducedTokens),
    wall_time_ms: Number(wall.toFixed(3)),
    preserved_error_lines_count: (text.match(/\b(error|denied|timeout|permission)\b/gi) ?? []).length,
    preserved_file_paths_count: (text.match(/src[\\/][\w.-]+(?::\d+(?::\d+)?)?/g) ?? []).length,
    raw_id: null,
    raw_sha256: sha256(raw),
    reduced_sha256: sha256(text),
    quality_passed: true,
    details: reduced.details ?? {}
  };
}

function qualityCheck(fixture: string, text: string): { ok: boolean; reason?: string } {
  if (fixture.includes("test") && (!text.includes("AssertionError") || !text.includes("tests/app.test.ts"))) {
    return { ok: false, reason: "test assertion or path missing" };
  }
  if (fixture.includes("git") && (!text.includes("src/app.ts") || !text.includes("@@ -1,3 +1,5 @@"))) {
    return { ok: false, reason: "git path or hunk missing" };
  }
  if (fixture.includes("json") && (!text.includes("Permission denied") || !text.includes("timeout"))) {
    return { ok: false, reason: "JSON error primitives missing" };
  }
  if (fixture.includes("log") && (!text.includes("permission refused") || !text.includes("src/app.ts:22"))) {
    return { ok: false, reason: "log signal missing" };
  }
  return { ok: true };
}

async function responseResult(root: string, mode: "concise" | "review" | "debug" | "commit" | "docs"): Promise<BenchResult> {
  const raw = await readFixture(root, "verbose-ai-answer.md");
  const start = performance.now();
  const reduced = reduceAgentResponse(raw, mode);
  const wall = performance.now() - start;
  return {
    name: `verbose-ai-answer-${mode}`,
    category: "agent_response_compression",
    engine: "ts",
    raw_bytes: Buffer.byteLength(raw),
    reduced_bytes: Buffer.byteLength(reduced.output),
    estimated_raw_tokens: reduced.raw_tokens,
    estimated_reduced_tokens: reduced.compressed_tokens,
    compression_ratio_percent: reduced.reduction_percent,
    wall_time_ms: Number(wall.toFixed(3)),
    preserved_error_lines_count: 0,
    preserved_file_paths_count: reduced.preserved_paths_count,
    raw_id: null,
    raw_sha256: sha256(raw),
    reduced_sha256: sha256(reduced.output),
    quality_passed: reduced.output.includes("npm test") && reduced.output.includes("Security warning"),
    details: {
      mode,
      preserved_commands_count: reduced.preserved_commands_count,
      preserved_code_blocks_count: reduced.preserved_code_blocks_count,
      preserved_security_warnings_count: reduced.preserved_security_warnings_count
    }
  };
}

async function rulesResult(root: string): Promise<BenchResult> {
  const raw = await readFixture(root, "rules-doc.md");
  const fixturePath = path.resolve(benchDirs(root).fixtures, "rules-doc.md");
  const start = performance.now();
  const document = await ingestDocument(fixturePath, "requirements", root);
  const rules = extractRules(document);
  const checks = await validateRules(rules, root);
  const output = JSON.stringify({ rules, checks }, null, 2);
  const wall = performance.now() - start;
  return {
    name: "rules-doc-extraction",
    category: "knowledge_structuring",
    engine: "ts",
    raw_bytes: Buffer.byteLength(raw),
    reduced_bytes: Buffer.byteLength(output),
    estimated_raw_tokens: estimateTokens(raw),
    estimated_reduced_tokens: estimateTokens(output),
    compression_ratio_percent: null,
    wall_time_ms: Number(wall.toFixed(3)),
    preserved_error_lines_count: 0,
    preserved_file_paths_count: (output.match(/\bREADME\.md|LICENSE|ci\.yml/g) ?? []).length,
    raw_id: null,
    raw_sha256: sha256(raw),
    reduced_sha256: sha256(output),
    quality_passed: rules.length >= 3,
    details: {
      extracted_rules_count: rules.length,
      raw_document_tokens: estimateTokens(raw),
      structured_rule_tokens: estimateTokens(output),
      reuse_value_note: "Structured rules may be larger than the seed document but are reusable, citable and validator-friendly.",
      validator_success_count: checks.filter((check) => check.ok).length,
      validator_failure_count: checks.filter((check) => !check.ok).length,
      citations_count: rules.length,
      source_sections_preserved_count: new Set(rules.map((rule) => rule.source_section)).size,
      manual_expansion_count: 0
    }
  };
}

export async function runBenchmarks(options: BenchOptions = {}, root = process.cwd()): Promise<BenchResult[]> {
  await ensureWorkspace(root);
  await prepareBenchmarks(root);
  const engine = options.engine ?? "ts";
  if (engine === "native" && !(await detectNativeEngine(root)).available) {
    const dirs = benchDirs(root);
    await fs.mkdir(dirs.results, { recursive: true });
    await fs.mkdir(dirs.reports, { recursive: true });
    const report = [
      "# SotuRail Benchmark Report",
      "",
      "Native engine was requested but `soturail-native` is not available. Build it with `npm run build:native`.",
      ""
    ].join("\n");
    await writeJson(path.resolve(dirs.results, "latest.json"), { generated_at: new Date().toISOString(), engine, native_available: false, results: [] });
    await fs.writeFile(path.resolve(dirs.reports, "latest.md"), report, "utf8");
    return [];
  }
  const results = [
    await terminalResult(root, "noisy-git-diff.txt", "git diff", engine),
    await terminalResult(root, "noisy-test-output.txt", "npm test", engine),
    await terminalResult(root, "noisy-log.txt", "docker logs app", engine),
    await jsonResult(root, engine),
    await responseResult(root, "concise"),
    await responseResult(root, "review"),
    await responseResult(root, "debug"),
    await responseResult(root, "commit"),
    await responseResult(root, "docs"),
    await rulesResult(root)
  ];
  const dirs = benchDirs(root);
  await fs.mkdir(dirs.results, { recursive: true });
  await fs.mkdir(dirs.reports, { recursive: true });
  await writeJson(path.resolve(dirs.results, "latest.json"), { generated_at: new Date().toISOString(), engine, results });
  await fs.writeFile(path.resolve(dirs.reports, "latest.md"), renderReport(results), "utf8");
  await new MetricsStore(root).append({ type: "bench_run", details: { engine, results_count: results.length } });
  return results;
}

export async function compareEngines(root = process.cwd()): Promise<string> {
  const native = await detectNativeEngine(root);
  if (!native.available) {
    return "Native engine not available. Build it with npm run build:native before comparing engines.\n";
  }
  const tsResults = await runBenchmarks({ engine: "ts" }, root);
  const nativeResults = await runBenchmarks({ engine: "native" }, root);
  const rows = tsResults.map((tsResult) => {
    const nativeResult = nativeResults.find((item) => item.name === tsResult.name && item.category === tsResult.category);
    if (!nativeResult) {
      return `| ${tsResult.name} | ${tsResult.category} | n/a | n/a | n/a |`;
    }
    const speedup = nativeResult.wall_time_ms === 0
      ? 0
      : Number((((tsResult.wall_time_ms - nativeResult.wall_time_ms) / tsResult.wall_time_ms) * 100).toFixed(2));
    return `| ${tsResult.name} | ${tsResult.category} | ${tsResult.wall_time_ms} | ${nativeResult.wall_time_ms} | ${speedup}% |`;
  });
  const report = [
    "# SotuRail Engine Comparison",
    "",
    "| Fixture | Category | TypeScript wall_time_ms | Native wall_time_ms | speedup_percent |",
    "|---|---|---:|---:|---:|",
    ...rows,
    ""
  ].join("\n");
  const reportPath = path.resolve(benchDirs(root).reports, "engine-comparison.md");
  await fs.writeFile(reportPath, report, "utf8");
  return `${reportPath}\n`;
}

export async function reportBenchmarks(root = process.cwd()): Promise<string> {
  const reportPath = path.resolve(benchDirs(root).reports, "latest.md");
  return fs.readFile(reportPath, "utf8").catch(() => "No benchmark report found. Run soturail bench run first.\n");
}

function renderReport(results: BenchResult[]): string {
  const grouped = groupByCategory(results);
  const rows = results.map((result) =>
    `| ${result.name} | ${result.category} | ${result.engine} | ${result.estimated_raw_tokens} | ${result.estimated_reduced_tokens} | ${result.compression_ratio_percent === null ? "n/a" : `${result.compression_ratio_percent}%`} | ${result.wall_time_ms} | ${result.quality_passed ? "pass" : "fail"} |`
  );
  return [
    "# SotuRail Benchmark Report",
    "",
    "Generated from deterministic local fixtures. No external RTK/Squeez comparison numbers are included unless a user runs optional comparison locally.",
    "",
    "Categories:",
    ...Object.entries(grouped).map(([category, count]) => `- ${category}: ${count} case(s)`),
    "",
    "| Fixture | Category | Engine | Raw tokens | Reduced/structured tokens | compression_ratio_percent | wall_time_ms | Quality |",
    "|---|---|---:|---:|---:|---:|---:|---|",
    ...rows,
    "",
    "Includes terminal compression, agent response compression, JSON/tool payload compression, knowledge structuring and native performance readiness cases.",
    "",
    "Knowledge-to-Rules is reported as reusable structuring, not pure compression."
  ].join("\n") + "\n";
}

function groupByCategory(results: BenchResult[]): Record<string, number> {
  return results.reduce<Record<string, number>>((acc, result) => {
    acc[result.category] = (acc[result.category] ?? 0) + 1;
    return acc;
  }, {});
}

export async function compareOptional(tool: string, root = process.cwd()): Promise<string> {
  if (!["rtk", "squeez"].includes(tool)) {
    throw new Error("Optional comparison tool must be rtk or squeez.");
  }
  const locator = process.platform === "win32" ? "where" : "which";
  try {
    const { stdout } = await execFileAsync(locator, [tool], { cwd: root, windowsHide: true, timeout: 3000 });
    return `Optional tool detected: ${tool}\nPath: ${stdout.trim().split(/\r?\n/)[0]}\nRun comparison manually with your chosen fixture; SotuRail does not install or depend on ${tool}.\n`;
  } catch {
    return `Optional tool not found on PATH: ${tool}. No comparison was run.\n`;
  }
}

export function registerBenchCommand(program: Command): void {
  const bench = program.command("bench").description("Run reproducible local SotuRail benchmarks.");
  bench.command("prepare").description("Generate deterministic benchmark fixtures.").action(async () => {
    process.stdout.write(await prepareBenchmarks());
  });
  bench.command("run").description("Run benchmarks and write latest JSON/Markdown reports.").option("--engine <engine>", "ts, native, or auto", "ts").action(async (options: BenchOptions) => {
    const results = await runBenchmarks(options);
    process.stdout.write(`Benchmark results written: ${results.length} cases\nbenchmarks/results/latest.json\nbenchmarks/reports/latest.md\n`);
  });
  bench.command("report").description("Print the latest benchmark report.").action(async () => {
    process.stdout.write(await reportBenchmarks());
  });
  bench.command("compare-optional").description("Detect optional external comparison tool without installing it.").option("--tool <tool>", "rtk or squeez").action(async (options: BenchOptions) => {
    process.stdout.write(await compareOptional(options.tool ?? ""));
  });
  bench.command("compare-engines").description("Compare TypeScript and native engines when native is available.").action(async () => {
    process.stdout.write(await compareEngines());
  });
}
