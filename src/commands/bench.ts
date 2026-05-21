import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";
import type { Command } from "commander";
import { reduceAgentResponse } from "../compressors/agent-response-reducer.js";
import { compressOutputWithEngine } from "../compressors/index.js";
import { buildCachePayload } from "../core/cache-normalizer.js";
import { buildContextPack } from "../core/context-pack.js";
import { ensureWorkspace, writeJson } from "../core/config.js";
import { ingestDocument } from "../core/document-ingest.js";
import { exportHook } from "./hooks.js";
import { approveMemory, listMemory, proposeMemory } from "./memory.js";
import { MetricsStore } from "../core/metrics-store.js";
import { mcpManifest } from "../core/mcp-server.js";
import { readMcpResource } from "../core/mcp-resources.js";
import { detectNativeEngine, type ReducerEngine } from "../core/native-engine.js";
import { extractRules } from "../core/rule-extractor.js";
import { estimateTokens } from "../core/token-estimator.js";
import { validateRules } from "../core/rule-validator.js";
import { createSkill } from "../core/skill-store.js";
import { exportSkills } from "../core/skill-exporter.js";
import { validateSkills } from "../core/skill-validator.js";
import { SOTURAIL_VERSION } from "../core/version.js";

const execFileAsync = promisify(execFile);

interface BenchOptions {
  engine?: ReducerEngine;
  tool?: string;
}

export type BenchmarkCategory =
  | "terminal_compression"
  | "agent_response_compression"
  | "knowledge_structuring"
  | "cache_stability"
  | "native_engine"
  | "skill_rail"
  | "mcp"
  | "context_pack"
  | "agent_integration"
  | "memory_workflow";

export interface BenchResult {
  case_id: string;
  name: string;
  category: BenchmarkCategory;
  engine: string;
  raw_bytes: number;
  reduced_bytes: number;
  raw_tokens: number;
  reduced_tokens: number;
  reduction_percent: number | null;
  estimated_raw_tokens: number;
  estimated_reduced_tokens: number;
  compression_ratio_percent: number | null;
  runtime_ms: number;
  wall_time_ms: number;
  quality_passed: boolean;
  preserved_errors_count: number;
  preserved_paths_count: number;
  preserved_commands_count: number;
  preserved_error_lines_count: number;
  preserved_file_paths_count: number;
  raw_id: string | null;
  raw_sha256: string;
  reduced_sha256: string;
  notes: string;
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
  const npmInstall = [
    "npm WARN deprecated left-pad@1.3.0: use String.prototype.padStart()",
    "added 421 packages, and audited 422 packages in 12s",
    ...Array.from({ length: 220 }, (_, index) => `npm http fetch GET 200 https://registry.npmjs.org/pkg-${index} 24ms (cache hit)`),
    "5 moderate severity vulnerabilities",
    "Run npm audit for details"
  ].join("\n");
  const vitestFailure = [
    "FAIL tests/app.test.ts > app > returns expected value",
    "AssertionError: expected 1 to equal 2",
    "Expected: 2",
    "Received: 1",
    "    at tests/app.test.ts:12:10",
    "    at src/app.ts:7:3",
    ...Array.from({ length: 180 }, () => "PASS tests/noise.test.ts")
  ].join("\n");
  const tscError = [
    "src/commands/self.ts:42:7 - error TS2322: Type 'string' is not assignable to type 'number'.",
    "42 const count: number = value;",
    "Found 1 error in src/commands/self.ts:42",
    ...Array.from({ length: 120 }, (_, index) => `message TS${index}: incremental build trace`)
  ].join("\n");
  const gitDiff = [
    "diff --git a/src/app.ts b/src/app.ts",
    "index 1111111..2222222 100644",
    "--- a/src/app.ts",
    "+++ b/src/app.ts",
    "@@ -1,3 +1,5 @@",
    "-  return 1;",
    "+  return 2;",
    "diff --git a/docs/usage.md b/docs/usage.md",
    "--- a/docs/usage.md",
    "+++ b/docs/usage.md",
    "@@ -10,4 +10,8 @@",
    "+Use soturail self all before release commits.",
    "rename from src/old.ts",
    "rename to src/new.ts",
    ...Array.from({ length: 300 }, (_, index) => `+ repeated diff noise ${index}`)
  ].join("\n");
  const gitStatus = [
    "On branch main",
    "Changes not staged for commit:",
    ...Array.from({ length: 120 }, (_, index) => ` modified: src/generated-${index}.ts`),
    " deleted: src/old.ts",
    "Untracked files:",
    " docs/windows.md"
  ].join("\n");
  const jsonPayload = JSON.stringify({
    status: "error",
    message: "Permission denied",
    path: "src/app.ts",
    request_id: "req_123",
    items: Array.from({ length: 160 }, (_, index) => ({ id: index, ok: index !== 77, error: index === 77 ? "timeout" : null }))
  }, null, 2);
  const verboseAi = [
    "I think the main issue is probably that tests are failing because src/app.ts:12 returns the wrong value.",
    "Security warning: do not run rm -rf or git push automatically.",
    "Run npm test after changing src/app.ts.",
    "```ts",
    "export function app() {",
    "  return 2;",
    "}",
    "```",
    ...Array.from({ length: 48 }, () => "Basically, this is extra explanation that can be shorter.")
  ].join("\n");
  const readmeText = [
    "# SotuRail",
    "SotuRail is a local-first Context OS for AI coding agents.",
    "Run npm install -g soturail, then soturail init.",
    "Use soturail run npm test to preserve raw logs.",
    ...Array.from({ length: 60 }, () => "This documentation paragraph repeats project goals and usage details for compression testing.")
  ].join("\n\n");
  const rulesDoc = [
    "# Runtime",
    "- Project must run on Node.js 20 or newer.",
    "- README.md must include a section named Quick start.",
    "- LICENSE must be present.",
    "- .github/workflows/ci.yml is required for CI workflow.",
    "# Security",
    "- git push must never be run automatically through soturail run."
  ].join("\n");

  await writeFixture(root, "npm-install-noisy.txt", npmInstall);
  await writeFixture(root, "vitest-failure-stacktrace.txt", vitestFailure);
  await writeFixture(root, "tsc-error.txt", tscError);
  await writeFixture(root, "git-diff-multiple.txt", gitDiff);
  await writeFixture(root, "git-status-many.txt", gitStatus);
  await writeFixture(root, "json-tool-payload.json", jsonPayload);
  await writeFixture(root, "verbose-ai-answer.md", verboseAi);
  await writeFixture(root, "readme-doc.md", readmeText);
  await writeFixture(root, "rules-doc.md", rulesDoc);

  return "Benchmark fixtures prepared in benchmarks/fixtures.\n";
}

async function readFixture(root: string, name: string): Promise<string> {
  return fs.readFile(path.resolve(benchDirs(root).fixtures, name), "utf8");
}

function reductionPercent(rawTokens: number, reducedTokens: number): number {
  return rawTokens === 0 ? 0 : Number((((rawTokens - reducedTokens) / rawTokens) * 100).toFixed(2));
}

async function terminalResult(root: string, caseId: string, fixture: string, command: string, engine: ReducerEngine): Promise<BenchResult> {
  const raw = await readFixture(root, fixture);
  const start = performance.now();
  const reduced = await compressOutputWithEngine(command, raw, `bench-${caseId}`, engine, root);
  const runtime = performance.now() - start;
  const text = reduced.summary;
  const rawTokens = estimateTokens(raw);
  const reducedTokens = estimateTokens(text);
  const quality = qualityCheck(caseId, text);
  if (!quality.ok) {
    throw new Error(`Benchmark quality check failed for ${caseId}: ${quality.reason}`);
  }
  return makeResult({
    case_id: caseId,
    category: "terminal_compression",
    engine: reduced.engine,
    raw,
    reduced: text,
    rawTokens,
    reducedTokens,
    reduction: reductionPercent(rawTokens, reducedTokens),
    runtime,
    quality: true,
    notes: quality.note ?? "Terminal output reducer preserved required signals.",
    details: { compressor: reduced.compressor, ...(reduced.details ?? {}) }
  });
}

async function responseResult(root: string, fixture: string, mode: "concise" | "review" | "debug" | "commit" | "docs"): Promise<BenchResult> {
  const raw = await readFixture(root, fixture);
  const start = performance.now();
  const reduced = reduceAgentResponse(raw, mode);
  const runtime = performance.now() - start;
  return makeResult({
    case_id: `${fixture.replace(/\.[^.]+$/, "")}-${mode}`,
    category: "agent_response_compression",
    engine: "ts",
    raw,
    reduced: reduced.output,
    rawTokens: reduced.raw_tokens,
    reducedTokens: reduced.compressed_tokens,
    reduction: reduced.reduction_percent,
    runtime,
    quality: reduced.output.includes("npm test") || reduced.output.includes("soturail run"),
    notes: `Agent response compression mode: ${mode}.`,
    details: {
      mode,
      preserved_commands_count: reduced.preserved_commands_count,
      preserved_code_blocks_count: reduced.preserved_code_blocks_count,
      preserved_security_warnings_count: reduced.preserved_security_warnings_count
    }
  });
}

async function rulesResult(root: string): Promise<BenchResult> {
  const raw = await readFixture(root, "rules-doc.md");
  const fixturePath = path.resolve(benchDirs(root).fixtures, "rules-doc.md");
  const start = performance.now();
  const document = await ingestDocument(fixturePath, "requirements", root);
  const rules = extractRules(document);
  const checks = await validateRules(rules, root);
  const output = JSON.stringify({ rules, checks }, null, 2);
  const runtime = performance.now() - start;
  return makeResult({
    case_id: "rules-extraction-markdown",
    category: "knowledge_structuring",
    engine: "ts",
    raw,
    reduced: output,
    rawTokens: estimateTokens(raw),
    reducedTokens: estimateTokens(output),
    reduction: null,
    runtime,
    quality: rules.length >= 3,
    notes: "Knowledge-to-Rules is reusable structuring, not pure compression.",
    details: {
      extracted_rules_count: rules.length,
      validator_success_count: checks.filter((check) => check.ok).length,
      validator_failure_count: checks.filter((check) => !check.ok).length,
      citations_count: rules.length,
      source_sections_preserved_count: new Set(rules.map((rule) => rule.source_section)).size
    }
  });
}

async function cacheStabilityResult(root: string): Promise<BenchResult> {
  const start = performance.now();
  const first = await buildCachePayload(root, "dynamic footer raw_id=one");
  const second = await buildCachePayload(root, "dynamic footer raw_id=two");
  const marker = "<!-- soturail:dynamic:dynamic-footer -->";
  const stablePrefixEqual = first.payload.split(marker)[0] === second.payload.split(marker)[0];
  const runtime = performance.now() - start;
  return makeResult({
    case_id: "cache-stable-prefix",
    category: "cache_stability",
    engine: "ts",
    raw: first.payload,
    reduced: second.payload,
    rawTokens: estimateTokens(first.payload),
    reducedTokens: estimateTokens(second.payload),
    reduction: null,
    runtime,
    quality: stablePrefixEqual,
    notes: "Verifies dynamic footer changes do not move stable cache-friendly prefix blocks.",
    details: { stable_prefix_equal: stablePrefixEqual }
  });
}

async function nativeEngineResult(root: string): Promise<BenchResult> {
  const start = performance.now();
  const native = await detectNativeEngine(root);
  const runtime = performance.now() - start;
  const text = native.available
    ? `native available at ${native.path}\nversion: ${native.version ?? "unknown"}`
    : "native engine unavailable; no native benchmark results were fabricated";
  return makeResult({
    case_id: "native-engine-availability",
    category: "native_engine",
    engine: native.available ? "native" : "unavailable",
    raw: text,
    reduced: text,
    rawTokens: estimateTokens(text),
    reducedTokens: estimateTokens(text),
    reduction: null,
    runtime,
    quality: true,
    notes: native.available ? "Native binary detected." : "Native binary unavailable; TypeScript benchmark remains authoritative.",
    details: { available: native.available, path: native.path ?? null, version: native.version ?? null }
  });
}

async function skillRailResult(root: string, mode: "validation" | "export"): Promise<BenchResult> {
  const start = performance.now();
  const skill = await createSkill(`benchmark ${mode}`, root);
  const raw = `${skill.metadata.id}\n${skill.markdown}`;
  const output = mode === "validation"
    ? JSON.stringify(await validateSkills(root), null, 2)
    : await exportSkills("claude", root);
  const runtime = performance.now() - start;
  return makeResult({
    case_id: mode === "validation" ? "skill-validation" : "skill-export-claude",
    category: "skill_rail",
    engine: "ts",
    raw,
    reduced: output,
    rawTokens: estimateTokens(raw),
    reducedTokens: estimateTokens(output),
    reduction: null,
    runtime,
    quality: output.includes(mode === "validation" ? "skills_count" : "Exported"),
    notes: "Skill Rail benchmark validates safe schema/export behavior.",
    details: { mode }
  });
}

async function mcpResult(root: string, mode: "manifest" | "read"): Promise<BenchResult> {
  const start = performance.now();
  const raw = mode;
  const output = mode === "manifest"
    ? JSON.stringify(await mcpManifest(SOTURAIL_VERSION), null, 2)
    : JSON.stringify(await readMcpResource("soturail://roadmap", root), null, 2);
  const runtime = performance.now() - start;
  return makeResult({
    case_id: mode === "manifest" ? "mcp-resource-list" : "mcp-resource-read",
    category: "mcp",
    engine: "ts",
    raw,
    reduced: output,
    rawTokens: estimateTokens(raw),
    reducedTokens: estimateTokens(output),
    reduction: null,
    runtime,
    quality: output.includes(mode === "manifest" ? "soturail://repo-map" : "roadmap"),
    notes: "MCP benchmark uses local resources without arbitrary shell execution.",
    details: { mode }
  });
}

async function contextPackResult(root: string): Promise<BenchResult> {
  const start = performance.now();
  const pack = await buildContextPack("generic", root, { now: "2026-05-21T00:00:00.000Z" });
  const runtime = performance.now() - start;
  return makeResult({
    case_id: "context-pack-generic",
    category: "context_pack",
    engine: "ts",
    raw: pack.stablePrefix,
    reduced: pack.payload,
    rawTokens: estimateTokens(pack.stablePrefix),
    reducedTokens: estimateTokens(pack.payload),
    reduction: null,
    runtime,
    quality: pack.payload.includes("Dynamic Footer"),
    notes: "Context pack benchmark preserves stable-before-dynamic ordering.",
    details: { target: "generic" }
  });
}

async function hookExportResult(root: string): Promise<BenchResult> {
  const start = performance.now();
  const output = await exportHook("claude", root);
  const runtime = performance.now() - start;
  return makeResult({
    case_id: "hook-export-claude",
    category: "agent_integration",
    engine: "ts",
    raw: "claude hook export",
    reduced: output,
    rawTokens: estimateTokens("claude hook export"),
    reducedTokens: estimateTokens(output),
    reduction: null,
    runtime,
    quality: output.includes(".soturail"),
    notes: "Hook export benchmark creates reviewable local files.",
    details: { agent: "claude" }
  });
}

async function memoryWorkflowResult(root: string): Promise<BenchResult> {
  const start = performance.now();
  const pending = await proposeMemory("Benchmark memory approval workflow.", {}, root);
  const approved = await approveMemory(pending.id, root);
  const list = await listMemory("approved", root);
  const runtime = performance.now() - start;
  const output = JSON.stringify({ pending, approved, list }, null, 2);
  return makeResult({
    case_id: "memory-approval-workflow",
    category: "memory_workflow",
    engine: "ts",
    raw: pending.text,
    reduced: output,
    rawTokens: estimateTokens(pending.text),
    reducedTokens: estimateTokens(output),
    reduction: null,
    runtime,
    quality: approved.status === "approved" && list.includes(pending.id),
    notes: "Memory workflow benchmark proposes, approves and lists local memory.",
    details: { memory_id: pending.id }
  });
}

function qualityCheck(caseId: string, text: string): { ok: boolean; reason?: string; note?: string } {
  if (caseId.includes("vitest") && (!text.includes("AssertionError") || !text.includes("tests/app.test.ts"))) {
    return { ok: false, reason: "Vitest assertion or path missing" };
  }
  if (caseId.includes("tsc") && (!text.includes("TS2322") || !text.includes("src/commands/self.ts"))) {
    return { ok: false, reason: "TypeScript diagnostic missing" };
  }
  if (caseId.includes("git-diff") && (!text.includes("src/app.ts") || !text.includes("@@ -1,3 +1,5 @@"))) {
    return { ok: false, reason: "git diff path or hunk missing" };
  }
  if (caseId.includes("git-status") && !text.includes("src/generated-")) {
    return { ok: false, reason: "git status changed path missing" };
  }
  if (caseId.includes("json") && (!text.includes("Permission denied") || !text.includes("timeout"))) {
    return { ok: false, reason: "JSON error primitives missing" };
  }
  if (caseId.includes("npm-install") && (!text.includes("moderate severity") || !text.includes("npm audit"))) {
    return { ok: false, reason: "npm warning or command suggestion missing" };
  }
  return { ok: true };
}

interface MakeResultInput {
  case_id: string;
  category: BenchmarkCategory;
  engine: string;
  raw: string;
  reduced: string;
  rawTokens: number;
  reducedTokens: number;
  reduction: number | null;
  runtime: number;
  quality: boolean;
  notes: string;
  details: Record<string, unknown>;
}

function makeResult(input: MakeResultInput): BenchResult {
  const errors = (input.reduced.match(/\b(error|warn|fail|assertion|timeout|denied|refused|TS\d+)\b/gi) ?? []).length;
  const paths = (input.reduced.match(/(?:src|tests|docs|\.github)[\\/][\w./-]+(?::\d+(?::\d+)?)?/g) ?? []).length;
  const commands = (input.reduced.match(/\b(?:npm|npx|node|soturail|git|tsc|vitest|pytest)\b[^\n]*/g) ?? []).length;
  return {
    case_id: input.case_id,
    name: input.case_id,
    category: input.category,
    engine: input.engine,
    raw_bytes: Buffer.byteLength(input.raw),
    reduced_bytes: Buffer.byteLength(input.reduced),
    raw_tokens: input.rawTokens,
    reduced_tokens: input.reducedTokens,
    reduction_percent: input.reduction,
    estimated_raw_tokens: input.rawTokens,
    estimated_reduced_tokens: input.reducedTokens,
    compression_ratio_percent: input.reduction,
    runtime_ms: Number(input.runtime.toFixed(3)),
    wall_time_ms: Number(input.runtime.toFixed(3)),
    quality_passed: input.quality,
    preserved_errors_count: errors,
    preserved_paths_count: paths,
    preserved_commands_count: commands,
    preserved_error_lines_count: errors,
    preserved_file_paths_count: paths,
    raw_id: null,
    raw_sha256: sha256(input.raw),
    reduced_sha256: sha256(input.reduced),
    notes: input.notes,
    details: input.details
  };
}

export async function runBenchmarks(options: BenchOptions = {}, root = process.cwd()): Promise<BenchResult[]> {
  await ensureWorkspace(root);
  await prepareBenchmarks(root);
  const engine = options.engine ?? "ts";
  if (engine === "native" && !(await detectNativeEngine(root)).available) {
    const results = [await nativeEngineResult(root)];
    await writeBenchmarkFiles(root, engine, results);
    return results;
  }
  const results = [
    await terminalResult(root, "npm-install-noisy", "npm-install-noisy.txt", "npm install", engine),
    await terminalResult(root, "vitest-failure-stacktrace", "vitest-failure-stacktrace.txt", "npm test", engine),
    await terminalResult(root, "tsc-error", "tsc-error.txt", "npm run build", engine),
    await terminalResult(root, "git-diff-multiple", "git-diff-multiple.txt", "git diff", engine),
    await terminalResult(root, "git-status-many", "git-status-many.txt", "git status", engine),
    await terminalResult(root, "json-tool-payload", "json-tool-payload.json", "cat tool-output.json", engine),
    await responseResult(root, "verbose-ai-answer.md", "concise"),
    await responseResult(root, "verbose-ai-answer.md", "review"),
    await responseResult(root, "readme-doc.md", "docs"),
    await rulesResult(root),
    await cacheStabilityResult(root),
    await nativeEngineResult(root),
    await skillRailResult(root, "validation"),
    await skillRailResult(root, "export"),
    await mcpResult(root, "manifest"),
    await mcpResult(root, "read"),
    await contextPackResult(root),
    await hookExportResult(root),
    await memoryWorkflowResult(root)
  ];
  await writeBenchmarkFiles(root, engine, results);
  await new MetricsStore(root).append({ type: "bench_run", details: { engine, results_count: results.length } });
  return results;
}

async function writeBenchmarkFiles(root: string, engine: ReducerEngine, results: BenchResult[]): Promise<void> {
  const dirs = benchDirs(root);
  await fs.mkdir(dirs.results, { recursive: true });
  await fs.mkdir(dirs.reports, { recursive: true });
  await writeJson(path.resolve(dirs.results, "latest.json"), { generated_at: new Date().toISOString(), engine, results });
  await fs.writeFile(path.resolve(dirs.reports, "latest.md"), renderReport(results), "utf8");
}

export async function compareEngines(root = process.cwd()): Promise<string> {
  const native = await detectNativeEngine(root);
  if (!native.available) {
    return "Native engine not available. Build it with npm run build:native before comparing engines.\n";
  }
  const tsResults = await runBenchmarks({ engine: "ts" }, root);
  const nativeResults = await runBenchmarks({ engine: "native" }, root);
  const rows = tsResults.map((tsResult) => {
    const nativeResult = nativeResults.find((item) => item.case_id === tsResult.case_id && item.category === tsResult.category);
    if (!nativeResult) {
      return `| ${tsResult.case_id} | ${tsResult.category} | n/a | n/a | n/a |`;
    }
    const speedup = nativeResult.runtime_ms === 0
      ? 0
      : Number((((tsResult.runtime_ms - nativeResult.runtime_ms) / tsResult.runtime_ms) * 100).toFixed(2));
    return `| ${tsResult.case_id} | ${tsResult.category} | ${tsResult.runtime_ms} | ${nativeResult.runtime_ms} | ${speedup}% |`;
  });
  const report = [
    "# SotuRail Engine Comparison",
    "",
    "| Fixture | Category | TypeScript runtime_ms | Native runtime_ms | speedup_percent |",
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

export function summarizeBenchmarkResults(results: BenchResult[]): string {
  const grouped = groupByCategory(results);
  const failed = results.filter((result) => !result.quality_passed).length;
  return [
    `cases_count: ${results.length}`,
    `quality_failed_count: ${failed}`,
    ...Object.entries(grouped).map(([category, count]) => `${category}: ${count}`)
  ].join("\n");
}

function renderReport(results: BenchResult[]): string {
  const grouped = groupByCategory(results);
  const rows = results.map((result) =>
    `| ${result.case_id} | ${result.category} | ${result.engine} | ${result.raw_tokens} | ${result.reduced_tokens} | ${result.reduction_percent === null ? "n/a" : `${result.reduction_percent}%`} | ${result.runtime_ms} | ${result.quality_passed ? "pass" : "fail"} | ${result.notes} |`
  );
  return [
    "# SotuRail Benchmark Report",
    "",
    "Generated from deterministic local fixtures. No external RTK/Squeez/NTK comparison numbers are included unless a user runs optional comparison locally.",
    "",
    "Categories:",
    ...Object.entries(grouped).map(([category, count]) => `- ${category}: ${count} case(s)`),
    "",
    "| case_id | category | engine | raw_tokens | reduced_tokens | reduction_percent | runtime_ms | quality | notes |",
    "|---|---|---:|---:|---:|---:|---:|---|---|",
    ...rows,
    "",
    "Knowledge structuring cases are extraction and validation tasks, not failed compression cases.",
    "Native engine rows never fabricate native speed numbers when the native binary is unavailable."
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
  const bench = program.command("bench").description("Run reproducible local SotuRail benchmarks.").action(async () => {
    const results = await runBenchmarks({ engine: "ts" });
    process.stdout.write(`Benchmark results written: ${results.length} cases\nbenchmarks/results/latest.json\nbenchmarks/reports/latest.md\n`);
  });
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
