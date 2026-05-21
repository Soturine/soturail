import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PassThrough, type Writable } from "node:stream";
import { promisify } from "node:util";
import { runBenchmarks, summarizeBenchmarkResults, type BenchResult } from "../commands/bench.js";
import { executeRunCommand, type RunExecutionResult } from "../commands/run.js";
import { ensureWorkspace, getWorkspacePaths, loadConfig, writeJson } from "./config.js";
import { scanRepository, writeRepoMap } from "./file-scanner.js";
import { getCurrentGitCommit } from "./git.js";
import { estimateTokens } from "./token-estimator.js";

const execFileAsync = promisify(execFile);

const REQUIRED_SOTURAIL_PATHS = [
  "package.json",
  "README.md",
  "CHANGELOG.md",
  "ROADMAP.md",
  path.join("src", "cli.ts"),
  path.join("src", "commands"),
  path.join("src", "core"),
  "tests",
  "docs"
];

export interface SelfDoctorResult {
  ok: boolean;
  root: string;
  package_name: string | null;
  package_version: string | null;
  missing: string[];
}

export interface SelfIndexResult {
  indexed_files_count: number;
  ignored_files_count: number;
  ignored_directories_count: number;
}

export interface SelfRunStep {
  ok: boolean;
  exit_code: number | null;
  raw_id: string | null;
  raw_tokens: number;
  reduced_tokens: number;
  summary: string;
  error?: string;
}

export interface SelfBenchResult {
  ok: boolean;
  raw_id: string | null;
  cases_count: number;
  summary: string;
  results: BenchResult[];
  error?: string;
}

export interface SelfDogfoodState {
  doctor?: SelfDoctorResult;
  index?: SelfIndexResult;
  build?: SelfRunStep;
  test?: SelfRunStep;
  bench?: SelfBenchResult;
  report_path?: string;
  errors: string[];
}

export interface SelfReportInput extends SelfDogfoodState {
  root?: string;
}

export function createEmptySelfState(): SelfDogfoodState {
  return { errors: [] };
}

export async function selfDoctor(root = process.cwd()): Promise<SelfDoctorResult> {
  const resolvedRoot = path.resolve(root);
  const missing: string[] = [];
  for (const required of REQUIRED_SOTURAIL_PATHS) {
    const absolute = path.resolve(resolvedRoot, required);
    try {
      await fs.access(absolute);
    } catch {
      missing.push(path.normalize(required));
    }
  }

  const packageJson = await readPackageJson(resolvedRoot);
  if (packageJson.name !== "soturail") {
    missing.push("package.json:name=soturail");
  }

  return {
    ok: missing.length === 0,
    root: resolvedRoot,
    package_name: typeof packageJson.name === "string" ? packageJson.name : null,
    package_version: typeof packageJson.version === "string" ? packageJson.version : null,
    missing
  };
}

export async function assertSotuRailRepository(root = process.cwd()): Promise<SelfDoctorResult> {
  const doctor = await selfDoctor(root);
  if (!doctor.ok) {
    throw new Error(`This directory does not look like the SotuRail repository. Missing: ${doctor.missing.join(", ")}`);
  }
  return doctor;
}

export async function selfIndex(root = process.cwd()): Promise<SelfIndexResult> {
  await assertSotuRailRepository(root);
  await ensureWorkspace(root);
  const config = await loadConfig(root);
  const repoMap = await scanRepository(root, config);
  await writeRepoMap(root, repoMap);
  return {
    indexed_files_count: repoMap.total_files,
    ignored_files_count: repoMap.stats.ignored_files,
    ignored_directories_count: repoMap.stats.ignored_directories
  };
}

export async function selfBuild(root = process.cwd(), terminalStdout?: Writable, terminalStderr?: Writable): Promise<SelfRunStep> {
  return selfRunCommand(["npm", "run", "build"], root, terminalStdout, terminalStderr);
}

export async function selfTest(root = process.cwd(), terminalStdout?: Writable, terminalStderr?: Writable): Promise<SelfRunStep> {
  return selfRunCommand(["npm", "test"], root, terminalStdout, terminalStderr);
}

export async function selfBench(root = process.cwd(), terminalStdout?: Writable, terminalStderr?: Writable): Promise<SelfBenchResult> {
  await assertSotuRailRepository(root);
  const cliPath = path.resolve(root, "dist", "cli.js");
  let runResult: RunExecutionResult | null = null;
  try {
    await fs.access(cliPath);
    runResult = await executeRunCommand(
      [`"${process.execPath}" "${cliPath}" bench run --engine ts`],
      {
        terminalStdout: terminalStdout ?? drainedStream(),
        terminalStderr: terminalStderr ?? drainedStream(),
        engine: "ts"
      },
      root
    );
  } catch {
    // If the built CLI is unavailable, the in-process benchmark path still gives a real report.
  }

  const results = runResult ? await readLatestBenchmarkResults(root) : await runBenchmarks({ engine: "ts" }, root);
  return {
    ok: runResult ? runResult.exitCode === 0 : true,
    raw_id: runResult?.rawId ?? null,
    cases_count: results.length,
    summary: summarizeBenchmarkResults(results),
    results
  };
}

export async function writeSelfReport(input: SelfReportInput): Promise<string> {
  const root = path.resolve(input.root ?? process.cwd());
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const reportsDir = path.resolve(paths.workspace, "reports");
  await fs.mkdir(reportsDir, { recursive: true });
  const reportPath = path.resolve(reportsDir, "self-dogfood.md");
  const packageJson = await readPackageJson(root);
  const commit = await getCurrentGitCommit(root);
  const branch = await getCurrentGitBranch(root);
  const accounting = selfTokenAccounting(input);
  const report = [
    "# SotuRail Self-Dogfood Report",
    "",
    "## Stable Project Description",
    "",
    "SotuRail aims to unify terminal compression, progressive repo reading, Spec-Driven workflows, local memory, rules extraction, agent hooks, benchmarks and cache-friendly payloads into one local-first workflow.",
    "",
    `- package_name: ${stringOrUnknown(packageJson.name)}`,
    `- package_version: ${stringOrUnknown(packageJson.version)}`,
    "- report_schema: self-dogfood-v1",
    "",
    "## Stable Quality Rails",
    "",
    "- Build, test and benchmark commands should run through SotuRail so raw logs are recoverable.",
    "- Token counts are deterministic estimates unless provider metadata is explicitly imported.",
    "- Dynamic raw IDs, timestamps, logs and volatile command status stay below this stable section.",
    "",
    "## Dynamic Execution Data",
    "",
    `- repository_path: ${path.normalize(root)}`,
    `- current_git_commit_hash: ${commit ?? "unknown"}`,
    `- current_branch: ${branch ?? "unknown"}`,
    `- doctor_ok: ${input.doctor?.ok ?? false}`,
    `- indexed_files_count: ${input.index?.indexed_files_count ?? 0}`,
    `- ignored_files_directories_count: ${(input.index?.ignored_files_count ?? 0) + (input.index?.ignored_directories_count ?? 0)}`,
    `- build_result: ${formatStep(input.build)}`,
    `- test_result: ${formatStep(input.test)}`,
    `- benchmark_summary: ${input.bench?.summary.replace(/\r?\n/g, " | ") ?? "not run"}`,
    `- build_raw_id: ${input.build?.raw_id ?? "n/a"}`,
    `- test_raw_id: ${input.test?.raw_id ?? "n/a"}`,
    `- benchmark_raw_id: ${input.bench?.raw_id ?? "n/a"}`,
    `- estimated_raw_tokens: ${accounting.estimated_raw_tokens}`,
    `- estimated_reduced_tokens: ${accounting.estimated_reduced_tokens}`,
    `- estimated_metadata_overhead_tokens: ${accounting.estimated_metadata_overhead_tokens}`,
    `- compression_effective: ${accounting.compression_effective}`,
    "",
    "## Known Limitations",
    "",
    "- Native benchmark rows are marked unavailable when the optional native binary is not built.",
    "- Self-dogfood reports are local evidence, not provider cache-hit evidence.",
    "- Small command outputs may cost more after metadata, but recovery and audit paths remain valuable.",
    "",
    "## Recommended Next Action",
    "",
    input.errors.length > 0
      ? `Review partial failures: ${input.errors.join("; ")}`
      : "Keep running `soturail self all` before release-oriented commits.",
    ""
  ].join("\n");
  await fs.writeFile(reportPath, report, "utf8");
  return reportPath;
}

export async function selfAll(root = process.cwd(), terminalStdout?: Writable, terminalStderr?: Writable): Promise<SelfDogfoodState> {
  const state = createEmptySelfState();
  try {
    state.doctor = await selfDoctor(root);
    if (!state.doctor.ok) {
      state.errors.push(`doctor failed: ${state.doctor.missing.join(", ")}`);
      state.report_path = await writeSelfReport({ ...state, root });
      return state;
    }
    state.index = await selfIndex(root);
    state.build = await selfBuild(root, terminalStdout, terminalStderr);
    if (!state.build.ok) {
      state.errors.push(`build failed: raw_id=${state.build.raw_id ?? "n/a"}`);
      state.report_path = await writeSelfReport({ ...state, root });
      return state;
    }
    state.test = await selfTest(root, terminalStdout, terminalStderr);
    if (!state.test.ok) {
      state.errors.push(`test failed: raw_id=${state.test.raw_id ?? "n/a"}`);
      state.report_path = await writeSelfReport({ ...state, root });
      return state;
    }
    state.bench = await selfBench(root, terminalStdout, terminalStderr);
    if (!state.bench.ok) {
      state.errors.push(`bench failed: raw_id=${state.bench.raw_id ?? "n/a"}`);
    }
  } catch (error) {
    state.errors.push(error instanceof Error ? error.message : String(error));
  }
  state.report_path = await writeSelfReport({ ...state, root });
  return state;
}

export function formatSelfDoctor(result: SelfDoctorResult): string {
  return [
    "SotuRail self doctor",
    `ok: ${result.ok}`,
    `root: ${path.normalize(result.root)}`,
    `package_name: ${result.package_name ?? "unknown"}`,
    `package_version: ${result.package_version ?? "unknown"}`,
    `missing: ${result.missing.length === 0 ? "none" : result.missing.join(", ")}`
  ].join("\n") + "\n";
}

export function formatSelfIndex(result: SelfIndexResult): string {
  return [
    "SotuRail self index",
    `indexed_files_count: ${result.indexed_files_count}`,
    `ignored_files_count: ${result.ignored_files_count}`,
    `ignored_directories_count: ${result.ignored_directories_count}`
  ].join("\n") + "\n";
}

export function formatSelfRunStep(label: string, result: SelfRunStep): string {
  return [
    `SotuRail self ${label}`,
    `ok: ${result.ok}`,
    `exit_code: ${result.exit_code ?? "n/a"}`,
    `raw_id: ${result.raw_id ?? "n/a"}`
  ].join("\n") + "\n";
}

export function formatSelfBench(result: SelfBenchResult): string {
  return [
    "SotuRail self bench",
    `ok: ${result.ok}`,
    `raw_id: ${result.raw_id ?? "n/a"}`,
    `cases_count: ${result.cases_count}`,
    result.summary
  ].join("\n") + "\n";
}

function selfTokenAccounting(input: SelfReportInput): {
  estimated_raw_tokens: number;
  estimated_reduced_tokens: number;
  estimated_metadata_overhead_tokens: number;
  compression_effective: boolean;
} {
  const estimatedRaw = (input.build?.raw_tokens ?? 0) + (input.test?.raw_tokens ?? 0);
  const estimatedReduced = (input.build?.reduced_tokens ?? 0) + (input.test?.reduced_tokens ?? 0);
  const metadata = estimateTokens(JSON.stringify({
    doctor: input.doctor?.ok,
    index: input.index,
    build_raw_id: input.build?.raw_id,
    test_raw_id: input.test?.raw_id,
    bench_raw_id: input.bench?.raw_id
  }));
  return {
    estimated_raw_tokens: estimatedRaw,
    estimated_reduced_tokens: estimatedReduced,
    estimated_metadata_overhead_tokens: metadata,
    compression_effective: estimatedReduced + metadata <= estimatedRaw
  };
}

async function selfRunCommand(commandParts: string[], root: string, terminalStdout?: Writable, terminalStderr?: Writable): Promise<SelfRunStep> {
  await assertSotuRailRepository(root);
  try {
    const result = await executeRunCommand(commandParts, {
      terminalStdout: terminalStdout ?? drainedStream(),
      terminalStderr: terminalStderr ?? drainedStream(),
      engine: "ts"
    }, root);
    return {
      ok: result.exitCode === 0,
      exit_code: result.exitCode,
      raw_id: result.rawId,
      raw_tokens: result.record.raw_tokens_estimated,
      reduced_tokens: result.record.compressed_tokens_estimated,
      summary: result.summary
    };
  } catch (error) {
    return {
      ok: false,
      exit_code: null,
      raw_id: null,
      raw_tokens: 0,
      reduced_tokens: 0,
      summary: "",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function readPackageJson(root: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(path.resolve(root, "package.json"), "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function readLatestBenchmarkResults(root: string): Promise<BenchResult[]> {
  const filePath = path.resolve(root, "benchmarks", "results", "latest.json");
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as { results?: BenchResult[] };
    return Array.isArray(parsed.results) ? parsed.results : [];
  } catch {
    return [];
  }
}

async function getCurrentGitBranch(root: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: root,
      timeout: 3000,
      windowsHide: true
    });
    const branch = stdout.trim();
    return branch.length > 0 ? branch : null;
  } catch {
    return null;
  }
}

function drainedStream(): Writable {
  const stream = new PassThrough();
  stream.resume();
  return stream;
}

function formatStep(step: SelfRunStep | undefined): string {
  if (!step) {
    return "not run";
  }
  return step.ok ? `pass exit_code=${step.exit_code}` : `fail exit_code=${step.exit_code ?? "n/a"}`;
}

function stringOrUnknown(value: unknown): string {
  return typeof value === "string" && value.length > 0 ? value : "unknown";
}
