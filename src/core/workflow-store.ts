import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths, readJsonl, relativeToRoot, writeJson } from "./config.js";
import { planWorktree } from "./worktree-manager.js";
import type { HarnessFailureRecord } from "./harness-rail.js";
import type { PolicyDecision, PolicyQueueItem } from "./policy-rail.js";
import type { RawRunRecord } from "./raw-store.js";

export type WorkflowState = "draft" | "planned" | "active" | "verifying" | "ready_for_review" | "closed" | "blocked";

export interface WorkflowRecord {
  id: string;
  title: string;
  state: WorkflowState;
  created_at: string;
  updated_at: string;
  worktree_path?: string;
  branch?: string;
}

export interface WorkflowStartOptions {
  worktree?: boolean;
  dryRun?: boolean;
}

export interface WorkflowCleanupResult {
  lines: string[];
}

export interface WorkflowPlanRecord {
  schemaVersion: "soturail.workflow.plan.v2";
  id: string;
  title: string;
  status: WorkflowState;
  phase: "plan";
  createdAt: string;
  tasks: string[];
  acceptanceGates: string[];
  rolePacks: string[];
  contextRoutes: string[];
  linkedRunWorkspace: string | null;
  evidencePath: string;
}

export interface WorkflowReviewReport {
  schemaVersion: "soturail.workflow.review.v1";
  id: string;
  workflowId: string;
  createdAt: string;
  perspectives: Array<{ name: WorkflowReviewPerspective; result: "pass" | "warn"; notes: string[] }>;
}

export type WorkflowReviewPerspective = "security" | "docs" | "tests" | "release" | "context" | "agent-readiness";

export interface WorkflowVerifyReport {
  schemaVersion: "soturail.workflow.verify.v1";
  id: string;
  workflowId: string;
  createdAt: string;
  summary: {
    harnessContract: string;
    policy: string;
    evidence: string;
    diagram: string;
    evalReport: string;
    releasePreflight: string;
  };
  paths: {
    json: string;
    markdown: string;
    review: string;
    harnessContract: string;
    policyQueue: string;
    policyDecisions: string;
    diagramValidation: string;
    evalReport: string;
    releaseNotes: string;
  };
}

const states: WorkflowState[] = ["draft", "planned", "active", "verifying", "ready_for_review", "closed", "blocked"];
const reviewPerspectives: WorkflowReviewPerspective[] = ["security", "docs", "tests", "release", "context", "agent-readiness"];

export async function setupWorkflowRail(root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  await fs.mkdir(paths.workflowTemplatesDir, { recursive: true });
  await writeFileIfMissing(path.join(paths.workflowTemplatesDir, "feature.md"), workflowTemplate("feature"));
  await writeFileIfMissing(path.join(paths.workflowTemplatesDir, "release.md"), workflowTemplate("release"));
  if (!(await exists(paths.workflowIndexFile))) await writeJson(paths.workflowIndexFile, { schemaVersion: "soturail.workflow.index.v2", workflows: [] });
  if (!(await exists(paths.workflowCurrentFile))) await writeJson(paths.workflowCurrentFile, { schemaVersion: "soturail.workflow.current.v1", id: null });
  return [
    "SotuRail workflow setup",
    `workflows_dir: ${relativeToRoot(root, paths.workflowsDir)}`,
    `templates_dir: ${relativeToRoot(root, paths.workflowTemplatesDir)}`,
    `index: ${relativeToRoot(root, paths.workflowIndexFile)}`,
    `current: ${relativeToRoot(root, paths.workflowCurrentFile)}`,
    "next_commands:",
    "- soturail workflow plan \"Task title\"",
    "- soturail workflow work",
    "- soturail workflow review --all",
    "- soturail workflow verify"
  ].join("\n") + "\n";
}

export async function createWorkflow(title: string, root = process.cwd(), now = new Date().toISOString()): Promise<WorkflowRecord> {
  await ensureWorkspace(root);
  const id = `${now.slice(0, 10).replace(/-/g, "")}-${slug(title)}`;
  const paths = getWorkspacePaths(root);
  const dir = path.join(paths.workflowsDir, id);
  const record: WorkflowRecord = { id, title, state: "draft", created_at: now, updated_at: now };
  await fs.mkdir(path.join(dir, "logs"), { recursive: true });
  await writeWorkflowRecord(dir, record);
  await fs.writeFile(path.join(dir, "plan.md"), `# Plan: ${title}\n\nAdd reviewed plan steps here.\n`, "utf8");
  await fs.writeFile(path.join(dir, "tasks.md"), `# Tasks: ${title}\n\n- [ ] Define the change.\n- [ ] Run explicit verification.\n`, "utf8");
  await fs.writeFile(path.join(dir, "verification.md"), `# Verification: ${title}\n\nConfigured checks: none yet.\n\nChecklist:\n- [ ] npm run build\n- [ ] npm test\n- [ ] npm audit --omit=dev\n`, "utf8");
  await setCurrentWorkflow(id, root);
  await refreshWorkflowIndex(root);
  return record;
}

export async function listWorkflows(root = process.cwd()): Promise<WorkflowRecord[]> {
  const paths = getWorkspacePaths(root);
  const entries = await fs.readdir(paths.workflowsDir, { withFileTypes: true }).catch(() => []);
  const records: WorkflowRecord[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "templates") continue;
    const record = await readWorkflow(entry.name, root).catch(() => null);
    if (record) records.push(record);
  }
  return records.sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function readWorkflow(id: string, root = process.cwd()): Promise<WorkflowRecord> {
  const filePath = path.join(getWorkspacePaths(root).workflowsDir, id, "workflow.yml");
  const raw = await fs.readFile(filePath, "utf8").catch(async (error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
    throw new Error(await missingWorkflowMessage(id, root));
  });
  const record = parseWorkflow(raw);
  if (!states.includes(record.state)) throw new Error(`Invalid workflow state: ${record.state}`);
  return record;
}

export async function planWorkflow(id: string, root = process.cwd()): Promise<WorkflowRecord> {
  const record = await updateWorkflow(id, root, { state: "planned" });
  const planPath = path.join(getWorkspacePaths(root).workflowsDir, id, "plan.md");
  await appendIfMissing(planPath, "\n## Reviewed Scope\n\n- Problem statement\n- Safety notes\n- Verification plan\n");
  await writeWorkflowPlanRecord(record, root);
  await setCurrentWorkflow(id, root);
  return record;
}

export async function createWorkflowPlan(title: string, root = process.cwd()): Promise<{ record: WorkflowRecord; plan: WorkflowPlanRecord; output: string }> {
  await setupWorkflowRail(root);
  const created = await createWorkflow(title, root);
  const record = await planWorkflow(created.id, root);
  const plan = await writeWorkflowPlanRecord(record, root);
  return {
    record,
    plan,
    output: [
      "SotuRail workflow plan",
      `id: ${record.id}`,
      `title: ${record.title}`,
      `status: ${record.state}`,
      `phase: ${plan.phase}`,
      `plan: ${relativeToRoot(root, path.join(getWorkspacePaths(root).workflowsDir, record.id, "plan.json"))}`,
      `evidence_path: ${plan.evidencePath}`,
      "next_commands:",
      `- soturail workflow work ${record.id}`,
      `- soturail workflow review ${record.id} --all`,
      `- soturail workflow verify ${record.id}`
    ].join("\n") + "\n"
  };
}

export async function currentWorkflowId(root = process.cwd()): Promise<string | null> {
  const paths = getWorkspacePaths(root);
  const raw = await fs.readFile(paths.workflowCurrentFile, "utf8").catch(() => "");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { id?: string | null };
      if (parsed.id) return parsed.id;
    } catch {
      // Fall back to newest workflow below.
    }
  }
  return (await listWorkflows(root))[0]?.id ?? null;
}

export async function workflowWork(id: string | undefined, note = "Progress recorded.", root = process.cwd()): Promise<string> {
  const workflowId = id ?? await requiredCurrentWorkflow(root);
  const record = await updateWorkflow(workflowId, root, { state: "active" });
  const paths = getWorkspacePaths(root);
  const dir = path.join(paths.workflowsDir, workflowId);
  const workPath = path.join(dir, "work.md");
  const changedFiles = await gitChangedFiles(root);
  const rawRecords = await readJsonl<RawRunRecord>(paths.rawIndex);
  const failures = await readJsonl<HarnessFailureRecord>(paths.harnessFailuresFile);
  await appendIfMissing(workPath, `# Work: ${record.title}\n`);
  await fs.appendFile(workPath, [
    "",
    `## ${new Date().toISOString()}`,
    "",
    note,
    "",
    `- changed_files: ${changedFiles.length}`,
    `- raw_ids: ${rawRecords.length}`,
    `- harness_failures: ${failures.filter((failure) => failure.workflowId === workflowId || !failure.workflowId).length}`,
    ""
  ].join("\n"), "utf8");
  await setCurrentWorkflow(workflowId, root);
  return [
    "SotuRail workflow work",
    `id: ${workflowId}`,
    `phase: work`,
    `state: ${record.state}`,
    `work_path: ${relativeToRoot(root, workPath)}`,
    `progress_appended: ${note}`,
    `changed_files: ${changedFiles.length}`,
    `raw_ids: ${rawRecords.length}`,
    `harness_failures: ${failures.length}`
  ].join("\n") + "\n";
}

export async function reviewWorkflow(
  id: string | undefined,
  options: { all?: boolean; perspective?: string } = {},
  root = process.cwd()
): Promise<{ report: WorkflowReviewReport; markdownPath: string; jsonPath: string; output: string }> {
  const workflowId = id ?? await requiredCurrentWorkflow(root);
  const record = await updateWorkflow(workflowId, root, { state: "ready_for_review" });
  const selected = options.all || !options.perspective
    ? reviewPerspectives
    : parsePerspective(options.perspective);
  const paths = getWorkspacePaths(root);
  const dir = path.join(paths.workflowsDir, workflowId);
  const changedFiles = await gitChangedFiles(root);
  const failures = await readJsonl<HarnessFailureRecord>(paths.harnessFailuresFile);
  const report: WorkflowReviewReport = {
    schemaVersion: "soturail.workflow.review.v1",
    id: `${workflowId}-review`,
    workflowId,
    createdAt: new Date().toISOString(),
    perspectives: selected.map((name) => ({
      name,
      result: reviewResultFor(name, changedFiles, failures),
      notes: reviewNotesFor(name, record, changedFiles, failures)
    }))
  };
  const jsonPath = path.join(dir, "review.json");
  const markdownPath = path.join(dir, "review.md");
  await writeJson(jsonPath, report);
  await fs.writeFile(markdownPath, renderReviewMarkdown(report, record), "utf8");
  await setCurrentWorkflow(workflowId, root);
  return {
    report,
    markdownPath,
    jsonPath,
    output: [
      "SotuRail workflow review",
      `id: ${workflowId}`,
      `perspectives: ${selected.join(", ")}`,
      `review_json: ${relativeToRoot(root, jsonPath)}`,
      `review_md: ${relativeToRoot(root, markdownPath)}`
    ].join("\n") + "\n"
  };
}

export async function startWorkflow(id: string, options: WorkflowStartOptions = {}, root = process.cwd()): Promise<string> {
  const record = await readWorkflow(id, root);
  const lines = [`SotuRail workflow start ${id}${options.worktree ? " --worktree" : ""}${options.dryRun ? " --dry-run" : ""}`];
  let updates: Partial<WorkflowRecord> = { state: "active" };
  if (options.worktree) {
    const plan = await planWorktree(root, id, options.dryRun !== false);
    lines.push(`worktree_available: ${plan.available ? "yes" : "no"}`);
    lines.push(`branch: ${plan.branch}`);
    lines.push(`worktree_path: ${relativeToRoot(root, plan.worktreePath)}`);
    lines.push(`message: ${plan.message}`);
    lines.push("rollback:");
    lines.push(`- ${plan.commands[1]}`);
    if (plan.available && !plan.dryRun) {
      updates = { ...updates, branch: plan.branch, worktree_path: plan.worktreePath };
    }
  }
  if (!options.dryRun) {
    await updateWorkflow(id, root, updates);
  } else {
    lines.push(`would_update_state: ${record.state} -> active`);
  }
  return `${lines.join("\n")}\n`;
}

export async function statusWorkflow(id: string, root = process.cwd()): Promise<string> {
  const record = await readWorkflow(id, root);
  return renderWorkflow(record, root);
}

export async function verifyWorkflow(id: string, root = process.cwd()): Promise<string> {
  await updateWorkflow(id, root, { state: "verifying" });
  const paths = getWorkspacePaths(root);
  const verificationPath = path.join(paths.workflowsDir, id, "verification.md");
  const verification = await fs.readFile(verificationPath, "utf8").catch(() => "");
  const configured = verification.match(/^Configured checks:\s*(.+)$/m)?.[1]?.trim();
  const report = await writeVerificationReport(id, root);
  const baseLines = [
    `SotuRail workflow verify ${id}`,
    `verify_json: ${relativeToRoot(root, report.paths.json)}`,
    `verify_md: ${relativeToRoot(root, report.paths.markdown)}`,
    `harness_contract: ${report.summary.harnessContract}`,
    `policy_status: ${report.summary.policy}`,
    `evidence_completeness: ${report.summary.evidence}`,
    `diagram_validation: ${report.summary.diagram}`,
    `eval_report: ${report.summary.evalReport}`,
    `release_preflight: ${report.summary.releasePreflight}`
  ];
  if (!configured || configured === "none yet.") {
    return [
      ...baseLines,
      "configured_checks: none",
      "No commands were run.",
      "Checklist:",
      "- npm run build",
      "- npm test",
      "- npm audit --omit=dev"
    ].join("\n") + "\n";
  }
  return [
    ...baseLines,
    `configured_checks: ${configured}`,
    "SotuRail only runs explicitly configured safe checks through reviewed workflow docs."
  ].join("\n") + "\n";
}

export async function closeWorkflow(id: string, root = process.cwd()): Promise<WorkflowRecord> {
  const record = await readWorkflow(id, root);
  if (record.state === "closed") return record;
  return updateWorkflow(id, root, { state: "closed" });
}

export async function cleanupClosedWorkflows(options: { dryRun?: boolean; yes?: boolean } = {}, root = process.cwd()): Promise<WorkflowCleanupResult> {
  const records = await listWorkflows(root);
  const closed = records.filter((record) => record.state === "closed");
  const paths = getWorkspacePaths(root);
  const lines = [
    "SotuRail workflow cleanup",
    `closed_workflows_count: ${closed.length}`,
    `dry_run: ${options.dryRun === true}`,
    `confirmed: ${options.yes === true}`
  ];
  if (closed.length === 0) {
    lines.push("No closed workflows found.");
    return { lines };
  }
  for (const record of closed) {
    const dir = path.join(paths.workflowsDir, record.id);
    lines.push(`${options.dryRun || !options.yes ? "Would remove" : "Removed"} ${relativeToRoot(root, dir)}`);
    if (!options.dryRun && options.yes) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
  if (!options.dryRun && !options.yes) {
    lines.push("No files removed. Re-run with --closed --yes after review.");
  }
  return { lines };
}

export function renderWorkflowList(records: WorkflowRecord[]): string {
  if (records.length === 0) return "No workflows found.\nCreate one with: soturail workflow new \"Task title\"\n";
  return [
    "SotuRail workflows",
    `workflows_count: ${records.length}`,
    "",
    ...records.map((record) => `- ${record.id} [${record.state}] ${record.title}`)
  ].join("\n") + "\n";
}

export function renderWorkflow(record: WorkflowRecord, root = process.cwd()): string {
  const paths = getWorkspacePaths(root);
  const dir = path.join(paths.workflowsDir, record.id);
  return [
    "SotuRail workflow",
    `path: ${relativeToRoot(root, dir)}`,
    `id: ${record.id}`,
    `title: ${record.title}`,
    `state: ${record.state}`,
    `created_at: ${record.created_at}`,
    `updated_at: ${record.updated_at}`,
    `branch: ${record.branch ?? "none"}`,
    `worktree_path: ${record.worktree_path ? relativeToRoot(root, record.worktree_path) : "none"}`,
    `plan_path: ${relativeToRoot(root, path.join(dir, "plan.md"))}`,
    `tasks_path: ${relativeToRoot(root, path.join(dir, "tasks.md"))}`,
    `verification_path: ${relativeToRoot(root, path.join(dir, "verification.md"))}`
  ].join("\n") + "\n";
}

async function updateWorkflow(id: string, root: string, patch: Partial<WorkflowRecord>): Promise<WorkflowRecord> {
  const paths = getWorkspacePaths(root);
  const dir = path.join(paths.workflowsDir, id);
  const record = await readWorkflow(id, root);
  const next: WorkflowRecord = { ...record, ...patch, updated_at: new Date().toISOString() };
  await writeWorkflowRecord(dir, next);
  await refreshWorkflowIndex(root);
  return next;
}

async function writeWorkflowRecord(dir: string, record: WorkflowRecord): Promise<void> {
  const lines = [
    `id: ${record.id}`,
    `title: ${quote(record.title)}`,
    `state: ${record.state}`,
    `created_at: ${record.created_at}`,
    `updated_at: ${record.updated_at}`,
    ...(record.branch ? [`branch: ${record.branch}`] : []),
    ...(record.worktree_path ? [`worktree_path: ${quote(record.worktree_path)}`] : [])
  ];
  await fs.writeFile(path.join(dir, "workflow.yml"), `${lines.join("\n")}\n`, "utf8");
}

function parseWorkflow(raw: string): WorkflowRecord {
  const values = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const match = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (match) values.set(match[1] ?? "", unquote(match[2] ?? ""));
  }
  const id = values.get("id");
  const title = values.get("title");
  const state = values.get("state") as WorkflowState | undefined;
  const created_at = values.get("created_at");
  const updated_at = values.get("updated_at");
  if (!id || !title || !state || !created_at || !updated_at) throw new Error("Invalid workflow.yml");
  const record: WorkflowRecord = {
    id,
    title,
    state,
    created_at,
    updated_at
  };
  const branch = values.get("branch");
  const worktreePath = values.get("worktree_path");
  if (branch) record.branch = branch;
  if (worktreePath) record.worktree_path = worktreePath;
  return record;
}

async function appendIfMissing(filePath: string, content: string): Promise<void> {
  const raw = await fs.readFile(filePath, "utf8").catch(() => "");
  if (!raw.includes(content.trim().split(/\r?\n/)[0] ?? "Reviewed Scope")) {
    await fs.appendFile(filePath, content, "utf8");
  }
}

async function writeWorkflowPlanRecord(record: WorkflowRecord, root: string): Promise<WorkflowPlanRecord> {
  const paths = getWorkspacePaths(root);
  const dir = path.join(paths.workflowsDir, record.id);
  const plan: WorkflowPlanRecord = {
    schemaVersion: "soturail.workflow.plan.v2",
    id: record.id,
    title: record.title,
    status: record.state,
    phase: "plan",
    createdAt: record.created_at,
    tasks: ["Define the change", "Run explicit verification", "Record evidence"],
    acceptanceGates: ["build", "typecheck", "test", "policy", "evidence"],
    rolePacks: ["planner", "executor", "reviewer"],
    contextRoutes: ["workflow", "code", "security"],
    linkedRunWorkspace: await latestRunWorkspaceId(root),
    evidencePath: relativeToRoot(root, path.join(paths.reportsDir, `evidence_${record.id}.md`))
  };
  await writeJson(path.join(dir, "plan.json"), plan);
  return plan;
}

async function writeVerificationReport(id: string, root: string): Promise<WorkflowVerifyReport> {
  const paths = getWorkspacePaths(root);
  const dir = path.join(paths.workflowsDir, id);
  const queue = await readJsonl<PolicyQueueItem>(paths.policyQueueFile);
  const decisions = await readJsonl<PolicyDecision>(paths.policyDecisionsFile);
  const failures = await readJsonl<HarnessFailureRecord>(paths.harnessFailuresFile);
  const rawRecords = await readJsonl<RawRunRecord>(paths.rawIndex);
  const reviewPath = path.join(dir, "review.json");
  const diagramValidationPath = path.join(paths.diagramsDir, "validation.json");
  const evalPath = path.join(paths.workspace, "eval", "latest.json");
  const harnessContractPath = path.join(paths.harnessContractsDir, "default.json");
  const releaseNotesPath = await currentReleaseNotesPath(root);
  const jsonPath = path.join(dir, "verify.json");
  const markdownPath = path.join(dir, "verify.md");
  const report: WorkflowVerifyReport = {
    schemaVersion: "soturail.workflow.verify.v1",
    id: `${id}-verify`,
    workflowId: id,
    createdAt: new Date().toISOString(),
    summary: {
      harnessContract: await exists(harnessContractPath) ? "present" : "missing",
      policy: queue.length === 0 ? `clear (${decisions.length} decisions)` : `${queue.length} pending`,
      evidence: rawRecords.length > 0 || failures.length > 0 || await exists(reviewPath) ? "partial" : "needs evidence",
      diagram: await exists(diagramValidationPath) ? "validated" : "not validated",
      evalReport: await exists(evalPath) ? relativeToRoot(root, evalPath) : "missing",
      releasePreflight: releaseNotesPath ? `release notes: ${releaseNotesPath}` : "not release-focused"
    },
    paths: {
      json: jsonPath,
      markdown: markdownPath,
      review: relativeToRoot(root, reviewPath),
      harnessContract: relativeToRoot(root, harnessContractPath),
      policyQueue: relativeToRoot(root, paths.policyQueueFile),
      policyDecisions: relativeToRoot(root, paths.policyDecisionsFile),
      diagramValidation: relativeToRoot(root, diagramValidationPath),
      evalReport: await exists(evalPath) ? relativeToRoot(root, evalPath) : "missing",
      releaseNotes: releaseNotesPath ?? "missing"
    }
  };
  await writeJson(jsonPath, report);
  await fs.writeFile(markdownPath, renderVerifyMarkdown(report), "utf8");
  return report;
}

function renderReviewMarkdown(report: WorkflowReviewReport, record: WorkflowRecord): string {
  return [
    `# Workflow Review: ${record.title}`,
    "",
    `workflow_id: ${report.workflowId}`,
    `createdAt: ${report.createdAt}`,
    "",
    ...report.perspectives.flatMap((perspective) => [
      `## ${perspective.name}`,
      "",
      `result: ${perspective.result}`,
      ...perspective.notes.map((note) => `- ${note}`),
      ""
    ])
  ].join("\n");
}

function renderVerifyMarkdown(report: WorkflowVerifyReport): string {
  return [
    `# Workflow Verification: ${report.workflowId}`,
    "",
    `createdAt: ${report.createdAt}`,
    "",
    "## Summary",
    "",
    ...Object.entries(report.summary).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Paths",
    "",
    ...Object.entries(report.paths).map(([key, value]) => `- ${key}: ${value}`),
    ""
  ].join("\n");
}

function parsePerspective(value: string): WorkflowReviewPerspective[] {
  const normalized = value as WorkflowReviewPerspective;
  if (!reviewPerspectives.includes(normalized)) throw new Error(`Unknown review perspective "${value}". Supported: ${reviewPerspectives.join(", ")}`);
  return [normalized];
}

function reviewResultFor(name: WorkflowReviewPerspective, changedFiles: string[], failures: HarnessFailureRecord[]): "pass" | "warn" {
  if (name === "tests" && changedFiles.length === 0) return "warn";
  if (name === "agent-readiness" && failures.length > 0) return "warn";
  return "pass";
}

function reviewNotesFor(name: WorkflowReviewPerspective, record: WorkflowRecord, changedFiles: string[], failures: HarnessFailureRecord[]): string[] {
  const common = `Workflow ${record.id} is in state ${record.state}.`;
  const map: Record<WorkflowReviewPerspective, string[]> = {
    security: [common, "Check secrets, raw log exposure, policy queue and MCP exposure before handoff."],
    docs: [common, "Confirm README/docs/release notes reflect changed behavior."],
    tests: [common, changedFiles.length > 0 ? "Changed files detected; verify tests cover the change." : "No changed files detected; add evidence before claiming implementation."],
    release: [common, "Release actions remain manual; npm publish and GitHub release require explicit human action."],
    context: [common, "Use context route/select and role packs instead of dumping the whole repo."],
    "agent-readiness": [common, failures.length > 0 ? "Harness failures exist; convert them into rules/docs/memory/workflow checks." : "No harness failures recorded for this workflow."]
  };
  return map[name];
}

async function setCurrentWorkflow(id: string, root: string): Promise<void> {
  const paths = getWorkspacePaths(root);
  await writeJson(paths.workflowCurrentFile, { schemaVersion: "soturail.workflow.current.v1", id });
}

async function refreshWorkflowIndex(root: string): Promise<void> {
  const paths = getWorkspacePaths(root);
  const workflows = await listWorkflows(root).catch(() => []);
  await writeJson(paths.workflowIndexFile, { schemaVersion: "soturail.workflow.index.v2", workflows });
}

async function requiredCurrentWorkflow(root: string): Promise<string> {
  const id = await currentWorkflowId(root);
  if (!id) throw new Error("No current workflow found. Run: soturail workflow plan \"Task title\"");
  return id;
}

async function latestRunWorkspaceId(root: string): Promise<string | null> {
  const dir = getWorkspacePaths(root).runsDir;
  const entries = await fs.readdir(dir).catch(() => []);
  return entries.sort().at(-1) ?? null;
}

async function currentReleaseNotesPath(root: string): Promise<string | null> {
  const packagePath = path.join(root, "package.json");
  const raw = await fs.readFile(packagePath, "utf8").catch(() => "");
  if (!raw) return null;
  try {
    const version = (JSON.parse(raw) as { version?: string }).version;
    if (!version) return null;
    const notes = path.join(root, "docs", "releases", `RELEASE_NOTES_v${version}.md`);
    return await exists(notes) ? relativeToRoot(root, notes) : null;
  } catch {
    return null;
  }
}

async function gitChangedFiles(root: string): Promise<string[]> {
  const git = await import("node:child_process");
  const util = await import("node:util");
  const execFileAsync = util.promisify(git.execFile);
  try {
    const { stdout } = await execFileAsync("git", ["diff", "--name-only", "--", "."], { cwd: root, timeout: 3000, windowsHide: true });
    return stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function writeFileIfMissing(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  if (!(await exists(filePath))) await fs.writeFile(filePath, content, "utf8");
}

function workflowTemplate(kind: "feature" | "release"): string {
  return [
    `# ${kind === "feature" ? "Feature" : "Release"} Workflow Template`,
    "",
    "## Phases",
    "",
    "- setup",
    "- plan",
    "- work",
    "- review",
    "- verify",
    "- evidence",
    "",
    "## Acceptance Gates",
    "",
    "- build",
    "- typecheck",
    "- test",
    "- policy",
    "- evidence",
    ""
  ].join("\n");
}

async function exists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "workflow";
}

async function missingWorkflowMessage(id: string, root: string): Promise<string> {
  const records = await listWorkflows(root).catch(() => []);
  return [
    `Workflow not found: ${id}`,
    records.length > 0 ? `Valid workflow ids: ${records.map((record) => record.id).join(", ")}` : "No workflows found.",
    "Create one with: soturail workflow new \"Task title\""
  ].join("\n");
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function unquote(value: string): string {
  try {
    return JSON.parse(value) as string;
  } catch {
    return value;
  }
}
