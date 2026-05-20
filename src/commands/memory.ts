import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { appendJsonl, ensureWorkspace, getWorkspacePaths, readJsonl } from "../core/config.js";
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
  source?: "manual" | "agent" | "import";
}

export interface PendingMemoryRecord {
  id: string;
  created_at: string;
  git_commit: string | null;
  text: string;
  source: "manual" | "agent" | "import";
  file_hashes?: Record<string, string>;
  status: "pending" | "rejected";
}

export interface ApprovedMemoryRecord {
  id: string;
  created_at: string;
  approved_at: string;
  git_commit: string | null;
  text: string;
  source: "manual" | "agent" | "import";
  file_hashes?: Record<string, string>;
  stale?: boolean;
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

function memoryId(text: string): string {
  let hash = 0;
  for (const char of `${text}${Date.now()}`) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }
  return `mem_${Math.abs(hash).toString(36)}`;
}

async function fileHashes(root: string, file?: string): Promise<Record<string, string> | undefined> {
  if (!file) {
    return undefined;
  }
  const absolute = path.resolve(root, file);
  const digest = await hashFile(absolute);
  return digest ? { [path.normalize(path.relative(root, absolute)).replace(/\\/g, "/")]: digest } : undefined;
}

export async function proposeMemory(text: string, options: MemoryAddOptions = {}, root = process.cwd()): Promise<PendingMemoryRecord> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const record: PendingMemoryRecord = {
    id: memoryId(text),
    created_at: new Date().toISOString(),
    git_commit: await getCurrentGitCommit(root),
    text,
    source: options.source ?? "manual",
    status: "pending"
  };
  const hashes = await fileHashes(root, options.file);
  if (hashes) {
    record.file_hashes = hashes;
  }
  await appendJsonl(paths.memoryPendingFile, record);
  return record;
}

export async function approveMemory(id: string, root = process.cwd()): Promise<ApprovedMemoryRecord> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const pending = await readJsonl<PendingMemoryRecord>(paths.memoryPendingFile);
  const record = pending.find((item) => item.id === id && item.status === "pending");
  if (!record) {
    throw new Error(`Pending memory ${id} not found.`);
  }
  const approved: ApprovedMemoryRecord = {
    id: record.id,
    created_at: record.created_at,
    approved_at: new Date().toISOString(),
    git_commit: record.git_commit,
    text: record.text,
    source: record.source
  };
  if (record.file_hashes) {
    approved.file_hashes = record.file_hashes;
  }
  await appendJsonl(paths.memoryApprovedFile, approved);
  await appendJsonl(paths.memoryFile, { ...approved, content: `[approved] ${approved.text}`, approved: true });
  return approved;
}

export async function rejectMemory(id: string, root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const pending = await readJsonl<PendingMemoryRecord>(paths.memoryPendingFile);
  let found = false;
  const next = pending.map((item) => {
    if (item.id === id) {
      found = true;
      return { ...item, status: "rejected" as const };
    }
    return item;
  });
  await fs.writeFile(paths.memoryPendingFile, next.map((item) => JSON.stringify(item)).join("\n") + "\n", "utf8");
  if (!found) {
    throw new Error(`Pending memory ${id} not found.`);
  }
  return `Rejected memory ${id}\n`;
}

export async function listMemory(kind: "pending" | "approved", root = process.cwd()): Promise<string> {
  const paths = getWorkspacePaths(root);
  if (kind === "pending") {
    const records = (await readJsonl<PendingMemoryRecord>(paths.memoryPendingFile)).filter((item) => item.status === "pending");
    return records.length > 0 ? `${records.map((item) => `${item.id} ${item.text}`).join("\n")}\n` : "No pending memory.\n";
  }
  const records = await readJsonl<ApprovedMemoryRecord>(paths.memoryApprovedFile);
  return records.length > 0 ? `${records.map((item) => `${item.id}${item.stale ? " [stale]" : ""} ${item.text}`).join("\n")}\n` : "No approved memory.\n";
}

export async function pruneStaleMemory(root = process.cwd()): Promise<string> {
  const paths = getWorkspacePaths(root);
  const approved = await readJsonl<ApprovedMemoryRecord>(paths.memoryApprovedFile);
  let staleCount = 0;
  const next: ApprovedMemoryRecord[] = [];
  for (const record of approved) {
    let stale = false;
    for (const [file, expected] of Object.entries(record.file_hashes ?? {})) {
      const actual = await hashFile(path.resolve(root, file));
      if (actual && actual !== expected) {
        stale = true;
      }
    }
    if (stale) {
      staleCount += 1;
      next.push({ ...record, stale: true });
    } else {
      next.push(record);
    }
  }
  await fs.writeFile(paths.memoryApprovedFile, next.map((item) => JSON.stringify(item)).join("\n") + (next.length > 0 ? "\n" : ""), "utf8");
  return `Marked stale approved memory entries: ${staleCount}\n`;
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

  memory.command("propose").description("Create a pending memory record.").argument("<text>", "Memory text").option("--file <path>", "Optional file scope").option("--source <source>", "manual, agent, or import", "manual").action(async (text: string, options: MemoryAddOptions) => {
    const record = await proposeMemory(text, options);
    process.stdout.write(`Proposed memory ${record.id}\n`);
  });

  memory.command("approve").description("Approve a pending memory record.").argument("<id>", "Memory id").action(async (id: string) => {
    const record = await approveMemory(id);
    process.stdout.write(`Approved memory ${record.id}\n`);
  });

  memory.command("reject").description("Reject a pending memory record.").argument("<id>", "Memory id").action(async (id: string) => {
    process.stdout.write(await rejectMemory(id));
  });

  memory.command("list").description("List pending or approved memory.").option("--pending", "List pending memory").option("--approved", "List approved memory").action(async (options: { pending?: boolean; approved?: boolean }) => {
    process.stdout.write(await listMemory(options.approved ? "approved" : "pending"));
  });

  memory.command("prune").description("Mark approved memory stale when linked file hashes changed.").option("--stale", "Prune stale entries").action(async () => {
    process.stdout.write(await pruneStaleMemory());
  });
}
