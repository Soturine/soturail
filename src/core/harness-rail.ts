import { promises as fs } from "node:fs";
import path from "node:path";
import { appendJsonl, ensureWorkspace, getWorkspacePaths, readJsonl, relativeToRoot, writeJson } from "./config.js";
import { makeRailId } from "./rail-utils.js";

export interface HarnessFailureRecord {
  schemaVersion: "soturail.harness.failure.v1";
  id: string;
  createdAt: string;
  whatFailed: string;
  workflowId?: string;
  suspectedRootCause?: string;
  preventionCandidate: string;
  evidence?: string;
}

export interface HarnessContract {
  schemaVersion: "soturail.harness.contract.v1";
  checks: Array<{ name: string; command: string; required: boolean }>;
  acceptanceRules: string[];
}

export async function noteHarnessFailure(
  text: string,
  options: { workflow?: string; cause?: string; prevention?: string; evidence?: string } = {},
  root = process.cwd()
): Promise<HarnessFailureRecord> {
  await ensureWorkspace(root);
  const record: HarnessFailureRecord = {
    schemaVersion: "soturail.harness.failure.v1",
    id: makeRailId("hfail", text),
    createdAt: new Date().toISOString(),
    whatFailed: text,
    preventionCandidate: options.prevention ?? "workflow check"
  };
  if (options.workflow) record.workflowId = options.workflow;
  if (options.cause) record.suspectedRootCause = options.cause;
  if (options.evidence) record.evidence = options.evidence;
  await appendJsonl(getWorkspacePaths(root).harnessFailuresFile, record);
  return record;
}

export async function listHarnessFailures(root = process.cwd()): Promise<HarnessFailureRecord[]> {
  return readJsonl<HarnessFailureRecord>(getWorkspacePaths(root).harnessFailuresFile);
}

export async function explainHarnessFailure(id: string, root = process.cwd()): Promise<string> {
  const record = (await listHarnessFailures(root)).find((item) => item.id === id);
  if (!record) throw new Error(`Harness failure not found: ${id}`);
  return [
    "SotuRail harness failure",
    `id: ${record.id}`,
    `created_at: ${record.createdAt}`,
    `what_failed: ${record.whatFailed}`,
    `workflow_id: ${record.workflowId ?? "none"}`,
    `suspected_root_cause: ${record.suspectedRootCause ?? "none"}`,
    `prevention_candidate: ${record.preventionCandidate}`,
    `evidence: ${record.evidence ?? "none"}`
  ].join("\n") + "\n";
}

export async function harnessDoctor(root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const failures = await listHarnessFailures(root);
  const currentWorkflow = await readCurrentWorkflow(paths.workflowCurrentFile);
  const contractPath = path.join(paths.harnessContractsDir, "default.json");
  const verifyPath = currentWorkflow ? path.join(paths.workflowsDir, currentWorkflow, "verify.json") : "";
  const checks = [
    ["README", "README.md"],
    ["ROADMAP", "ROADMAP.md"],
    ["tests", "tests"],
    ["context_pack_support", "src/commands/context.ts"],
    ["agent_docs", "docs/agents.md"],
    ["policy_docs", "docs/policy-rail.md"],
    ["workflow_state", ".soturail/workflows"]
  ] as const;
  const lines = ["SotuRail Harness Rail doctor"];
  for (const [name, file] of checks) {
    lines.push(`${name}: ${(await exists(path.resolve(root, file))) ? "present" : "missing"}`);
  }
  lines.push(`active_workflow: ${currentWorkflow ?? "none"}`);
  lines.push(`contract_present: ${await exists(contractPath)}`);
  lines.push(`failure_count: ${failures.length}`);
  lines.push(`latest_verify_status: ${verifyPath && await exists(verifyPath) ? "present" : "missing"}`);
  lines.push(`suggested_prevention_action: ${suggestPrevention(failures)}`);
  lines.push("acceptance_contract: soturail harness contract init");
  lines.push("safe_default: contract check validates by default; it does not run commands unless future explicit flags add that behavior.");
  lines.push("workflow_connection: workflow verify/evidence reads harness contracts and failures.");
  lines.push("brain_connection: repeated failures can become brain bugs, draft rules or workflow checks after `soturail brain scan`.");
  lines.push("brain_next_commands: soturail brain consolidate --dry-run; soturail rules from-brain");
  return `${lines.join("\n")}\n`;
}

export async function initHarnessContract(root = process.cwd()): Promise<{ path: string; created: boolean }> {
  await ensureWorkspace(root);
  const filePath = path.join(getWorkspacePaths(root).harnessContractsDir, "default.json");
  if (await exists(filePath)) return { path: filePath, created: false };
  await writeJson(filePath, defaultContract());
  return { path: filePath, created: true };
}

export async function checkHarnessContract(root = process.cwd()): Promise<string> {
  const filePath = path.join(getWorkspacePaths(root).harnessContractsDir, "default.json");
  const raw = await fs.readFile(filePath, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") throw new Error("Harness contract not found. Run: soturail harness contract init");
    throw error;
  });
  const parsed = JSON.parse(raw) as HarnessContract;
  const ok = parsed.schemaVersion === "soturail.harness.contract.v1"
    && Array.isArray(parsed.checks)
    && parsed.checks.every((check) => typeof check.name === "string" && typeof check.command === "string" && typeof check.required === "boolean")
    && Array.isArray(parsed.acceptanceRules);
  return [
    "SotuRail harness contract check",
    `path: ${relativeToRoot(root, filePath)}`,
    `valid: ${ok}`,
    `checks_count: ${Array.isArray(parsed.checks) ? parsed.checks.length : 0}`,
    "commands_run: none",
    "note: v0.5.0 validates the contract without executing checks by default."
  ].join("\n") + "\n";
}

export function renderHarnessFailures(records: HarnessFailureRecord[]): string {
  if (records.length === 0) return "No harness failures recorded.\n";
  return [
    "SotuRail harness failures",
    `failures_count: ${records.length}`,
    "",
    ...records.map((record) => `- ${record.id}: ${record.whatFailed} [candidate: ${record.preventionCandidate}]`)
  ].join("\n") + "\n";
}

function defaultContract(): HarnessContract {
  return {
    schemaVersion: "soturail.harness.contract.v1",
    checks: [
      { name: "build", command: "npm run build", required: true },
      { name: "typecheck", command: "npm run typecheck", required: true },
      { name: "test", command: "npm test", required: true }
    ],
    acceptanceRules: [
      "Do not mark work as done if build fails.",
      "Do not mark work as done if tests fail.",
      "Do not mark work as done if policy checks fail.",
      "Record evidence before release.",
      "Convert repeated failures into a rule, doc, memory, workflow check or diagram/spec update."
    ]
  };
}

async function readCurrentWorkflow(filePath: string): Promise<string | null> {
  const raw = await fs.readFile(filePath, "utf8").catch(() => "");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { id?: string | null };
    return parsed.id ?? null;
  } catch {
    return null;
  }
}

function suggestPrevention(failures: HarnessFailureRecord[]): string {
  if (failures.length === 0) return "record failures with soturail harness note";
  const latest = failures.at(-1);
  if (!latest) return "record failures with soturail harness note";
  if (/diagram|visual|spec/i.test(latest.whatFailed)) return "diagram/spec update";
  return latest.preventionCandidate;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
