import { promises as fs } from "node:fs";
import path from "node:path";
import { artifactStore } from "./artifact-store.js";
import { getWorkspacePaths, relativeToRoot } from "./config.js";
import { redactText } from "./report-redaction.js";
import { RawStore, type RawRunRecord } from "./raw-store.js";
import { WorkspaceGuard } from "./workspace-guard.js";

export async function rawStatus(root = process.cwd()): Promise<Record<string, unknown>> {
  const records = await new RawStore(root).readManifest();
  return {
    schemaVersion: "soturail.raw.status.v1",
    createdAt: new Date().toISOString(),
    records: records.length,
    sensitive: records.filter((record) => record.sensitivity === "sensitive" || record.contains_probable_secrets === true).length,
    metadataMissing: records.filter((record) => !record.workspace_fingerprint || !record.redaction_version || !record.retention_policy).length,
    oldest: records.at(0)?.created_at ?? null,
    newest: records.at(-1)?.created_at ?? null
  };
}

export async function rawDoctor(root = process.cwd()): Promise<{ ok: boolean; findings: string[]; records: number }> {
  const paths = getWorkspacePaths(root);
  const parsed = await artifactStore.readJsonl<RawRunRecord>(paths.rawIndex);
  const findings: string[] = [];
  if (parsed.corruptLine !== undefined) findings.push(`Corrupt JSONL line: ${parsed.corruptLine}`);
  if (parsed.recoveredPartialTail) findings.push("Partial JSONL tail detected; run a writer or repair path before relying on the final record.");
  const guard = new WorkspaceGuard(root);
  for (const record of parsed.records) {
    try {
      await guard.realpathAndVerify(path.resolve(root, record.path), paths.rawDir, true);
    } catch {
      findings.push(`Invalid or missing raw path for ${record.raw_id}: ${record.path}`);
    }
  }
  return { ok: findings.length === 0, findings, records: parsed.records.length };
}

export async function inspectRaw(rawId: string, root = process.cwd()): Promise<{ metadata: RawRunRecord; redacted: string; redactions: number }> {
  const store = new RawStore(root);
  const metadata = await store.find(rawId);
  if (!metadata) throw new Error(`Raw log not found: ${rawId}`);
  const buffer = await store.readRaw(rawId);
  if (!buffer) throw new Error(`Raw log payload not found: ${rawId}`);
  const result = redactText(buffer.toString("utf8"));
  return { metadata, redacted: result.text, redactions: result.redactions.reduce((sum, item) => sum + item.count, 0) };
}

export async function rawSensitivity(rawId: string, root = process.cwd()): Promise<Record<string, unknown>> {
  const inspected = await inspectRaw(rawId, root);
  return {
    rawId,
    sensitivity: inspected.metadata.sensitivity ?? (inspected.redactions > 0 ? "sensitive" : "unknown"),
    containsProbableSecrets: inspected.metadata.contains_probable_secrets ?? inspected.redactions > 0,
    redactionVersion: inspected.metadata.redaction_version ?? "legacy-unreported",
    redactionsDetectedNow: inspected.redactions,
    workspaceFingerprint: inspected.metadata.workspace_fingerprint ?? "UNAVAILABLE",
    retentionPolicy: inspected.metadata.retention_policy ?? "legacy-unreported",
    expiresAt: inspected.metadata.expires_at ?? null
  };
}

export async function purgeRaw(options: { ttl: string; execute?: boolean; yes?: boolean }, root = process.cwd()): Promise<{ candidates: string[]; removed: string[] }> {
  const ttlMs = parseTtl(options.ttl);
  const cutoff = Date.now() - ttlMs;
  const store = new RawStore(root);
  const records = await store.readManifest();
  const candidates = records.filter((record) => Date.parse(record.created_at) < cutoff);
  if (options.execute && !options.yes) throw new Error("Raw deletion requires --execute --yes. Run without --execute for a dry run.");
  const removed: string[] = [];
  if (options.execute) {
    const paths = getWorkspacePaths(root);
    const guard = new WorkspaceGuard(root);
    for (const record of candidates) {
      const target = await guard.realpathAndVerify(path.resolve(root, record.path), paths.rawDir, true);
      await fs.unlink(target);
      removed.push(relativeToRoot(root, target));
    }
    const candidateIds = new Set(candidates.map((record) => record.raw_id));
    await artifactStore.writeText(paths.rawIndex, records.filter((record) => !candidateIds.has(record.raw_id)).map((record) => JSON.stringify(record)).join("\n") + (records.length === candidates.length ? "" : "\n"));
  }
  return { candidates: candidates.map((record) => record.raw_id), removed };
}

function parseTtl(value: string): number {
  const match = /^(\d+)([dhm])$/.exec(value.trim().toLowerCase());
  if (!match?.[1] || !match[2]) throw new Error("TTL must use a positive integer followed by d, h or m (for example 30d). ");
  const amount = Number.parseInt(match[1], 10);
  if (amount <= 0) throw new Error("TTL must be positive.");
  return amount * ({ d: 86_400_000, h: 3_600_000, m: 60_000 }[match[2]] ?? 0);
}
