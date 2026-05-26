import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { compressOutputWithEngine } from "../compressors/index.js";
import { lintAgentDocs } from "./agent-docs-hygiene.js";
import { appendJsonl, ensureWorkspace, getWorkspacePaths, writeJson } from "./config.js";
import { buildRolePack, offloadContext, restoreOffload, routeContext, selectContext } from "./context-intelligence.js";
import { validateMermaidDiagram } from "./diagram-validator.js";
import { buildWorkflowEvidence } from "./evidence-pack.js";
import { createFsSnapshot, planEdit } from "./fs-evidence.js";
import { compareFormats } from "./format-compare.js";
import { initHarnessContract, checkHarnessContract, noteHarnessFailure } from "./harness-rail.js";
import { validateJsonFile } from "./json-validator.js";
import { rememberMemory, recallMemory } from "./memory-rail.js";
import { decidePolicyItem, queuePolicyItem } from "./policy-rail.js";
import { makeRailId } from "./rail-utils.js";
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
  suite: "v0.6.1";
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

export function listEvaluationCases(): string {
  return [
    "SotuRail evaluation cases",
    `suite: v0.6.1`,
    `cases_count: ${caseList.length}`,
    "",
    ...caseList.map(([id, group, title]) => `- ${id} [${group}] ${title}`)
  ].join("\n") + "\n";
}

export async function runEvaluationSuite(root = process.cwd()): Promise<EvaluationRun> {
  await ensureWorkspace(root);
  const evalRoot = await createEvalProject();
  const cases: EvaluationCase[] = [];
  for (const [id, group, title] of caseList) {
    cases.push(await runCase(id, group, title, evalRoot));
  }
  const run: EvaluationRun = {
    schemaVersion: "soturail.eval.v1",
    id: makeRailId("eval", "v0.6.1"),
    createdAt: new Date().toISOString(),
    suite: "v0.6.1",
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

async function runCase(id: string, group: string, title: string, root: string): Promise<EvaluationCase> {
  try {
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
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.mkdir(path.join(root, "tests"), { recursive: true });
  await fs.writeFile(path.join(root, "README.md"), "# Eval Project\n\nSotuRail local-first Context OS evaluation fixture.\n", "utf8");
  await fs.writeFile(path.join(root, "package.json"), "{\"scripts\":{\"test\":\"vitest run\",\"build\":\"tsc\"}}\n", "utf8");
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
