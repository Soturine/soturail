import { createHash, randomUUID } from "node:crypto";
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
  /**
   * How edits are detected. `git`: porcelain status plus content of dirty files.
   * `content-scan`: no Git work tree, so every workspace file is hashed.
   * `unavailable`: too large to scan; the fingerprint is unique per call, so earlier
   * evidence can never look current (fail closed). Not part of the digest.
   */
  freshnessBasis: "git" | "content-scan" | "unavailable";
  relevantFilesDigest: string;
  lockfileDigest: string;
  configurationDigest: string;
  toolchain: {
    node: string;
    platform: string;
    arch: string;
  };
}

export interface FingerprintOptions {
  /** Upper bound for the content scan used when there is no Git work tree. */
  maxScanFiles?: number;
}

const DEFAULT_MAX_SCAN_FILES = 20000;

export async function createWorkspaceFingerprint(root = process.cwd(), options: FingerprintOptions = {}): Promise<WorkspaceFingerprint> {
  const resolvedRoot = path.resolve(root);
  const [insideWorkTree, repositoryIdentity, worktreeIdentity, branch, head, status] = await Promise.all([
    git(root, ["rev-parse", "--is-inside-work-tree"], "false"),
    git(root, ["config", "--get", "remote.origin.url"], "UNKNOWN"),
    git(root, ["rev-parse", "--show-toplevel"], resolvedRoot),
    git(root, ["branch", "--show-current"], "DETACHED"),
    git(root, ["rev-parse", "HEAD"], "UNAVAILABLE"),
    git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"], "").then(withoutRuntimeState)
  ]);
  const relevantFiles = ["package.json", "package-lock.json", "native/soturail-native/Cargo.toml", ".soturail/config/config.json"];
  const relevantFilesDigest = await digestFiles(resolvedRoot, relevantFiles);
  const lockfileDigest = await digestFiles(resolvedRoot, ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "Cargo.lock"]);
  const configurationDigest = await digestFiles(resolvedRoot, ["package.json", "tsconfig.json", ".soturail/config/config.json"]);
  // Without a Git work tree, `git status` is empty and would hide every edit (false green).
  const scan = insideWorkTree === "true" ? null : await digestWorkspaceContent(resolvedRoot, options.maxScanFiles ?? DEFAULT_MAX_SCAN_FILES);
  const freshnessBasis: WorkspaceFingerprint["freshnessBasis"] = scan === null ? "git" : scan.complete ? "content-scan" : "unavailable";
  const dirtyDigest = scan === null ? await digestDirtyState(resolvedRoot, status) : scan.complete ? scan.digest : `unavailable:${randomUUID()}`;
  const stable = {
    repositoryIdentity: sanitizeRepositoryIdentity(repositoryIdentity),
    worktreeIdentity: normalizePath(worktreeIdentity),
    branch: branch || "DETACHED",
    head,
    dirty: scan === null ? status.length > 0 : true,
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
    ...stable,
    freshnessBasis
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

async function digestWorkspaceContent(root: string, maxFiles: number): Promise<{ complete: boolean; digest: string }> {
  const parts: string[] = [];
  const pending = [""];
  while (pending.length > 0) {
    const relativeDir = pending.pop() as string;
    const entries = await fs.readdir(path.join(root, relativeDir), { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const relative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      if (ignored(relative) || /^\.soturail(?:\/|$)/i.test(relative)) continue;
      if (entry.isDirectory()) {
        pending.push(relative);
      } else if (entry.isFile()) {
        if (parts.length >= maxFiles) return { complete: false, digest: "" };
        const stat = await fs.stat(path.join(root, relative)).catch(() => null);
        const content = stat && stat.size <= 10 * 1024 * 1024 ? sha256(await fs.readFile(path.join(root, relative))) : `size:${stat?.size ?? "missing"}:${stat?.mtimeMs ?? 0}`;
        parts.push(`${relative}:${content}`);
      }
    }
  }
  return { complete: true, digest: sha256(parts.sort().join("\0")) };
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
    // Porcelain status is positional (" M path"): trimming would drop the first
    // entry's leading status column and hide that file's content from the digest.
    return args[0] === "status" ? stdout : stdout.trim();
  } catch {
    return fallback;
  }
}

function sanitizeRepositoryIdentity(value: string): string {
  return value.replace(/:\/\/[^/@\s]+@/g, "://[REDACTED]@").replace(/^git@([^:]+):/, "ssh://$1/");
}

/**
 * Drops SotuRail's own runtime state (raw logs, evidence, metrics, contracts) from the
 * porcelain status. `soturail init` does not gitignore `.soturail/`, so otherwise every
 * recorded run would change the fingerprint it was just bound to. `.soturail/config/config.json`
 * stays bound through `configurationDigest`.
 */
function withoutRuntimeState(status: string): string {
  return status.split("\0").filter((entry) => entry && !/^\.soturail(?:[\\/]|$)/i.test(entry.slice(3))).map((entry) => `${entry}\0`).join("");
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
