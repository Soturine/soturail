import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths, relativeToRoot } from "./config.js";

const requiredSections = ["Objective", "Allowed context", "Allowed files", "Disallowed actions", "Verification commands", "Definition of done", "Expected handoff"];

export interface TaskletSimulation {
  schemaVersion: "soturail.tasklet.simulation.v1";
  createdAt: string;
  name: string;
  mode: "dry-run";
  valid: boolean;
  missingSections: string[];
  shellCommandsExecuted: false;
  sourcePath: string;
  nextCommands: string[];
}

export async function createTasklet(name: string, root = process.cwd()): Promise<{ path: string; created: boolean }> {
  await ensureWorkspace(root);
  const file = path.join(getWorkspacePaths(root).taskletsDir, `${slug(name)}.md`);
  if (await exists(file)) return { path: file, created: false };
  await fs.writeFile(file, renderTasklet(name), "utf8");
  return { path: file, created: true };
}

export async function listTasklets(root = process.cwd()): Promise<Array<{ name: string; path: string }>> {
  const dir = getWorkspacePaths(root).taskletsDir;
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map((entry) => ({
    name: entry.name.replace(/\.md$/, ""),
    path: relativeToRoot(root, path.join(dir, entry.name))
  })).sort((left, right) => left.name.localeCompare(right.name));
}

export async function runTasklet(name: string, root = process.cwd()): Promise<TaskletSimulation> {
  const file = path.join(getWorkspacePaths(root).taskletsDir, `${slug(name)}.md`);
  const content = await fs.readFile(file, "utf8").catch(() => "");
  if (!content) throw new Error(`Tasklet not found: ${slug(name)}`);
  const missingSections = requiredSections.filter((section) => !new RegExp(`^## ${escapeRegExp(section)}\\s*$`, "mi").test(content));
  const simulation: TaskletSimulation = {
    schemaVersion: "soturail.tasklet.simulation.v1",
    createdAt: new Date().toISOString(),
    name: slug(name),
    mode: "dry-run",
    valid: missingSections.length === 0,
    missingSections,
    shellCommandsExecuted: false,
    sourcePath: relativeToRoot(root, file),
    nextCommands: missingSections.length ? [`Review ${relativeToRoot(root, file)}`] : [`soturail tasklet export ${slug(name)}`]
  };
  const reportDir = path.join(getWorkspacePaths(root).taskletsDir, "runs");
  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(path.join(reportDir, `${slug(name)}-latest.json`), `${JSON.stringify(simulation, null, 2)}\n`, "utf8");
  return simulation;
}

export async function exportTasklet(name: string, root = process.cwd()): Promise<string> {
  const paths = getWorkspacePaths(root);
  const source = path.join(paths.taskletsDir, `${slug(name)}.md`);
  const content = await fs.readFile(source, "utf8").catch(() => "");
  if (!content) throw new Error(`Tasklet not found: ${slug(name)}`);
  const target = path.join(paths.exportsDir, "tasklets", `${slug(name)}.md`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${content.trimEnd()}\n\n## Export Safety\n\n- This is a local task template, not an autonomous agent.\n- Commands remain review-only and are not executed by export.\n`, "utf8");
  return target;
}

export function renderTaskletList(items: Awaited<ReturnType<typeof listTasklets>>): string {
  return ["SotuRail tasklets", `count: ${items.length}`, ...(items.length ? items.map((item) => `- ${item.name}: ${item.path}`) : ["- none"]), "next: soturail tasklet create <name>"].join("\n") + "\n";
}

function renderTasklet(name: string): string {
  return [`# Tasklet: ${name}`, "", "schemaVersion: soturail.tasklet.v1", "", "## Objective", "", `Complete the focused local task: ${name}.`, "", "## Allowed context", "", "- Project-local files explicitly relevant to the objective.", "- SotuRail reports, knowledge packs and evidence artifacts.", "", "## Allowed files", "", "- Files inside the current project root.", "", "## Disallowed actions", "", "- No destructive shell commands.", "- No secret access or telemetry upload.", "- No remote writes without explicit human approval.", "", "## Verification commands", "", "- Record commands for human review; tasklet dry-run does not execute them.", "", "## Definition of done", "", "- Objective is addressed.", "- Evidence and verification status are explicit.", "", "## Expected handoff", "", "- Summary, files changed, verification status, blockers and next step.", ""].join("\n");
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "tasklet";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(() => true).catch(() => false);
}
