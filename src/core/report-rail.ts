import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getWorkspacePaths, relativeToRoot, writeJson } from "./config.js";
import { buildStatus, type SotuRailStatus, type StatusLevel } from "./status-model.js";
import { redactText, scanReportSafety, writeRedactedReports, type ReportRedaction, type ReportSafetyResult } from "./report-redaction.js";
import { makeRailId } from "./rail-utils.js";
import { SOTURAIL_VERSION } from "./version.js";

export type ReportSeverity = "ok" | "warning" | "failed" | "unknown";
export type ReportAgent =
  | "codex"
  | "claude"
  | "gemini"
  | "gemini-legacy"
  | "cursor"
  | "opencode"
  | "antigravity"
  | "deepagents"
  | "deepagents-js"
  | "generic"
  | "amp"
  | "kiro";
export type ReportFormat = "html" | "md" | "json";

export interface ReportSection {
  id: string;
  title: string;
  severity: ReportSeverity;
  summary: string;
  evidencePaths: string[];
  nextCommands: string[];
}

export interface SotuRailReport {
  schemaVersion: "soturail.report.v1";
  id: string;
  createdAt: string;
  version: string;
  status: SotuRailStatus;
  sections: ReportSection[];
  warnings: string[];
  redactions: ReportRedaction[];
  nextCommands: string[];
}

export interface ReportBuildResult {
  report: SotuRailReport;
  paths: {
    json: string;
    markdown: string;
    html: string;
    githubSummary: string;
    agents: Record<ReportAgent, string>;
  };
  output: string;
}

export async function buildReport(root = process.cwd()): Promise<ReportBuildResult> {
  const resolvedRoot = path.resolve(root);
  const paths = getWorkspacePaths(resolvedRoot);
  await fs.mkdir(paths.reportsDir, { recursive: true });
  await fs.mkdir(path.join(paths.reportsDir, "history"), { recursive: true });
  await preservePreviousReport(resolvedRoot);
  const status = (await buildStatus(resolvedRoot)).status;
  const sections = reportSections(status);
  const warnings = sections.filter((section) => section.severity === "warning" || section.severity === "failed").map((section) => `${section.title}: ${section.summary}`);
  const report: SotuRailReport = {
    schemaVersion: "soturail.report.v1",
    id: makeRailId("report", `${status.project.gitCommit}:${Date.now()}`),
    createdAt: new Date().toISOString(),
    version: SOTURAIL_VERSION,
    status,
    sections,
    warnings,
    redactions: [],
    nextCommands: status.nextCommands
  };
  const jsonPath = path.join(paths.reportsDir, "latest.json");
  const markdownPath = path.join(paths.reportsDir, "latest.md");
  const htmlPath = path.join(paths.reportsDir, "latest.html");
  const markdown = redactText(renderReportMarkdown(report));
  const html = redactText(renderReportHtml(report));
  report.redactions = [...markdown.redactions, ...html.redactions];
  await writeJson(jsonPath, report);
  await fs.writeFile(markdownPath, markdown.text, "utf8");
  await fs.writeFile(htmlPath, html.text, "utf8");
  const githubSummary = await writeGithubSummary(resolvedRoot, report);
  const agents = Object.fromEntries(await Promise.all(reportAgents().map(async (agent) => [agent, await writeAgentReport(resolvedRoot, report, agent)]))) as Record<ReportAgent, string>;
  await writeJson(path.join(paths.reportsDir, "safety.json"), await scanReportSafety(resolvedRoot));
  return {
    report,
    paths: { json: jsonPath, markdown: markdownPath, html: htmlPath, githubSummary, agents },
    output: [
      "SotuRail report build",
      `schemaVersion: ${report.schemaVersion}`,
      `sections: ${report.sections.length}`,
      `warnings: ${report.warnings.length}`,
      `json: ${relativeToRoot(resolvedRoot, jsonPath)}`,
      `markdown: ${relativeToRoot(resolvedRoot, markdownPath)}`,
      `html: ${relativeToRoot(resolvedRoot, htmlPath)}`
    ].join("\n") + "\n"
  };
}

export async function reportLatest(root = process.cwd()): Promise<string> {
  const report = await readLatestReport(root);
  if (!report) return "No report found. Run: soturail report build\n";
  const brainNeedsRefresh = report.status.brain.brainStatus === "needs_refresh" || report.status.brain.brainStatus === "warning";
  return [
    "SotuRail report latest",
    `id: ${report.id}`,
    `version: ${report.version}`,
    `sections: ${report.sections.length}`,
    `warnings: ${report.warnings.length}`,
    `brain_status: ${report.status.brain.brainStatus}`,
    ...(brainNeedsRefresh ? [
      "brain_note: High suspect/stale counts mean the brain evidence may be old; they do not necessarily mean the code is broken."
    ] : []),
    `json: ${relativeToRoot(root, path.join(getWorkspacePaths(root).reportsDir, "latest.json"))}`,
    `markdown: ${relativeToRoot(root, path.join(getWorkspacePaths(root).reportsDir, "latest.md"))}`,
    `html: ${relativeToRoot(root, path.join(getWorkspacePaths(root).reportsDir, "latest.html"))}`,
    "next_commands:",
    ...report.nextCommands.slice(0, 8).map((command) => `- ${command}`)
  ].join("\n") + "\n";
}

export async function exportReport(root = process.cwd(), format: ReportFormat): Promise<{ path: string; output: string }> {
  const report = await readLatestReport(root) ?? (await buildReport(root)).report;
  const paths = getWorkspacePaths(root);
  const output = path.join(paths.reportsDir, `export.${format === "md" ? "md" : format}`);
  const contents = format === "json"
    ? `${JSON.stringify(report, null, 2)}\n`
    : format === "html"
      ? renderReportHtml(report)
      : renderReportMarkdown(report);
  await fs.writeFile(output, redactText(contents).text, "utf8");
  return { path: output, output: `Report export written: ${relativeToRoot(root, output)}\n` };
}

export async function reportDoctor(root = process.cwd()): Promise<{ safety: ReportSafetyResult; output: string }> {
  const paths = getWorkspacePaths(root);
  const jsonPath = path.join(paths.reportsDir, "latest.json");
  const markdownPath = path.join(paths.reportsDir, "latest.md");
  const htmlPath = path.join(paths.reportsDir, "latest.html");
  const report = await readLatestReport(root);
  const jsonParseable = await isJsonParseable(jsonPath);
  const safety = await scanReportSafety(root);
  const evidenceMissing = report?.sections.flatMap((section) => section.evidencePaths).filter((item) => item !== "missing" && !existsSync(path.join(root, item))) ?? [];
  const tooLarge = await fileSize(markdownPath) > 200_000;
  const ok = Boolean(report && jsonParseable && existsSync(markdownPath) && existsSync(htmlPath) && safety.ok && !tooLarge);
  return {
    safety,
    output: [
      "SotuRail report doctor",
      `ok: ${ok}`,
      `json_report: ${existsSync(jsonPath) ? "present" : "missing"}`,
      `json_parseable: ${jsonParseable}`,
      `markdown_report: ${existsSync(markdownPath) ? "present" : "missing"}`,
      `html_report: ${existsSync(htmlPath) ? "present" : "missing"}`,
      `safety_ok: ${safety.ok}`,
      `secret_findings: ${safety.findings.length}`,
      `large_for_agent_export: ${tooLarge}`,
      `missing_evidence_paths: ${evidenceMissing.length}`,
      ...(evidenceMissing.length > 0 ? [`missing_evidence_sample: ${evidenceMissing.slice(0, 5).join(", ")}`] : []),
      "next_commands:",
      "- soturail report build",
      "- soturail report redact",
      "- soturail self schemas --check",
      "- soturail dashboard build",
      "- soturail status --agent"
    ].join("\n") + "\n"
  };
}

export async function reportRedact(root = process.cwd()): Promise<string> {
  return (await writeRedactedReports(root)).output;
}

export async function reportDiff(root = process.cwd()): Promise<string> {
  const paths = getWorkspacePaths(root);
  const latest = await readLatestReport(root);
  const previous = await latestHistoricalReport(root);
  const diffPath = path.join(paths.reportsDir, "diff.json");
  const diffMd = path.join(paths.reportsDir, "diff.md");
  const status = !latest ? "missing_latest_report" : previous ? "compared" : "no_previous_report";
  const nextCommands = status === "missing_latest_report"
    ? ["soturail report build"]
    : status === "no_previous_report"
      ? ["soturail report build"]
      : ["soturail report latest"];
  const diff = {
    schemaVersion: "soturail.report.diff.v1",
    createdAt: new Date().toISOString(),
    status,
    latest: latest?.id ?? null,
    previous: previous?.id ?? null,
    changes: latest && previous ? {
      warnings: latest.warnings.length - previous.warnings.length,
      brainSuspect: latest.status.brain.suspect - previous.status.brain.suspect,
      brainStale: latest.status.brain.stale - previous.status.brain.stale,
      benchCases: latest.status.bench.cases - previous.status.bench.cases,
      benchWarnings: latest.status.bench.warnings - previous.status.bench.warnings,
      nativeCandidates: latest.status.native.candidates - previous.status.native.candidates,
      baselineSignals: latest.status.baseline.signalsPassed + latest.status.baseline.signalsFailed - (previous.status.baseline.signalsPassed + previous.status.baseline.signalsFailed),
      baselineFailures: latest.status.baseline.signalsFailed - previous.status.baseline.signalsFailed,
      releaseCheckChanged: latest.status.release.releaseCheck !== previous.status.release.releaseCheck,
      workflowEvidenceChanged: latest.status.workflow.latestEvidence !== previous.status.workflow.latestEvidence
    } : null,
    nextCommands
  };
  await writeJson(diffPath, diff);
  const markdown = [
    "# SotuRail Report Diff",
    "",
    `status: ${diff.status}`,
    `latest: ${diff.latest ?? "missing"}`,
    `previous: ${diff.previous ?? "none"}`,
    "",
    diff.changes ? JSON.stringify(diff.changes, null, 2) : status === "missing_latest_report" ? "No latest report was available. Run `soturail report build`." : "No previous report was available for comparison. Run `soturail report build` again after changes.",
    "",
    "## Next",
    "",
    ...nextCommands.map((command) => `- \`${command}\``),
    ""
  ].join("\n");
  await fs.writeFile(diffMd, markdown, "utf8");
  return [
    "SotuRail report diff",
    `latest: ${diff.latest ?? "missing"}`,
    `previous: ${diff.previous ?? "none"}`,
    `json: ${relativeToRoot(root, diffPath)}`,
    `markdown: ${relativeToRoot(root, diffMd)}`
  ].join("\n") + "\n";
}

export async function reportGithubSummary(root = process.cwd()): Promise<string> {
  const report = await readLatestReport(root) ?? (await buildReport(root)).report;
  const output = await writeGithubSummary(root, report);
  return `GitHub summary written: ${relativeToRoot(root, output)}\n`;
}

export async function reportAgent(root = process.cwd(), agent: ReportAgent): Promise<string> {
  const report = await readLatestReport(root) ?? (await buildReport(root)).report;
  const output = await writeAgentReport(root, report, agent);
  return `Agent report written: ${relativeToRoot(root, output)}\n`;
}

export async function reportOpen(root = process.cwd()): Promise<string> {
  const html = path.join(getWorkspacePaths(root).reportsDir, "latest.html");
  return `Report HTML: ${relativeToRoot(root, html)}\nOpen this local file in a browser if desired.\n`;
}

export async function readLatestReport(root = process.cwd()): Promise<SotuRailReport | null> {
  const raw = await fs.readFile(path.join(getWorkspacePaths(root).reportsDir, "latest.json"), "utf8").catch(() => "");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SotuRailReport;
    return parsed.schemaVersion === "soturail.report.v1" ? parsed : null;
  } catch {
    return null;
  }
}

export function renderReportMarkdown(report: SotuRailReport): string {
  return [
    "# SotuRail Local Report",
    "",
    "SotuRail reports are local artifacts for humans, CI and coding agents. They do not upload telemetry or require a dashboard server.",
    "",
    `schemaVersion: ${report.schemaVersion}`,
    `id: ${report.id}`,
    `createdAt: ${report.createdAt}`,
    `version: ${report.version}`,
    "",
    "## Summary",
    "",
    `- release: ${report.status.release.releaseCheck}`,
    `- brain: ${report.status.brain.doctor} (${report.status.brain.brainStatus})`,
    `- eval: passed=${report.status.eval.passed}, failed=${report.status.eval.failed}, warnings=${report.status.eval.warnings}`,
    `- bench: cases=${report.status.bench.cases}, warnings=${report.status.bench.warnings}`,
    `- native: available=${report.status.native.available}, fallback=${report.status.native.fallback}`,
    `- baseline: failed=${report.status.baseline.signalsFailed}`,
    "",
    "## Sections",
    "",
    ...report.sections.flatMap((section) => [
      `### ${section.title}`,
      "",
      `severity: ${section.severity}`,
      "",
      section.summary,
      "",
      "Evidence:",
      ...(section.evidencePaths.length > 0 ? section.evidencePaths.map((item) => `- ${item}`) : ["- none"]),
      "",
      "Next:",
      ...(section.nextCommands.length > 0 ? section.nextCommands.map((item) => `- \`${item}\``) : ["- none"]),
      ""
    ]),
    "## Safe Next Commands",
    "",
    ...report.nextCommands.map((command) => `- \`${command}\``),
    "",
    "## Warnings",
    "",
    ...(report.warnings.length > 0 ? report.warnings.map((warning) => `- ${warning}`) : ["- none"]),
    ...(report.status.brain.brainStatus === "needs_refresh" ? [
      "- Brain evidence needs refresh: high suspect/stale counts usually mean evidence is old, not necessarily broken code."
    ] : []),
    ""
  ].join("\n");
}

export function renderReportHtml(report: SotuRailReport): string {
  const cards = report.sections.map((section) => `<section class="card ${section.severity}"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.summary)}</p><p><strong>Severity:</strong> ${section.severity}</p><ul>${section.evidencePaths.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SotuRail Local Report</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;margin:0;background:#f8fafc;color:#172033}
header{padding:24px 32px;background:#12343b;color:white}
main{padding:24px 32px;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.card{background:white;border:1px solid #d7dee8;border-radius:8px;padding:16px}
.ok{border-left:6px solid #15803d}.warning,.unknown{border-left:6px solid #b45309}.failed{border-left:6px solid #b91c1c}
code{background:#eef2f7;padding:2px 4px;border-radius:4px}
</style>
</head>
<body>
<header><h1>SotuRail Local Report</h1><p>No cloud, no telemetry upload, no server required.</p><p>Version ${escapeHtml(report.version)} &middot; ${escapeHtml(report.createdAt)}</p></header>
<main>${cards}</main>
</body>
</html>
`;
}

export function renderAgentReport(report: SotuRailReport, agent: ReportAgent): string {
  const hostNote = hostReportNote(agent);
  const body = [
    "# Current Project Status",
    "",
    `Version: ${report.version}`,
    `Release: ${report.status.release.releaseCheck}`,
    `Brain: ${report.status.brain.doctor} (${report.status.brain.brainStatus})`,
    "",
    "## Known Problems",
    "",
    ...(report.warnings.length > 0 ? report.warnings.slice(0, 12).map((warning) => `- ${warning}`) : ["- none"]),
    ...(report.status.brain.brainStatus === "needs_refresh" ? [
      "- High suspect/stale brain counts mean evidence may be old; refresh the brain before relying on claims."
    ] : []),
    "",
    "## Safe Next Commands",
    "",
    ...report.nextCommands.slice(0, 12).map((command) => `- ${command}`),
    "",
    "## Do Not Do",
    "",
    "- Do not upload reports or telemetry.",
    "- Do not expose raw logs, tokens or .env contents.",
    "- Do not claim native speedups without benchmark evidence.",
    "- Do not assume host-native integration where SotuRail only generated prompt/context artifacts.",
    "",
    "## Host Compatibility Note",
    "",
    hostNote,
    "",
    "## Evidence Paths",
    "",
    "- .soturail/reports/latest.json",
    "- .soturail/status/latest.json",
    report.status.eval.latestReport !== "missing" ? `- ${report.status.eval.latestReport}` : "- eval report missing",
    report.status.bench.latestReport !== "missing" ? `- ${report.status.bench.latestReport}` : "- bench report missing",
    report.status.baseline.latestReport !== "missing" ? `- ${report.status.baseline.latestReport}` : "- baseline report missing",
    "",
    "## Recommended Fix Order",
    "",
    ...report.nextCommands.slice(0, 8).map((command) => `- ${command}`),
    ""
  ].join("\n");
  if (agent === "claude") return `<soturail_report>\n${body}\n</soturail_report>\n`;
  if (agent === "codex") return `${body}\n## Codex Notes\n\nKeep edits local, use evidence paths, and run checks before release.\n`;
  if (agent === "gemini" || agent === "gemini-legacy") return `${body}\n## Gemini Context\n\nLarge-context readers can inspect the evidence paths above before acting. Legacy-compatible hosts remain prompt-only unless a host contract is verified.\n`;
  if (agent === "cursor") return `${body}\n## Cursor Notes\n\nKeep rules compact, source-linked and project-local.\n`;
  if (agent === "opencode") return `${body}\n## OpenCode Notes\n\nUse AGENTS.md/context artifacts as a generic-compatible handoff. Do not assume full host-native support.\n`;
  if (agent === "antigravity") return `${body}\n## Antigravity Notes\n\nAntigravity is high-priority but experimental; prefer reviewed prompt/context handoff until stable Google-local config is documented.\n`;
  if (agent === "deepagents" || agent === "deepagents-js") return `${body}\n## DeepAgents Notes\n\nUse this as role-pack/context evidence only. SotuRail does not run a Deep Agents runtime.\n`;
  return body;
}

function reportAgents(): ReportAgent[] {
  return ["codex", "claude", "gemini", "gemini-legacy", "cursor", "opencode", "antigravity", "deepagents", "deepagents-js", "generic", "amp", "kiro"];
}

function hostReportNote(agent: ReportAgent): string {
  if (agent === "claude" || agent === "codex" || agent === "cursor" || agent === "generic") return "This host has stable or generic-stable local report handoff support in SotuRail v1.1.";
  if (agent === "gemini" || agent === "gemini-legacy") return "Gemini-compatible support uses prompt/context artifacts and legacy-compatible Markdown handoff.";
  if (agent === "opencode") return "OpenCode is generic-compatible: AGENTS.md and context-pack exports are supported, while host-native configuration remains unclaimed.";
  if (agent === "antigravity") return "Antigravity is experimental and high-priority: use safe prompt/context exports until stable local config is verified.";
  if (agent === "deepagents" || agent === "deepagents-js") return "DeepAgents targets receive role-pack/context artifacts only; runtime execution is outside SotuRail.";
  return "This target uses a generic prompt/context handoff.";
}

async function writeAgentReport(root: string, report: SotuRailReport, agent: ReportAgent): Promise<string> {
  const filePath = path.join(getWorkspacePaths(root).reportsDir, `agent-${agent}.md`);
  await fs.writeFile(filePath, redactText(renderAgentReport(report, agent)).text, "utf8");
  return filePath;
}

async function writeGithubSummary(root: string, report: SotuRailReport): Promise<string> {
  const filePath = path.join(getWorkspacePaths(root).reportsDir, "github-step-summary.md");
  const content = [
    "## SotuRail Summary",
    "",
    `- Version: ${report.version}`,
    `- Release check: ${report.status.release.releaseCheck}`,
    `- Eval: ${report.status.eval.passed} passed, ${report.status.eval.failed} failed, ${report.status.eval.warnings} warnings`,
    `- Bench: ${report.status.bench.cases} cases, ${report.status.bench.warnings} warnings`,
    `- Brain: ${report.status.brain.claims} claims, ${report.status.brain.suspect} suspect/stale, status=${report.status.brain.brainStatus}`,
    `- Baseline: ${report.status.baseline.signalsPassed} passed, ${report.status.baseline.signalsFailed} failed`,
    `- Native fallback: ${report.status.native.fallback}`,
    "",
    "### Artifact Paths",
    "",
    "- `.soturail/reports/latest.json`",
    "- `.soturail/reports/latest.md`",
    "- `.soturail/status/latest.json`",
    "",
    "### Safe Next Commands",
    "",
    ...report.nextCommands.slice(0, 8).map((command) => `- \`${command}\``),
    ""
  ].join("\n");
  await fs.writeFile(filePath, redactText(content).text, "utf8");
  return filePath;
}

function reportSections(status: SotuRailStatus): ReportSection[] {
  return [
    section("project-status", "Project Status", status.project.dirty ? "warning" : "ok", `Git ${status.project.gitCommit}; dirty=${status.project.dirty}.`, [], ["soturail status --json"]),
    section("release-readiness", "Release Readiness", level(status.release.releaseCheck), `Package ${status.release.packageVersion}, CLI ${status.release.cliVersion}, notes ${status.release.releaseNotesPath}.`, [status.release.releaseNotesPath], ["soturail release check"]),
    section("brain-health", "Brain Health", brainSeverity(status), `${status.brain.claims} claims, ${status.brain.suspect} suspect, ${status.brain.stale} stale; status=${status.brain.brainStatus}. High suspect/stale counts mean evidence may be old, not necessarily broken code.`, [".soturail/brain/doctor.json"], ["soturail brain stale --repair-plan", "soturail reverse claims ./src", "soturail brain consolidate --dry-run", "soturail brain doctor --repair-plan"]),
    section("eval-summary", "Eval Summary", status.eval.failed > 0 ? "failed" : status.eval.latestReport === "missing" ? "unknown" : "ok", `${status.eval.passed} passed, ${status.eval.failed} failed, ${status.eval.warnings} warnings.`, [status.eval.latestReport], ["soturail eval run --suite brain"]),
    section("benchmark-summary", "Benchmark Summary", status.bench.warnings > 0 ? "warning" : status.bench.latestReport === "missing" ? "unknown" : "ok", `${status.bench.cases} cases, ${status.bench.warnings} warnings.`, [status.bench.latestReport], ["soturail bench run --suite brain"]),
    section("native-candidates", "Native Candidates", "ok", `${status.native.candidates} candidates; fallback=${status.native.fallback}; available=${status.native.available}.`, [".soturail/native/candidates.json"], ["soturail native candidates"]),
    section("baseline-snapshot", "Baseline Snapshot", status.baseline.signalsFailed > 0 ? "warning" : status.baseline.latestReport === "missing" ? "unknown" : "ok", `${status.baseline.signalsPassed} signals passed, ${status.baseline.signalsFailed} failed.`, [status.baseline.latestReport], ["soturail self baseline --check"]),
    section("workflow-evidence", "Workflow Evidence", status.workflow.latestEvidence ? "ok" : "unknown", `Active workflow: ${status.workflow.activeWorkflow ?? "none"}.`, [status.workflow.latestEvidence ?? "missing"], ["soturail workflow list"]),
    section("harness-diagram", "Harness And Diagram", status.harness.failures > 0 ? "warning" : "unknown", `Harness failures=${status.harness.failures}; diagram=${status.diagram.validation}.`, [status.diagram.latestReport ?? "missing"], ["soturail harness doctor", "soturail diagram validate"]),
    section("agent-readiness", "Agent Readiness", level(status.agents.readiness), `Agent readiness is ${status.agents.readiness}.`, [".soturail/exports/agents/"], ["soturail agents status"]),
    section("report-safety", "Report Safety", "ok", "Reports are redaction-checked local artifacts. No telemetry upload is used.", [".soturail/reports/safety.json"], ["soturail report redact"])
  ];
}

function section(id: string, title: string, severity: ReportSeverity, summary: string, evidencePaths: string[], nextCommands: string[]): ReportSection {
  return { id, title, severity, summary, evidencePaths, nextCommands };
}

function level(status: StatusLevel): ReportSeverity {
  if (status === "passed") return "ok";
  if (status === "failed") return "failed";
  return status;
}

function brainSeverity(status: SotuRailStatus): ReportSeverity {
  if (status.brain.brainStatus === "healthy") return "ok";
  if (status.brain.brainStatus === "needs_refresh" || status.brain.brainStatus === "warning") return "warning";
  return level(status.brain.doctor);
}

async function isJsonParseable(filePath: string): Promise<boolean> {
  const raw = await fs.readFile(filePath, "utf8").catch(() => "");
  if (!raw) return false;
  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

async function preservePreviousReport(root: string): Promise<void> {
  const paths = getWorkspacePaths(root);
  const latest = path.join(paths.reportsDir, "latest.json");
  if (!existsSync(latest)) return;
  const raw = await fs.readFile(latest, "utf8").catch(() => "");
  if (!raw) return;
  const history = path.join(paths.reportsDir, "history", `report-${Date.now()}.json`);
  await fs.mkdir(path.dirname(history), { recursive: true });
  await fs.writeFile(history, raw, "utf8");
}

async function latestHistoricalReport(root: string): Promise<SotuRailReport | null> {
  const historyDir = path.join(getWorkspacePaths(root).reportsDir, "history");
  const entries = (await fs.readdir(historyDir).catch(() => [])).filter((entry) => entry.endsWith(".json")).sort();
  const latest = entries.at(-1);
  if (!latest) return null;
  const raw = await fs.readFile(path.join(historyDir, latest), "utf8").catch(() => "");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SotuRailReport;
  } catch {
    return null;
  }
}

async function fileSize(filePath: string): Promise<number> {
  return fs.stat(filePath).then((stat) => stat.size).catch(() => 0);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
