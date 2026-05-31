import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { getWorkspacePaths, readJsonl, relativeToRoot, writeJson } from "./config.js";
import type { HarnessFailureRecord } from "./harness-rail.js";
import { nativeStatus } from "./native-candidates.js";
import { readBrainCounts } from "./project-brain.js";
import { redactText } from "./report-redaction.js";
import { SOTURAIL_VERSION } from "./version.js";

const execFileAsync = promisify(execFile);

export type StatusLevel = "passed" | "warning" | "failed" | "unknown";
export type BrainStatus = "healthy" | "needs_refresh" | "warning" | "unknown";

export interface SotuRailStatus {
  schemaVersion: "soturail.status.v1";
  createdAt: string;
  version: string;
  project: {
    name: string;
    root: string;
    gitCommit: string;
    dirty: boolean;
  };
  release: {
    packageVersion: string;
    cliVersion: string;
    releaseNotesPath: string;
    releaseCheck: StatusLevel;
  };
  brain: {
    claims: number;
    suspect: number;
    stale: number;
    doctor: StatusLevel;
    brainStatus: BrainStatus;
  };
  eval: {
    latestReport: string;
    passed: number;
    failed: number;
    warnings: number;
  };
  bench: {
    latestReport: string;
    cases: number;
    warnings: number;
  };
  native: {
    available: boolean;
    fallback: "typescript";
    candidates: number;
  };
  baseline: {
    latestReport: string;
    signalsPassed: number;
    signalsFailed: number;
  };
  workflow: {
    activeWorkflow: string | null;
    latestEvidence: string | null;
  };
  harness: {
    failures: number;
  };
  diagram: {
    validation: StatusLevel;
    latestReport: string | null;
  };
  agents: {
    readiness: StatusLevel;
  };
  nextCommands: string[];
}

export async function buildStatus(root = process.cwd()): Promise<{ status: SotuRailStatus; paths: { json: string; markdown: string; agent: string } }> {
  const resolvedRoot = path.resolve(root);
  const paths = getWorkspacePaths(resolvedRoot);
  const statusDir = path.join(paths.workspace, "status");
  await fs.mkdir(statusDir, { recursive: true });
  const packageJson = await readJson(path.join(resolvedRoot, "package.json"));
  const packageVersion = asString(packageJson.version, "unknown");
  const projectName = asString(packageJson.name, "unknown");
  const gitCommit = await git(resolvedRoot, ["rev-parse", "--short", "HEAD"]);
  const gitStatus = await git(resolvedRoot, ["status", "--short"]);
  const dirty = gitStatus.trim().length > 0;
  const releaseNotes = packageVersion !== "unknown" ? path.join("docs", "releases", `RELEASE_NOTES_v${packageVersion}.md`) : "unknown";
  const releaseNotesExists = packageVersion !== "unknown" && existsSync(path.join(resolvedRoot, releaseNotes));
  const brainCounts = await readBrainCounts(resolvedRoot).catch(() => null);
  const brainDoctor = await readJson(paths.brainDoctorFile);
  const evalReportPath = path.join(paths.workspace, "eval", "latest.json");
  const evalReport = await readJson(evalReportPath);
  const benchReportPath = path.join(paths.workspace, "bench", "latest.json");
  const benchReport = await readJson(benchReportPath);
  const candidatesPath = path.join(paths.workspace, "native", "candidates.json");
  const candidates = await readJson(candidatesPath);
  const baselinePath = path.join(paths.workspace, "baselines", "latest.json");
  const baseline = await readJson(baselinePath);
  const currentWorkflow = await readJson(paths.workflowCurrentFile);
  const harnessFailures = await readJsonl<HarnessFailureRecord>(paths.harnessFailuresFile).catch(() => []);
  const diagramValidationPath = path.join(paths.diagramsDir, "validation.json");
  const agentExports = existsSync(paths.agentExportsDir);
  const status: SotuRailStatus = {
    schemaVersion: "soturail.status.v1",
    createdAt: new Date().toISOString(),
    version: SOTURAIL_VERSION,
    project: {
      name: projectName,
      root: ".",
      gitCommit: gitCommit.trim() || "unknown",
      dirty
    },
    release: {
      packageVersion,
      cliVersion: SOTURAIL_VERSION,
      releaseNotesPath: releaseNotes,
      releaseCheck: releaseStatus(packageVersion, releaseNotesExists, dirty)
    },
    brain: {
      claims: brainCounts?.claims ?? numberAt(brainDoctor, ["counts", "claims"]),
      suspect: brainCounts?.suspectOrStale ?? 0,
      stale: countStaleEvents(brainDoctor),
      doctor: doctorStatus(brainDoctor),
      brainStatus: "unknown"
    },
    eval: {
      latestReport: existsSync(evalReportPath) ? relativeToRoot(resolvedRoot, evalReportPath) : "missing",
      passed: numberAt(evalReport, ["summary", "passed"]),
      failed: numberAt(evalReport, ["summary", "failed"]),
      warnings: numberAt(evalReport, ["summary", "warnings"])
    },
    bench: {
      latestReport: existsSync(benchReportPath) ? relativeToRoot(resolvedRoot, benchReportPath) : "missing",
      cases: Array.isArray(benchReport.cases) ? benchReport.cases.length : 0,
      warnings: numberAt(benchReport, ["summary", "warnings"])
    },
    native: {
      available: (await nativeStatus(resolvedRoot).catch(() => null))?.native_available ?? false,
      fallback: "typescript",
      candidates: Array.isArray(candidates.candidates) ? candidates.candidates.length : 0
    },
    baseline: {
      latestReport: existsSync(baselinePath) ? relativeToRoot(resolvedRoot, baselinePath) : "missing",
      signalsPassed: Array.isArray(baseline.signals) ? baseline.signals.filter((item) => item?.ok === true).length : 0,
      signalsFailed: Array.isArray(baseline.signals) ? baseline.signals.filter((item) => item?.ok === false && item?.required !== false).length : 0
    },
    workflow: {
      activeWorkflow: typeof currentWorkflow.id === "string" ? currentWorkflow.id : null,
      latestEvidence: await latestEvidencePath(resolvedRoot)
    },
    harness: {
      failures: harnessFailures.length
    },
    diagram: {
      validation: existsSync(diagramValidationPath) ? "passed" : "unknown",
      latestReport: existsSync(diagramValidationPath) ? relativeToRoot(resolvedRoot, diagramValidationPath) : null
    },
    agents: {
      readiness: agentExports ? "passed" : "unknown"
    },
    nextCommands: []
  };
  status.brain.brainStatus = brainRefreshStatus(status);
  status.nextCommands = nextCommands(status);
  const jsonPath = path.join(statusDir, "latest.json");
  const markdownPath = path.join(statusDir, "latest.md");
  const agentPath = path.join(statusDir, "agent.md");
  await writeJson(jsonPath, status);
  await fs.writeFile(markdownPath, renderStatusMarkdown(status), "utf8");
  await fs.writeFile(agentPath, redactText(renderStatusAgent(status)).text, "utf8");
  return { status, paths: { json: jsonPath, markdown: markdownPath, agent: agentPath } };
}

export function renderStatusMarkdown(status: SotuRailStatus): string {
  return [
    "# SotuRail Status",
    "",
    `schemaVersion: ${status.schemaVersion}`,
    `createdAt: ${status.createdAt}`,
    `version: ${status.version}`,
    "",
    "## Project",
    "",
    `- name: ${status.project.name}`,
    `- gitCommit: ${status.project.gitCommit}`,
    `- dirty: ${status.project.dirty}`,
    "",
    "## Release",
    "",
    `- packageVersion: ${status.release.packageVersion}`,
    `- cliVersion: ${status.release.cliVersion}`,
    `- releaseNotesPath: ${status.release.releaseNotesPath}`,
    `- releaseCheck: ${status.release.releaseCheck}`,
    "",
    "## Evidence",
    "",
    `- brain: claims=${status.brain.claims}, suspect=${status.brain.suspect}, stale=${status.brain.stale}, doctor=${status.brain.doctor}, brain_status=${status.brain.brainStatus}`,
    `- eval: passed=${status.eval.passed}, failed=${status.eval.failed}, warnings=${status.eval.warnings}`,
    `- bench: cases=${status.bench.cases}, warnings=${status.bench.warnings}`,
    `- native: available=${status.native.available}, fallback=${status.native.fallback}, candidates=${status.native.candidates}`,
    `- baseline: passed=${status.baseline.signalsPassed}, failed=${status.baseline.signalsFailed}`,
    `- workflow: active=${status.workflow.activeWorkflow ?? "none"}, evidence=${status.workflow.latestEvidence ?? "missing"}`,
    `- harness: failures=${status.harness.failures}`,
    `- diagram: ${status.diagram.validation}`,
    `- agents: ${status.agents.readiness}`,
    "",
    ...(status.brain.brainStatus === "needs_refresh" || status.brain.brainStatus === "warning" ? [
      "Brain note: High suspect/stale counts mean the brain evidence may be old. They do not necessarily mean the code is broken.",
      ""
    ] : []),
    "## Next Commands",
    "",
    ...status.nextCommands.map((command) => `- \`${command}\``),
    ""
  ].join("\n");
}

export function renderStatusAgent(status: SotuRailStatus): string {
  const warnings = [
    status.project.dirty ? "Working tree is dirty; avoid release/publish until clean." : "",
    status.release.releaseCheck !== "passed" ? `Release readiness is ${status.release.releaseCheck}.` : "",
    status.brain.doctor !== "passed" ? `Brain doctor is ${status.brain.doctor}.` : "",
    status.brain.brainStatus === "needs_refresh" ? "Brain evidence needs refresh; suspect/stale records may be old rather than broken code." : "",
    status.eval.failed > 0 ? `Eval has ${status.eval.failed} failures.` : "",
    status.baseline.signalsFailed > 0 ? `Baseline has ${status.baseline.signalsFailed} failed signals.` : ""
  ].filter(Boolean);
  return [
    "# Current Project Status",
    "",
    `Version: ${status.version}`,
    `Release readiness: ${status.release.releaseCheck}`,
    `Brain status: ${status.brain.brainStatus}`,
    `Git commit: ${status.project.gitCommit}`,
    "",
    "## Warnings",
    "",
    ...(warnings.length > 0 ? warnings.map((warning) => `- ${warning}`) : ["- none"]),
    ...(status.brain.brainStatus === "needs_refresh" ? [
      "",
      "High suspect/stale counts mean the brain evidence may be old. They do not necessarily mean the code is broken."
    ] : []),
    "",
    "## Safe Next Commands",
    "",
    ...status.nextCommands.map((command) => `- ${command}`),
    "",
    "## Do Not Do",
    "",
    "- Do not upload local reports or telemetry.",
    "- Do not publish unless release checks pass and the working tree is clean.",
    "- Do not expose raw logs, .env files or tokens to agents.",
    "",
    "## Evidence Paths",
    "",
    `- status: .soturail/status/latest.json`,
    `- eval: ${status.eval.latestReport}`,
    `- bench: ${status.bench.latestReport}`,
    `- baseline: ${status.baseline.latestReport}`,
    ""
  ].join("\n");
}

function releaseStatus(packageVersion: string, notesExist: boolean, dirty: boolean): StatusLevel {
  if (packageVersion === "unknown" || SOTURAIL_VERSION !== packageVersion || !notesExist) return "failed";
  return dirty ? "warning" : "passed";
}

function doctorStatus(value: Record<string, unknown>): StatusLevel {
  if (Object.keys(value).length === 0) return "unknown";
  if (value.ok === true) return "passed";
  if (value.ok === false) return "failed";
  return "warning";
}

function nextCommands(status: SotuRailStatus): string[] {
  const commands = ["soturail status --md", "soturail report build"];
  if (status.eval.latestReport === "missing") commands.push("soturail eval run --suite brain");
  if (status.bench.latestReport === "missing") commands.push("soturail bench run --suite brain");
  if (status.native.candidates === 0) commands.push("soturail native candidates");
  if (status.baseline.latestReport === "missing") commands.push("soturail self baseline --check");
  if (status.brain.doctor === "unknown") commands.push("soturail brain doctor --repair-plan");
  if (status.brain.brainStatus === "needs_refresh" || status.brain.brainStatus === "warning") {
    commands.push(...brainRefreshCommands());
  }
  commands.push("soturail dashboard build");
  return [...new Set(commands)];
}

export function brainRefreshStatus(status: SotuRailStatus): BrainStatus {
  if (status.brain.claims === 0 && status.brain.doctor === "unknown") return "unknown";
  if (status.brain.doctor === "failed") return "warning";
  if (status.brain.suspect > 0 || status.brain.stale > 0) return "needs_refresh";
  if (status.brain.doctor === "unknown") return "unknown";
  return "healthy";
}

export function brainRefreshCommands(): string[] {
  return [
    "soturail brain stale --repair-plan",
    "soturail reverse claims ./src",
    "soturail brain consolidate --dry-run",
    "soturail brain doctor --repair-plan"
  ];
}

async function latestEvidencePath(root: string): Promise<string | null> {
  const reportsDir = getWorkspacePaths(root).reportsDir;
  const entries = await fs.readdir(reportsDir).catch(() => []);
  const evidence = entries.filter((entry) => entry.startsWith("evidence_") && entry.endsWith(".md")).sort().at(-1);
  return evidence ? relativeToRoot(root, path.join(reportsDir, evidence)) : null;
}

async function git(root: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd: root, timeout: 3000, windowsHide: true });
    return stdout.trim();
  } catch {
    return "";
  }
}

async function readJson(filePath: string): Promise<Record<string, any>> {
  const raw = await fs.readFile(filePath, "utf8").catch(() => "");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return {};
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function numberAt(value: Record<string, any>, keys: string[]): number {
  let current: unknown = value;
  for (const key of keys) {
    if (!current || typeof current !== "object" || !(key in current)) return 0;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "number" && Number.isFinite(current) ? current : 0;
}

function countStaleEvents(value: Record<string, unknown>): number {
  return numberAt(value as Record<string, any>, ["counts", "staleEvents"]);
}
