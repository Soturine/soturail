import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { appendJsonl, ensureWorkspace, getWorkspacePaths, readJsonl, relativeToRoot, writeJson } from "./config.js";
import type { HarnessFailureRecord } from "./harness-rail.js";
import type { MemoryRailRecord } from "./memory-rail.js";
import { getAgentCapability, listAgentCapabilities } from "./agent-runtime.js";
import type { AgentId } from "./agent-profile.js";
import { keywordScore, makeRailId, sha256Text, summarizeText } from "./rail-utils.js";
import { SOTURAIL_VERSION } from "./version.js";

const execFileAsync = promisify(execFile);

export type BrainRecordType = "claim" | "decision" | "bug" | "gap" | "rule" | "stale-event";
export type BrainClaimKind = "architecture" | "release" | "workflow" | "policy" | "test" | "command" | "docs" | "agent" | "security" | "unknown";
export type BrainClaimStatus = "verified" | "suspect" | "stale" | "unverified" | "rejected";
export type BrainConfidence = "high" | "medium" | "low";

export interface SourceRange {
  startLine: number;
  endLine: number;
}

export interface BrainClaimRecord {
  schemaVersion: "soturail.brain.claim.v1";
  id: string;
  claim: string;
  kind: BrainClaimKind;
  status: BrainClaimStatus;
  confidence: BrainConfidence;
  sourcePath: string;
  sourceCommit: string;
  sourceRange: SourceRange;
  fileHash: string;
  rangeHash: string;
  validatedBy: string[];
  relatedWorkflowIds: string[];
  relatedEvidenceIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BrainDecisionRecord {
  schemaVersion: "soturail.brain.decision.v1";
  id: string;
  title: string;
  decision: string;
  reason: string;
  status: "active" | "superseded" | "rejected" | "unknown";
  sourcePath: string;
  sourceCommit: string;
  tags: string[];
  createdAt: string;
}

export interface BrainBugRecord {
  schemaVersion: "soturail.brain.bug.v1";
  id: string;
  bug: string;
  status: "open" | "fixed" | "recurring" | "unknown";
  sourcePath: string;
  tags: string[];
  createdAt: string;
}

export interface BrainGapRecord {
  schemaVersion: "soturail.brain.gap.v1";
  id: string;
  gap: string;
  severity: "low" | "medium" | "high";
  needsHumanValidation: boolean;
  sourcePath: string;
  status: "open" | "resolved" | "accepted-risk";
  createdAt: string;
}

export interface BrainRuleRecord {
  schemaVersion: "soturail.brain.rule.v1";
  id: string;
  rule: string;
  sourceClaimIds: string[];
  sourceDecisionIds?: string[];
  enforcement: "advisory" | "policy-gate" | "test-backed" | "manual-review";
  status: "active" | "draft" | "deprecated";
  createdAt: string;
}

export interface BrainStaleEventRecord {
  schemaVersion: "soturail.brain.stale-event.v1";
  id: string;
  recordId: string;
  reason: string;
  previousHash: string;
  currentHash: string;
  status: "suspect" | "stale" | "resolved" | "relocated";
  previousRange?: SourceRange;
  candidateRange?: SourceRange;
  similarity?: number;
  createdAt: string;
}

export interface BrainProjectProfile {
  schemaVersion: "soturail.brain.project-profile.v1";
  projectName: string;
  packageVersion: string;
  cliVersion: string;
  identity: string;
  mainLanguageRuntime: string[];
  docsFolders: string[];
  releaseNotesPath: string;
  rails: string[];
  commands: string[];
  tests: string[];
  workflowHarnessDiagramEval: Record<string, string>;
  agentHosts: string[];
  knownReleaseProcess: string[];
  counts: BrainCounts;
  updatedAt: string;
}

export interface BrainCounts {
  claims: number;
  decisions: number;
  bugs: number;
  gaps: number;
  rules: number;
  staleEvents: number;
  suspectOrStale: number;
}

export interface BrainArchitectureView {
  schemaVersion: "soturail.brain.architecture.v1";
  storage: {
    jsonl: string[];
    jsonViews: string[];
    exports: string[];
  };
  rails: Array<{ name: string; evidence: string }>;
  boundaries: string[];
  updatedAt: string;
}

export interface BrainIndexView {
  schemaVersion: "soturail.brain.index.v1";
  updatedAt: string;
  claims: Array<{ id: string; kind: BrainClaimKind; status: BrainClaimStatus; sourcePath: string; tags: string[] }>;
  decisions: Array<{ id: string; status: string; sourcePath: string; tags: string[] }>;
  gaps: Array<{ id: string; severity: string; status: string; sourcePath: string }>;
  rules: Array<{ id: string; status: string; sourceClaimIds: string[] }>;
}

export interface BrainFreshnessView {
  schemaVersion: "soturail.brain.freshness.v1";
  updatedAt: string;
  checkedRecords: number;
  suspect: number;
  stale: number;
  warnings: string[];
  events: BrainStaleEventRecord[];
}

export interface BrainDoctorReport {
  schemaVersion: "soturail.brain.doctor.v1";
  ok: boolean;
  createdAt: string;
  files: Array<{ path: string; present: boolean; validJsonl?: boolean }>;
  counts: BrainCounts;
  duplicateClaimGroups?: number;
  integrationStatus?: Record<string, string>;
  repairPlanPath?: string;
  findings: string[];
  nextCommands: string[];
}

export type BrainAgentTarget = Extract<AgentId, "claude" | "codex" | "gemini" | "cursor" | "generic">;

export interface BrainStaleOptions {
  repairPlan?: boolean;
}

export interface BrainRepairSuggestion {
  recordId: string;
  type: "claim" | "decision" | "rule";
  text: string;
  reason: string;
  sourcePath: string;
  affectedRange?: SourceRange;
  candidateRange?: SourceRange;
  similarity?: number;
  recommendedCommand: string;
  recommendedHumanAction: string;
  relatedValidation: string[];
}

export interface BrainRepairPlan {
  schemaVersion: "soturail.brain.repair-plan.v1";
  createdAt: string;
  suggestions: BrainRepairSuggestion[];
}

export interface BrainConsolidationGroup {
  canonicalId: string;
  duplicateIds: string[];
  reason: string;
  score: number;
  claims: Array<{ id: string; status: BrainClaimStatus; confidence: BrainConfidence; sourcePath: string; claim: string }>;
}

export interface BrainConsolidationReport {
  schemaVersion: "soturail.brain.consolidation.v1";
  createdAt: string;
  dryRun: boolean;
  claimsRead: number;
  duplicateGroups: number;
  mergedClaims: number;
  canonicalClaims: number;
  groups: BrainConsolidationGroup[];
}

export interface BrainExportOptions {
  limit?: number;
  includeSuspect?: boolean;
}

export interface BrainDoctorOptions {
  repairPlan?: boolean;
}

export async function initBrain(root = process.cwd()): Promise<{ paths: string[]; output: string }> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  await Promise.all([
    fs.mkdir(paths.brainDir, { recursive: true }),
    fs.mkdir(paths.brainExportsDir, { recursive: true }),
    fs.mkdir(paths.brainSpecsDir, { recursive: true })
  ]);
  await Promise.all([
    writeFileIfMissing(paths.brainClaimsFile, ""),
    writeFileIfMissing(paths.brainDecisionsFile, ""),
    writeFileIfMissing(paths.brainBugsFile, ""),
    writeFileIfMissing(paths.brainGapsFile, ""),
    writeFileIfMissing(paths.brainRulesFile, ""),
    writeFileIfMissing(paths.brainStaleEventsFile, "")
  ]);
  const now = new Date().toISOString();
  const counts = await brainCounts(root);
  await writeJsonIfMissing(paths.brainProjectProfileFile, defaultProfile(root, counts, now));
  await writeJsonIfMissing(paths.brainArchitectureFile, defaultArchitecture(root, now));
  await writeJsonIfMissing(paths.brainIndexFile, { schemaVersion: "soturail.brain.index.v1", updatedAt: now, claims: [], decisions: [], gaps: [], rules: [] });
  await writeJsonIfMissing(paths.brainFreshnessFile, { schemaVersion: "soturail.brain.freshness.v1", updatedAt: now, checkedRecords: 0, suspect: 0, stale: 0, warnings: [], events: [] });
  const createdPaths = [
    paths.brainDir,
    paths.brainExportsDir,
    paths.brainClaimsFile,
    paths.brainDecisionsFile,
    paths.brainBugsFile,
    paths.brainGapsFile,
    paths.brainRulesFile,
    paths.brainStaleEventsFile,
    paths.brainProjectProfileFile,
    paths.brainArchitectureFile,
    paths.brainIndexFile,
    paths.brainFreshnessFile,
    paths.brainConsolidatedClaimsFile,
    paths.brainConsolidationReportJson,
    paths.brainConsolidationReportMd,
    paths.brainRepairPlanJson,
    paths.brainRepairPlanMd
  ].map((filePath) => relativeToRoot(root, filePath));
  return {
    paths: createdPaths,
    output: [
      "SotuRail brain init",
      `brain_dir: ${relativeToRoot(root, paths.brainDir)}`,
      `exports_dir: ${relativeToRoot(root, paths.brainExportsDir)}`,
      `claims: ${relativeToRoot(root, paths.brainClaimsFile)}`,
      `profile: ${relativeToRoot(root, paths.brainProjectProfileFile)}`,
      "next_commands:",
      "- soturail brain scan",
      "- soturail brain profile",
      "- soturail brain doctor",
      "- soturail brain export --agent codex"
    ].join("\n") + "\n"
  };
}

export async function scanBrain(root = process.cwd()): Promise<{ profile: BrainProjectProfile; claimsAdded: number; output: string }> {
  await initBrain(root);
  const now = new Date().toISOString();
  const paths = getWorkspacePaths(root);
  const packageJson = await readPackageJson(root);
  const tests = await listRelativeFiles(path.join(root, "tests"), root, (file) => file.endsWith(".test.ts"));
  const docsFolders = await listDocsFolders(root);
  const commands = await detectCliCommands(root);
  const rails = await detectRails(root);
  const claims = await scanClaims(root, now);
  const added = await appendRecordsIfNew(paths.brainClaimsFile, claims);
  const failures = await readJsonl<HarnessFailureRecord>(paths.harnessFailuresFile);
  await appendRecordsIfNew(paths.brainBugsFile, failures.map((failure): BrainBugRecord => ({
    schemaVersion: "soturail.brain.bug.v1",
    id: makeRailId("bug", `${failure.id}:${failure.whatFailed}`),
    bug: failure.whatFailed,
    status: "recurring",
    sourcePath: ".soturail/harness/failures.jsonl",
    tags: ["harness", failure.preventionCandidate.replace(/\s+/g, "-")],
    createdAt: now
  })));
  const counts = await brainCounts(root);
  const releaseNotesPath = packageJson.version ? path.join("docs", "releases", `RELEASE_NOTES_v${packageJson.version}.md`) : "unknown";
  const profile: BrainProjectProfile = {
    schemaVersion: "soturail.brain.project-profile.v1",
    projectName: packageJson.name ?? path.basename(root),
    packageVersion: packageJson.version ?? "unknown",
    cliVersion: SOTURAIL_VERSION,
    identity: "Local-first Context OS for AI coding agents.",
    mainLanguageRuntime: ["TypeScript", "Node >=20", "optional Rust/native"],
    docsFolders,
    releaseNotesPath,
    rails,
    commands,
    tests,
    workflowHarnessDiagramEval: {
      workflow: await exists(paths.workflowsDir) ? "present" : "missing",
      harness: await exists(paths.harnessDir) ? "present" : "missing",
      diagram: await exists(paths.diagramsDir) ? "present" : "missing",
      eval: await exists(path.join(paths.workspace, "eval", "latest.json")) ? "latest report present" : "no latest report"
    },
    agentHosts: listAgentCapabilities().map((capability) => capability.id),
    knownReleaseProcess: ["npm run typecheck", "npm run build", "npm test", "npm run release:check", "tag/release after checks", "npm publish only after release gates"],
    counts,
    updatedAt: now
  };
  await writeJson(paths.brainProjectProfileFile, profile);
  await writeJson(paths.brainArchitectureFile, defaultArchitecture(root, now));
  await writeBrainIndex(root);
  return {
    profile,
    claimsAdded: added,
    output: [
      "SotuRail brain scan",
      `project: ${profile.projectName}`,
      `package_version: ${profile.packageVersion}`,
      `cli_version: ${profile.cliVersion}`,
      `claims_added: ${added}`,
      `claims_total: ${counts.claims}`,
      `release_notes_path: ${profile.releaseNotesPath}`,
      `rails: ${rails.join(", ")}`,
      `commands_detected: ${commands.length}`,
      `tests_detected: ${tests.length}`,
      "next_commands:",
      "- soturail brain recall \"release notes\"",
      "- soturail brain consolidate --dry-run",
      "- soturail brain stale --repair-plan",
      "- soturail rules from-brain",
      "- soturail reverse gaps"
    ].join("\n") + "\n"
  };
}

export async function brainProfile(root = process.cwd()): Promise<string> {
  await ensureProfile(root);
  const paths = getWorkspacePaths(root);
  const profile = JSON.parse(await fs.readFile(paths.brainProjectProfileFile, "utf8")) as BrainProjectProfile;
  const counts = await brainCounts(root);
  return [
    "SotuRail brain profile",
    `project: ${profile.projectName}`,
    `package_version: ${profile.packageVersion}`,
    `cli_version: ${profile.cliVersion}`,
    `identity: ${profile.identity}`,
    `main_runtime: ${profile.mainLanguageRuntime.join(", ")}`,
    `release_notes_path: ${profile.releaseNotesPath}`,
    `rails: ${profile.rails.join(", ")}`,
    `workflow_support: ${profile.workflowHarnessDiagramEval.workflow}`,
    `diagram_support: ${profile.workflowHarnessDiagramEval.diagram}`,
    `eval_support: ${profile.workflowHarnessDiagramEval.eval}`,
    `claims: ${counts.claims}`,
    `gaps: ${counts.gaps}`,
    `suspect_or_stale: ${counts.suspectOrStale}`,
    "next_commands:",
    "- soturail brain consolidate --dry-run",
    "- soturail brain stale --repair-plan",
    "- soturail brain export --agent generic",
    "- soturail reverse specs ./src"
  ].join("\n") + "\n";
}

export async function recallBrain(query: string, root = process.cwd(), limit = 8): Promise<string> {
  await ensureProfile(root);
  const records = await allRecallRecords(root);
  const scored = records
    .map((record) => {
      const text = recallText(record);
      const score = keywordScore(query, `${text} ${record.tags.join(" ")}`);
      const exact = text.toLowerCase().includes(query.toLowerCase());
      const statusBoost = statusScore(record.status);
      const confidenceBoost = confidenceScore(record.confidence);
      return {
        ...record,
        score: score.score + statusBoost + confidenceBoost + (exact ? 8 : 0),
        reason: [exact ? "exact phrase" : score.reason, `status ${record.status}`, record.confidence ? `confidence ${record.confidence}` : ""].filter(Boolean).join(", ")
      };
    })
    .filter((record) => record.score > 0)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit);
  return [
    "SotuRail brain recall",
    `query: ${query}`,
    `matches_count: ${scored.length}`,
    "",
    ...scored.flatMap((record) => [
      `- ${record.id} [${record.type}] score ${record.score.toFixed(2)}`,
      `  Status/confidence: ${record.status}${record.confidence ? ` / ${record.confidence}` : ""}`,
      `  Source: ${record.sourcePath || "unknown"}`,
      `  Reason: ${record.reason}`,
      `  Text: ${summarizeText(recallText(record), 220)}`,
      ""
    ])
  ].join("\n").trimEnd() + "\n";
}

export async function staleBrain(root = process.cwd(), options: BrainStaleOptions = {}): Promise<{ freshness: BrainFreshnessView; repairPlan?: BrainRepairPlan; output: string }> {
  await initBrain(root);
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const existingEvents = await readJsonl<BrainStaleEventRecord>(paths.brainStaleEventsFile);
  const warnings: string[] = [];
  const events: BrainStaleEventRecord[] = [];
  for (const claim of claims) {
    const absolute = path.resolve(root, claim.sourcePath);
    if (!(await exists(absolute))) {
      events.push(staleEvent(claim.id, "source file missing", claim.rangeHash, "missing", "stale", { previousRange: claim.sourceRange }));
      continue;
    }
    const evidence = await sourceEvidence(root, claim.sourcePath, undefined, claim.sourceRange);
    if (claim.rangeHash !== evidence.rangeHash) {
      const relocation = await relocateSourceRange(root, claim);
      if (relocation.status === "relocated") {
        events.push(staleEvent(claim.id, "source range relocated", claim.rangeHash, relocation.rangeHash, "relocated", {
          previousRange: claim.sourceRange,
          ...(relocation.range ? { candidateRange: relocation.range } : {}),
          similarity: relocation.similarity
        }));
      } else if (relocation.status === "candidate") {
        events.push(staleEvent(claim.id, "rangeHash changed; relocation candidate", claim.rangeHash, evidence.rangeHash, "suspect", {
          previousRange: claim.sourceRange,
          ...(relocation.range ? { candidateRange: relocation.range } : {}),
          similarity: relocation.similarity
        }));
      } else {
        events.push(staleEvent(claim.id, "rangeHash changed", claim.rangeHash, evidence.rangeHash, "suspect", {
          previousRange: claim.sourceRange
        }));
      }
    } else if (claim.fileHash !== evidence.fileHash) {
      warnings.push(`${claim.id}: fileHash changed but rangeHash is unchanged`);
    }
    for (const validationPath of claim.validatedBy) {
      if (!(await exists(path.resolve(root, validationPath)))) {
        events.push(staleEvent(claim.id, `validatedBy missing: ${validationPath}`, claim.rangeHash, "missing-validation", "suspect", { previousRange: claim.sourceRange }));
      }
    }
  }
  const newEvents = events.filter((event) => !existingEvents.some((existing) => existing.id === event.id));
  for (const event of newEvents) await appendJsonl(paths.brainStaleEventsFile, event);
  const freshness: BrainFreshnessView = {
    schemaVersion: "soturail.brain.freshness.v1",
    updatedAt: new Date().toISOString(),
    checkedRecords: claims.length,
    suspect: events.filter((event) => event.status === "suspect").length,
    stale: events.filter((event) => event.status === "stale").length,
    warnings,
    events
  };
  await writeJson(paths.brainFreshnessFile, freshness);
  const repairPlan = options.repairPlan ? await writeRepairPlan(root, claims, events) : undefined;
  return {
    freshness,
    ...(repairPlan ? { repairPlan } : {}),
    output: [
      "SotuRail brain stale",
      `checked_records: ${freshness.checkedRecords}`,
      `new_events: ${newEvents.length}`,
      `suspect: ${freshness.suspect}`,
      `stale: ${freshness.stale}`,
      `relocated: ${freshness.events.filter((event) => event.status === "relocated").length}`,
      `warnings: ${freshness.warnings.length}`,
      `freshness: ${relativeToRoot(root, paths.brainFreshnessFile)}`,
      ...(repairPlan ? [
        `repair_plan_json: ${relativeToRoot(root, paths.brainRepairPlanJson)}`,
        `repair_plan_md: ${relativeToRoot(root, paths.brainRepairPlanMd)}`
      ] : []),
      "",
      ...(newEvents.length > 0 ? newEvents.map((event) => `- ${event.recordId}: ${event.reason} [${event.status}]`) : ["No stale evidence drift detected."])
    ].join("\n") + "\n"
  };
}

export async function consolidateBrain(root = process.cwd(), options: { dryRun?: boolean } = {}): Promise<{ report: BrainConsolidationReport; output: string }> {
  await initBrain(root);
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const dryRun = options.dryRun !== false;
  const groups = findDuplicateClaimGroups(claims);
  const duplicateIds = new Set(groups.flatMap((group) => group.duplicateIds));
  const canonicalIds = new Set(groups.map((group) => group.canonicalId));
  const canonicalClaims = claims.filter((claim) => !duplicateIds.has(claim.id));
  const consolidated = canonicalClaims.map((claim) => ({
    ...claim,
    mergedClaimIds: groups.find((group) => group.canonicalId === claim.id)?.duplicateIds ?? []
  }));
  const report: BrainConsolidationReport = {
    schemaVersion: "soturail.brain.consolidation.v1",
    createdAt: new Date().toISOString(),
    dryRun,
    claimsRead: claims.length,
    duplicateGroups: groups.length,
    mergedClaims: duplicateIds.size,
    canonicalClaims: canonicalIds.size + claims.filter((claim) => !duplicateIds.has(claim.id) && !canonicalIds.has(claim.id)).length,
    groups
  };
  await writeJson(paths.brainConsolidationReportJson, report);
  await fs.writeFile(paths.brainConsolidationReportMd, renderConsolidationReport(root, report), "utf8");
  await fs.writeFile(paths.brainConsolidatedClaimsFile, consolidated.map((claim) => JSON.stringify(claim)).join("\n") + (consolidated.length > 0 ? "\n" : ""), "utf8");
  return {
    report,
    output: [
      "SotuRail brain consolidate",
      `dry_run: ${dryRun}`,
      `claims_read: ${report.claimsRead}`,
      `duplicate_groups: ${report.duplicateGroups}`,
      `merged_claims: ${report.mergedClaims}`,
      `canonical_claims: ${report.canonicalClaims}`,
      `consolidated: ${relativeToRoot(root, paths.brainConsolidatedClaimsFile)}`,
      `report_json: ${relativeToRoot(root, paths.brainConsolidationReportJson)}`,
      `report: ${relativeToRoot(root, paths.brainConsolidationReportMd)}`,
      "history_preserved: true"
    ].join("\n") + "\n"
  };
}

export async function brainDoctor(root = process.cwd(), options: BrainDoctorOptions = {}): Promise<{ report: BrainDoctorReport; repairPlan?: BrainRepairPlan; output: string }> {
  await initBrain(root);
  const paths = getWorkspacePaths(root);
  const counts = await brainCounts(root);
  const jsonlFiles = [
    paths.brainClaimsFile,
    paths.brainDecisionsFile,
    paths.brainBugsFile,
    paths.brainGapsFile,
    paths.brainRulesFile,
    paths.brainStaleEventsFile
  ];
  const files: BrainDoctorReport["files"] = [];
  for (const filePath of jsonlFiles) {
    files.push({ path: relativeToRoot(root, filePath), present: await exists(filePath), validJsonl: await validJsonl(filePath) });
  }
  for (const filePath of [paths.brainProjectProfileFile, paths.brainIndexFile, paths.brainFreshnessFile]) {
    files.push({ path: relativeToRoot(root, filePath), present: await exists(filePath) });
  }
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const rules = await readJsonl<BrainRuleRecord>(paths.brainRulesFile);
  const duplicateGroups = findDuplicateClaimGroups(claims).length;
  const activeSourceIds = new Set([...claims.map((claim) => claim.id), ...(await readJsonl<BrainDecisionRecord>(paths.brainDecisionsFile)).map((decision) => decision.id)]);
  const rulesWithoutSources = rules.filter((rule) => [...rule.sourceClaimIds, ...(rule.sourceDecisionIds ?? [])].every((id) => !activeSourceIds.has(id))).length;
  const integrationStatus = {
    projectProfile: await exists(paths.brainProjectProfileFile) ? "present" : "missing",
    workflow: await exists(paths.workflowsDir) ? "present" : "missing",
    harness: await exists(paths.harnessDir) ? "present" : "missing",
    diagram: await exists(paths.diagramsDir) ? "present" : "missing",
    eval: await exists(path.join(paths.workspace, "eval", "latest.json")) ? "latest report present" : "no latest report",
    agentExports: await exists(path.join(paths.brainExportsDir, "agent-brief.md")) ? "present" : "missing",
    releaseProcess: await exists(path.join(root, "docs", "releases")) ? "docs/releases present" : "unknown"
  };
  const findings = [
    ...(claims.some((claim) => !claim.sourcePath) ? ["Some claims are missing source paths."] : []),
    ...(claims.some((claim) => claim.status === "verified" && claim.validatedBy.length === 0) ? ["Some verified claims have no validation references."] : []),
    ...(duplicateGroups > 0 ? [`Duplicate claim groups found: ${duplicateGroups}`] : []),
    ...(counts.gaps > 0 ? [`Open gaps recorded: ${counts.gaps}`] : []),
    ...(counts.suspectOrStale > 0 ? [`Suspect or stale records/events: ${counts.suspectOrStale}`] : []),
    ...(rulesWithoutSources > 0 ? [`Rules without live brain sources: ${rulesWithoutSources}`] : []),
    ...(await exists(path.join(paths.brainExportsDir, "agent-brief.md")) ? [] : ["Agent brief export is missing."])
  ];
  const repairPlan = options.repairPlan ? (await staleBrain(root, { repairPlan: true })).repairPlan : undefined;
  const report: BrainDoctorReport = {
    schemaVersion: "soturail.brain.doctor.v1",
    ok: files.every((file) => file.present && file.validJsonl !== false),
    createdAt: new Date().toISOString(),
    files,
    counts,
    duplicateClaimGroups: duplicateGroups,
    integrationStatus,
    ...(repairPlan ? { repairPlanPath: relativeToRoot(root, paths.brainRepairPlanMd) } : {}),
    findings,
    nextCommands: [
      "soturail brain scan",
      "soturail brain consolidate --dry-run",
      "soturail brain stale --repair-plan",
      "soturail brain export --agent generic",
      "soturail rules from-brain",
      "soturail eval run --suite brain"
    ]
  };
  await writeJson(paths.brainDoctorFile, report);
  return {
    report,
    output: [
      "SotuRail brain doctor",
      `ok: ${report.ok}`,
      `claims: ${counts.claims}`,
      `decisions: ${counts.decisions}`,
      `bugs: ${counts.bugs}`,
      `gaps: ${counts.gaps}`,
      `rules: ${counts.rules}`,
      `stale_events: ${counts.staleEvents}`,
      `duplicate_claim_groups: ${duplicateGroups}`,
      `rules_without_sources: ${rulesWithoutSources}`,
      `doctor_json: ${relativeToRoot(root, paths.brainDoctorFile)}`,
      ...(repairPlan ? [`repair_plan: ${relativeToRoot(root, paths.brainRepairPlanMd)}`] : []),
      "",
      "Files:",
      ...files.map((file) => `- ${file.path}: ${file.present ? "present" : "missing"}${file.validJsonl === undefined ? "" : `, jsonl_valid=${file.validJsonl}`}`),
      "",
      "Integration status:",
      ...Object.entries(integrationStatus).map(([key, value]) => `- ${key}: ${value}`),
      "",
      "Findings:",
      ...(findings.length > 0 ? findings.map((finding) => `- ${finding}`) : ["- none"]),
      "",
      "Next commands:",
      ...report.nextCommands.map((command) => `- ${command}`)
    ].join("\n") + "\n"
  };
}

export async function exportBrain(agent: BrainAgentTarget, root = process.cwd(), options: BrainExportOptions = {}): Promise<{ path: string; content: string; output: string }> {
  await ensureProfile(root);
  const paths = getWorkspacePaths(root);
  const profile = JSON.parse(await fs.readFile(paths.brainProjectProfileFile, "utf8")) as BrainProjectProfile;
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const decisions = await readJsonl<BrainDecisionRecord>(paths.brainDecisionsFile);
  const gaps = await readJsonl<BrainGapRecord>(paths.brainGapsFile);
  const bugs = await readJsonl<BrainBugRecord>(paths.brainBugsFile);
  const rules = await readJsonl<BrainRuleRecord>(paths.brainRulesFile);
  const freshness = await readJson<BrainFreshnessView>(paths.brainFreshnessFile).catch(() => null);
  const approvedMemory = await readJsonl<MemoryRailRecord>(paths.memoryApprovedFile).catch(() => []);
  const base = renderBrainBrief(agent, profile, claims, decisions, gaps, bugs, rules, freshness, approvedMemory, options);
  const content = agent === "claude" ? `<project_brain>\n${base}\n</project_brain>\n` : base;
  const outputPath = path.join(paths.brainExportsDir, `${agent}.md`);
  await fs.writeFile(outputPath, content, "utf8");
  if (agent === "generic") await fs.writeFile(path.join(paths.brainExportsDir, "agent-brief.md"), content, "utf8");
  return {
    path: outputPath,
    content,
    output: [
      "SotuRail brain export",
      `agent: ${agent}`,
      `path: ${relativeToRoot(root, outputPath)}`,
      `limit: ${normalizeLimit(options.limit)}`,
      `include_suspect: ${options.includeSuspect === true}`,
      ...(agent === "generic" ? [`generic_alias: ${relativeToRoot(root, path.join(paths.brainExportsDir, "agent-brief.md"))}`] : []),
      "review_required: true"
    ].join("\n") + "\n"
  };
}

export async function rulesFromBrain(root = process.cwd()): Promise<{ rules: BrainRuleRecord[]; markdownPath: string; jsonPath: string; output: string }> {
  await ensureProfile(root);
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const decisions = await readJsonl<BrainDecisionRecord>(paths.brainDecisionsFile);
  const staleEvents = await readJsonl<BrainStaleEventRecord>(paths.brainStaleEventsFile);
  const unsafeClaimIds = new Set(staleEvents.filter((event) => event.status === "suspect" || event.status === "stale").map((event) => event.recordId));
  const now = new Date().toISOString();
  const rules: BrainRuleRecord[] = [];
  for (const claim of claims.filter((item) => item.status !== "rejected" && item.status !== "stale" && item.status !== "suspect").slice(0, 25)) {
    if (unsafeClaimIds.has(claim.id)) continue;
    const ruleText = ruleFromClaim(claim.claim);
    if (!ruleText) continue;
    const verified = claim.status === "verified";
    rules.push({
      schemaVersion: "soturail.brain.rule.v1",
      id: makeRailId("rule", `${claim.id}:${ruleText}`),
      rule: ruleText,
      sourceClaimIds: [claim.id],
      enforcement: ruleEnforcementForClaim(claim),
      status: verified ? "active" : "draft",
      createdAt: now
    });
  }
  for (const decision of decisions.filter((item) => item.status === "active").slice(0, 10)) {
    rules.push({
      schemaVersion: "soturail.brain.rule.v1",
      id: makeRailId("rule", `${decision.id}:${decision.decision}`),
      rule: ruleFromDecision(decision),
      sourceClaimIds: [],
      sourceDecisionIds: [decision.id],
      enforcement: "advisory",
      status: "active",
      createdAt: now
    });
  }
  await appendRecordsIfNew(paths.brainRulesFile, rules);
  await fs.mkdir(paths.rulesDir, { recursive: true });
  const markdownPath = path.join(paths.rulesDir, "from-brain.md");
  const jsonPath = path.join(paths.rulesDir, "from-brain.json");
  await fs.writeFile(markdownPath, [
    "# Brain-Derived Rules",
    "",
    "These rules are derived from verified Project Brain claims and active decisions. Suspect or stale claims are excluded from active rules by default.",
    "",
    ...rules.map((rule) => `- [${rule.status}/${rule.enforcement}] ${rule.rule} (sources: ${[...rule.sourceClaimIds, ...(rule.sourceDecisionIds ?? [])].join(", ") || "none"})`),
    ""
  ].join("\n"), "utf8");
  await writeJson(jsonPath, { schemaVersion: "soturail.rules.from-brain.v1", createdAt: now, rules });
  return {
    rules,
    markdownPath,
    jsonPath,
    output: [
      "SotuRail rules from-brain",
      `rules_written: ${rules.length}`,
      `jsonl: ${relativeToRoot(root, paths.brainRulesFile)}`,
      `markdown: ${relativeToRoot(root, markdownPath)}`,
      `json: ${relativeToRoot(root, jsonPath)}`,
      "review_required: true"
    ].join("\n") + "\n"
  };
}

export async function readBrainCounts(root = process.cwd()): Promise<BrainCounts> {
  return brainCounts(root);
}

export async function brainExportExists(root = process.cwd()): Promise<boolean> {
  return exists(path.join(getWorkspacePaths(root).brainExportsDir, "agent-brief.md"));
}

async function scanClaims(root: string, now: string): Promise<BrainClaimRecord[]> {
  const commit = await currentCommit(root);
  const packageJson = await readPackageJson(root);
  const claims: BrainClaimRecord[] = [];
  const add = async (
    claim: string,
    kind: BrainClaimKind,
    sourcePath: string,
    tags: string[],
    validatedBy: string[] = []
  ): Promise<void> => {
    const evidence = await sourceEvidence(root, sourcePath, claim.split(/\s+/).slice(0, 4).join(" "));
    claims.push({
      schemaVersion: "soturail.brain.claim.v1",
      id: makeRailId("claim", `${kind}:${claim}:${sourcePath}`),
      claim,
      kind,
      status: evidence.exists ? "verified" : "unverified",
      confidence: evidence.exists ? "high" : "medium",
      sourcePath,
      sourceCommit: commit,
      sourceRange: evidence.sourceRange,
      fileHash: evidence.fileHash,
      rangeHash: evidence.rangeHash,
      validatedBy,
      relatedWorkflowIds: [],
      relatedEvidenceIds: [],
      tags,
      createdAt: now,
      updatedAt: now
    });
  };
  if (packageJson.name) await add(`Package name is ${packageJson.name}.`, "architecture", "package.json", ["package", "identity"]);
  if (packageJson.version) await add(`Package version is ${packageJson.version}.`, "release", "package.json", ["package", "version"], ["tests/soturail.test.ts"]);
  await add(`CLI version source is ${SOTURAIL_VERSION}.`, "release", "src/core/version.ts", ["cli", "version"], ["tests/soturail.test.ts"]);
  await add("Release notes live under docs/releases/.", "release", "src/core/release-preflight.ts", ["release", "docs"], ["tests/v070.test.ts"]);
  await add("SotuRail keeps native acceleration optional.", "architecture", "package.json", ["native", "optional"]);
  await add("No arbitrary shell execution is exposed through SotuRail MCP by default.", "security", "src/core/agent-runtime.ts", ["mcp", "security"], ["tests/v060.test.ts"]);
  await add("Workflow Rail stores local workflow evidence under .soturail/workflows/.", "workflow", "src/core/workflow-store.ts", ["workflow", "evidence"], ["tests/v070.test.ts"]);
  await add("Diagram Rail uses lightweight Mermaid validation and is not a full Mermaid parser.", "docs", "src/core/diagram-validator.ts", ["diagram", "validation"], ["tests/v070.test.ts"]);
  await add("Evaluation reports are written under .soturail/eval/.", "test", "src/core/evaluation-suite.ts", ["eval", "reports"], ["tests/v061.test.ts"]);
  for (const command of await detectCliCommands(root)) {
    await add(`CLI command '${command}' is registered.`, "command", "src/cli.ts", ["command", command]);
  }
  for (const capability of listAgentCapabilities()) {
    await add(`Agent host '${capability.id}' supports ${capability.promptOnlyFallback} prompt-only fallback.`, "agent", "src/core/agent-runtime.ts", ["agent", capability.id]);
  }
  return claims;
}

async function writeBrainIndex(root: string): Promise<void> {
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const decisions = await readJsonl<BrainDecisionRecord>(paths.brainDecisionsFile);
  const gaps = await readJsonl<BrainGapRecord>(paths.brainGapsFile);
  const rules = await readJsonl<BrainRuleRecord>(paths.brainRulesFile);
  const index: BrainIndexView = {
    schemaVersion: "soturail.brain.index.v1",
    updatedAt: new Date().toISOString(),
    claims: claims.map((claim) => ({ id: claim.id, kind: claim.kind, status: claim.status, sourcePath: claim.sourcePath, tags: claim.tags })),
    decisions: decisions.map((decision) => ({ id: decision.id, status: decision.status, sourcePath: decision.sourcePath, tags: decision.tags })),
    gaps: gaps.map((gap) => ({ id: gap.id, severity: gap.severity, status: gap.status, sourcePath: gap.sourcePath })),
    rules: rules.map((rule) => ({ id: rule.id, status: rule.status, sourceClaimIds: rule.sourceClaimIds }))
  };
  await writeJson(paths.brainIndexFile, index);
}

async function brainCounts(root: string): Promise<BrainCounts> {
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const gaps = await readJsonl<BrainGapRecord>(paths.brainGapsFile);
  const staleEvents = await readJsonl<BrainStaleEventRecord>(paths.brainStaleEventsFile);
  return {
    claims: claims.length,
    decisions: (await readJsonl<BrainDecisionRecord>(paths.brainDecisionsFile)).length,
    bugs: (await readJsonl<BrainBugRecord>(paths.brainBugsFile)).length,
    gaps: gaps.filter((gap) => gap.status === "open").length,
    rules: (await readJsonl<BrainRuleRecord>(paths.brainRulesFile)).length,
    staleEvents: staleEvents.length,
    suspectOrStale: claims.filter((claim) => claim.status === "suspect" || claim.status === "stale").length + staleEvents.filter((event) => event.status === "suspect" || event.status === "stale").length
  };
}

function defaultProfile(root: string, counts: BrainCounts, now: string): BrainProjectProfile {
  return {
    schemaVersion: "soturail.brain.project-profile.v1",
    projectName: path.basename(root),
    packageVersion: "unknown",
    cliVersion: SOTURAIL_VERSION,
    identity: "Local-first Context OS for AI coding agents.",
    mainLanguageRuntime: ["TypeScript", "Node >=20"],
    docsFolders: [],
    releaseNotesPath: "unknown",
    rails: [],
    commands: [],
    tests: [],
    workflowHarnessDiagramEval: {},
    agentHosts: [],
    knownReleaseProcess: [],
    counts,
    updatedAt: now
  };
}

function defaultArchitecture(root: string, now: string): BrainArchitectureView {
  return {
    schemaVersion: "soturail.brain.architecture.v1",
    storage: {
      jsonl: [
        ".soturail/brain/claims.jsonl",
        ".soturail/brain/decisions.jsonl",
        ".soturail/brain/bugs.jsonl",
        ".soturail/brain/gaps.jsonl",
        ".soturail/brain/rules.jsonl",
        ".soturail/brain/stale-events.jsonl"
      ],
      jsonViews: [
        ".soturail/brain/project-profile.json",
        ".soturail/brain/architecture.json",
        ".soturail/brain/brain-index.json",
        ".soturail/brain/freshness.json",
        ".soturail/brain/doctor.json",
        ".soturail/brain/consolidation-report.json",
        ".soturail/brain/stale-repair-plan.json"
      ],
      exports: [relativeToRoot(root, path.join(getWorkspacePaths(root).brainExportsDir, "agent-brief.md"))]
    },
    rails: [
      { name: "Memory", evidence: ".soturail/memory/" },
      { name: "Workflow", evidence: ".soturail/workflows/" },
      { name: "Harness", evidence: ".soturail/harness/" },
      { name: "Diagram", evidence: ".soturail/diagrams/ and docs/diagrams/" },
      { name: "Evaluation", evidence: ".soturail/eval/" }
    ],
    boundaries: ["no external LLM calls", "no embeddings required", "no cloud service", "agent-safe exports are reviewed Markdown/tagged context"],
    updatedAt: now
  };
}

async function sourceEvidence(root: string, relativePath: string, needle?: string, forcedRange?: SourceRange): Promise<{ exists: boolean; sourceRange: SourceRange; fileHash: string; rangeHash: string }> {
  const absolute = path.resolve(root, relativePath);
  const raw = await fs.readFile(absolute, "utf8").catch(() => "");
  if (!raw) return { exists: false, sourceRange: { startLine: 1, endLine: 1 }, fileHash: "sha256-missing", rangeHash: "sha256-missing" };
  const lines = raw.split(/\r?\n/);
  let startLine = forcedRange?.startLine ?? 1;
  let endLine = forcedRange?.endLine ?? Math.min(lines.length, 20);
  if (!forcedRange && needle) {
    const index = lines.findIndex((line) => line.toLowerCase().includes(needle.toLowerCase().split(/\s+/)[0] ?? needle.toLowerCase()));
    if (index >= 0) {
      startLine = index + 1;
      endLine = Math.min(lines.length, index + 3);
    }
  }
  const rangeText = lines.slice(Math.max(0, startLine - 1), endLine).join("\n");
  return {
    exists: true,
    sourceRange: { startLine, endLine },
    fileHash: `sha256-${sha256Text(raw)}`,
    rangeHash: `sha256-${sha256Text(rangeText)}`
  };
}

function staleEvent(
  recordId: string,
  reason: string,
  previousHash: string,
  currentHash: string,
  status: BrainStaleEventRecord["status"],
  metadata: Partial<Pick<BrainStaleEventRecord, "previousRange" | "candidateRange" | "similarity">> = {}
): BrainStaleEventRecord {
  return {
    schemaVersion: "soturail.brain.stale-event.v1",
    id: makeRailId("stale", `${recordId}:${reason}:${previousHash}:${currentHash}:${metadata.candidateRange?.startLine ?? ""}`),
    recordId,
    reason,
    previousHash,
    currentHash,
    status,
    ...metadata,
    createdAt: new Date().toISOString()
  };
}

async function relocateSourceRange(
  root: string,
  claim: BrainClaimRecord
): Promise<{ status: "relocated" | "candidate" | "missing"; range?: SourceRange; similarity: number; rangeHash: string }> {
  const absolute = path.resolve(root, claim.sourcePath);
  const raw = await fs.readFile(absolute, "utf8").catch(() => "");
  if (!raw) return { status: "missing", similarity: 0, rangeHash: "sha256-missing" };
  const lines = raw.split(/\r?\n/);
  const windowSize = Math.max(1, Math.min(12, claim.sourceRange.endLine - claim.sourceRange.startLine + 1));
  const queryTokens = tokenSet(`${claim.claim} ${claim.kind} ${claim.tags.join(" ")}`);
  const preferredStart = Math.max(0, claim.sourceRange.startLine - 1);
  let best: { range: SourceRange; similarity: number; text: string } | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const window = lines.slice(index, Math.min(lines.length, index + windowSize)).join("\n");
    const similarity = sourceSimilarity(queryTokens, window, claim.claim, index, preferredStart);
    if (!best || similarity > best.similarity) {
      best = { range: { startLine: index + 1, endLine: Math.min(lines.length, index + windowSize) }, similarity, text: window };
    }
  }

  if (!best) return { status: "missing", similarity: 0, rangeHash: "sha256-missing" };
  const rounded = Number(best.similarity.toFixed(3));
  if (rounded >= 0.62) {
    return { status: "relocated", range: best.range, similarity: rounded, rangeHash: `sha256-${sha256Text(best.text)}` };
  }
  if (rounded >= 0.35) {
    return { status: "candidate", range: best.range, similarity: rounded, rangeHash: `sha256-${sha256Text(best.text)}` };
  }
  return { status: "missing", similarity: rounded, rangeHash: `sha256-${sha256Text(best.text)}` };
}

function sourceSimilarity(queryTokens: Set<string>, window: string, claim: string, index: number, preferredStart: number): number {
  const windowTokens = tokenSet(window);
  if (windowTokens.size === 0) return 0;
  const overlap = [...queryTokens].filter((token) => windowTokens.has(token)).length;
  const union = new Set([...queryTokens, ...windowTokens]).size || 1;
  const jaccard = overlap / union;
  const claimWords = [...tokenSet(claim)].slice(0, 8);
  const phraseBoost = claimWords.length > 0 && claimWords.every((word) => windowTokens.has(word)) ? 0.28 : 0;
  const nearbyBoost = Math.abs(index - preferredStart) <= 8 ? 0.08 : 0;
  return Math.min(1, jaccard + phraseBoost + nearbyBoost);
}

function tokenSet(value: string): Set<string> {
  return new Set(value.toLowerCase().replace(/[^a-z0-9_./-]+/g, " ").split(/\s+/).filter((token) => token.length > 2));
}

async function writeRepairPlan(root: string, claims: BrainClaimRecord[], events: BrainStaleEventRecord[]): Promise<BrainRepairPlan> {
  const paths = getWorkspacePaths(root);
  const claimById = new Map(claims.map((claim) => [claim.id, claim]));
  const suggestions: BrainRepairSuggestion[] = events
    .filter((event) => event.status === "suspect" || event.status === "stale" || event.status === "relocated")
    .map((event) => {
      const claim = claimById.get(event.recordId);
      const sourcePath = claim?.sourcePath ?? "unknown";
      const text = claim?.claim ?? event.recordId;
      const relatedValidation = claim?.validatedBy ?? [];
      const affectedRange = event.previousRange ?? claim?.sourceRange;
      const action = event.status === "relocated"
        ? "Confirm the relocated range still proves the claim, then rescan/reverse-claim the source if the new range should become canonical."
        : event.status === "stale"
          ? "Restore or replace the missing source evidence, then rerun brain scan and stale checks."
          : "Inspect the source range and validation references before trusting or exporting this claim.";
      const suggestion: BrainRepairSuggestion = {
        recordId: event.recordId,
        type: "claim",
        text,
        reason: event.reason,
        sourcePath,
        recommendedCommand: sourcePath === "unknown" ? "soturail brain scan" : `soturail reverse claims ${sourcePath}`,
        recommendedHumanAction: action,
        relatedValidation
      };
      if (affectedRange) suggestion.affectedRange = affectedRange;
      if (event.candidateRange) suggestion.candidateRange = event.candidateRange;
      if (event.similarity !== undefined) suggestion.similarity = event.similarity;
      return suggestion;
    });
  const plan: BrainRepairPlan = {
    schemaVersion: "soturail.brain.repair-plan.v1",
    createdAt: new Date().toISOString(),
    suggestions
  };
  await writeJson(paths.brainRepairPlanJson, plan);
  await fs.writeFile(paths.brainRepairPlanMd, renderRepairPlan(root, plan), "utf8");
  return plan;
}

function renderRepairPlan(root: string, plan: BrainRepairPlan): string {
  return [
    "# SotuRail Brain Stale Repair Plan",
    "",
    "This plan is guidance only. SotuRail does not auto-edit code, docs or claims.",
    "",
    `createdAt: ${plan.createdAt}`,
    `suggestions: ${plan.suggestions.length}`,
    "",
    ...(plan.suggestions.length > 0 ? plan.suggestions.flatMap((item) => [
      `## ${item.recordId}`,
      "",
      `- type: ${item.type}`,
      `- reason: ${item.reason}`,
      `- source: ${item.sourcePath}`,
      `- affected_range: ${formatRange(item.affectedRange)}`,
      `- candidate_range: ${formatRange(item.candidateRange)}`,
      `- similarity: ${item.similarity ?? "n/a"}`,
      `- recommended_command: \`${item.recommendedCommand}\``,
      `- human_action: ${item.recommendedHumanAction}`,
      `- related_validation: ${item.relatedValidation.length > 0 ? item.relatedValidation.join(", ") : "none"}`,
      "",
      summarizeText(item.text, 240),
      ""
    ]) : [
      "No stale, suspect or relocated records need repair guidance.",
      ""
    ]),
    "## Safe Follow-up",
    "",
    "- Run `soturail brain stale --repair-plan` after source changes.",
    "- Run `soturail reverse claims ./src` after confirming source changes.",
    "- Run `soturail brain consolidate --dry-run` before deriving new rules.",
    "- Run `soturail eval run --suite brain` before release.",
    "",
    `json: ${relativeToRoot(root, getWorkspacePaths(root).brainRepairPlanJson)}`,
    ""
  ].join("\n");
}

function formatRange(range: SourceRange | undefined): string {
  return range ? `${range.startLine}-${range.endLine}` : "n/a";
}

function findDuplicateClaimGroups(claims: BrainClaimRecord[]): BrainConsolidationGroup[] {
  const groups: BrainConsolidationGroup[] = [];
  const consumed = new Set<string>();
  const candidates = claims.filter((claim) => claim.status !== "rejected");
  for (const claim of candidates) {
    if (consumed.has(claim.id)) continue;
    const matches = candidates.filter((candidate) => candidate.id !== claim.id && !consumed.has(candidate.id) && compatibleClaims(claim, candidate));
    if (matches.length === 0) continue;
    const members = [claim, ...matches].sort(compareCanonicalClaim);
    const canonical = members[0] ?? claim;
    for (const member of members) consumed.add(member.id);
    const duplicateMembers = members.filter((member) => member.id !== canonical.id);
    groups.push({
      canonicalId: canonical.id,
      duplicateIds: duplicateMembers.map((member) => member.id),
      reason: duplicateMembers.every((member) => normalizeClaimText(member.claim) === normalizeClaimText(canonical.claim))
        ? "normalized claim text match"
        : "near-duplicate claim text with compatible kind/source",
      score: Math.max(...duplicateMembers.map((member) => claimSimilarity(canonical, member))),
      claims: members.map((member) => ({
        id: member.id,
        status: member.status,
        confidence: member.confidence,
        sourcePath: member.sourcePath,
        claim: member.claim
      }))
    });
  }
  return groups.sort((left, right) => left.canonicalId.localeCompare(right.canonicalId));
}

function compatibleClaims(left: BrainClaimRecord, right: BrainClaimRecord): boolean {
  if (left.kind !== right.kind) return false;
  if (left.status === "rejected" || right.status === "rejected") return false;
  if (left.status === "stale" && right.status === "verified") return false;
  if (right.status === "stale" && left.status === "verified") return false;
  const normalizedLeft = normalizeClaimText(left.claim);
  const normalizedRight = normalizeClaimText(right.claim);
  if (normalizedLeft === normalizedRight) return true;
  if (left.sourcePath !== right.sourcePath && tagOverlap(left.tags, right.tags) === 0) return false;
  return claimSimilarity(left, right) >= 0.82;
}

function normalizeClaimText(value: string): string {
  return value.toLowerCase().replace(/[`"'.,:;!?()[\]{}]/g, " ").replace(/\s+/g, " ").trim();
}

function claimSimilarity(left: BrainClaimRecord, right: BrainClaimRecord): number {
  const leftTokens = tokenSet(left.claim);
  const rightTokens = tokenSet(right.claim);
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size || 1;
  const tagBonus = tagOverlap(left.tags, right.tags) > 0 ? 0.08 : 0;
  const sourceBonus = left.sourcePath === right.sourcePath ? 0.08 : 0;
  return Math.min(1, overlap / union + tagBonus + sourceBonus);
}

function tagOverlap(left: string[], right: string[]): number {
  const rightSet = new Set(right);
  return left.filter((tag) => rightSet.has(tag)).length;
}

function compareCanonicalClaim(left: BrainClaimRecord, right: BrainClaimRecord): number {
  return canonicalClaimScore(right) - canonicalClaimScore(left) || left.id.localeCompare(right.id);
}

function canonicalClaimScore(claim: BrainClaimRecord): number {
  const status = claim.status === "verified" ? 8 : claim.status === "unverified" ? 4 : claim.status === "suspect" ? 2 : 0;
  const confidence = claim.confidence === "high" ? 3 : claim.confidence === "medium" ? 1 : 0;
  const validation = claim.validatedBy.length > 0 ? 3 : 0;
  return status + confidence + validation;
}

function renderConsolidationReport(root: string, report: BrainConsolidationReport): string {
  return [
    "# SotuRail Brain Claim Consolidation Report",
    "",
    "This report preserves append-only history. It writes a consolidated view; it does not delete original claim records.",
    "",
    `createdAt: ${report.createdAt}`,
    `dry_run: ${report.dryRun}`,
    `claims_read: ${report.claimsRead}`,
    `duplicate_groups: ${report.duplicateGroups}`,
    `merged_claims: ${report.mergedClaims}`,
    `canonical_claims: ${report.canonicalClaims}`,
    "",
    ...(report.groups.length > 0 ? report.groups.flatMap((group) => [
      `## ${group.canonicalId}`,
      "",
      `- reason: ${group.reason}`,
      `- score: ${group.score.toFixed(3)}`,
      `- duplicates: ${group.duplicateIds.join(", ")}`,
      "",
      ...group.claims.map((claim) => `- ${claim.id} [${claim.status}/${claim.confidence}] ${claim.claim} (${claim.sourcePath})`),
      ""
    ]) : [
      "No duplicate claim groups found.",
      ""
    ]),
    `json: ${relativeToRoot(root, getWorkspacePaths(root).brainConsolidationReportJson)}`,
    ""
  ].join("\n");
}

type RecallRecord = {
  id: string;
  type: BrainRecordType;
  status: string;
  confidence?: BrainConfidence;
  sourcePath: string;
  tags: string[];
  claim?: string;
  decision?: string;
  title?: string;
  bug?: string;
  gap?: string;
  rule?: string;
  createdAt: string;
};

async function allRecallRecords(root: string): Promise<RecallRecord[]> {
  const paths = getWorkspacePaths(root);
  return [
    ...(await readJsonl<BrainClaimRecord>(paths.brainClaimsFile)).map((record): RecallRecord => ({ ...record, type: "claim" })),
    ...(await readJsonl<BrainDecisionRecord>(paths.brainDecisionsFile)).map((record): RecallRecord => ({ ...record, type: "decision", confidence: "medium" })),
    ...(await readJsonl<BrainBugRecord>(paths.brainBugsFile)).map((record): RecallRecord => ({ ...record, type: "bug", confidence: "medium" })),
    ...(await readJsonl<BrainGapRecord>(paths.brainGapsFile)).map((record): RecallRecord => ({ ...record, type: "gap", confidence: "low", tags: ["gap"], sourcePath: record.sourcePath })),
    ...(await readJsonl<BrainRuleRecord>(paths.brainRulesFile)).map((record): RecallRecord => ({ ...record, type: "rule", confidence: "medium", sourcePath: ".soturail/brain/rules.jsonl", tags: ["rule"] }))
  ];
}

function recallText(record: RecallRecord): string {
  return record.claim ?? record.decision ?? record.bug ?? record.gap ?? record.rule ?? record.title ?? record.id;
}

function statusScore(status: string): number {
  if (status === "verified" || status === "active" || status === "recurring") return 4;
  if (status === "unverified" || status === "open") return 2;
  if (status === "suspect") return 0;
  if (status === "stale") return -3;
  return 1;
}

function confidenceScore(confidence: BrainConfidence | undefined): number {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 1;
  return 0;
}

function renderBrainBrief(
  agent: BrainAgentTarget,
  profile: BrainProjectProfile,
  claims: BrainClaimRecord[],
  decisions: BrainDecisionRecord[],
  gaps: BrainGapRecord[],
  bugs: BrainBugRecord[],
  rules: BrainRuleRecord[],
  freshness: BrainFreshnessView | null,
  approvedMemory: MemoryRailRecord[],
  options: BrainExportOptions = {}
): string {
  const capability = getAgentCapability(agent);
  const limit = normalizeLimit(options.limit);
  const eventByRecord = new Map((freshness?.events ?? []).map((event) => [event.recordId, event]));
  const verifiedClaims = claims.filter((claim) => claim.status === "verified" && !hasUnsafeEvent(eventByRecord.get(claim.id))).slice(0, limit);
  const suspectClaims = claims.filter((claim) => claim.status === "suspect" || eventByRecord.get(claim.id)?.status === "suspect").slice(0, limit);
  const staleClaims = claims.filter((claim) => claim.status === "stale" || eventByRecord.get(claim.id)?.status === "stale").slice(0, limit);
  const verifiedRules = rules.filter((rule) => rule.status === "active" && rule.sourceClaimIds.every((id) => !hasUnsafeEvent(eventByRecord.get(id)))).slice(0, limit);
  const activeDecisions = decisions.filter((decision) => decision.status === "active").slice(0, limit);
  const openGaps = gaps.filter((gap) => gap.status === "open").slice(0, limit);
  const recurringBugs = bugs.slice(0, limit);
  const warnings = [
    ...(freshness?.events ?? []).filter((event) => event.status === "suspect" || event.status === "stale").slice(0, limit).map((event) => `- ${event.recordId}: ${event.reason} [${event.status}]`),
    ...(options.includeSuspect === true ? suspectClaims.map((claim) => `- ${claim.id}: ${claim.claim} [${claim.status}]`) : [])
  ];
  const incomplete = claims.length === 0 || profile.releaseNotesPath === "unknown";
  const hostNote = hostBrainBriefNote(agent);
  const lines = [
    `# SotuRail Project Brain Brief (${agent})`,
    "",
    "This brief is evidence-backed local context. Do not overclaim beyond the sources listed here.",
    hostNote,
    ...(incomplete ? ["", "Data completeness: incomplete brain data. Run `soturail brain scan` and `soturail brain stale --repair-plan`."] : []),
    "",
    "## Project Identity",
    "",
    `- project: ${profile.projectName}`,
    `- package_version: ${profile.packageVersion}`,
    `- cli_version: ${profile.cliVersion}`,
    `- identity: ${profile.identity}`,
    `- recommended_payloads: ${capability.recommendedPayloads.join(" + ")}`,
    "",
    "## Verified Rules",
    "",
    ...nonEmpty(verifiedRules.map((rule) => `- ${rule.rule} (${rule.id}, enforcement: ${rule.enforcement}, sources: ${[...rule.sourceClaimIds, ...(rule.sourceDecisionIds ?? [])].join(", ") || "none"})`), "- none yet"),
    "",
    "## Verified Claims",
    "",
    ...(verifiedClaims.length > 0 ? verifiedClaims.map((claim) => `- ${claim.claim} (${claim.id}, source: ${claim.sourcePath}:${claim.sourceRange.startLine})`) : ["- none yet"]),
    "",
    "## Active Rules",
    "",
    ...nonEmpty(verifiedRules.map((rule) => `- ${rule.rule} (sources: ${rule.sourceClaimIds.join(", ") || (rule.sourceDecisionIds ?? []).join(", ") || "none"})`), "- none yet"),
    "",
    "## Current Release Process",
    "",
    ...nonEmpty(profile.knownReleaseProcess.slice(0, limit).map((step) => `- ${step}`), "- no release process recorded yet"),
    "",
    "## Active Decisions",
    "",
    ...nonEmpty(activeDecisions.map((decision) => `- ${decision.title}: ${decision.decision} (source: ${decision.sourcePath})`), "- none yet"),
    "",
    "## Known Gaps",
    "",
    ...nonEmpty(openGaps.map((gap) => `- [${gap.severity}] ${gap.gap} (source: ${gap.sourcePath})`), "- none recorded"),
    "",
    "## Recurring Bugs / Harness Patterns",
    "",
    ...nonEmpty(recurringBugs.map((bug) => `- ${bug.bug} (source: ${bug.sourcePath})`), "- none recorded"),
    "",
    "## Suspect Claims",
    "",
    ...nonEmpty(suspectClaims.map((claim) => `- ${claim.claim} (${claim.id}, source: ${claim.sourcePath}:${claim.sourceRange.startLine})`), "- none from latest data"),
    "",
    "## Stale Claims",
    "",
    ...nonEmpty(staleClaims.map((claim) => `- ${claim.claim} (${claim.id}, source: ${claim.sourcePath}:${claim.sourceRange.startLine})`), "- none from latest data"),
    "",
    "## Safe Commands",
    "",
    "- soturail brain scan",
    "- soturail brain consolidate --dry-run",
    "- soturail brain stale --repair-plan",
    "- soturail brain doctor",
    "- soturail context budget --explain",
    "- soturail workflow verify",
    "- soturail eval run --suite brain",
    "- npm run release:check",
    "",
    "## Critical Commands",
    "",
    "- npm run typecheck",
    "- npm run build",
    "- npm test",
    "- npm run release:check",
    "",
    "## Release And Workflow Notes",
    "",
    `- release_notes_path: ${profile.releaseNotesPath}`,
    `- workflow: ${profile.workflowHarnessDiagramEval.workflow ?? "unknown"}`,
    `- harness: ${profile.workflowHarnessDiagramEval.harness ?? "unknown"}`,
    `- diagram: ${profile.workflowHarnessDiagramEval.diagram ?? "unknown"}`,
    `- eval: ${profile.workflowHarnessDiagramEval.eval ?? "unknown"}`,
    "",
    "## Recovery Pointers",
    "",
    "- Brain profile: `.soturail/brain/project-profile.json`",
    "- Brain freshness: `.soturail/brain/freshness.json`",
    "- Brain repair plan: `.soturail/brain/stale-repair-plan.md` when generated",
    "- Workflow evidence: `soturail workflow evidence <id>`",
    "- Raw logs: `soturail expand <raw_id>` with redaction by default",
    "",
    "## Approved Memory Summary",
    "",
    ...(approvedMemory.length > 0 ? approvedMemory.slice(0, Math.min(limit, 5)).map((memory) => `- ${memory.text} (${memory.source})`) : ["- no approved memory exported"]),
    "",
    "## Stale Or Suspect Warnings",
    "",
    ...(warnings.length > 0 ? warnings : ["- none from latest freshness check"]),
    "",
    "## Do Not Do",
    "",
    "- Do not treat stale or suspect claims as verified.",
    "- Do not expose private memory, secrets or raw logs in agent prompts.",
    "- Do not publish or create releases without release gates.",
    "- Do not assume Project Brain is a full static analyzer or LLM reviewer.",
    "",
    "## Source References",
    "",
    ...nonEmpty(verifiedClaims.map((claim) => `- ${claim.id}: ${claim.sourcePath}:${claim.sourceRange.startLine}`), "- none yet"),
    "",
    "## Safety Notes",
    "",
    "- Keep secrets local and redacted.",
    "- Raw logs need explicit recovery and review.",
    "- Brain claims are only as fresh as their source hashes.",
    "- Generated exports should be reviewed before agent handoff.",
    ""
  ];
  return lines.join("\n");
}

function normalizeLimit(limit: number | undefined): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) return 10;
  return Math.max(1, Math.min(50, Math.trunc(limit ?? 10)));
}

function hasUnsafeEvent(event: BrainStaleEventRecord | undefined): boolean {
  return event?.status === "suspect" || event?.status === "stale";
}

function hostBrainBriefNote(agent: BrainAgentTarget): string {
  if (agent === "claude") return "Host formatting: Markdown wrapped in XML-like tags for Claude Code prompt boundaries.";
  if (agent === "codex") return "Host formatting: AGENTS.md-friendly Markdown with source references and safe commands.";
  if (agent === "gemini") return "Host formatting: Markdown sections suitable for larger-context review.";
  if (agent === "cursor") return "Host formatting: short rules-friendly sections for project rules/context handoff.";
  return "Host formatting: clean Markdown for generic agents.";
}

function ruleFromClaim(claim: string): string | null {
  if (/release notes live under docs\/releases/i.test(claim)) return "Release notes must live under docs/releases/.";
  if (/release|publish|npm|version|tag/i.test(claim)) return `Verify release evidence for: ${claim.replace(/\.$/, "")}.`;
  if (/arbitrary shell|mcp/i.test(claim)) return "Do not expose arbitrary shell execution through MCP.";
  if (/native/i.test(claim)) return "Keep native acceleration optional.";
  if (/diagram|Mermaid/i.test(claim)) return "Do not treat diagram validation as a full Mermaid parser.";
  return `Preserve evidence for: ${claim.replace(/\.$/, "")}.`;
}

function ruleEnforcementForClaim(claim: BrainClaimRecord): BrainRuleRecord["enforcement"] {
  if (claim.status !== "verified") return "advisory";
  if (claim.validatedBy.length > 0) return "test-backed";
  if (claim.kind === "release" || claim.kind === "security" || claim.kind === "policy") return "policy-gate";
  return "manual-review";
}

function nonEmpty(values: string[], fallback: string): string[] {
  return values.length > 0 ? values : [fallback];
}

function ruleFromDecision(decision: BrainDecisionRecord): string {
  return `Follow active decision: ${decision.title}.`;
}

async function readPackageJson(root: string): Promise<{ name?: string; version?: string; engines?: Record<string, string> }> {
  const raw = await fs.readFile(path.join(root, "package.json"), "utf8").catch(() => "{}");
  try {
    const parsed = JSON.parse(raw) as { name?: string; version?: string; engines?: Record<string, string> };
    return parsed;
  } catch {
    return {};
  }
}

async function detectCliCommands(root: string): Promise<string[]> {
  const raw = await fs.readFile(path.join(root, "src", "cli.ts"), "utf8").catch(() => "");
  return [...raw.matchAll(/register([A-Z][A-Za-z]+)Command\(program\)/g)]
    .map((match) => (match[1] ?? "").replace(/[A-Z]/g, (letter, index) => `${index === 0 ? "" : "-"}${letter.toLowerCase()}`))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

async function detectRails(root: string): Promise<string[]> {
  const candidates = [
    ["memory", "src/commands/memory.ts"],
    ["context", "src/commands/context.ts"],
    ["workflow", "src/commands/workflow.ts"],
    ["harness", "src/commands/harness.ts"],
    ["diagram", "src/commands/diagram.ts"],
    ["evaluation", "src/commands/eval.ts"],
    ["agents", "src/commands/agents.ts"],
    ["rules", "src/commands/rules.ts"],
    ["brain", "src/commands/brain.ts"],
    ["reverse", "src/commands/reverse.ts"]
  ] as const;
  const present: string[] = [];
  for (const [name, file] of candidates) {
    if (await exists(path.join(root, file))) present.push(name);
  }
  return present;
}

async function listDocsFolders(root: string): Promise<string[]> {
  const docsRoot = path.join(root, "docs");
  const entries = await fs.readdir(docsRoot, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join("docs", entry.name).replace(/\\/g, "/")).sort();
}

async function listRelativeFiles(dir: string, root: string, predicate: (file: string) => boolean): Promise<string[]> {
  const output: string[] = [];
  async function visit(current: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!["node_modules", ".git", "dist", ".soturail"].includes(entry.name)) await visit(absolute);
        continue;
      }
      if (entry.isFile() && predicate(absolute)) output.push(relativeToRoot(root, absolute).replace(/\\/g, "/"));
    }
  }
  await visit(dir);
  return output.sort((a, b) => a.localeCompare(b));
}

async function currentCommit(root: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, timeout: 3000, windowsHide: true });
    return stdout.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

async function appendRecordsIfNew<T extends { id: string }>(filePath: string, records: T[]): Promise<number> {
  const existing = new Set((await readJsonl<T>(filePath)).map((record) => record.id));
  let added = 0;
  for (const record of records) {
    if (existing.has(record.id)) continue;
    await appendJsonl(filePath, record);
    existing.add(record.id);
    added += 1;
  }
  return added;
}

async function ensureProfile(root: string): Promise<void> {
  const paths = getWorkspacePaths(root);
  if (!(await exists(paths.brainProjectProfileFile))) await scanBrain(root);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function validJsonl(filePath: string): Promise<boolean> {
  try {
    await readJsonl<unknown>(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeFileIfMissing(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  if (!(await exists(filePath))) await fs.writeFile(filePath, content, "utf8");
}

async function writeJsonIfMissing(filePath: string, value: unknown): Promise<void> {
  if (!(await exists(filePath))) await writeJson(filePath, value);
}

async function exists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}
