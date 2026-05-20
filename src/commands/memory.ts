import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { appendJsonl, ensureWorkspace, getWorkspacePaths } from "../core/config.js";
import { getCurrentGitCommit, hashFile } from "../core/git.js";

export interface MemoryRecord {
  timestamp: string;
  git_commit: string | null;
  content: string;
  scope?: string;
  file_hash?: string;
}

export interface MemoryAddOptions {
  file?: string;
}

export async function addMemory(content: string, options: MemoryAddOptions = {}, root = process.cwd()): Promise<MemoryRecord> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const record: MemoryRecord = {
    timestamp: new Date().toISOString(),
    git_commit: await getCurrentGitCommit(root),
    content
  };

  if (options.file) {
    const absolute = path.resolve(root, options.file);
    const digest = await hashFile(absolute);
    record.scope = path.normalize(path.relative(root, absolute)).replace(/\\/g, "/");
    if (digest) {
      record.file_hash = digest;
    }
  }

  await appendJsonl(paths.memoryFile, record);
  return record;
}

export async function searchMemory(term: string, root = process.cwd()): Promise<string[]> {
  const paths = getWorkspacePaths(root);
  try {
    const raw = await fs.readFile(paths.memoryFile, "utf8");
    const needle = term.toLowerCase();
    return raw
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0 && line.toLowerCase().includes(needle));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function registerMemoryCommand(program: Command): void {
  const memory = program.command("memory").description("Manage local Git-linked memory records.");
  memory
    .command("add")
    .description("Append a local memory JSONL record.")
    .argument("<content>", "Memory content")
    .option("--file <path>", "Optional file scope to hash and link")
    .action(async (content: string, options: MemoryAddOptions) => {
      const record = await addMemory(content, options);
      process.stdout.write(`Memory added at ${record.timestamp}\n`);
    });

  memory
    .command("search")
    .description("Search local memory JSONL records by string.")
    .argument("<term>", "Search term")
    .action(async (term: string) => {
      const matches = await searchMemory(term);
      process.stdout.write(matches.length > 0 ? `${matches.join("\n")}\n` : "No memory records matched.\n");
    });
}
