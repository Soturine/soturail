import { promises as fs } from "node:fs";
import path from "node:path";
import { detectNativeEngine } from "./native-engine.js";
import { getWorkspacePaths, relativeToRoot, writeJson } from "./config.js";
import { SOTURAIL_VERSION } from "./version.js";

export type NativeCandidateClassification = "good-candidate" | "maybe-candidate" | "not-worth-it-yet" | "blocked";

export interface NativeCandidate {
  area: string;
  classification: NativeCandidateClassification;
  reason: string;
  currentEngine: "typescript";
  benchmarkCategory: string;
  risk: "low" | "medium" | "high";
  estimatedBenefit: "low" | "medium" | "high";
  fallback: "typescript";
  recommendation: "benchmark-before-native" | "keep-typescript" | "blocked-until-measured";
}

export interface NativeCandidateReport {
  schemaVersion: "soturail.native.candidates.v1";
  createdAt: string;
  version: string;
  status: "passed" | "warning" | "failed" | "unknown";
  engine: {
    nativeAvailable: boolean;
    fallback: "typescript";
    normalInstallRequiresNative: false;
  };
  candidates: NativeCandidate[];
  warnings: string[];
  nextCommands: string[];
}

export interface NativeStatusReport {
  schemaVersion: "soturail.native.status.v1";
  createdAt: string;
  native_available: boolean;
  native_engine: "rust" | "none";
  native_path: string | null;
  native_version: string | null;
  fallback: "typescript";
  npm_install_requires_native: false;
  safe_to_use: boolean;
  checked_paths: string[];
}

export async function nativeStatus(root = process.cwd()): Promise<NativeStatusReport> {
  const info = await detectNativeEngine(root);
  return {
    schemaVersion: "soturail.native.status.v1",
    createdAt: new Date().toISOString(),
    native_available: info.available,
    native_engine: info.available ? "rust" : "none",
    native_path: info.path,
    native_version: info.version,
    fallback: "typescript",
    npm_install_requires_native: false,
    safe_to_use: true,
    checked_paths: info.checked_paths
  };
}

export async function writeNativeCandidateReport(root = process.cwd()): Promise<{ report: NativeCandidateReport; markdownPath: string; jsonPath: string; output: string }> {
  const status = await nativeStatus(root);
  const report: NativeCandidateReport = {
    schemaVersion: "soturail.native.candidates.v1",
    createdAt: new Date().toISOString(),
    version: SOTURAIL_VERSION,
    status: "warning",
    engine: {
      nativeAvailable: status.native_available,
      fallback: "typescript",
      normalInstallRequiresNative: false
    },
    candidates: nativeCandidates(),
    warnings: ["Native acceleration remains optional and benchmark-gated; unavailable native engines are non-blocking."],
    nextCommands: ["soturail bench run --suite brain", "soturail native doctor", "soturail native compare"]
  };
  const dir = path.join(getWorkspacePaths(root).workspace, "native");
  const jsonPath = path.join(dir, "candidates.json");
  const markdownPath = path.join(dir, "candidates.md");
  await fs.mkdir(dir, { recursive: true });
  await writeJson(jsonPath, report);
  await fs.writeFile(markdownPath, renderNativeCandidates(report), "utf8");
  return {
    report,
    markdownPath,
    jsonPath,
    output: [
      "SotuRail native candidates",
      `schemaVersion: ${report.schemaVersion}`,
      `native_available: ${report.engine.nativeAvailable}`,
      `fallback: ${report.engine.fallback}`,
      `normal_install_requires_native: ${report.engine.normalInstallRequiresNative}`,
      `candidates_count: ${report.candidates.length}`,
      `good_candidates: ${report.candidates.filter((item) => item.classification === "good-candidate").length}`,
      "native_unavailable_is_non_blocking: true",
      "top_recommendations:",
      ...topNativeRecommendations(report).map((item) => `- ${item}`),
      `json: ${relativeToRoot(root, jsonPath)}`,
      `markdown: ${relativeToRoot(root, markdownPath)}`
    ].join("\n") + "\n"
  };
}

export function renderNativeStatus(report: NativeStatusReport): string {
  return [
    "SotuRail native status",
    `schemaVersion: ${report.schemaVersion}`,
    `native_available: ${report.native_available}`,
    `native_engine: ${report.native_engine}`,
    `native_path: ${report.native_path ?? "not found"}`,
    `native_version: ${report.native_version ?? "unknown"}`,
    `fallback: ${report.fallback}`,
    `npm_install_requires_native: ${report.npm_install_requires_native}`,
    `safe_to_use: ${report.safe_to_use}`,
    "checked_paths:",
    ...report.checked_paths.map((item) => `- ${item}`)
  ].join("\n") + "\n";
}

export async function nativeDoctor(root = process.cwd()): Promise<string> {
  const status = await nativeStatus(root);
  const paths = getWorkspacePaths(root);
  const candidateJson = path.join(paths.workspace, "native", "candidates.json");
  const benchJson = path.join(paths.workspace, "bench", "latest.json");
  const candidatePresent = await exists(candidateJson);
  const benchPresent = await exists(benchJson);
  return [
    "SotuRail native doctor",
    "typescript_fallback: OK",
    `native_optional: ${status.native_available ? "OK" : "Unavailable"}`,
    `native_available: ${status.native_available}`,
    `native_engine: ${status.native_engine}`,
    "normal_npm_install_requires_rust: NO",
    "normal_npm_install_requires_native: NO",
    "native_unavailable_is_non_blocking: YES",
    `benchmarks_available: ${benchPresent ? "YES" : "NO"}`,
    `candidate_report: ${candidatePresent ? relativeToRoot(root, candidateJson) : "missing"}`,
    "decision_policy: benchmark-before-native",
    "top_recommendations:",
    "- keep TypeScript fallback as the default path",
    "- run local benchmarks before approving native acceleration",
    "- treat native unavailable as non-blocking unless the TypeScript fallback fails",
    "recommended_next_command:",
    candidatePresent ? "- soturail bench run --suite brain" : "- soturail native candidates",
    "- soturail native compare"
  ].join("\n") + "\n";
}

export async function nativeCompare(root = process.cwd()): Promise<string> {
  const status = await nativeStatus(root);
  if (!status.native_available) {
    return [
      "SotuRail native compare",
      "native_available: false",
      "result: skipped",
      "typescript_fallback: OK",
      "reason: optional native engine is unavailable; no native speedup is claimed",
      "next: soturail bench run --suite brain"
    ].join("\n") + "\n";
  }
  return [
    "SotuRail native compare",
    "native_available: true",
    "result: ready",
    "typescript_fallback: OK",
    "next: soturail bench compare-engines",
    "note: promote native acceleration only after a local benchmark report shows justified speedup."
  ].join("\n") + "\n";
}

function nativeCandidates(): NativeCandidate[] {
  return [
    candidate("large log reducers", "good-candidate", "Large terminal logs already have reducer fixtures and can be compared against TypeScript output.", "reducer-large-log", "medium", "high"),
    candidate("rangeHash computation", "good-candidate", "Range hashing repeats over source evidence during stale checks.", "range-hash", "low", "medium"),
    candidate("JSONL scanning", "good-candidate", "Append-only brain records and metrics grow with local usage.", "jsonl-read-write", "low", "medium"),
    candidate("source-range relocation", "maybe-candidate", "Relocation uses simple text windows and should be measured before native work.", "brain-stale", "medium", "medium"),
    candidate("duplicate claim clustering", "maybe-candidate", "Claim consolidation scales with record count and token overlap checks.", "brain-consolidate", "medium", "medium"),
    candidate("recursive file scanning", "maybe-candidate", "Large repositories may spend time walking files, but ignores and file limits must stay identical.", "file-scan", "medium", "medium"),
    candidate("reverse claims", "maybe-candidate", "Heuristic extraction may benefit from parser help later, but TypeScript remains adequate on small repos.", "reverse-claims", "medium", "medium"),
    candidate("diagram validation", "not-worth-it-yet", "Current validation is lightweight string logic, not a measured bottleneck.", "workflow-evidence", "low", "low", "keep-typescript"),
    candidate("workflow evidence generation", "not-worth-it-yet", "Evidence rendering is I/O and Markdown assembly, not a native hot path yet.", "workflow-evidence", "low", "low", "keep-typescript"),
    candidate("agent brief rendering", "not-worth-it-yet", "Brief rendering is bounded and review-oriented; native code would add maintenance risk without evidence.", "brain-scan", "low", "low", "keep-typescript"),
    candidate("release preflight", "blocked", "Release gates are orchestration, npm, audit and pack checks; native acceleration would not simplify them.", "release-preflight", "high", "low", "blocked-until-measured")
  ];
}

function candidate(
  area: string,
  classification: NativeCandidateClassification,
  reason: string,
  benchmarkCategory: string,
  risk: NativeCandidate["risk"],
  estimatedBenefit: NativeCandidate["estimatedBenefit"],
  recommendation: NativeCandidate["recommendation"] = "benchmark-before-native"
): NativeCandidate {
  return {
    area,
    classification,
    reason,
    currentEngine: "typescript",
    benchmarkCategory,
    risk,
    estimatedBenefit,
    fallback: "typescript",
    recommendation
  };
}

function renderNativeCandidates(report: NativeCandidateReport): string {
  return [
    "# SotuRail Native Candidate Report",
    "",
    "No benchmark, no native rewrite. TypeScript remains the portable baseline.",
    "",
    `schemaVersion: ${report.schemaVersion}`,
    `createdAt: ${report.createdAt}`,
    `nativeAvailable: ${report.engine.nativeAvailable}`,
    `fallback: ${report.engine.fallback}`,
    `normalInstallRequiresNative: ${report.engine.normalInstallRequiresNative}`,
    "",
    "## Top Recommendations",
    "",
    ...topNativeRecommendations(report).map((item) => `- ${item}`),
    "",
    "| area | classification | benchmark | risk | benefit | recommendation | reason |",
    "|---|---|---|---|---|---|---|",
    ...report.candidates.map((item) => `| ${item.area} | ${item.classification} | ${item.benchmarkCategory} | ${item.risk} | ${item.estimatedBenefit} | ${item.recommendation} | ${item.reason} |`),
    ""
  ].join("\n");
}

function topNativeRecommendations(report: NativeCandidateReport): string[] {
  const strongest = report.candidates
    .filter((item) => item.classification === "good-candidate")
    .slice(0, 3)
    .map((item) => `${item.area}: benchmark ${item.benchmarkCategory} before any native work`);
  return [
    "TypeScript fallback remains mandatory and safe for normal npm installs.",
    "Native unavailable is non-blocking; no speedup is claimed without benchmark evidence.",
    ...strongest
  ];
}

async function exists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}
