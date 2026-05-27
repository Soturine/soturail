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
  status: "suspect" | "stale" | "resolved";
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
  findings: string[];
  nextCommands: string[];
}

export type BrainAgentTarget = Extract<AgentId, "claude" | "codex" | "gemini" | "cursor" | "generic">;

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
    paths.brainFreshnessFile
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
    "- soturail brain stale",
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

export async function staleBrain(root = process.cwd()): Promise<{ freshness: BrainFreshnessView; output: string }> {
  await initBrain(root);
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const existingEvents = await readJsonl<BrainStaleEventRecord>(paths.brainStaleEventsFile);
  const warnings: string[] = [];
  const events: BrainStaleEventRecord[] = [];
  for (const claim of claims) {
    const absolute = path.resolve(root, claim.sourcePath);
    if (!(await exists(absolute))) {
      events.push(staleEvent(claim.id, "source file missing", claim.rangeHash, "missing", "stale"));
      continue;
    }
    const evidence = await sourceEvidence(root, claim.sourcePath, undefined, claim.sourceRange);
    if (claim.rangeHash !== evidence.rangeHash) {
      events.push(staleEvent(claim.id, "rangeHash changed", claim.rangeHash, evidence.rangeHash, "suspect"));
    } else if (claim.fileHash !== evidence.fileHash) {
      warnings.push(`${claim.id}: fileHash changed but rangeHash is unchanged`);
    }
    for (const validationPath of claim.validatedBy) {
      if (!(await exists(path.resolve(root, validationPath)))) {
        events.push(staleEvent(claim.id, `validatedBy missing: ${validationPath}`, claim.rangeHash, "missing-validation", "suspect"));
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
  return {
    freshness,
    output: [
      "SotuRail brain stale",
      `checked_records: ${freshness.checkedRecords}`,
      `new_events: ${newEvents.length}`,
      `suspect: ${freshness.suspect}`,
      `stale: ${freshness.stale}`,
      `warnings: ${freshness.warnings.length}`,
      `freshness: ${relativeToRoot(root, paths.brainFreshnessFile)}`,
      "",
      ...(newEvents.length > 0 ? newEvents.map((event) => `- ${event.recordId}: ${event.reason} [${event.status}]`) : ["No stale evidence drift detected."])
    ].join("\n") + "\n"
  };
}

export async function brainDoctor(root = process.cwd()): Promise<{ report: BrainDoctorReport; output: string }> {
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
  const findings = [
    ...(claims.some((claim) => !claim.sourcePath) ? ["Some claims are missing source paths."] : []),
    ...(claims.some((claim) => claim.status === "verified" && claim.validatedBy.length === 0) ? ["Some verified claims have no validation references."] : []),
    ...(counts.gaps > 0 ? [`Open gaps recorded: ${counts.gaps}`] : []),
    ...(counts.suspectOrStale > 0 ? [`Suspect or stale records/events: ${counts.suspectOrStale}`] : []),
    ...(await exists(path.join(paths.brainExportsDir, "agent-brief.md")) ? [] : ["Agent brief export is missing."])
  ];
  const report: BrainDoctorReport = {
    schemaVersion: "soturail.brain.doctor.v1",
    ok: files.every((file) => file.present && file.validJsonl !== false),
    createdAt: new Date().toISOString(),
    files,
    counts,
    findings,
    nextCommands: ["soturail brain scan", "soturail brain stale", "soturail brain export --agent generic", "soturail rules from-brain"]
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
      `doctor_json: ${relativeToRoot(root, paths.brainDoctorFile)}`,
      "",
      "Files:",
      ...files.map((file) => `- ${file.path}: ${file.present ? "present" : "missing"}${file.validJsonl === undefined ? "" : `, jsonl_valid=${file.validJsonl}`}`),
      "",
      "Findings:",
      ...(findings.length > 0 ? findings.map((finding) => `- ${finding}`) : ["- none"]),
      "",
      "Next commands:",
      ...report.nextCommands.map((command) => `- ${command}`)
    ].join("\n") + "\n"
  };
}

export async function exportBrain(agent: BrainAgentTarget, root = process.cwd()): Promise<{ path: string; content: string; output: string }> {
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
  const base = renderBrainBrief(agent, profile, claims, decisions, gaps, bugs, rules, freshness, approvedMemory);
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
      ...(agent === "generic" ? [`generic_alias: ${relativeToRoot(root, path.join(paths.brainExportsDir, "agent-brief.md"))}`] : []),
      "review_required: true"
    ].join("\n") + "\n"
  };
}

export async function rulesFromBrain(root = process.cwd()): Promise<{ rules: BrainRuleRecord[]; markdownPath: string; output: string }> {
  await ensureProfile(root);
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const decisions = await readJsonl<BrainDecisionRecord>(paths.brainDecisionsFile);
  const now = new Date().toISOString();
  const rules: BrainRuleRecord[] = [];
  for (const claim of claims.filter((item) => item.status === "verified").slice(0, 25)) {
    const ruleText = ruleFromClaim(claim.claim);
    if (!ruleText) continue;
    rules.push({
      schemaVersion: "soturail.brain.rule.v1",
      id: makeRailId("rule", `${claim.id}:${ruleText}`),
      rule: ruleText,
      sourceClaimIds: [claim.id],
      enforcement: claim.kind === "release" || claim.kind === "security" || claim.kind === "policy" ? "manual-review" : "advisory",
      status: "active",
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
  await fs.writeFile(markdownPath, [
    "# Brain-Derived Rules",
    "",
    "These rules are derived from verified Project Brain claims and active decisions. Review before using as policy gates.",
    "",
    ...rules.map((rule) => `- ${rule.rule} (sources: ${[...rule.sourceClaimIds, ...(rule.sourceDecisionIds ?? [])].join(", ") || "none"})`),
    ""
  ].join("\n"), "utf8");
  return {
    rules,
    markdownPath,
    output: [
      "SotuRail rules from-brain",
      `rules_written: ${rules.length}`,
      `jsonl: ${relativeToRoot(root, paths.brainRulesFile)}`,
      `markdown: ${relativeToRoot(root, markdownPath)}`,
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
    suspectOrStale: claims.filter((claim) => claim.status === "suspect" || claim.status === "stale").length + staleEvents.filter((event) => event.status !== "resolved").length
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
        ".soturail/brain/doctor.json"
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

function staleEvent(recordId: string, reason: string, previousHash: string, currentHash: string, status: "suspect" | "stale"): BrainStaleEventRecord {
  return {
    schemaVersion: "soturail.brain.stale-event.v1",
    id: makeRailId("stale", `${recordId}:${reason}:${previousHash}:${currentHash}`),
    recordId,
    reason,
    previousHash,
    currentHash,
    status,
    createdAt: new Date().toISOString()
  };
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
  approvedMemory: MemoryRailRecord[]
): string {
  const capability = getAgentCapability(agent);
  const verifiedClaims = claims.filter((claim) => claim.status === "verified").slice(0, 12);
  return [
    `# SotuRail Project Brain Brief (${agent})`,
    "",
    "This brief is evidence-backed local context. Do not overclaim beyond the sources listed here.",
    "",
    "## Project Identity",
    "",
    `- project: ${profile.projectName}`,
    `- package_version: ${profile.packageVersion}`,
    `- cli_version: ${profile.cliVersion}`,
    `- identity: ${profile.identity}`,
    `- recommended_payloads: ${capability.recommendedPayloads.join(" + ")}`,
    "",
    "## Verified Claims",
    "",
    ...(verifiedClaims.length > 0 ? verifiedClaims.map((claim) => `- ${claim.claim} (${claim.id}, source: ${claim.sourcePath}:${claim.sourceRange.startLine})`) : ["- none yet"]),
    "",
    "## Active Rules",
    "",
    ...nonEmpty(rules.filter((rule) => rule.status === "active").slice(0, 12).map((rule) => `- ${rule.rule} (sources: ${rule.sourceClaimIds.join(", ") || (rule.sourceDecisionIds ?? []).join(", ") || "none"})`), "- none yet"),
    "",
    "## Active Decisions",
    "",
    ...nonEmpty(decisions.filter((decision) => decision.status === "active").slice(0, 8).map((decision) => `- ${decision.title}: ${decision.decision} (source: ${decision.sourcePath})`), "- none yet"),
    "",
    "## Known Gaps",
    "",
    ...nonEmpty(gaps.filter((gap) => gap.status === "open").slice(0, 8).map((gap) => `- [${gap.severity}] ${gap.gap} (source: ${gap.sourcePath})`), "- none recorded"),
    "",
    "## Recurring Bugs And Harness Notes",
    "",
    ...nonEmpty(bugs.slice(0, 8).map((bug) => `- ${bug.bug} (source: ${bug.sourcePath})`), "- none recorded"),
    "",
    "## Safe Commands",
    "",
    "- soturail brain doctor",
    "- soturail context budget --explain",
    "- soturail workflow verify",
    "- soturail eval run --suite brain",
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
    "## Approved Memory Summary",
    "",
    ...(approvedMemory.length > 0 ? approvedMemory.slice(0, 5).map((memory) => `- ${memory.text} (${memory.source})`) : ["- no approved memory exported"]),
    "",
    "## Stale Or Suspect Warnings",
    "",
    ...(freshness && (freshness.suspect > 0 || freshness.stale > 0) ? freshness.events.slice(0, 8).map((event) => `- ${event.recordId}: ${event.reason} [${event.status}]`) : ["- none from latest freshness check"]),
    "",
    "## Safety Notes",
    "",
    "- Keep secrets local and redacted.",
    "- Raw logs need explicit recovery and review.",
    "- Brain claims are only as fresh as their source hashes.",
    "- Generated exports should be reviewed before agent handoff.",
    ""
  ].join("\n");
}

function ruleFromClaim(claim: string): string | null {
  if (/release notes live under docs\/releases/i.test(claim)) return "Release notes must live under docs/releases/.";
  if (/release|publish|npm|version|tag/i.test(claim)) return `Verify release evidence for: ${claim.replace(/\.$/, "")}.`;
  if (/arbitrary shell|mcp/i.test(claim)) return "Do not expose arbitrary shell execution through MCP.";
  if (/native/i.test(claim)) return "Keep native acceleration optional.";
  if (/diagram|Mermaid/i.test(claim)) return "Do not treat diagram validation as a full Mermaid parser.";
  return `Preserve evidence for: ${claim.replace(/\.$/, "")}.`;
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
