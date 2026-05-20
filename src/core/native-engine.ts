import { execFile, spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Writable } from "node:stream";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type ReductionKind = "reduce-generic" | "reduce-git" | "reduce-test" | "reduce-json";
export type ReducerEngine = "ts" | "native" | "auto";

export interface NativeEngineInfo {
  available: boolean;
  path: string | null;
  version: string | null;
  checked_paths: string[];
}

function executableName(): string {
  return process.platform === "win32" ? "soturail-native.exe" : "soturail-native";
}

async function isExecutable(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function pathLookup(): Promise<string | null> {
  const command = process.platform === "win32" ? "where" : "which";
  try {
    const { stdout } = await execFileAsync(command, ["soturail-native"], { windowsHide: true, timeout: 3000 });
    const first = stdout.split(/\r?\n/).find((line) => line.trim().length > 0);
    return first?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function detectNativeEngine(root = process.cwd()): Promise<NativeEngineInfo> {
  const name = executableName();
  const candidates = [
    path.resolve(root, "native", "soturail-native", "target", "release", name),
    path.resolve(root, "native", "soturail-native", "target", "debug", name),
    path.resolve(root, "dist", "native", name)
  ];
  const checked = [...candidates];
  const onPath = await pathLookup();
  if (onPath) {
    candidates.push(onPath);
    checked.push(onPath);
  }

  const found = await firstExisting(candidates);
  if (!found) {
    return { available: false, path: null, version: null, checked_paths: checked };
  }

  try {
    const { stdout } = await execFileAsync(found, ["--version"], { windowsHide: true, timeout: 3000 });
    return { available: true, path: found, version: stdout.trim(), checked_paths: checked };
  } catch {
    return { available: true, path: found, version: null, checked_paths: checked };
  }
}

export interface NativeRunOptions {
  commandParts: string[];
  rawLogPath: string;
  summaryJsonPath: string;
  cwd?: string;
  interactive?: boolean;
  terminalStdout?: Writable;
  terminalStderr?: Writable;
}

export interface NativeRunResult {
  exitCode: number;
  summary: Record<string, unknown>;
}

export async function runWithNative(options: NativeRunOptions, root = process.cwd()): Promise<NativeRunResult | null> {
  const info = await detectNativeEngine(root);
  if (!info.path) {
    return null;
  }
  const args = [
    "run",
    "--raw-log",
    options.rawLogPath,
    "--summary-json",
    options.summaryJsonPath,
    "--reducer",
    "auto"
  ];
  if (options.interactive) {
    args.push("--interactive");
  }
  args.push("--", ...nativeCommandParts(options.commandParts));

  return new Promise<NativeRunResult | null>((resolve) => {
    const child = spawn(info.path as string, args, {
      cwd: options.cwd ?? root,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: !options.interactive
    });
    child.stdout.on("data", (chunk: Buffer) => (options.terminalStdout ?? process.stdout).write(chunk));
    child.stderr.on("data", (chunk: Buffer) => (options.terminalStderr ?? process.stderr).write(chunk));
    if (options.interactive && child.stdin && process.stdin.readable) {
      process.stdin.pipe(child.stdin);
    } else {
      child.stdin.end();
    }
    child.on("error", () => resolve(null));
    child.on("close", async (code) => {
      if (options.interactive && child.stdin) {
        process.stdin.unpipe(child.stdin);
      }
      let summary: Record<string, unknown> = {};
      try {
        summary = JSON.parse(await fs.readFile(options.summaryJsonPath, "utf8")) as Record<string, unknown>;
      } catch {
        summary = {};
      }
      resolve({ exitCode: typeof code === "number" ? code : 1, summary });
    });
  });
}

function nativeCommandParts(parts: string[]): string[] {
  if (parts.length === 1 && /\s/.test(parts[0] ?? "")) {
    const command = parts[0] ?? "";
    return process.platform === "win32" ? ["cmd.exe", "/d", "/s", "/c", command] : ["sh", "-c", command];
  }
  return parts;
}

async function firstExisting(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    if (await isExecutable(candidate)) {
      return candidate;
    }
  }
  return null;
}

export async function reduceWithNative(
  kind: ReductionKind,
  input: string,
  rawId: string,
  root = process.cwd()
): Promise<string | null> {
  const info = await detectNativeEngine(root);
  if (!info.path) {
    return null;
  }

  return new Promise<string | null>((resolve) => {
    const child = spawn(info.path as string, [kind, "--raw-id", rawId], {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });
    const stdout: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(Buffer.from(chunk)));
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      resolve(code === 0 ? Buffer.concat(stdout).toString("utf8") : null);
    });
    child.stdin.end(input);
  });
}
