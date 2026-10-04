import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getWorkspacePaths, readJsonl } from "./config.js";
import { artifactStore } from "./artifact-store.js";

// Approved memory has one canonical store: memory/approved.jsonl.
// Before v1.6, `memory approve` also mirrored approvals into the free-form
// memory.jsonl log and readers merged both, which duplicated approvals and let
// entries marked stale in the canonical store reappear through the mirror.
// This module migrates any legacy-only approvals once, records a receipt, and
// is the single reader.

export const APPROVED_MEMORY_MIGRATION_ID = "memory-approved-canonical-v1.6";

export interface ApprovedMemoryEntry {
  id: string;
  created_at: string;
  approved_at: string;
  git_commit: string | null;
  text: string;
  source: string;
  status: "approved";
  stale?: boolean;
  file_hashes?: Record<string, string>;
  migrated_from?: string;
}

export interface ApprovedMemoryMigrationReceipt {
  schemaVersion: "soturail.migration.receipt.v1";
  id: typeof APPROVED_MEMORY_MIGRATION_ID;
  appliedAt: string;
  source: string;
  target: string;
  sourceSha256: string | null;
  migrated: number;
  alreadyCanonical: number;
}

type LegacyRecord = { id?: string; text?: string; content?: string; approved?: boolean; created_at?: string; approved_at?: string; timestamp?: string; git_commit?: string | null; source?: string; file_hashes?: Record<string, string> };

/** Run the one-time migration if it has not been applied; idempotent and atomic. */
export async function ensureApprovedMemoryMigrated(root = process.cwd()): Promise<ApprovedMemoryMigrationReceipt> {
  const paths = getWorkspacePaths(root);
  const receiptPath = path.join(paths.migrationsDir, `${APPROVED_MEMORY_MIGRATION_ID}.json`);
  const existing = await fs.readFile(receiptPath, "utf8").then((raw) => JSON.parse(raw) as ApprovedMemoryMigrationReceipt).catch(() => null);
  if (existing?.id === APPROVED_MEMORY_MIGRATION_ID) return existing;

  const legacyRaw = await fs.readFile(paths.memoryFile, "utf8").catch(() => null);
  const legacy = (await readJsonl<LegacyRecord>(paths.memoryFile)).filter((record) => record.approved === true || /^\[approved\]\s*/i.test(record.content ?? ""));
  const canonical = await readJsonl<ApprovedMemoryEntry>(paths.memoryApprovedFile);
  const knownIds = new Set(canonical.map((record) => record.id));
  const knownTexts = new Set(canonical.map((record) => record.text));
  const additions: ApprovedMemoryEntry[] = [];
  let alreadyCanonical = 0;
  for (const record of legacy) {
    const text = record.text ?? (record.content ?? "").replace(/^\[approved\]\s*/i, "");
    if (!text) continue;
    if ((record.id && knownIds.has(record.id)) || knownTexts.has(text)) {
      alreadyCanonical += 1;
      continue;
    }
    const id = record.id ?? `mem_legacy_${createHash("sha256").update(text).digest("hex").slice(0, 12)}`;
    const entry: ApprovedMemoryEntry = {
      id,
      created_at: record.created_at ?? record.timestamp ?? "UNKNOWN",
      approved_at: record.approved_at ?? record.timestamp ?? "UNKNOWN",
      git_commit: record.git_commit ?? null,
      text,
      source: record.source ?? "import",
      status: "approved",
      migrated_from: "memory/memory.jsonl"
    };
    if (record.file_hashes) entry.file_hashes = record.file_hashes;
    additions.push(entry);
    knownIds.add(id);
    knownTexts.add(text);
  }
  if (additions.length > 0) {
    const next = [...canonical, ...additions];
    await artifactStore.writeText(paths.memoryApprovedFile, next.map((record) => JSON.stringify(record)).join("\n") + "\n");
    const verified = await readJsonl<ApprovedMemoryEntry>(paths.memoryApprovedFile);
    if (verified.length !== next.length) throw new Error("Approved memory migration verification failed; canonical store left for inspection.");
  }
  const receipt: ApprovedMemoryMigrationReceipt = {
    schemaVersion: "soturail.migration.receipt.v1",
    id: APPROVED_MEMORY_MIGRATION_ID,
    appliedAt: new Date().toISOString(),
    source: "memory/memory.jsonl",
    target: "memory/approved.jsonl",
    sourceSha256: legacyRaw === null ? null : createHash("sha256").update(legacyRaw).digest("hex"),
    migrated: additions.length,
    alreadyCanonical
  };
  await artifactStore.writeJson(receiptPath, receipt);
  return receipt;
}

/** The single reader for approved memory. Stale entries are returned only when asked for. */
export async function readApprovedMemory(root = process.cwd(), options: { includeStale?: boolean } = {}): Promise<ApprovedMemoryEntry[]> {
  const paths = getWorkspacePaths(root);
  // A reader never creates state in a project without a SotuRail workspace.
  if (!await fs.access(paths.workspace).then(() => true, () => false)) return [];
  await ensureApprovedMemoryMigrated(root);
  const records = await readJsonl<ApprovedMemoryEntry>(paths.memoryApprovedFile);
  return records.filter((record) => record.status === "approved" && (options.includeStale === true || record.stale !== true));
}
