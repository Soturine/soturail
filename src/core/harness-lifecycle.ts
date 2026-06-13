import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
  ensureWorkspace,
  getWorkspacePaths,
  relativeToRoot,
  writeFileIfMissing,
  writeJson
} from "./config.js";
import { makeRailId } from "./rail-utils.js";

const execFileAsync = promisify(execFile);

export type FeatureStatus = "planned" | "active" | "done";

export interface FeatureEntry {
  id: string;
  title: string;
  status: FeatureStatus;
  definition_of_done: string[];
  evidence: string[];
  created_at: string;
  updated_at: string;
}

export interface FeatureList {
  schemaVersion: "soturail.feature-list.v1";
  active: string | null;
  features: FeatureEntry[];
}

export interface HarnessAuditCheck {
  id: string;
  title: string;
  status: "passed" | "warning";
  evidence: string[];
  recommendation?: string;
}

export interface HarnessAuditReport {
  schemaVersion: "soturail.harness.audit.v1";
  createdAt: string;
  status: "passed" | "warning";
  score: number;
  checks: HarnessAuditCheck[];
  warnings: string[];
  nextCommands: string[];
}

export interface SessionRecord {
  schemaVersion: "soturail.session.v1";
  id: string;
  objective: string;
  status: "active" | "ended";
  startedAt: string;
  endedAt?: string;
  summary?: string;
}

export interface HarnessLifecycleInitResult {
  created: string[];
  skipped: string[];
}

export interface HandoffOptions {
  objective?: string;
  completed?: string;
  blocker?: string;
  next?: string;
}

export async function initHarnessLifecycle(
  root = process.cwd(),
  options: { force?: boolean } = {}
): Promise<HarnessLifecycleInitResult> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const created: string[] = [];
  const skipped: string[] = [];
  const files = new Map<string, string>([
    [path.join(paths.harnessDir, "AGENTS.md"), harnessAgentsTemplate()],
    [path.join(paths.harnessDir, "instructions.md"), instructionsTemplate()],
    [path.join(paths.harnessDir, "verification.md"), verificationTemplate()],
    [path.join(paths.harnessDir, "scope.md"), scopeTemplate()],
    [path.join(paths.harnessDir, "lifecycle.md"), lifecycleTemplate()],
    [paths.featureListFile, `${JSON.stringify(emptyFeatureList(), null, 2)}\n`],
    [paths.progressFile, "# Progress\n\nNo lifecycle progress recorded yet.\n"],
    [paths.sessionHandoffFile, handoffTemplate()]
  ]);

  for (const [filePath, contents] of files) {
    const display = relativeToRoot(root, filePath);
    if (options.force) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, contents, "utf8");
      created.push(display);
      continue;
    }
    const result = await writeFileIfMissing(filePath, contents);
    (result === "created" ? created : skipped).push(display);
  }

  return { created, skipped };
}

export async function auditHarnessLifecycle(root = process.cwd()): Promise<HarnessAuditReport> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const checks: HarnessAuditCheck[] = [
    await auditFiles(root, "instructions", "Instructions", [
      path.join(paths.harnessDir, "AGENTS.md"),
      path.join(paths.harnessDir, "instructions.md")
    ], "Run: soturail harness init"),
    await auditFiles(root, "state", "State", [
      paths.featureListFile,
      paths.progressFile,
      paths.sessionHandoffFile
    ], "Run: soturail harness init"),
    await auditFiles(root, "verification", "Verification", [
      path.join(paths.harnessDir, "verification.md")
    ], "Document required checks in .soturail/harness/verification.md"),
    await auditFiles(root, "scope", "Scope", [
      path.join(paths.harnessDir, "scope.md")
    ], "Document in-scope and out-of-scope work"),
    await auditFiles(root, "session-lifecycle", "Session Lifecycle", [
      path.join(paths.harnessDir, "lifecycle.md"),
      paths.sessionHandoffFile
    ], "Run: soturail session start \"objective\""),
    await auditFiles(root, "host-compatibility", "Host Compatibility", [
      path.join(paths.harnessDir, "AGENTS.md")
    ], "Run: soturail agents doctor --all"),
    await auditFiles(root, "evidence-reports", "Evidence/Reports", [
      path.join(paths.harnessDir, "verification.md"),
      paths.progressFile
    ], "Record verification evidence before marking a feature done"),
    await auditFiles(root, "security-boundaries", "Security Boundaries", [
      path.join(paths.harnessDir, "scope.md")
    ], "Review docs/security/security-boundaries.md and keep local safe defaults")
  ];
  const passed = checks.filter((check) => check.status === "passed").length;
  const score = Math.round((passed / checks.length) * 100);
  const warnings = checks
    .filter((check) => check.status === "warning")
    .map((check) => `${check.title}: ${check.recommendation ?? "review missing evidence"}`);
  const report: HarnessAuditReport = {
    schemaVersion: "soturail.harness.audit.v1",
    createdAt: new Date().toISOString(),
    status: warnings.length === 0 ? "passed" : "warning",
    score,
    checks,
    warnings,
    nextCommands: [
      "soturail harness init",
      "soturail feature list",
      "soturail handoff generate",
      "soturail agents doctor --all"
    ]
  };
  await writeJson(paths.harnessAuditJson, report);
  await fs.writeFile(paths.harnessAuditMd, renderHarnessAudit(report), "utf8");
  return report;
}

export function renderHarnessAudit(report: HarnessAuditReport): string {
  return [
    "# SotuRail Harness Lifecycle Audit",
    "",
    `status: ${report.status}`,
    `score: ${report.score}`,
    "",
    "## Checks",
    "",
    ...report.checks.map((check) => `- ${check.title}: ${check.status}${check.recommendation ? ` - ${check.recommendation}` : ""}`),
    "",
    "## Safety",
    "",
    "- Commands run by audit: none",
    "- Local files are inspected without uploading telemetry.",
    "",
    "## Next Commands",
    "",
    ...report.nextCommands.map((command) => `- \`${command}\``),
    ""
  ].join("\n");
}

export async function addFeature(
  title: string,
  definitionOfDone: string[] = [],
  root = process.cwd()
): Promise<FeatureEntry> {
  const list = await loadFeatureList(root);
  const now = new Date().toISOString();
  const feature: FeatureEntry = {
    id: makeRailId("feature", title),
    title,
    status: "planned",
    definition_of_done: definitionOfDone,
    evidence: [],
    created_at: now,
    updated_at: now
  };
  list.features.push(feature);
  await saveFeatureList(root, list);
  await appendProgress(root, `Feature added: ${feature.id} - ${feature.title}`);
  return feature;
}

export async function startFeature(id: string, root = process.cwd()): Promise<FeatureEntry> {
  const list = await loadFeatureList(root);
  if (list.active && list.active !== id) {
    throw new Error(`Feature already active: ${list.active}. Mark it done before starting another feature.`);
  }
  const feature = requireFeature(list, id);
  feature.status = "active";
  feature.updated_at = new Date().toISOString();
  list.active = feature.id;
  await saveFeatureList(root, list);
  await appendProgress(root, `Feature started: ${feature.id} - ${feature.title}`);
  return feature;
}

export async function completeFeature(id: string, evidence: string[] = [], root = process.cwd()): Promise<FeatureEntry> {
  const list = await loadFeatureList(root);
  const feature = requireFeature(list, id);
  feature.status = "done";
  feature.updated_at = new Date().toISOString();
  feature.evidence = [...new Set([...feature.evidence, ...evidence])];
  if (list.active === feature.id) list.active = null;
  await saveFeatureList(root, list);
  await appendProgress(root, `Feature completed: ${feature.id} - ${feature.title}`);
  return feature;
}

export async function loadFeatureList(root = process.cwd()): Promise<FeatureList> {
  await initHarnessLifecycle(root);
  const raw = await fs.readFile(getWorkspacePaths(root).featureListFile, "utf8");
  const parsed = JSON.parse(raw) as Partial<FeatureList>;
  if (parsed.schemaVersion !== "soturail.feature-list.v1" || !Array.isArray(parsed.features)) {
    throw new Error("Invalid feature list. Expected schemaVersion soturail.feature-list.v1 and a features array.");
  }
  return {
    schemaVersion: "soturail.feature-list.v1",
    active: typeof parsed.active === "string" ? parsed.active : null,
    features: parsed.features
  };
}

export function renderFeatureList(list: FeatureList): string {
  return [
    "SotuRail feature lifecycle",
    `active: ${list.active ?? "none"}`,
    `features_count: ${list.features.length}`,
    ...list.features.map((feature) => `- ${feature.id}: ${feature.title} [${feature.status}]`)
  ].join("\n") + "\n";
}

export async function startSession(objective: string, root = process.cwd()): Promise<SessionRecord> {
  await initHarnessLifecycle(root);
  const paths = getWorkspacePaths(root);
  const current = await readSession(root);
  if (current?.status === "active") throw new Error(`Session already active: ${current.id}`);
  const session: SessionRecord = {
    schemaVersion: "soturail.session.v1",
    id: makeRailId("session", objective),
    objective,
    status: "active",
    startedAt: new Date().toISOString()
  };
  await writeJson(paths.sessionFile, session);
  await appendProgress(root, `Session started: ${session.id} - ${objective}`);
  return session;
}

export async function endSession(summary: string | undefined, root = process.cwd()): Promise<SessionRecord> {
  const session = await readSession(root);
  if (!session || session.status !== "active") throw new Error("No active session. Run: soturail session start \"objective\"");
  session.status = "ended";
  session.endedAt = new Date().toISOString();
  if (summary) session.summary = summary;
  await writeJson(getWorkspacePaths(root).sessionFile, session);
  await appendProgress(root, `Session ended: ${session.id}${summary ? ` - ${summary}` : ""}`);
  await generateHandoff(summary ? { objective: session.objective, completed: summary } : { objective: session.objective }, root);
  return session;
}

export async function generateHandoff(options: HandoffOptions = {}, root = process.cwd()): Promise<string> {
  await initHarnessLifecycle(root);
  const paths = getWorkspacePaths(root);
  const session = await readSession(root);
  const features = await loadFeatureList(root);
  const latestDone = [...features.features].reverse().find((feature) => feature.status === "done");
  const changedFiles = await gitChangedFiles(root);
  const content = [
    "# SotuRail Session Handoff",
    "",
    "## Current objective",
    "",
    options.objective ?? session?.objective ?? featureTitle(features, features.active) ?? "No active objective recorded.",
    "",
    "## Last completed work",
    "",
    options.completed ?? session?.summary ?? latestDone?.title ?? "No completed work recorded.",
    "",
    "## Files changed",
    "",
    ...(changedFiles.length > 0 ? changedFiles.map((file) => `- ${file}`) : ["- No Git working-tree changes detected."]),
    "",
    "## Verification status",
    "",
    "- Handoff generation does not run verification commands.",
    "- Review `.soturail/harness/verification.md` and attach evidence before marking work complete.",
    "",
    "## Known blockers",
    "",
    options.blocker ?? "No blockers recorded.",
    "",
    "## Next recommended steps",
    "",
    `- ${options.next ?? "Run `soturail harness audit` and the documented verification commands."}`,
    "- Review changed files and evidence before handing work to another host.",
    ""
  ].join("\n");
  await fs.writeFile(paths.sessionHandoffFile, content, "utf8");
  return content;
}

async function readSession(root: string): Promise<SessionRecord | null> {
  const raw = await fs.readFile(getWorkspacePaths(root).sessionFile, "utf8").catch(() => "");
  if (!raw) return null;
  return JSON.parse(raw) as SessionRecord;
}

async function saveFeatureList(root: string, list: FeatureList): Promise<void> {
  await writeJson(getWorkspacePaths(root).featureListFile, list);
}

async function appendProgress(root: string, text: string): Promise<void> {
  const filePath = getWorkspacePaths(root).progressFile;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `\n- ${new Date().toISOString()} ${text}\n`, "utf8");
}

async function auditFiles(
  root: string,
  id: string,
  title: string,
  files: string[],
  recommendation: string
): Promise<HarnessAuditCheck> {
  const evidence: string[] = [];
  for (const file of files) {
    if (await exists(file)) evidence.push(relativeToRoot(root, file));
  }
  const complete = evidence.length === files.length;
  return {
    id,
    title,
    status: complete ? "passed" : "warning",
    evidence,
    ...(complete ? {} : { recommendation })
  };
}

function requireFeature(list: FeatureList, id: string): FeatureEntry {
  const feature = list.features.find((item) => item.id === id);
  if (!feature) throw new Error(`Feature not found: ${id}`);
  return feature;
}

function featureTitle(list: FeatureList, id: string | null): string | undefined {
  return id ? list.features.find((feature) => feature.id === id)?.title : undefined;
}

async function gitChangedFiles(root: string): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync("git", ["status", "--short"], {
      cwd: root,
      timeout: 3000,
      windowsHide: true
    });
    return stdout.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function emptyFeatureList(): FeatureList {
  return { schemaVersion: "soturail.feature-list.v1", active: null, features: [] };
}

function harnessAgentsTemplate(): string {
  return `# SotuRail Harness Instructions

SotuRail is a local-first Context OS and harness layer for coding agents. It is not an autonomous agent runtime.

- Read scope and lifecycle notes before work.
- Keep MCP resources read-only unless a reviewed project policy says otherwise.
- Record verification evidence before marking work complete.
- Do not expose secrets or promise destructive shell execution.
`;
}

function instructionsTemplate(): string {
  return `# Instructions

- Preserve user work and existing project conventions.
- Use the smallest useful context and keep evidence paths.
- Prefer deterministic local checks.
- Require human approval for publish, release, destructive or external actions.
`;
}

function verificationTemplate(): string {
  return `# Verification

Document the project-specific checks required before completion.

\`\`\`bash
npm run typecheck
npm run build
npm test
\`\`\`

Harness audit validates this file but does not execute commands.
`;
}

function scopeTemplate(): string {
  return `# Scope And Security Boundaries

## In scope

- Local context, state, evidence, reports, workflows and host handoffs.

## Out of scope

- Cloud telemetry, mandatory servers, autonomous edit loops and destructive MCP tools.
- Secret exposure, unreviewed publishing and arbitrary shell execution through MCP.
`;
}

function lifecycleTemplate(): string {
  return `# Harness Lifecycle

1. Start a session with a clear objective.
2. Add and start one feature.
3. Record progress and evidence.
4. Audit the harness and run project verification.
5. Mark the feature done.
6. Generate a handoff and end the session.
`;
}

function handoffTemplate(): string {
  return `# SotuRail Session Handoff

## Current objective

No active objective recorded.

## Last completed work

No completed work recorded.

## Files changed

- No Git working-tree changes detected.

## Verification status

- Not run.

## Known blockers

No blockers recorded.

## Next recommended steps

- Run \`soturail harness audit\`.
`;
}
