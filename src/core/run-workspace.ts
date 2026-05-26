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
  options: { workflow?: string; targetAgent?: string; role?: string } = {},
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
    contextPack: null,
    selectedRolePack: null,
    skills: [],
    rawIds: [],
    offloadIds: [],
    policyDecisions: decisions.map((decision) => decision.id),
    harnessContract: path.join(paths.harnessContractsDir, "default.json"),
    evidencePack: null
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
  return [
    "SotuRail run workspace",
    `run_id: ${record.runId}`,
    `title: ${record.title}`,
    `path: ${relativeToRoot(root, dir)}`,
    `workflow_id: ${record.workflowId ?? "none"}`,
    `target_agent: ${record.targetAgent}`,
    `role: ${record.role}`,
    `policy_decisions: ${record.policyDecisions.length}`,
    `handoff: ${relativeToRoot(root, path.join(dir, "handoff.md"))}`
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
    ...candidates.map((candidate) => `${dryRun ? "Would remove" : "Remove skipped in v0.5.0"} ${relativeToRoot(root, candidate)}`),
    dryRun ? "No files removed." : "v0.5.0 keeps cleanup preview-only unless future explicit confirmation is added."
  ].join("\n") + "\n";
}

function parseTtlDays(ttl: string): number {
  const match = /^(\d+)\s*d?$/.exec(ttl.trim());
  return match?.[1] ? Number.parseInt(match[1], 10) : 7;
}
