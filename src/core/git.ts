import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function getCurrentGitCommit(root = process.cwd()): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      timeout: 3000,
      windowsHide: true
    });
    const hash = stdout.trim();
    return hash.length > 0 ? hash : null;
  } catch {
    return null;
  }
}

export async function hashFile(filePath: string): Promise<string | null> {
  try {
    const buffer = await fs.readFile(filePath);
    return createHash("sha256").update(buffer).digest("hex");
  } catch {
    return null;
  }
}
