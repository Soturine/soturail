import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { compressOutputWithEngine } from "../compressors/index.js";
import { lintAgentDocs } from "./agent-docs-hygiene.js";
import { appendJsonl, ensureWorkspace, getWorkspacePaths, readJsonl, writeJson } from "./config.js";
import { buildRolePack, offloadContext, restoreOffload, routeContext, selectContext } from "./context-intelligence.js";
import { validateMermaidDiagram } from "./diagram-validator.js";
import { buildWorkflowEvidence } from "./evidence-pack.js";
import { createFsSnapshot, planEdit } from "./fs-evidence.js";
import { compareFormats } from "./format-compare.js";
import { initHarnessContract, checkHarnessContract, noteHarnessFailure } from "./harness-rail.js";
import { validateJsonFile } from "./json-validator.js";
import { rememberMemory, recallMemory } from "./memory-rail.js";
import { decidePolicyItem, queuePolicyItem } from "./policy-rail.js";
import { brainDoctor, consolidateBrain, exportBrain, initBrain, recallBrain, rulesFromBrain, scanBrain, staleBrain } from "./project-brain.js";
import { makeRailId, summarizeText } from "./rail-utils.js";
import { reverseClaims, reverseExport, reverseGaps, reverseScan, reverseSpecs } from "./reverse-specification.js";
import { estimateTokens } from "./token-estimator.js";
import { createWorkflow } from "./workflow-store.js";

export type EvalResult = "pass" | "fail" | "warn";

export interface EvaluationCase {
  id: string;
  group: string;
  title: string;
  result: EvalResult;
  details: Record<string, unknown>;
  evidence: string[];
}

export interface EvaluationRun {
  schemaVersion: "soturail.eval.v1";
  id: string;
  createdAt: string;
  suite: EvaluationSuiteName;
  cases: EvaluationCase[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
  reports: {
    json: string;
    markdown: string;
  };
}

export type EvaluationSuiteName = "v0.6.1" | "brain";

export interface EvaluationOptions {
  suite?: EvaluationSuiteName;
}

const caseList = [
  ["memory-recall-quality", "memory", "Memory recall ranks exact project facts above unrelated memory."],
  ["context-selection-quality", "context", "Context selection preserves expected file, command, error and rule."],
  ["reducer-quality", "reducers", "Reducers preserve critical diagnostics across common tool outputs."],
  ["context-router-quality", "context", "Context router selects expected deterministic expert routes."],
  ["role-pack-quality", "context", "Role packs include expected scope and omit unrelated risky context."],
  ["agent-doc-hygiene-quality", "agents", "Short root agent docs pass and oversized docs warn."],
  ["offload-restore-quality", "context", "Offload and restore preserve recovery pointer and failure line."],
  ["format-quality", "payload", "Format comparison preserves evidence and warns about risky payloads."],
  ["strict-json-quality", "payload", "Strict JSON validation catches duplicates, secrets, huge arrays and invalid JSON."],
  ["evidence-pack-completeness", "evidence", "Evidence packs include workflow, raw, policy, harness and filesystem sections."],
  ["harness-scenario-quality", "harness", "Repeated harness failures become concrete prevention candidates."],
  ["diagram-validation-quality", "diagram", "Diagram validation catches invalid syntax and workflow warnings."]
] as const;

const brainCaseList = [
  ["brain-claim-quality", "brain", "Verified claims include source paths, hashes and validation status."],
  ["brain-stale-doc-detection", "brain", "Stale detection records source drift for changed evidence."],
  ["brain-rule-extraction", "rules", "Brain-derived rules link back to claims or decisions."],
  ["brain-agent-brief-quality", "agents", "Brain export includes rules, gaps, safe commands and source references."],
  ["reverse-spec-coverage", "reverse", "Reverse specs include source claims and acceptance criteria."],
  ["gap-detection-quality", "reverse", "Reverse gaps are explicit and source-linked."],
  ["decision-trace-quality", "brain", "Brain recall explains match reason, status, confidence and source."],
  ["brain-claim-deduplication", "brain", "Claim consolidation groups duplicates without deleting history."],
  ["brain-stale-repair-guidance", "brain", "Stale checks can write safe repair guidance."],
  ["brain-agent-brief-safety", "agents", "Agent briefs keep stale claims out of verified sections."],
  ["brain-source-range-relocation", "brain", "Moved source ranges are reported as relocation candidates."],
  ["brain-rules-link-integrity", "rules", "Brain-derived rules keep source links and avoid stale active rules."],
  ["brain-doctor-actionability", "brain", "Brain doctor reports actionable next commands."],
  ["brain-export-section-limits", "agents", "Brain exports stay bounded by section limits."]
] as const;

export function listEvaluationCases(options: EvaluationOptions = {}): string {
  const suite = options.suite ?? "v0.6.1";
  const cases = suite === "brain" ? brainCaseList : caseList;
  return [
    "SotuRail evaluation cases",
    `suite: ${suite}`,
    `cases_count: ${cases.length}`,
    "",
    ...cases.map(([id, group, title]) => `- ${id} [${group}] ${title}`)
  ].join("\n") + "\n";
}

export async function runEvaluationSuite(root = process.cwd(), options: EvaluationOptions = {}): Promise<EvaluationRun> {
  await ensureWorkspace(root);
  const suite = options.suite ?? "v0.6.1";
  const evalRoot = await createEvalProject();
  const cases: EvaluationCase[] = [];
  const casesToRun = suite === "brain" ? brainCaseList : caseList;
  for (const [id, group, title] of casesToRun) {
    cases.push(await runCase(id, group, title, evalRoot, suite));
  }
  const run: EvaluationRun = {
    schemaVersion: "soturail.eval.v1",
    id: makeRailId("eval", suite),
    createdAt: new Date().toISOString(),
    suite,
    cases,
    summary: {
      passed: cases.filter((item) => item.result === "pass").length,
      failed: cases.filter((item) => item.result === "fail").length,
      warnings: cases.filter((item) => item.result === "warn").length
    },
    reports: {
      json: "",
      markdown: ""
    }
  };
  await writeEvaluationReports(run, root);
  return run;
}

export async function readEvaluationReport(root = process.cwd()): Promise<string> {
  const reportPath = path.join(evalDir(root), "latest.md");
  return fs.readFile(reportPath, "utf8").catch(() => "No evaluation report found. Run: soturail eval run\n");
}

async function runCase(id: string, group: string, title: string, root: string, suite: EvaluationSuiteName): Promise<EvaluationCase> {
  try {
    if (suite === "brain") return runBrainCase(id, group, title, root);
    switch (id) {
      case "memory-recall-quality":
        return await memoryRecallCase(id, group, title, root);
      case "context-selection-quality":
        return await contextSelectionCase(id, group, title, root);
      case "reducer-quality":
        return await reducerCase(id, group, title, root);
      case "context-router-quality":
        return routerCase(id, group, title);
      case "role-pack-quality":
        return await rolePackCase(id, group, title, root);
      case "agent-doc-hygiene-quality":
        return await agentDocCase(id, group, title, root);
      case "offload-restore-quality":
        return await offloadCase(id, group, title, root);
      case "format-quality":
        return await formatCase(id, group, title, root);
      case "strict-json-quality":
        return await strictJsonCase(id, group, title, root);
      case "evidence-pack-completeness":
        return await evidenceCase(id, group, title, root);
      case "harness-scenario-quality":
        return await harnessCase(id, group, title, root);
      case "diagram-validation-quality":
        return diagramCase(id, group, title);
      default:
        return makeCase(id, group, title, "warn", { reason: "case not implemented" }, []);
    }
  } catch (error) {
    return makeCase(id, group, title, "fail", { error: error instanceof Error ? error.message : String(error) }, []);
  }
}

async function runBrainCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  try {
    switch (id) {
      case "brain-claim-quality":
        return await brainClaimQualityCase(id, group, title, root);
      case "brain-stale-doc-detection":
        return await brainStaleCase(id, group, title, root);
      case "brain-rule-extraction":
        return await brainRuleCase(id, group, title, root);
      case "brain-agent-brief-quality":
        return await brainBriefCase(id, group, title, root);
      case "reverse-spec-coverage":
        return await reverseSpecCase(id, group, title, root);
      case "gap-detection-quality":
        return await reverseGapCase(id, group, title, root);
      case "decision-trace-quality":
        return await brainRecallCase(id, group, title, root);
      case "brain-claim-deduplication":
        return await brainDedupCase(id, group, title, root);
      case "brain-stale-repair-guidance":
        return await brainRepairCase(id, group, title, root);
      case "brain-agent-brief-safety":
        return await brainBriefSafetyCase(id, group, title, root);
      case "brain-source-range-relocation":
        return await brainRelocationCase(id, group, title, root);
      case "brain-rules-link-integrity":
        return await brainRuleIntegrityCase(id, group, title, root);
      case "brain-doctor-actionability":
        return await brainDoctorActionabilityCase(id, group, title, root);
      case "brain-export-section-limits":
        return await brainExportLimitCase(id, group, title, root);
      default:
        return makeCase(id, group, title, "warn", { reason: "brain case not implemented" }, []);
    }
  } catch (error) {
    return makeCase(id, group, title, "fail", { error: error instanceof Error ? error.message : String(error) }, []);
  }
}

async function memoryRecallCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await rememberMemory("Architecture decision: keep MCP read-only by default and use local context packs.", { tags: ["architecture"], source: "eval" }, root);
  await rememberMemory("Recurring bug: Windows npm cache can make stale global CLI checks misleading.", { tags: ["bug"], source: "eval" }, root);
  await rememberMemory("Release decision: npm publish must succeed before GitHub Release creation.", { tags: ["release"], source: "eval" }, root);
  await rememberMemory("Policy decision: raw log expansion requires review and redaction.", { tags: ["policy"], source: "eval" }, root);
  await rememberMemory("Unrelated note: coffee preference should not affect release policy.", { tags: ["misc"], source: "eval" }, root);
  const matches = await recallMemory("Architecture decision MCP read-only local context packs", 3, root);
  const top = matches[0]?.record.text ?? "";
  return makeCase(id, group, title, top.includes("Architecture decision") ? "pass" : "fail", {
    topMatch: top,
    matches: matches.map((match) => ({ id: match.record.id, score: match.score, reason: match.reason }))
  }, ["memoryRecordsFile"]);
}

async function contextSelectionCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  const selection = await selectContext("validateRefund ERR_REFUND_WINDOW npm test Rule R08", 5, root);
  const item = selection.items.find((candidate) => candidate.path === "src/refund-policy.ts");
  const summary = item?.summary ?? "";
  const ok = Boolean(item && summary.includes("ERR_REFUND_WINDOW") && summary.includes("npm test") && summary.includes("Rule R08"));
  return makeCase(id, group, title, ok ? "pass" : "fail", {
    expert: selection.expert,
    selected: selection.items.map((candidate) => candidate.path ?? candidate.id),
    expectedFile: "src/refund-policy.ts",
    summary
  }, [`.soturail/context/selections/${selection.id}.json`]);
}

async function reducerCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  const samples = [
    ["npm", "npm test", "npm ERR! Test failed at tests/app.test.ts:12\nRun npm test for details.", "tests/app.test.ts"],
    ["vitest", "vitest run", "FAIL tests/app.test.ts > app\nAssertionError: expected 1 to equal 2\n    at tests/app.test.ts:12:10", "AssertionError"],
    ["tsc", "tsc --noEmit", "src/app.ts:12:7 - error TS2322: Type 'string' is not assignable to type 'number'.", "TS2322"],
    ["java", "java Main", "Exception in thread main java.lang.NullPointerException\n\tat com.example.Main.main(Main.java:12)", "NullPointerException"],
    ["maven", "mvn test", "[ERROR] UserServiceTest.shouldSaveUser <<< FAILURE!\n    at src/test/java/UserServiceTest.java:27", "UserServiceTest.java:27"],
    ["docker", "docker logs app", "2026-05-26 ERROR connection refused while opening /app/config.yml", "connection refused"],
    ["git-diff", "git diff", "diff --git a/src/app.ts b/src/app.ts\n@@ -1 +1 @@\n-return 1\n+return 2", "src/app.ts"],
    ["git-status", "git status", "modified: src/app.ts\ndeleted: src/old.ts\nuntracked: docs/new.md", "src/app.ts"],
    ["eslint", "npx eslint src", "src/app.ts\n  12:7 error 'unused' is never used @typescript-eslint/no-unused-vars", "@typescript-eslint/no-unused-vars"],
    ["vite-next", "vite build", "vite v5 building...\nwarn Large page data detected in app/dashboard/page.tsx\nbuilt in 1.24s", "app/dashboard/page.tsx"]
  ] as const;
  const results = [];
  for (const [name, command, output, expected] of samples) {
    const reduced = await compressOutputWithEngine(command, output, `eval-${name}`, "ts", root);
    results.push({ name, expected, passed: reduced.summary.includes(expected), tokens: estimateTokens(reduced.summary) });
  }
  return makeCase(id, group, title, results.every((item) => item.passed) ? "pass" : "fail", { reducers: results }, ["raw reducer summaries"]);
}

function routerCase(id: string, group: string, title: string): EvaluationCase {
  const expectations = [
    ["security policy", "security"],
    ["release notes npm publish", "release"],
    ["README docs tutorial", "docs"],
    ["failing test source file", "code"],
    ["workflow evidence", "workflow"],
    ["remembered decision", "memory"],
    ["compare ecosystem docs", "research"]
  ] as const;
  const results = expectations.map(([query, expected]) => ({ query, expected, actual: routeContext(query).expert }));
  return makeCase(id, group, title, results.every((item) => item.actual === item.expected) ? "pass" : "fail", { routes: results }, []);
}

async function rolePackCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  const roles = ["planner", "executor", "reviewer", "release-manager", "researcher"] as const;
  const results = [];
  for (const role of roles) {
    const pack = await buildRolePack(role, root);
    results.push({
      role,
      hasPurpose: pack.content.includes("## Purpose"),
      hasOmissions: pack.content.includes("## Omitted Sources"),
      avoidsSecrets: !/real token|private key/i.test(pack.content)
    });
  }
  return makeCase(id, group, title, results.every((item) => item.hasPurpose && item.hasOmissions && item.avoidsSecrets) ? "pass" : "fail", { roles: results }, [".soturail/context/role-packs/"]);
}

async function agentDocCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await fs.writeFile(path.join(root, "AGENTS.md"), "# Agent Notes\n\nSotuRail is a local-first Context OS.\n\nSafety: do not expose secrets or raw logs without approval.\n", "utf8");
  const short = await lintAgentDocs(root);
  await fs.writeFile(path.join(root, "CLAUDE.md"), `${"# Oversized\n\n"}${"Missing safety text.\n".repeat(700)}`, "utf8");
  const oversized = await lintAgentDocs(root);
  return makeCase(id, group, title, short.includes("findings_count: 0") && /CLAUDE\.md: too long/.test(oversized) ? "pass" : "fail", {
    shortFindings: short.match(/findings_count: \d+/)?.[0],
    oversizedIncludesWarning: /too long/.test(oversized)
  }, ["AGENTS.md", "CLAUDE.md"]);
}

async function offloadCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  const file = path.join(root, "logs", "failure.log");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, "ERROR critical failure line: PaymentTimeout at src/payments.ts:44\nfull details preserved locally\n", "utf8");
  const record = await offloadContext("logs/failure.log", root);
  const restored = await restoreOffload(record.id, root);
  return makeCase(id, group, title, record.summary.includes("PaymentTimeout") && restored.includes("PaymentTimeout") ? "pass" : "fail", {
    offloadId: record.id,
    recovery: `soturail context restore ${record.id}`,
    source: record.source
  }, [record.path]);
}

async function formatCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  const file = path.join(root, "payload.json");
  await fs.writeFile(file, JSON.stringify({ evidence: "ERR_REFUND_WINDOW", command: "npm test", items: Array.from({ length: 55 }, (_, index) => ({ index })) }, null, 2), "utf8");
  const report = await compareFormats("payload.json", root);
  return makeCase(id, group, title, report.markdownTokens > 0 && report.taggedTokens > 0 && report.warnings.some((warning) => warning.includes("huge array")) ? "pass" : "fail", {
    markdownTokens: report.markdownTokens,
    jsonTokens: report.jsonTokens,
    taggedTokens: report.taggedTokens,
    warnings: report.warnings
  }, ["payload.json"]);
}

async function strictJsonCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await fs.writeFile(path.join(root, "invalid.json"), "{\"ok\": true,}\n", "utf8");
  await fs.writeFile(path.join(root, "risky.json"), `{"name":"one","name":"two","apiKey":"replace-me","items":[${Array.from({ length: 55 }, (_, index) => index).join(",")}]}\n`, "utf8");
  const invalid = await validateJsonFile("invalid.json", { strict: true }, root);
  const risky = await validateJsonFile("risky.json", { strict: true }, root);
  const ok = invalid.result === "fail" && risky.duplicateKeys.length > 0 && risky.probableSecrets.length > 0 && risky.hugeArrays.length > 0;
  return makeCase(id, group, title, ok ? "pass" : "fail", { invalid, risky }, ["invalid.json", "risky.json"]);
}

async function evidenceCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  const workflow = await createWorkflow("Evaluation evidence workflow", root);
  await initHarnessContract(root);
  const contract = await checkHarnessContract(root);
  await noteHarnessFailure("Agent skipped release evidence before claiming done.", { workflow: workflow.id, prevention: "workflow check" }, root);
  const policy = await queuePolicyItem("npm publish", "npm publish --access public", "publish changes public package state", workflow.id, root);
  await decidePolicyItem(policy.id, "approved", root);
  await appendJsonl(getWorkspacePaths(root).rawIndex, {
    raw_id: "eval_raw_001",
    path: ".soturail/raw/eval.log",
    command: "npm test",
    exit_code: 0,
    created_at: new Date().toISOString(),
    compressor: "eval",
    raw_tokens_estimated: 10,
    compressed_tokens_estimated: 5
  });
  await createFsSnapshot(root);
  await planEdit("Change src/refund-policy.ts for evidence fixture", root);
  const evidence = await buildWorkflowEvidence(workflow.id, root);
  const ok = [
    workflow.id,
    "eval_raw_001",
    "approved npm publish",
    "Harness Failures",
    "Filesystem Evidence",
    "Harness Contract"
  ].every((needle) => evidence.content.includes(needle)) && contract.includes("valid: true");
  return makeCase(id, group, title, ok ? "pass" : "fail", {
    workflowId: workflow.id,
    evidencePath: evidence.path,
    contractValid: contract.includes("valid: true")
  }, [evidence.path]);
}

async function harnessCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  const records = [
    await noteHarnessFailure("Agent repeated stale docs in root instructions.", { prevention: "doc" }, root),
    await noteHarnessFailure("Agent forgot release checklist.", { prevention: "rule" }, root),
    await noteHarnessFailure("Agent forgot recurring Windows cache issue.", { prevention: "memory" }, root),
    await noteHarnessFailure("Agent skipped verify step.", { prevention: "workflow check" }, root)
  ];
  const candidates = new Set(records.map((record) => record.preventionCandidate));
  const ok = ["doc", "rule", "memory", "workflow check"].every((candidate) => candidates.has(candidate));
  return makeCase(id, group, title, ok ? "pass" : "fail", { candidates: [...candidates] }, [".soturail/harness/failures.jsonl"]);
}

function diagramCase(id: string, group: string, title: string): EvaluationCase {
  const invalid = validateMermaidDiagram("not a diagram");
  const warning = validateMermaidDiagram("stateDiagram-v2\n  Draft --> Active\n  Orphan --> Closed\n");
  const ok = !invalid.valid && warning.valid && warning.findings.some((finding) => finding.message.includes("verification"));
  return makeCase(id, group, title, ok ? "pass" : "fail", { invalid, warning }, ["diagram-validator"]);
}

async function brainClaimQualityCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await initBrain(root);
  const scan = await scanBrain(root);
  const claims = await readJsonl<Record<string, unknown>>(getWorkspacePaths(root).brainClaimsFile);
  const verifiedWithSources = claims.filter((claim) =>
    claim["status"] === "verified"
    && typeof claim["sourcePath"] === "string"
    && typeof claim["fileHash"] === "string"
    && typeof claim["rangeHash"] === "string"
  );
  return makeCase(id, group, title, verifiedWithSources.length > 0 ? "pass" : "fail", {
    claimsAdded: scan.claimsAdded,
    verifiedWithSources: verifiedWithSources.length
  }, [getWorkspacePaths(root).brainClaimsFile]);
}

async function brainStaleCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  await fs.appendFile(path.join(root, "src", "core", "release-preflight.ts"), "\n// changed for brain stale eval\n", "utf8");
  const stale = await staleBrain(root);
  return makeCase(id, group, title, stale.freshness.suspect + stale.freshness.stale + stale.freshness.warnings.length > 0 ? "pass" : "fail", {
    suspect: stale.freshness.suspect,
    stale: stale.freshness.stale,
    warnings: stale.freshness.warnings
  }, [getWorkspacePaths(root).brainFreshnessFile]);
}

async function brainRuleCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  const result = await rulesFromBrain(root);
  const linked = result.rules.every((rule) => rule.sourceClaimIds.length > 0 || (rule.sourceDecisionIds?.length ?? 0) > 0);
  return makeCase(id, group, title, result.rules.length > 0 && linked ? "pass" : "fail", {
    rules: result.rules.length,
    linked
  }, [result.markdownPath, getWorkspacePaths(root).brainRulesFile]);
}

async function brainBriefCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  await reverseGaps(root);
  await rulesFromBrain(root);
  const result = await exportBrain("codex", root);
  const ok = result.content.includes("Verified Claims")
    && result.content.includes("Active Rules")
    && result.content.includes("Known Gaps")
    && result.content.includes("Safe Commands")
    && result.content.includes("Do not overclaim");
  return makeCase(id, group, title, ok ? "pass" : "fail", { path: result.path }, [result.path]);
}

async function reverseSpecCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await reverseScan("./src", root);
  await reverseClaims("./src", root);
  const specs = await reverseSpecs("./src", root);
  const contents = await Promise.all(specs.paths.map((specPath) => fs.readFile(specPath, "utf8")));
  const ok = contents.some((content) => content.includes("## Source Claims") && content.includes("## Acceptance Criteria"));
  return makeCase(id, group, title, ok ? "pass" : "fail", { specs: specs.paths.length }, specs.paths);
}

async function reverseGapCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  const gaps = await reverseGaps(root);
  const exported = await reverseExport("agent", root);
  return makeCase(id, group, title, gaps.gaps.length > 0 && exported.path.endsWith("reverse-agent-brief.md") ? "pass" : "warn", {
    gaps: gaps.gaps.length,
    export: exported.path
  }, [gaps.markdownPath, exported.path]);
}

async function brainRecallCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  const recall = await recallBrain("release notes docs releases", root);
  const ok = recall.includes("Release notes") && recall.includes("Status/confidence") && recall.includes("Reason:") && recall.includes("Source:");
  return makeCase(id, group, title, ok ? "pass" : "fail", { recall: summarizeText(recall, 500) }, [getWorkspacePaths(root).brainClaimsFile]);
}

async function brainDedupCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<Record<string, unknown>>(paths.brainClaimsFile);
  const releaseClaim = claims.find((claim) => String(claim["claim"]).includes("Release notes live under docs/releases"));
  if (releaseClaim) {
    await appendJsonl(paths.brainClaimsFile, { ...releaseClaim, id: "claim_eval_duplicate_release_notes" });
  }
  const result = await consolidateBrain(root, { dryRun: true });
  return makeCase(id, group, title, result.report.duplicateGroups > 0 && result.report.mergedClaims > 0 ? "pass" : "fail", {
    duplicateGroups: result.report.duplicateGroups,
    mergedClaims: result.report.mergedClaims
  }, [getWorkspacePaths(root).brainConsolidationReportMd]);
}

async function brainRepairCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  await fs.writeFile(path.join(root, "src", "core", "release-preflight.ts"), "export const releaseNotesPath = \"docs/notes/RELEASE.md\";\n", "utf8");
  const result = await staleBrain(root, { repairPlan: true });
  const repair = await fs.readFile(getWorkspacePaths(root).brainRepairPlanMd, "utf8");
  return makeCase(id, group, title, repair.includes("recommended_command") && repair.includes("human_action") ? "pass" : "fail", {
    suggestions: result.repairPlan?.suggestions.length ?? 0
  }, [getWorkspacePaths(root).brainRepairPlanMd]);
}

async function brainBriefSafetyCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<Record<string, unknown>>(paths.brainClaimsFile);
  const releaseClaim = claims.find((claim) => String(claim["claim"]).includes("Release notes live under docs/releases"));
  if (releaseClaim) {
    await appendJsonl(paths.brainClaimsFile, { ...releaseClaim, id: "claim_eval_stale_release_notes", status: "stale" });
  }
  const result = await exportBrain("codex", root, { limit: 5 });
  const verifiedSection = result.content.split("## Verified Claims")[1]?.split("## Active Rules")[0] ?? "";
  const staleSection = result.content.split("## Stale Claims")[1]?.split("## Safe Commands")[0] ?? "";
  const ok = !verifiedSection.includes("claim_eval_stale_release_notes") && staleSection.includes("claim_eval_stale_release_notes");
  return makeCase(id, group, title, ok ? "pass" : "fail", { path: result.path }, [result.path]);
}

async function brainRelocationCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  await fs.writeFile(path.join(root, "src", "core", "release-preflight.ts"), [
    "// unrelated header",
    "export const other = true;",
    "",
    "// Release notes live under docs/releases/.",
    "export const releaseNotesPath = \"docs/releases/RELEASE_NOTES_v1.2.3.md\";",
    ""
  ].join("\n"), "utf8");
  const result = await staleBrain(root, { repairPlan: true });
  const relocated = result.freshness.events.some((event) => event.status === "relocated" && event.candidateRange);
  return makeCase(id, group, title, relocated ? "pass" : "warn", {
    events: result.freshness.events.map((event) => ({ id: event.recordId, status: event.status, reason: event.reason, similarity: event.similarity }))
  }, [getWorkspacePaths(root).brainFreshnessFile]);
}

async function brainRuleIntegrityCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<Record<string, unknown>>(paths.brainClaimsFile);
  const releaseClaim = claims.find((claim) => String(claim["claim"]).includes("Release notes live under docs/releases"));
  if (releaseClaim) {
    await appendJsonl(paths.brainStaleEventsFile, {
      schemaVersion: "soturail.brain.stale-event.v1",
      id: "stale_eval_release_notes",
      recordId: releaseClaim["id"],
      reason: "eval stale source",
      previousHash: "sha256-old",
      currentHash: "sha256-new",
      status: "stale",
      createdAt: new Date().toISOString()
    });
  }
  const result = await rulesFromBrain(root);
  const linked = result.rules.every((rule) => rule.sourceClaimIds.length > 0 || (rule.sourceDecisionIds?.length ?? 0) > 0);
  const staleExcluded = !result.rules.some((rule) => rule.status === "active" && rule.sourceClaimIds.includes(String(releaseClaim?.["id"] ?? "")));
  return makeCase(id, group, title, linked && staleExcluded ? "pass" : "fail", {
    linked,
    staleExcluded,
    rules: result.rules.length
  }, [result.markdownPath, result.jsonPath]);
}

async function brainDoctorActionabilityCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  const result = await brainDoctor(root, { repairPlan: true });
  const ok = result.output.includes("soturail brain consolidate --dry-run")
    && result.output.includes("soturail brain stale --repair-plan")
    && result.output.includes("soturail eval run --suite brain");
  return makeCase(id, group, title, ok ? "pass" : "fail", { output: summarizeText(result.output, 500) }, [getWorkspacePaths(root).brainDoctorFile]);
}

async function brainExportLimitCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  await scanBrain(root);
  const result = await exportBrain("codex", root, { limit: 3 });
  const verifiedSection = result.content.split("## Verified Claims")[1]?.split("## Active Rules")[0] ?? "";
  const bullets = verifiedSection.split(/\r?\n/).filter((line) => line.startsWith("- ")).length;
  return makeCase(id, group, title, bullets <= 3 ? "pass" : "fail", { bullets }, [result.path]);
}

function makeCase(
  id: string,
  group: string,
  title: string,
  result: EvalResult,
  details: Record<string, unknown>,
  evidence: string[]
): EvaluationCase {
  return { id, group, title, result, details, evidence };
}

async function createEvalProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-eval-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.mkdir(path.join(root, "src", "core"), { recursive: true });
  await fs.mkdir(path.join(root, "src", "commands"), { recursive: true });
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.mkdir(path.join(root, "docs", "releases"), { recursive: true });
  await fs.mkdir(path.join(root, "tests"), { recursive: true });
  await fs.writeFile(path.join(root, "README.md"), "# Eval Project\n\nSotuRail local-first Context OS evaluation fixture.\n", "utf8");
  await fs.writeFile(path.join(root, "package.json"), "{\"name\":\"soturail-eval\",\"version\":\"1.2.3\",\"scripts\":{\"test\":\"vitest run\",\"build\":\"tsc\"}}\n", "utf8");
  await fs.writeFile(path.join(root, "src", "cli.ts"), "registerBrainCommand(program);\nregisterReverseCommand(program);\nregisterWorkflowCommand(program);\n", "utf8");
  await fs.writeFile(path.join(root, "src", "core", "version.ts"), "export const SOTURAIL_VERSION = \"1.2.3\";\n", "utf8");
  await fs.writeFile(path.join(root, "src", "core", "release-preflight.ts"), "export const releaseNotesPath = \"docs/releases/RELEASE_NOTES_v1.2.3.md\";\n", "utf8");
  await fs.writeFile(path.join(root, "src", "core", "agent-runtime.ts"), "export const policy = \"No arbitrary shell execution through MCP by default.\";\n", "utf8");
  await fs.writeFile(path.join(root, "src", "core", "workflow-store.ts"), "export const workflowStorage = \".soturail/workflows/\";\n", "utf8");
  await fs.writeFile(path.join(root, "src", "core", "diagram-validator.ts"), "export const diagramNote = \"lightweight Mermaid validation, not a full parser\";\n", "utf8");
  await fs.writeFile(path.join(root, "src", "core", "evaluation-suite.ts"), "export const evalPath = \".soturail/eval/latest.json\";\n", "utf8");
  await fs.writeFile(path.join(root, "src", "commands", "brain.ts"), "program.command(\"brain\");\n", "utf8");
  await fs.writeFile(path.join(root, "src", "commands", "reverse.ts"), "program.command(\"reverse\");\n", "utf8");
  await fs.writeFile(path.join(root, "docs", "releases", "README.md"), "# Release Notes\n\nRelease notes live under docs/releases/.\n", "utf8");
  await fs.writeFile(path.join(root, "docs", "releases", "RELEASE_NOTES_v1.2.3.md"), "# Notes\n", "utf8");
  await fs.writeFile(path.join(root, "docs", "diagram-rail.md"), "# Diagram Rail\n\nNo full Mermaid parser is available yet.\n", "utf8");
  await fs.writeFile(path.join(root, "src", "refund-policy.ts"), [
    "export function validateRefund() {",
    "  // Rule R08: refunds must preserve release evidence.",
    "  // Command: npm test",
    "  throw new Error(\"ERR_REFUND_WINDOW\");",
    "}",
    ""
  ].join("\n"), "utf8");
  await fs.writeFile(path.join(root, "docs", "security-policy.md"), "# Security Policy\n\nRaw logs require review and redaction.\n", "utf8");
  await fs.writeFile(path.join(root, "docs", "release.md"), "# Release\n\nnpm publish must finish before GitHub Release.\n", "utf8");
  await fs.writeFile(path.join(root, "docs", "research.md"), "# Research\n\nCompare ecosystem docs with citations.\n", "utf8");
  await fs.writeFile(path.join(root, "tests", "refund.test.ts"), "import { validateRefund } from '../src/refund-policy';\n", "utf8");
  await ensureWorkspace(root);
  return root;
}

async function writeEvaluationReports(run: EvaluationRun, root: string): Promise<void> {
  const dir = evalDir(root);
  await fs.mkdir(dir, { recursive: true });
  const jsonPath = path.join(dir, "latest.json");
  const markdownPath = path.join(dir, "latest.md");
  run.reports.json = jsonPath;
  run.reports.markdown = markdownPath;
  await writeJson(jsonPath, run);
  await fs.writeFile(markdownPath, renderEvaluationReport(run, root), "utf8");
}

function renderEvaluationReport(run: EvaluationRun, root: string): string {
  const rows = run.cases.map((item) => `| ${item.id} | ${item.group} | ${item.result} | ${item.title} |`);
  return [
    "# SotuRail Evaluation Report",
    "",
    "Generated from deterministic local fixtures. No network, paid APIs, GitHub access or real agent hosts are required.",
    "",
    `suite: ${run.suite}`,
    `id: ${run.id}`,
    `createdAt: ${run.createdAt}`,
    `passed: ${run.summary.passed}`,
    `failed: ${run.summary.failed}`,
    `warnings: ${run.summary.warnings}`,
    `json_report: ${path.relative(root, run.reports.json).replace(/\\/g, "/")}`,
    "",
    "| case_id | group | result | title |",
    "|---|---|---|---|",
    ...rows,
    "",
    "Token savings without quality preservation is not a success.",
    "Warnings are separate from failures. A passing suite means critical local evidence was preserved on this fixture set, not that SotuRail is superior to any external tool.",
    ""
  ].join("\n");
}

function evalDir(root: string): string {
  return path.join(getWorkspacePaths(root).workspace, "eval");
}
