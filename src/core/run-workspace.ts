import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths, readJsonl, relativeToRoot, writeJson } from "./config.js";
import type { PolicyDecision } from "./policy-rail.js";
import { makeRailId } from "./rail-utils.js";

export interface RunWorkspaceRecord {
  schemaVersion: "soturail.run.v1";
  runId: string;
  id: string;
  createdAt: string;
  title: string;
  workflowId: string | null;
  targetAgent: string;
  role: string;
  contextPack: string | null;
  selectedRolePack: string | null;
  skills: string[];
  rawIds: string[];
  offloadIds: string[];
  policyDecisions: string[];
  harnessContract: string | null;
  evidencePack: string | null;
}

export async function createRunWorkspace(
  title: string,
  options: {
    workflow?: string;
    targetAgent?: string;
    role?: string;
    contextPack?: string;
    selectedRolePack?: string;
    skills?: string[];
    rawIds?: string[];
    offloadIds?: string[];
    harnessContract?: string;
    evidencePack?: string;
  } = {},
  root = process.cwd()
): Promise<{ record: RunWorkspaceRecord; path: string }> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const runId = makeRailId("run", title);
  const dir = path.join(paths.runsDir, runId);
  for (const child of ["input", "output", "raw", "offload", "artifacts", "evidence"]) {
    await fs.mkdir(path.join(dir, child), { recursive: true });
  }
  const decisions = await readJsonl<PolicyDecision>(paths.policyDecisionsFile);
  const record: RunWorkspaceRecord = {
    schemaVersion: "soturail.run.v1",
    runId,
    id: runId,
    createdAt: new Date().toISOString(),
    title,
    workflowId: options.workflow ?? null,
    targetAgent: options.targetAgent ?? "generic",
    role: options.role ?? "executor",
    contextPack: options.contextPack ?? null,
    selectedRolePack: options.selectedRolePack ?? null,
    skills: options.skills ?? [],
    rawIds: options.rawIds ?? [],
    offloadIds: options.offloadIds ?? [],
    policyDecisions: decisions.map((decision) => decision.id),
    harnessContract: options.harnessContract ?? path.join(paths.harnessContractsDir, "default.json"),
    evidencePack: options.evidencePack ?? null
  };
  await writeJson(path.join(dir, "workspace.json"), record);
  await fs.writeFile(path.join(dir, "summary.md"), `# Run Workspace: ${title}\n\nAdd run summary here.\n`, "utf8");
  await fs.writeFile(path.join(dir, "handoff.md"), `# Handoff: ${title}\n\n- Run id: ${runId}\n- Safe default: no commands were run by workspace creation.\n`, "utf8");
  return { record, path: dir };
}

export async function showRunWorkspace(runId: string, root = process.cwd()): Promise<string> {
  const paths = getWorkspacePaths(root);
  const dir = path.join(paths.runsDir, runId);
  const raw = await fs.readFile(path.join(dir, "workspace.json"), "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") throw new Error(`Run workspace not found: ${runId}`);
    throw error;
  });
  const record = JSON.parse(raw) as RunWorkspaceRecord;
  const summaryPath = path.join(dir, "summary.md");
  const handoffPath = path.join(dir, "handoff.md");
  const evidenceDir = path.join(dir, "evidence");
  return [
    "SotuRail run workspace",
    `run_id: ${record.runId}`,
    `title: ${record.title}`,
    `path: ${relativeToRoot(root, dir)}`,
    `workflow_id: ${record.workflowId ?? "none"}`,
    `target_agent: ${record.targetAgent}`,
    `role: ${record.role}`,
    `context_pack: ${record.contextPack ?? "none"}`,
    `role_pack: ${record.selectedRolePack ?? "none"}`,
    `skills: ${record.skills.length > 0 ? record.skills.join(", ") : "none"}`,
    `raw_ids: ${record.rawIds.length}`,
    `offload_ids: ${record.offloadIds.length}`,
    `policy_decisions: ${record.policyDecisions.length}`,
    `evidence_pack: ${record.evidencePack ?? "none"}`,
    `summary_present: ${await exists(summaryPath)}`,
    `handoff_present: ${await exists(handoffPath)}`,
    `summary: ${relativeToRoot(root, summaryPath)}`,
    `handoff: ${relativeToRoot(root, handoffPath)}`,
    `evidence_dir: ${relativeToRoot(root, evidenceDir)}`
  ].join("\n") + "\n";
}

export async function cleanRunWorkspaces(options: { ttl?: string; dryRun?: boolean } = {}, root = process.cwd()): Promise<string> {
  const paths = getWorkspacePaths(root);
  const entries = await fs.readdir(paths.runsDir).catch(() => []);
  const ttlDays = parseTtlDays(options.ttl ?? "7d");
  const cutoff = Date.now() - ttlDays * 24 * 60 * 60 * 1000;
  const candidates = [];
  for (const entry of entries) {
    const dir = path.join(paths.runsDir, entry);
    const stat = await fs.stat(dir).catch(() => null);
    if (stat?.isDirectory() && stat.mtimeMs < cutoff) candidates.push(dir);
  }
  const dryRun = options.dryRun !== false;
  return [
    "SotuRail run workspace clean",
    `ttl: ${ttlDays}d`,
    `dry_run: ${dryRun}`,
    `candidates_count: ${candidates.length}`,
    "",
    ...candidates.map((candidate) => `${dryRun ? "Would remove" : "Remove skipped in v0.5.1"} ${relativeToRoot(root, candidate)}`),
    dryRun ? "No files removed." : "v0.5.1 keeps cleanup preview-only unless future explicit confirmation is added.",
    "Safety: review run workspace artifacts before deleting them."
  ].join("\n") + "\n";
}

function parseTtlDays(ttl: string): number {
  const match = /^(\d+)\s*d?$/.exec(ttl.trim());
  return match?.[1] ? Number.parseInt(match[1], 10) : 7;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
