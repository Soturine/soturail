import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { ensureWorkspace, getWorkspacePaths, loadConfig, relativeToRoot, writeJson } from "./config.js";
import { scanRepository } from "./file-scanner.js";
import { hashFile } from "./git.js";
import { makeRailId } from "./rail-utils.js";

const execFileAsync = promisify(execFile);

export interface FsSnapshot {
  schemaVersion: "soturail.fs.snapshot.v1";
  id: string;
  createdAt: string;
  files: Array<{ path: string; size: number; hash: string | null; timestamp: string }>;
}

export async function createFsSnapshot(root = process.cwd()): Promise<{ snapshot: FsSnapshot; path: string }> {
  await ensureWorkspace(root);
  const config = await loadConfig(root);
  const repo = await scanRepository(root, config);
  const files = [];
  for (const file of repo.files) {
    const absolute = path.join(root, file.path);
    const stat = await fs.stat(absolute);
    files.push({ path: file.path, size: stat.size, hash: await hashFile(absolute), timestamp: stat.mtime.toISOString() });
  }
  const snapshot: FsSnapshot = {
    schemaVersion: "soturail.fs.snapshot.v1",
    id: makeRailId("fs", root),
    createdAt: new Date().toISOString(),
    files
  };
  const filePath = path.join(getWorkspacePaths(root).fsSnapshotsDir, `${snapshot.id}.json`);
  await writeJson(filePath, snapshot);
  return { snapshot, path: filePath };
}

export async function touchedFiles(root = process.cwd()): Promise<string> {
  const latest = await latestSnapshot(root);
  if (!latest) return "No filesystem snapshot found.\nCreate one with: soturail fs snapshot\n";
  const current = (await createFsSnapshot(root)).snapshot;
  const before = new Map(latest.files.map((file) => [file.path, file.hash]));
  const changed = current.files.filter((file) => before.get(file.path) !== file.hash);
  return [
    "SotuRail fs touched",
    `snapshot_id: ${latest.id}`,
    `changed_count: ${changed.length}`,
    "",
    ...changed.map((file) => `- ${file.path}`)
  ].join("\n") + "\n";
}

export async function fsDiff(root = process.cwd()): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["diff", "--stat", "--", "."], {
      cwd: root,
      timeout: 5000,
      windowsHide: true
    });
    const summary = stdout.trim() || "No git diff changes detected.";
    return ["SotuRail fs diff", summary].join("\n") + "\n";
  } catch {
    return "SotuRail fs diff\ngit_diff: unavailable\nUse `soturail fs touched` after a snapshot for local evidence.\n";
  }
}

export async function planEdit(description: string, root = process.cwd()): Promise<{ path: string; id: string }> {
  await ensureWorkspace(root);
  const id = makeRailId("edit", description);
  const filePath = path.join(getWorkspacePaths(root).fsDir, `${id}.md`);
  await fs.writeFile(filePath, [
    `# Planned Edit ${id}`,
    "",
    "schemaVersion: soturail.fs.plan-edit.v1",
    `createdAt: ${new Date().toISOString()}`,
    "",
    "## Description",
    description,
    "",
    "## Safety",
    "- This is an intent note only.",
    "- No files were modified by this command.",
    ""
  ].join("\n"), "utf8");
  return { path: filePath, id };
}

async function latestSnapshot(root: string): Promise<FsSnapshot | null> {
  const dir = getWorkspacePaths(root).fsSnapshotsDir;
  const entries = await fs.readdir(dir).catch(() => []);
  const json = entries.filter((entry) => entry.endsWith(".json")).sort().at(-1);
  if (!json) return null;
  const raw = await fs.readFile(path.join(dir, json), "utf8");
  return JSON.parse(raw) as FsSnapshot;
}

export function renderSnapshot(pathRoot: string, result: { snapshot: FsSnapshot; path: string }): string {
  return [
    "SotuRail fs snapshot",
    `snapshot_id: ${result.snapshot.id}`,
    `files_count: ${result.snapshot.files.length}`,
    `path: ${relativeToRoot(pathRoot, result.path)}`
  ].join("\n") + "\n";
}
