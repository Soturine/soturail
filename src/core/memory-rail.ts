import { promises as fs } from "node:fs";
import path from "node:path";
import { appendJsonl, ensureWorkspace, getWorkspacePaths, readJsonl } from "./config.js";
import { getCurrentGitCommit, hashFile } from "./git.js";
import { keywordScore, makeRailId, normalizeWords, redactProbableSecrets, sha256Text, summarizeText } from "./rail-utils.js";

export interface MemoryRailRecord {
  schemaVersion: "soturail.memory.v1";
  id: string;
  createdAt: string;
  text: string;
  source: string;
  tags: string[];
  confidence: number;
  privacy: "local" | "sensitive";
  gitCommit: string | null;
  filePath?: string;
  fileHash?: string;
}

export interface MemoryRecallMatch {
  record: MemoryRailRecord;
  score: number;
  reason: string;
}

export async function rememberMemory(
  text: string,
  options: { tags?: string[]; source?: string; confidence?: number; privacy?: "local" | "sensitive" } = {},
  root = process.cwd()
): Promise<MemoryRailRecord> {
  await ensureWorkspace(root);
  const redacted = redactProbableSecrets(text);
  const record: MemoryRailRecord = {
    schemaVersion: "soturail.memory.v1",
    id: makeRailId("mem", text),
    createdAt: new Date().toISOString(),
    text: redacted,
    source: options.source ?? "manual",
    tags: uniqueTags(options.tags ?? []),
    confidence: options.confidence ?? 0.8,
    privacy: redacted === text ? options.privacy ?? "local" : "sensitive",
    gitCommit: await getCurrentGitCommit(root)
  };
  await appendJsonl(getWorkspacePaths(root).memoryRecordsFile, record);
  return record;
}

export async function captureMemoryFromFile(
  file: string,
  options: { tags?: string[]; source?: string } = {},
  root = process.cwd()
): Promise<MemoryRailRecord> {
  await ensureWorkspace(root);
  const absolute = path.resolve(root, file);
  const raw = await fs.readFile(absolute, "utf8");
  const relative = path.normalize(path.relative(root, absolute)).replace(/\\/g, "/");
  const text = `Captured from ${relative}: ${summarizeText(redactProbableSecrets(raw), 900)}`;
  const record = await rememberMemory(text, {
    tags: options.tags ?? ["capture"],
    source: options.source ?? "import",
    confidence: 0.65
  }, root);
  const digest = await hashFile(absolute);
  if (!digest) return record;

  const paths = getWorkspacePaths(root);
  const updated = { ...record, filePath: relative, fileHash: digest };
  const records = await readJsonl<MemoryRailRecord>(paths.memoryRecordsFile);
  await fs.writeFile(
    paths.memoryRecordsFile,
    `${records.map((item) => JSON.stringify(item.id === record.id ? updated : item)).join("\n")}\n`,
    "utf8"
  );
  return updated;
}

export async function recallMemory(query: string, limit = 5, root = process.cwd()): Promise<MemoryRecallMatch[]> {
  const records = await allMemoryRecords(root);
  const queryWords = new Set(normalizeWords(query));
  return records
    .map((record, index) => {
      const base = keywordScore(query, `${record.text} ${record.tags.join(" ")}`);
      const tagHits = record.tags.filter((tag) => queryWords.has(tag)).length;
      return {
        record,
        score: base.score + tagHits * 4 + Math.max(0, 1 - index / Math.max(records.length, 1)),
        reason: tagHits > 0 ? `${base.reason}; tag match: ${tagHits}` : base.reason
      };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || right.record.createdAt.localeCompare(left.record.createdAt))
    .slice(0, limit);
}

export async function consolidateMemory(root = process.cwd()): Promise<{ before: number; after: number; duplicatesRemoved: number; path: string }> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const records = await allMemoryRecords(root);
  const seen = new Set<string>();
  const consolidated: MemoryRailRecord[] = [];
  for (const record of records) {
    const key = sha256Text(`${record.text.toLowerCase().replace(/\s+/g, " ").trim()}|${record.tags.join(",")}`);
    if (seen.has(key)) continue;
    seen.add(key);
    consolidated.push(record);
  }
  await fs.writeFile(
    paths.memoryConsolidatedFile,
    consolidated.map((item) => JSON.stringify(item)).join("\n") + (consolidated.length > 0 ? "\n" : ""),
    "utf8"
  );
  return { before: records.length, after: consolidated.length, duplicatesRemoved: records.length - consolidated.length, path: paths.memoryConsolidatedFile };
}

export async function memoryRailDoctor(root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const records = await allMemoryRecords(root);
  const consolidated = await readJsonl<MemoryRailRecord>(paths.memoryConsolidatedFile);
  const sensitive = records.filter((record) => record.privacy === "sensitive").length;
  const storageExists = await exists(paths.memoryDir);
  const likelySecrets = records.filter((record) => /\[REDACTED|secret|token|api[_-]?key/i.test(record.text)).length;
  return [
    "SotuRail Memory Rail doctor",
    `storage: ${path.normalize(path.relative(root, paths.memoryDir))}`,
    `storage_exists: ${storageExists}`,
    `total_records: ${records.length}`,
    `consolidated_records: ${consolidated.length}`,
    `sensitive_records: ${sensitive}`,
    `likely_secret_records: ${likelySecrets}`,
    "redaction: enabled",
    `approved_memory_export_status: ${sensitive === 0 ? "safe-default" : "review required before export"}`,
    "embeddings: not used",
    "cloud_storage: not used",
    "next_steps:",
    "- soturail memory recall \"project decision\" --limit 5",
    "- soturail memory consolidate",
    "- Keep sensitive or unapproved memory local."
  ].join("\n") + "\n";
}

export function renderRecall(matches: MemoryRecallMatch[]): string {
  if (matches.length === 0) return "No memory records matched.\nTry a shorter query or add memory with: soturail memory remember \"decision\" --tag <tag>\n";
  const lines = ["SotuRail memory recall", `matches_count: ${matches.length}`, "", "Matches:"];
  for (const match of matches) {
    lines.push(
      `- ${match.record.id} [score ${match.score.toFixed(2)}]`,
      `  Text: ${match.record.text}`,
      `  Reason: ${match.reason}`,
      `  Source: ${match.record.source}`,
      `  Tags: ${match.record.tags.length > 0 ? match.record.tags.join(", ") : "none"}`,
      `  Confidence/privacy: ${match.record.confidence} / ${match.record.privacy}`,
      `  Created: ${match.record.createdAt}`,
      ""
    );
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

async function allMemoryRecords(root: string): Promise<MemoryRailRecord[]> {
  const paths = getWorkspacePaths(root);
  const records = await readJsonl<MemoryRailRecord>(paths.memoryRecordsFile);
  const approved = await readJsonl<{ id?: string; created_at?: string; text?: string; source?: string }>(paths.memoryApprovedFile);
  const upgraded = approved
    .filter((record) => typeof record.text === "string")
    .map((record) => ({
      schemaVersion: "soturail.memory.v1" as const,
      id: record.id ?? makeRailId("mem", record.text ?? ""),
      createdAt: record.created_at ?? new Date(0).toISOString(),
      text: record.text ?? "",
      source: record.source ?? "approved",
      tags: ["approved"],
      confidence: 0.75,
      privacy: "local" as const,
      gitCommit: null
    }));
  return [...records, ...upgraded].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function uniqueTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
