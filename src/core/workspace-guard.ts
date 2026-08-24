import { promises as fs } from "node:fs";
import path from "node:path";

export type SensitivePathKind = "normal" | "soturail-state" | "raw-log" | "secret" | "vcs-internal";

export interface ResolvePathOptions {
  mustExist?: boolean;
  allowAbsolute?: boolean;
}

export interface PathAccessOptions extends ResolvePathOptions {
  allowRaw?: boolean;
  allowSecrets?: boolean;
  allowVcsInternals?: boolean;
}

export class WorkspaceGuard {
  readonly projectRoot: string;
  readonly workspaceRoot: string;
  private canonicalProjectRoot?: string;
  private canonicalWorkspaceRoot?: string;

  constructor(projectRoot = process.cwd(), workspaceDir = ".soturail") {
    this.projectRoot = path.resolve(projectRoot);
    this.workspaceRoot = path.resolve(this.projectRoot, workspaceDir);
  }

  async resolveProjectPath(input: string, options: ResolvePathOptions = {}): Promise<string> {
    return this.resolveInside(this.projectRoot, input, options);
  }

  async resolveWorkspacePath(input: string, options: ResolvePathOptions = {}): Promise<string> {
    return this.resolveInside(this.workspaceRoot, input, options);
  }

  async realpathAndVerify(inputPath: string, boundary = this.projectRoot, mustExist = true): Promise<string> {
    const resolved = path.resolve(inputPath);
    const canonicalBoundary = await this.canonicalBoundary(boundary);
    if (!isInside(boundary, resolved) && !isInside(canonicalBoundary, resolved)) {
      throw new Error(`Path escapes allowed boundary: ${resolved}`);
    }
    const canonicalTarget = await canonicalizeTarget(resolved, mustExist);
    this.assertInside(canonicalBoundary, canonicalTarget);
    return canonicalTarget;
  }

  assertInside(boundary: string, target: string): void {
    if (!isInside(boundary, target)) {
      throw new Error(`Path escapes allowed boundary: ${target}`);
    }
  }

  assertInsideProject(target: string): void {
    this.assertInside(this.projectRoot, target);
  }

  assertInsideWorkspace(target: string): void {
    this.assertInside(this.workspaceRoot, target);
  }

  async assertAllowedRead(input: string, options: PathAccessOptions = {}): Promise<string> {
    const resolved = await this.resolveProjectPath(input, { ...options, mustExist: options.mustExist !== false });
    this.assertSensitivity(resolved, options);
    return resolved;
  }

  async assertAllowedWrite(input: string, options: PathAccessOptions = {}): Promise<string> {
    const resolved = await this.resolveProjectPath(input, { ...options, mustExist: false });
    this.assertSensitivity(resolved, options);
    return resolved;
  }

  classifySensitivePath(target: string): SensitivePathKind {
    const resolved = path.resolve(target);
    const comparisonRoot = this.canonicalProjectRoot && isInside(this.canonicalProjectRoot, resolved)
      ? this.canonicalProjectRoot
      : this.projectRoot;
    const relative = normalizeForComparison(path.relative(comparisonRoot, resolved));
    const segments = relative.split("/").filter(Boolean);
    const basename = (segments.at(-1) ?? "").toLowerCase();
    if (segments[0]?.toLowerCase() === ".git") return "vcs-internal";
    if (segments[0]?.toLowerCase() === ".soturail" && segments[1]?.toLowerCase() === "raw") return "raw-log";
    if (segments[0]?.toLowerCase() === ".soturail") return "soturail-state";
    if (
      basename === ".env"
      || basename.startsWith(".env.")
      || /\.(?:pem|key|p12|pfx)$/i.test(basename)
      || /^(?:id_rsa|id_ed25519|credentials|secrets?)(?:\.|$)/i.test(basename)
    ) return "secret";
    return "normal";
  }

  private async resolveInside(boundary: string, input: string, options: ResolvePathOptions): Promise<string> {
    if (!input || input.includes("\0")) throw new Error("Path must be a non-empty string without NUL bytes.");
    if (path.isAbsolute(input) && options.allowAbsolute === false) throw new Error(`Absolute paths are not allowed: ${input}`);
    const candidate = path.isAbsolute(input) ? path.resolve(input) : path.resolve(boundary, input);
    return this.realpathAndVerify(candidate, boundary, options.mustExist !== false);
  }

  private async canonicalBoundary(boundary: string): Promise<string> {
    const resolved = path.resolve(boundary);
    if (samePath(resolved, this.projectRoot)) {
      this.canonicalProjectRoot ??= await fs.realpath(this.projectRoot);
      return this.canonicalProjectRoot;
    }
    if (samePath(resolved, this.workspaceRoot)) {
      this.canonicalWorkspaceRoot ??= await canonicalizeTarget(this.workspaceRoot, false);
      return this.canonicalWorkspaceRoot;
    }
    return canonicalizeTarget(resolved, true);
  }

  private assertSensitivity(target: string, options: PathAccessOptions): void {
    const kind = this.classifySensitivePath(target);
    if (kind === "raw-log" && options.allowRaw !== true) throw new Error("Raw logs require an explicit trusted policy decision.");
    if (kind === "secret" && options.allowSecrets !== true) throw new Error("Probable secret paths are not available through this capability.");
    if (kind === "vcs-internal" && options.allowVcsInternals !== true) throw new Error("Git internals are not available through this capability.");
  }
}

async function canonicalizeTarget(target: string, mustExist: boolean): Promise<string> {
  try {
    return path.normalize(await fs.realpath(target));
  } catch (error) {
    if (mustExist || (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const missing: string[] = [];
  let cursor = path.resolve(target);
  while (true) {
    try {
      const parent = path.normalize(await fs.realpath(cursor));
      return path.join(parent, ...missing.reverse());
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = path.dirname(cursor);
      if (samePath(parent, cursor)) throw new Error(`Unable to resolve an existing parent for: ${target}`);
      missing.push(path.basename(cursor));
      cursor = parent;
    }
  }
}

function isInside(boundary: string, target: string): boolean {
  const relative = path.relative(path.resolve(boundary), path.resolve(target));
  if (relative === "") return true;
  return !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

function samePath(left: string, right: string): boolean {
  const a = normalizeForComparison(path.resolve(left));
  const b = normalizeForComparison(path.resolve(right));
  return a === b;
}

function normalizeForComparison(value: string): string {
  const normalized = path.normalize(value).replace(/\\/g, "/");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}
