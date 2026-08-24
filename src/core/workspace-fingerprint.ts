import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface WorkspaceFingerprint {
  schemaVersion: "soturail.workspace-fingerprint.v1";
  fingerprint: string;
  createdAt: string;
  repositoryIdentity: string;
  worktreeIdentity: string;
  branch: string;
  head: string;
  dirty: boolean;
  dirtyDigest: string;
  relevantFilesDigest: string;
  lockfileDigest: string;
  configurationDigest: string;
  toolchain: {
    node: string;
    platform: string;
    arch: string;
  };
}

export async function createWorkspaceFingerprint(root = process.cwd()): Promise<WorkspaceFingerprint> {
  const resolvedRoot = path.resolve(root);
  const [repositoryIdentity, worktreeIdentity, branch, head, status] = await Promise.all([
    git(root, ["config", "--get", "remote.origin.url"], "UNKNOWN"),
    git(root, ["rev-parse", "--show-toplevel"], resolvedRoot),
    git(root, ["branch", "--show-current"], "DETACHED"),
    git(root, ["rev-parse", "HEAD"], "UNAVAILABLE"),
    git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"], "")
  ]);
  const relevantFiles = ["package.json", "package-lock.json", "native/soturail-native/Cargo.toml", ".soturail/config/config.json"];
  const relevantFilesDigest = await digestFiles(resolvedRoot, relevantFiles);
  const lockfileDigest = await digestFiles(resolvedRoot, ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "Cargo.lock"]);
  const configurationDigest = await digestFiles(resolvedRoot, ["package.json", "tsconfig.json", ".soturail/config/config.json"]);
  const dirtyDigest = await digestDirtyState(resolvedRoot, status);
  const stable = {
    repositoryIdentity: sanitizeRepositoryIdentity(repositoryIdentity),
    worktreeIdentity: normalizePath(worktreeIdentity),
    branch: branch || "DETACHED",
    head,
    dirty: status.length > 0,
    dirtyDigest,
    relevantFilesDigest,
    lockfileDigest,
    configurationDigest,
    toolchain: { node: process.version, platform: process.platform, arch: process.arch }
  };
  return {
    schemaVersion: "soturail.workspace-fingerprint.v1",
    fingerprint: sha256(JSON.stringify(stable)),
    createdAt: new Date().toISOString(),
    ...stable
  };
}

async function digestDirtyState(root: string, status: string): Promise<string> {
  const parts = [status];
  const entries = status.split("\0").filter(Boolean).map((entry) => entry.slice(3)).filter(Boolean).sort();
  for (const entry of entries) {
    const relative = entry.includes(" -> ") ? entry.split(" -> ").at(-1) ?? entry : entry;
    const absolute = path.resolve(root, relative);
    if (!isInside(root, absolute) || ignored(relative)) continue;
    const stat = await fs.stat(absolute).catch(() => null);
    if (stat?.isFile() && stat.size <= 10 * 1024 * 1024) parts.push(`${normalizePath(relative)}:${sha256(await fs.readFile(absolute))}`);
    else parts.push(`${normalizePath(relative)}:${stat?.isDirectory() ? "directory" : "missing"}`);
  }
  return sha256(parts.join("\0"));
}

async function digestFiles(root: string, files: string[]): Promise<string> {
  const parts: string[] = [];
  for (const relative of files.sort()) {
    const content = await fs.readFile(path.join(root, relative)).catch(() => null);
    parts.push(`${normalizePath(relative)}:${content ? sha256(content) : "MISSING"}`);
  }
  return sha256(parts.join("\n"));
}

async function git(root: string, args: string[], fallback: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd: root, timeout: 5000, windowsHide: true, encoding: "utf8" });
    return stdout.trim();
  } catch {
    return fallback;
  }
}

function sanitizeRepositoryIdentity(value: string): string {
  return value.replace(/:\/\/[^/@\s]+@/g, "://[REDACTED]@").replace(/^git@([^:]+):/, "ssh://$1/");
}

function ignored(relative: string): boolean {
  return /^(?:\.git|node_modules|dist|native[\\/]target|\.soturail[\\/](?:raw|index))(?:[\\/]|$)/i.test(relative);
}

function isInside(root: string, target: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function normalizePath(value: string): string {
  return path.normalize(value).replace(/\\/g, "/");
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
