import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { artifactStore } from "./artifact-store.js";
import { ensureWorkspace, getWorkspacePaths } from "./config.js";
import { redactText } from "./report-redaction.js";
import { candidateId, CandidateKindSchema, parseSemanticCandidate, SEMANTIC_CANDIDATE_SCHEMA, type SemanticCandidate } from "./semantic-candidate.js";
import { createWorkspaceFingerprint } from "./workspace-fingerprint.js";
import { WorkspaceGuard } from "./workspace-guard.js";

// Records Semantic Worker output as candidate artifacts. Recording never
// verifies anything: SotuRail stamps workspace binding and time, validates the
// schema, rejects self-awarded trusted states and refuses secret-like content.

export interface StoredCandidate {
  candidate: SemanticCandidate;
  recordedAt: string;
  path: string;
}

export interface CandidateView extends StoredCandidate {
  /** Whether the workspace still matches the fingerprint the candidate was recorded against. */
  freshness: "current" | "stale" | "unknown";
  /** Per-source provenance: does each cited file still have the digest recorded with the candidate? */
  sources: Array<{ path: string; state: "current" | "changed" | "missing" | "unhashed" }>;
}

/** Draft accepted from producers: SotuRail assigns schemaVersion, id, createdAt and workspace binding. */
export const CandidateDraftSchema = z.looseObject({ kind: CandidateKindSchema });

export async function recordCandidate(draft: unknown, root = process.cwd()): Promise<StoredCandidate> {
  const base = CandidateDraftSchema.parse(draft);
  await ensureWorkspace(root);
  const fingerprint = await createWorkspaceFingerprint(root);
  const { id: _id, createdAt: _createdAt, schemaVersion: _schema, workspace: _workspace, ...rest } = base as Record<string, unknown>;
  const content = primaryText(rest);
  const refs = Array.isArray(rest.sourceRefs) ? (rest.sourceRefs as Array<{ path: string }>) : [];
  const candidate = parseSemanticCandidate({
    ...rest,
    sourceRefs: await bindSourceRefs(refs, root),
    schemaVersion: SEMANTIC_CANDIDATE_SCHEMA,
    id: candidateId(base.kind, content, refs),
    createdAt: new Date().toISOString(),
    workspace: { fingerprint: fingerprint.fingerprint }
  });
  const serialized = JSON.stringify(candidate);
  if (redactText(serialized).redactions.length > 0) throw new Error("Candidate contains secret-like content; redact it before recording.");
  const filePath = path.join(getWorkspacePaths(root).candidatesDir, `${candidate.id}.json`);
  const recordedAt = new Date().toISOString();
  await artifactStore.writeJson(filePath, { recordedAt, candidate });
  return { candidate, recordedAt, path: path.relative(root, filePath).split(path.sep).join("/") };
}

export async function listCandidates(root = process.cwd(), options: { kind?: string } = {}): Promise<CandidateView[]> {
  const dir = getWorkspacePaths(root).candidatesDir;
  const entries = await fs.readdir(dir).catch(() => [] as string[]);
  if (entries.length === 0) return [];
  const current = (await createWorkspaceFingerprint(root)).fingerprint;
  const views: CandidateView[] = [];
  for (const entry of entries.filter((name) => name.endsWith(".json")).sort()) {
    const raw = JSON.parse(await fs.readFile(path.join(dir, entry), "utf8")) as { recordedAt?: string; candidate?: unknown };
    // Stored files are re-validated: an edited file cannot smuggle in a trusted state.
    const candidate = parseSemanticCandidate(raw.candidate);
    if (options.kind && candidate.kind !== options.kind) continue;
    const bound = candidate.workspace?.fingerprint;
    views.push({
      candidate,
      recordedAt: raw.recordedAt ?? "UNKNOWN",
      path: `.soturail/candidates/${entry}`,
      freshness: !bound ? "unknown" : bound === current ? "current" : "stale",
      sources: await sourceFreshness(candidate.sourceRefs, root)
    });
  }
  return views;
}

/** Stamp each cited source with its current digest; refuse refs outside the workspace or to sensitive files. */
async function bindSourceRefs(refs: Array<Record<string, unknown> & { path: string }>, root: string): Promise<unknown[]> {
  const guard = new WorkspaceGuard(root);
  const bound: unknown[] = [];
  for (const ref of refs) {
    if (typeof ref?.path !== "string") {
      bound.push(ref);
      continue;
    }
    await guard.resolveProjectPath(ref.path, { mustExist: false });
    const digest = await readDigest(guard, ref.path);
    bound.push(digest && ref.sha256 === undefined ? { ...ref, sha256: digest } : ref);
  }
  return bound;
}

async function sourceFreshness(refs: SemanticCandidate["sourceRefs"], root: string): Promise<CandidateView["sources"]> {
  const guard = new WorkspaceGuard(root);
  const result: CandidateView["sources"] = [];
  for (const ref of refs) {
    if (!ref.sha256) {
      result.push({ path: ref.path, state: "unhashed" });
      continue;
    }
    const digest = await readDigest(guard, ref.path);
    result.push({ path: ref.path, state: digest === null ? "missing" : digest === ref.sha256 ? "current" : "changed" });
  }
  return result;
}

async function readDigest(guard: WorkspaceGuard, relative: string): Promise<string | null> {
  try {
    const file = await guard.assertAllowedRead(relative);
    return createHash("sha256").update(await fs.readFile(file)).digest("hex");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function primaryText(draft: Record<string, unknown>): string {
  for (const key of ["statementOriginal", "questionOriginal", "summaryOriginal"]) {
    if (typeof draft[key] === "string") return draft[key] as string;
  }
  return JSON.stringify(draft.target ?? draft);
}
