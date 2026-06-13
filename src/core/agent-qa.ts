import { promises as fs } from "node:fs";
import path from "node:path";
import { exportAgents } from "./agent-exporter.js";
import { ensureWorkspace, getWorkspacePaths, relativeToRoot, writeJson } from "./config.js";

export interface AgentQaCase {
  id: string;
  description: string;
  result: "pass" | "fail" | "warn";
  evidence: string[];
  details: string;
}

export interface AgentQaReport {
  schemaVersion: "soturail.agent-qa.v1";
  createdAt: string;
  kind: "dataset" | "golden" | "regression";
  status: "passed" | "warning" | "failed";
  cases: AgentQaCase[];
  summary: { passed: number; failed: number; warnings: number };
  warnings: string[];
  nextCommands: string[];
}

const defaultDataset = {
  schemaVersion: "soturail.eval.dataset.v1",
  createdAt: "deterministic-template",
  cases: [
    "host-export-safety",
    "knowledge-pack-contract",
    "evidence-honesty",
    "skill-safety",
    "tasklet-dry-run"
  ]
};

export async function initEvalDataset(root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const target = path.join(getWorkspacePaths(root).evalsDir, "datasets", "default.json");
  await fs.mkdir(path.dirname(target), { recursive: true });
  if (!await exists(target)) await writeJson(target, defaultDataset);
  return target;
}

export async function runEvalDataset(root = process.cwd()): Promise<AgentQaReport> {
  await initEvalDataset(root);
  const paths = getWorkspacePaths(root);
  const cases: AgentQaCase[] = [];
  cases.push(await artifactCase("knowledge-pack-contract", paths.knowledgeDir, ["metadata.json", "source-map.json", "SKILL.md"], "Knowledge packs include metadata, source map and entry skill."));
  cases.push(await evidenceHonestyCase(paths.evidenceDir));
  cases.push(await artifactCase("skill-safety", paths.skillsDir, ["SKILL.md", "skill.yml"], "Skills include reviewed metadata and instructions."));
  cases.push(await taskletCase(paths.taskletsDir));
  cases.push(await hostExportCase(root, false));
  const report = buildReport("dataset", cases);
  await writeAgentQaReport(report, root, "dataset-latest");
  return report;
}

export async function runGoldenChecks(root = process.cwd()): Promise<AgentQaReport> {
  const host = await hostExportCase(root, true);
  const paths = getWorkspacePaths(root);
  const cases = [
    host,
    await artifactCase("knowledge-pack-contract", paths.knowledgeDir, ["metadata.json", "source-map.json", "SKILL.md"], "Knowledge packs include metadata and source maps."),
    await evidenceHonestyCase(paths.evidenceDir),
    await taskletCase(paths.taskletsDir)
  ];
  const report = buildReport("golden", cases);
  await writeAgentQaReport(report, root, "golden-latest");
  return report;
}

export async function runRegression(root = process.cwd()): Promise<AgentQaReport> {
  const paths = getWorkspacePaths(root);
  const current = await runGoldenChecks(root);
  const baselinePath = path.join(paths.evalsDir, "reports", "golden-baseline.json");
  const baseline = await readJson<AgentQaReport>(baselinePath);
  const cases: AgentQaCase[] = current.cases.map((item) => {
    const previous = baseline?.cases.find((candidate) => candidate.id === item.id);
    const regressed = previous?.result === "pass" && item.result !== "pass";
    return { ...item, result: regressed ? "fail" : item.result, details: regressed ? `Regression from pass: ${item.details}` : item.details };
  });
  const report = buildReport("regression", cases);
  if (!baseline) await writeJson(baselinePath, current);
  await writeAgentQaReport(report, root, "regression-latest");
  return report;
}

export function renderAgentQaReport(report: AgentQaReport): string {
  return [`# Agent QA ${report.kind}`, "", `Status: **${report.status}**`, `Passed: ${report.summary.passed}`, `Failed: ${report.summary.failed}`, `Warnings: ${report.summary.warnings}`, "", ...report.cases.map((item) => `- ${item.result.toUpperCase()} **${item.id}**: ${item.details}`), "", "Default Agent QA is offline, deterministic and provider-agnostic.", ""].join("\n");
}

async function hostExportCase(root: string, generate: boolean): Promise<AgentQaCase> {
  if (generate) await exportAgents("all", root);
  const dir = getWorkspacePaths(root).agentExportsDir;
  const files = await markdownFiles(dir);
  if (!files.length) return makeCase("host-export-safety", "warn", [], "No host exports found; run soturail agents export --agent all.");
  const issues: string[] = [];
  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    if (!text.trim()) issues.push(`${file}: empty`);
    if (!/SotuRail/i.test(text)) issues.push(`${file}: missing identity`);
    if (/\b(SoturAI|trading|backtesting)\b/i.test(text)) issues.push(`${file}: unrelated scope`);
    if (/autonomous agent runtime|destructive shell execution enabled/i.test(text)) issues.push(`${file}: unsafe overclaim`);
  }
  return makeCase("host-export-safety", issues.length ? "fail" : "pass", files.map((file) => relativeToRoot(root, file)), issues.join("; ") || `${files.length} exports preserve identity and safety boundaries.`);
}

async function evidenceHonestyCase(dir: string): Promise<AgentQaCase> {
  const files = await findNamed(dir, "evidence.json");
  if (!files.length) return makeCase("evidence-honesty", "warn", [], "No evidence runs found.");
  const issues: string[] = [];
  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { status?: string; checks?: unknown[] };
    if (parsed.status === "verified" && (!Array.isArray(parsed.checks) || parsed.checks.length === 0)) issues.push(`${file}: verified without checks`);
  }
  return makeCase("evidence-honesty", issues.length ? "fail" : "pass", files, issues.join("; ") || "Evidence does not claim unsupported verification.");
}

async function artifactCase(id: string, dir: string, required: string[], description: string): Promise<AgentQaCase> {
  const entries = (await fs.readdir(dir, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isDirectory());
  if (!entries.length) return makeCase(id, "warn", [], `No artifacts found. ${description}`);
  const missing: string[] = [];
  for (const entry of entries) for (const file of required) if (!await exists(path.join(dir, entry.name, file))) missing.push(`${entry.name}/${file}`);
  return makeCase(id, missing.length ? "fail" : "pass", entries.map((entry) => path.join(dir, entry.name)), missing.join(", ") || description);
}

async function taskletCase(dir: string): Promise<AgentQaCase> {
  const files = (await fs.readdir(dir).catch(() => [])).filter((file) => file.endsWith(".md"));
  if (!files.length) return makeCase("tasklet-dry-run", "warn", [], "No tasklets found.");
  const unsafe: string[] = [];
  for (const file of files) {
    const text = await fs.readFile(path.join(dir, file), "utf8");
    if (!/Disallowed actions/i.test(text) || !/Verification commands/i.test(text)) unsafe.push(file);
  }
  return makeCase("tasklet-dry-run", unsafe.length ? "fail" : "pass", files.map((file) => path.join(dir, file)), unsafe.length ? `Unsafe tasklet shape: ${unsafe.join(", ")}` : "Tasklets include boundaries and verification sections.");
}

async function writeAgentQaReport(report: AgentQaReport, root: string, name: string): Promise<void> {
  const dir = path.join(getWorkspacePaths(root).evalsDir, "reports");
  await fs.mkdir(dir, { recursive: true });
  await writeJson(path.join(dir, `${name}.json`), report);
  await fs.writeFile(path.join(dir, `${name}.md`), renderAgentQaReport(report), "utf8");
}

function buildReport(kind: AgentQaReport["kind"], cases: AgentQaCase[]): AgentQaReport {
  const summary = { passed: cases.filter((item) => item.result === "pass").length, failed: cases.filter((item) => item.result === "fail").length, warnings: cases.filter((item) => item.result === "warn").length };
  return { schemaVersion: "soturail.agent-qa.v1", createdAt: new Date().toISOString(), kind, status: summary.failed ? "failed" : summary.warnings ? "warning" : "passed", cases, summary, warnings: [], nextCommands: ["soturail eval golden", "soturail eval regression", "soturail eval report"] };
}

function makeCase(id: string, result: AgentQaCase["result"], evidence: string[], details: string): AgentQaCase {
  return { id, description: id.replace(/-/g, " "), result, evidence, details };
}

async function markdownFiles(dir: string): Promise<string[]> {
  const result: string[] = [];
  async function walk(current: string): Promise<void> {
    for (const entry of await fs.readdir(current, { withFileTypes: true }).catch(() => [])) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile() && entry.name.endsWith(".md")) result.push(absolute);
    }
  }
  await walk(dir);
  return result;
}

async function findNamed(dir: string, name: string): Promise<string[]> {
  const result: string[] = [];
  async function walk(current: string): Promise<void> {
    for (const entry of await fs.readdir(current, { withFileTypes: true }).catch(() => [])) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.name === name) result.push(absolute);
    }
  }
  await walk(dir);
  return result;
}

async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(() => true).catch(() => false);
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}
