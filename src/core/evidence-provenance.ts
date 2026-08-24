import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { ensureWorkspace, getWorkspacePaths, readJsonl, relativeToRoot, writeJson } from "./config.js";
import type { RawRunRecord } from "./raw-store.js";
import { makeRailId, redactProbableSecrets } from "./rail-utils.js";
import { createWorkspaceFingerprint, type WorkspaceFingerprint } from "./workspace-fingerprint.js";
import { createArtifactEnvelope } from "./artifact-envelope.js";
import { artifactStore } from "./artifact-store.js";
import { SOTURAIL_VERSION } from "./version.js";

const execFileAsync = promisify(execFile);
export type EvidenceStatus = "verified" | "unverified" | "blocked" | "inferred" | "stale";

export interface ProvenanceEvidence {
  schemaVersion: "soturail.evidence.provenance.v1";
  id: string;
  createdAt: string;
  status: EvidenceStatus;
  freshness: "current" | "stale" | "unknown";
  workspace: WorkspaceFingerprint;
  filesRead: Array<{ path: string; status: EvidenceStatus; source: string }>;
  filesChanged: Array<{ path: string; status: EvidenceStatus; source: string }>;
  checks: Array<{ command: string; exitCode: number; status: EvidenceStatus; rawId: string }>;
  reportsGenerated: Array<{ path: string; status: EvidenceStatus }>;
  blockers: string[];
  sourcePaths: string[];
  warnings: string[];
  nextCommands: string[];
}

export async function collectEvidence(root = process.cwd()): Promise<{ dir: string; evidence: ProvenanceEvidence }> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const workspace = await createWorkspaceFingerprint(root);
  const id = makeRailId("evidence", root);
  const dir = path.join(paths.evidenceDir, id);
  await fs.mkdir(dir, { recursive: true });
  const changed = await gitChangedFiles(root);
  const knowledgeSources = await readKnowledgeSources(paths.knowledgeDir);
  const raw = await readJsonl<RawRunRecord>(paths.rawIndex);
  const checks = raw.slice(-20).filter((record) => looksLikeCheck(record.command)).map((record) => ({
    command: redactProbableSecrets(record.command),
    exitCode: record.exit_code,
    status: record.exit_code === 0 ? "verified" as const : "blocked" as const,
    rawId: record.raw_id
  }));
  const reportsGenerated = await listReports(paths.reportsDir, root);
  const blockers = checks.filter((check) => check.status === "blocked").map((check) => `${check.command} exited ${check.exitCode}`);
  const evidence: ProvenanceEvidence = {
    schemaVersion: "soturail.evidence.provenance.v1",
    id,
    createdAt: new Date().toISOString(),
    status: blockers.length > 0 ? "blocked" : checks.length > 0 ? "verified" : "unverified",
    freshness: "current",
    workspace,
    filesRead: knowledgeSources.map((source) => ({ path: source, status: "inferred", source: "knowledge source-map" })),
    filesChanged: changed.map((file) => ({ path: file, status: "verified", source: "git status --short" })),
    checks,
    reportsGenerated,
    blockers,
    sourcePaths: [...new Set([...knowledgeSources, ...changed, ...reportsGenerated.map((report) => report.path)])],
    warnings: checks.length === 0 ? ["No locally recorded verification checks were found; status remains unverified."] : [],
    nextCommands: ["soturail evidence verify", "soturail evidence report"]
  };
  await writeEvidenceArtifacts(dir, evidence);
  return { dir, evidence };
}

export async function verifyEvidence(root = process.cwd()): Promise<{ dir: string; evidence: ProvenanceEvidence }> {
  const latest = await latestEvidence(root);
  if (!latest) throw new Error("No evidence run found. Run: soturail evidence collect");
  const missing: string[] = [];
  const currentWorkspace = await createWorkspaceFingerprint(root);
  for (const source of latest.evidence.sourcePaths) if (!await exists(path.resolve(root, source))) missing.push(source);
  const persistentBlockers = latest.evidence.blockers.filter((blocker) => !blocker.startsWith("Workspace fingerprint changed:"));
  const workspaceChanged = !latest.evidence.workspace?.fingerprint || latest.evidence.workspace.fingerprint !== currentWorkspace.fingerprint;
  latest.evidence.blockers = [...new Set([
    ...persistentBlockers,
    ...missing.map((source) => `Missing source: ${source}`),
    ...(workspaceChanged ? [`Workspace fingerprint changed: ${latest.evidence.workspace?.fingerprint ?? "UNAVAILABLE"} -> ${currentWorkspace.fingerprint}`] : [])
  ])];
  latest.evidence.freshness = workspaceChanged ? "stale" : "current";
  latest.evidence.warnings = latest.evidence.warnings.filter((warning) => !warning.startsWith("Evidence verification"));
  latest.evidence.warnings.push(`Evidence verification inspected ${latest.evidence.sourcePaths.length} local source paths without running commands.`);
  latest.evidence.status = workspaceChanged
    ? "stale"
    : latest.evidence.blockers.length > 0
    ? "blocked"
    : latest.evidence.checks.some((check) => check.status === "verified")
      ? "verified"
      : latest.evidence.sourcePaths.length > 0 ? "inferred" : "unverified";
  await writeEvidenceArtifacts(latest.dir, latest.evidence);
  return latest;
}

export async function reportEvidence(root = process.cwd()): Promise<{ dir: string; evidence: ProvenanceEvidence; report: string }> {
  const latest = await latestEvidence(root);
  if (!latest) throw new Error("No evidence run found. Run: soturail evidence collect");
  const report = renderEvidenceReport(latest.evidence);
  await artifactStore.writeText(path.join(latest.dir, "report.md"), report);
  await artifactStore.writeText(path.join(latest.dir, "provenance.md"), renderProvenance(latest.evidence));
  return { ...latest, report };
}

export function renderEvidenceReport(evidence: ProvenanceEvidence): string {
  return [`# Evidence Report ${evidence.id}`, "", `Status: **${evidence.status}**`, `Freshness: **${evidence.freshness}**`, `Workspace fingerprint: \`${evidence.workspace?.fingerprint ?? "UNAVAILABLE"}\``, "", "## Files Read", ...(evidence.filesRead.length ? evidence.filesRead.map((item) => `- [${item.status}] \`${item.path}\` (${item.source})`) : ["- none recorded"]), "", "## Files Changed", ...(evidence.filesChanged.length ? evidence.filesChanged.map((item) => `- [${item.status}] \`${item.path}\` (${item.source})`) : ["- none detected"]), "", "## Checks Referenced", ...(evidence.checks.length ? evidence.checks.map((item) => `- [${item.status}] \`${item.command}\` exit=${item.exitCode} raw=${item.rawId}`) : ["- none recorded"]), "", "## Known Blockers", ...(evidence.blockers.length ? evidence.blockers.map((item) => `- ${item}`) : ["- none"]), "", "## Warnings", ...(evidence.warnings.length ? evidence.warnings.map((item) => `- ${item}`) : ["- none"]), "", "No unsupported verification is claimed. Missing proof remains unverified, inferred, stale or blocked.", ""].join("\n");
}

async function latestEvidence(root: string): Promise<{ dir: string; evidence: ProvenanceEvidence } | null> {
  const base = getWorkspacePaths(root).evidenceDir;
  const entries = (await fs.readdir(base, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const latest = entries.at(-1);
  if (!latest) return null;
  const dir = path.join(base, latest);
  return { dir, evidence: JSON.parse(await fs.readFile(path.join(dir, "evidence.json"), "utf8")) as ProvenanceEvidence };
}

async function writeEvidenceArtifacts(dir: string, evidence: ProvenanceEvidence): Promise<void> {
  await writeJson(path.join(dir, "evidence.json"), evidence);
  await artifactStore.writeText(path.join(dir, "report.md"), renderEvidenceReport(evidence));
  await artifactStore.writeText(path.join(dir, "provenance.md"), renderProvenance(evidence));
  const envelope = await createArtifactEnvelope({
    artifactType: "evidence",
    artifactId: evidence.id,
    producer: "soturail.evidence",
    producerVersion: SOTURAIL_VERSION,
    payload: evidence,
    workspace: evidence.workspace,
    status: evidence.status === "verified" ? "verified" : evidence.status === "blocked" ? "blocked" : "unverified"
  });
  envelope.freshness = evidence.freshness;
  await writeJson(path.join(dir, "envelope.json"), envelope);
}

function renderProvenance(evidence: ProvenanceEvidence): string {
  return [`# Provenance ${evidence.id}`, "", `- schemaVersion: ${evidence.schemaVersion}`, `- createdAt: ${evidence.createdAt}`, `- status: ${evidence.status}`, `- freshness: ${evidence.freshness}`, `- workspaceFingerprint: ${evidence.workspace?.fingerprint ?? "UNAVAILABLE"}`, "- collection: local artifacts and read-only git status only", "- commands executed by evidence verification: none", "", "## Source Paths", ...(evidence.sourcePaths.length ? evidence.sourcePaths.map((source) => `- \`${source}\``) : ["- none"]), ""].join("\n");
}

async function gitChangedFiles(root: string): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync("git", ["status", "--short"], { cwd: root, timeout: 5000, windowsHide: true });
    return stdout.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim().replace(/\\/g, "/")).filter(Boolean);
  } catch {
    return [];
  }
}

async function readKnowledgeSources(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const sources = new Set<string>();
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const map = await fs.readFile(path.join(dir, entry.name, "source-map.json"), "utf8").then((raw) => JSON.parse(raw) as { sources?: Array<{ path?: string }> }).catch(() => null);
    for (const source of map?.sources ?? []) if (source.path) sources.add(source.path);
  }
  return [...sources].sort();
}

async function listReports(dir: string, root: string): Promise<Array<{ path: string; status: EvidenceStatus }>> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isFile() && /\.(json|md|html)$/i.test(entry.name)).slice(-20).map((entry) => ({ path: relativeToRoot(root, path.join(dir, entry.name)).replace(/\\/g, "/"), status: "inferred" as const }));
}

function looksLikeCheck(command: string): boolean {
  return /\b(test|typecheck|build|lint|audit|check|verify|vitest|tsc)\b/i.test(command);
}

async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(() => true).catch(() => false);
}
