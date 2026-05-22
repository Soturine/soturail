import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths, relativeToRoot } from "./config.js";
import { planWorktree } from "./worktree-manager.js";

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

const states: WorkflowState[] = ["draft", "planned", "active", "verifying", "ready_for_review", "closed", "blocked"];

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
  return record;
}

export async function listWorkflows(root = process.cwd()): Promise<WorkflowRecord[]> {
  const paths = getWorkspacePaths(root);
  const entries = await fs.readdir(paths.workflowsDir).catch(() => []);
  const records: WorkflowRecord[] = [];
  for (const entry of entries) {
    const record = await readWorkflow(entry, root).catch(() => null);
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
  return record;
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
  const verificationPath = path.join(getWorkspacePaths(root).workflowsDir, id, "verification.md");
  const verification = await fs.readFile(verificationPath, "utf8").catch(() => "");
  const configured = verification.match(/^Configured checks:\s*(.+)$/m)?.[1]?.trim();
  if (!configured || configured === "none yet.") {
    return [
      `SotuRail workflow verify ${id}`,
      "configured_checks: none",
      "No commands were run.",
      "Checklist:",
      "- npm run build",
      "- npm test",
      "- npm audit --omit=dev"
    ].join("\n") + "\n";
  }
  return [
    `SotuRail workflow verify ${id}`,
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
