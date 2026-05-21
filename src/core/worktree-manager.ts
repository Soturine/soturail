import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { getWorkspacePaths, relativeToRoot } from "./config.js";

const execFileAsync = promisify(execFile);

export interface WorktreePlan {
  available: boolean;
  dryRun: boolean;
  branch: string;
  worktreePath: string;
  commands: string[];
  message: string;
}

export function safeBranchName(id: string): string {
  return `soturail/${id.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase()}`;
}

export async function planWorktree(root: string, workflowId: string, dryRun = true): Promise<WorktreePlan> {
  const paths = getWorkspacePaths(root);
  const branch = safeBranchName(workflowId);
  const worktreePath = path.join(paths.worktreesDir, workflowId);
  const commands = [
    `git worktree add -b ${branch} ${relativeToRoot(root, worktreePath)}`,
    `git worktree remove ${relativeToRoot(root, worktreePath)}`
  ];
  const inGit = await isInsideGit(root);
  if (!inGit) {
    return {
      available: false,
      dryRun,
      branch,
      worktreePath,
      commands,
      message: dryRun
        ? "Dry-run only; Git repository not detected, so no worktree would be created."
        : "Git repository not detected; use non-worktree workflow state."
    };
  }
  if (!dryRun) {
    await fs.mkdir(paths.worktreesDir, { recursive: true });
    await execFileAsync("git", ["worktree", "add", "-b", branch, worktreePath], { cwd: root, windowsHide: true });
  }
  return {
    available: true,
    dryRun,
    branch,
    worktreePath,
    commands,
    message: dryRun
      ? "Dry-run only; no worktree created, pushed, merged or deleted."
      : "Local worktree created. SotuRail will not push, merge or delete it automatically."
  };
}

async function isInsideGit(root: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root, windowsHide: true, timeout: 3000 });
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}
