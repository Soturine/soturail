import { existsSync, readFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { buildDashboard } from "./dashboard-rail.js";
import { buildReport } from "./report-rail.js";
import { runArchitectureCheck, runCodeHealth } from "./code-health.js";
import { getWorkspacePaths, relativeToRoot, writeJson } from "./config.js";
import { SOTURAIL_VERSION } from "./version.js";

export type SchemaCheckStatus = "passed" | "warning" | "failed" | "missing";

export interface SchemaArtifactCheck {
  id: string;
  path: string;
  exists: boolean;
  parseable: boolean;
  schemaVersion: string | null;
  status: SchemaCheckStatus;
  requiredFields: string[];
  missingFields: string[];
  versionConsistent: boolean | null;
  notes: string[];
}

export interface SchemaCheckReport {
  schemaVersion: "soturail.schema-check.v1";
  contractId: "soturail.schemas.check.v1";
  createdAt: string;
  version: string;
  strict: boolean;
  status: "passed" | "warning" | "failed";
  artifacts: SchemaArtifactCheck[];
  warnings: string[];
  nextCommands: string[];
}

export interface V1ReadinessReport {
  schemaVersion: "soturail.v1-readiness.v1";
  createdAt: string;
  status: "passed" | "warning" | "failed";
  stableSurfacePercent: number;
  blockingIssues: string[];
  warnings: string[];
  experimentalCommands: string[];
  stableCommands: string[];
  nextCommands: string[];
}

export interface SchemaReadinessOptions {
  strict?: boolean;
}

interface ArtifactSpec {
  id: string;
  path: string;
  required: boolean;
  fields: string[];
  hasVersion?: boolean;
  arrayFields?: string[];
}

export async function runSchemaCheck(root = process.cwd(), options: SchemaReadinessOptions = {}): Promise<{ report: SchemaCheckReport; jsonPath: string; markdownPath: string; output: string }> {
  const resolvedRoot = path.resolve(root);
  const dir = path.join(getWorkspacePaths(resolvedRoot).workspace, "schemas");
  await fs.mkdir(dir, { recursive: true });
  if (options.strict) {
    await runCodeHealth(resolvedRoot, { strict: true }).catch(() => undefined);
    await runArchitectureCheck(resolvedRoot, { strict: true }).catch(() => undefined);
  }
  const artifacts = await Promise.all(schemaArtifacts(resolvedRoot, options.strict === true).map((spec) => checkArtifact(resolvedRoot, spec)));
  const failed = artifacts.filter((item) => item.status === "failed");
  const warnings = artifacts.filter((item) => item.status === "warning" || item.status === "missing").map((item) => `${item.id}: ${item.notes.join("; ") || item.status}`);
  const report: SchemaCheckReport = {
    schemaVersion: "soturail.schema-check.v1",
    contractId: "soturail.schemas.check.v1",
    createdAt: new Date().toISOString(),
    version: SOTURAIL_VERSION,
    strict: options.strict === true,
    status: failed.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
    artifacts,
    warnings,
    nextCommands: [
      "soturail status --json",
      "soturail report build",
      "soturail bench run --suite brain",
      "soturail native candidates",
      "soturail self baseline --check",
      "soturail mcp resources report",
      "soturail self code-health",
      "soturail self architecture --check"
    ]
  };
  const jsonPath = path.join(dir, "check.json");
  const markdownPath = path.join(dir, "check.md");
  await writeJson(jsonPath, report);
  await fs.writeFile(markdownPath, renderSchemaCheckMarkdown(report), "utf8");
  return {
    report,
    jsonPath,
    markdownPath,
    output: [
      "SotuRail schema check",
      `status: ${report.status}`,
      `strict: ${report.strict}`,
      `artifacts: ${report.artifacts.length}`,
      `warnings: ${report.warnings.length}`,
      `json: ${relativeToRoot(resolvedRoot, jsonPath)}`,
      `markdown: ${relativeToRoot(resolvedRoot, markdownPath)}`,
      "next_commands:",
      ...report.nextCommands.slice(0, 6).map((command) => `- ${command}`)
    ].join("\n") + "\n"
  };
}

export async function runV1Readiness(root = process.cwd(), options: SchemaReadinessOptions = {}): Promise<{ report: V1ReadinessReport; jsonPath: string; markdownPath: string; output: string }> {
  const resolvedRoot = path.resolve(root);
  const paths = getWorkspacePaths(resolvedRoot);
  const dir = path.join(paths.workspace, "readiness");
  await fs.mkdir(dir, { recursive: true });
  if (options.strict) {
    await buildReport(resolvedRoot);
    await buildDashboard(resolvedRoot);
  }
  const codeHealth = await runCodeHealth(resolvedRoot, { strict: options.strict === true });
  const architecture = await runArchitectureCheck(resolvedRoot, { strict: options.strict === true });
  const schemaCheck = await runSchemaCheck(resolvedRoot, { strict: options.strict === true });
  const stableCommands = [
    "soturail status",
    "soturail report",
    "soturail dashboard",
    "soturail obs",
    "soturail brain",
    "soturail eval",
    "soturail bench",
    "soturail native",
    "soturail self baseline",
    "soturail release check",
    "soturail self schemas --check",
    "soturail self readiness --v1",
    "soturail workflow",
    "soturail harness",
    "soturail diagram",
    "soturail agents",
    "soturail mcp exposure",
    "soturail mcp resources report"
  ];
  const experimentalCommands = ["graph", "parse", "native acceleration", "extended MCP tools"];
  const checks = [
    docsExist(resolvedRoot, "README.md"),
    docsExist(resolvedRoot, "CHANGELOG.md"),
    docsExist(resolvedRoot, "docs/status-command.md"),
    docsExist(resolvedRoot, "docs/report-rail.md"),
    docsExist(resolvedRoot, "docs/dashboard-rail.md"),
    docsExist(resolvedRoot, "docs/stable-command-surface.md"),
    docsExist(resolvedRoot, "docs/deprecation-policy.md"),
    docsExist(resolvedRoot, "docs/migration-v1.md"),
    docsExist(resolvedRoot, "docs/quickstart.md", options.strict === true),
    docsExist(resolvedRoot, "docs/v1-contract.md", options.strict === true),
    docsExist(resolvedRoot, "docs/schema-contracts.md", options.strict === true),
    docsExist(resolvedRoot, "docs/agent-hosts.md", options.strict === true),
    docsExist(resolvedRoot, "docs/clean-code-guidelines.md", options.strict === true),
    docsExist(resolvedRoot, "docs/architecture-boundaries.md", options.strict === true),
    docsExist(resolvedRoot, path.join("docs", "releases", `RELEASE_NOTES_v${packageVersion(resolvedRoot)}.md`))
  ];
  const packageJsonVersion = packageVersion(resolvedRoot);
  const blockingIssues = [
    ...schemaCheck.report.artifacts.filter((item) => item.status === "failed").map((item) => `${item.id} schema check failed`),
    ...(options.strict && packageJsonVersion !== SOTURAIL_VERSION ? [`package version ${packageJsonVersion} does not match CLI ${SOTURAIL_VERSION}`] : []),
    ...(options.strict && codeHealth.report.status === "failed" ? ["code health has blocking issues"] : []),
    ...(options.strict && architecture.report.status === "failed" ? ["architecture check has blocking issues"] : []),
    ...checks.filter((item) => !item.ok && item.required).map((item) => item.message)
  ];
  const warnings = [
    ...schemaCheck.report.warnings,
    ...codeHealth.report.warnings.slice(0, 5),
    ...architecture.report.warnings.slice(0, 5),
    ...checks.filter((item) => !item.ok && !item.required).map((item) => item.message),
    "graph/parse, real native acceleration, dashboard server mode and post-v1 rails remain experimental until explicitly promoted."
  ];
  const stableSurfacePercent = Math.max(0, Math.min(100, Math.round(((stableCommands.length - blockingIssues.length) / stableCommands.length) * 100)));
  const report: V1ReadinessReport = {
    schemaVersion: "soturail.v1-readiness.v1",
    createdAt: new Date().toISOString(),
    status: blockingIssues.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
    stableSurfacePercent,
    blockingIssues,
    warnings,
    experimentalCommands,
    stableCommands,
    nextCommands: [
      "npm run test",
      "soturail report build",
      options.strict ? "soturail self schemas --check --strict" : "soturail self schemas --check",
      "soturail self code-health",
      "soturail self architecture --check",
      "soturail self baseline --check",
      "soturail release check"
    ]
  };
  const jsonPath = path.join(dir, "v1.json");
  const markdownPath = path.join(dir, "v1.md");
  await writeJson(jsonPath, report);
  await fs.writeFile(markdownPath, renderV1ReadinessMarkdown(report), "utf8");
  return {
    report,
    jsonPath,
    markdownPath,
    output: [
      "SotuRail v1 readiness",
      `status: ${report.status}`,
      `strict: ${options.strict === true}`,
      `stable_surface: ${report.stableSurfacePercent}%`,
      "blocking_issues:",
      ...(report.blockingIssues.length > 0 ? report.blockingIssues.map((item) => `- ${item}`) : ["- none"]),
      "warnings:",
      ...(report.warnings.length > 0 ? report.warnings.slice(0, 8).map((item) => `- ${item}`) : ["- none"]),
      "next_commands:",
      ...report.nextCommands.map((command) => `- ${command}`),
      `json: ${relativeToRoot(resolvedRoot, jsonPath)}`,
      `markdown: ${relativeToRoot(resolvedRoot, markdownPath)}`
    ].join("\n") + "\n"
  };
}

function schemaArtifacts(root: string, strict: boolean): ArtifactSpec[] {
  const workspace = getWorkspacePaths(root).workspace;
  return [
    artifact("status", path.join(workspace, "status", "latest.json"), true, ["schemaVersion", "createdAt", "version", "nextCommands"], true, ["nextCommands"]),
    artifact("report", path.join(workspace, "reports", "latest.json"), true, ["schemaVersion", "id", "createdAt", "version", "warnings", "nextCommands"], true, ["warnings", "nextCommands"]),
    artifact("bench", path.join(workspace, "bench", "latest.json"), false, ["schemaVersion", "id", "createdAt", "version", "summary", "cases"], true),
    artifact("native_candidates", path.join(workspace, "native", "candidates.json"), false, ["schemaVersion", "createdAt", "engine", "candidates"]),
    artifact("baseline", path.join(workspace, "baselines", "latest.json"), false, ["schemaVersion", "createdAt", "version", "signals", "warnings"], true, ["warnings"]),
    artifact("mcp_report_resources", path.join(workspace, "mcp", "report-resources.json"), false, ["schemaVersion", "createdAt", "resources"]),
    artifact("eval", path.join(workspace, "eval", "latest.json"), false, ["schemaVersion", "createdAt", "summary"]),
    artifact("observability_timeline", path.join(workspace, "observability", "timeline.json"), false, ["schemaVersion", "createdAt", "events"]),
    artifact("code_health", path.join(workspace, "code-health", "latest.json"), strict, ["schemaVersion", "createdAt", "version", "status", "warnings", "nextCommands"], true, ["warnings", "nextCommands"]),
    artifact("architecture", path.join(workspace, "architecture", "check.json"), strict, ["schemaVersion", "createdAt", "version", "status", "warnings", "nextCommands"], true, ["warnings", "nextCommands"])
  ];
}

async function checkArtifact(root: string, spec: ArtifactSpec): Promise<SchemaArtifactCheck> {
  const displayPath = relativeToRoot(root, spec.path);
  if (!existsSync(spec.path)) {
    return {
      id: spec.id,
      path: displayPath,
      exists: false,
      parseable: false,
      schemaVersion: null,
      status: spec.required ? "failed" : "missing",
      requiredFields: spec.fields,
      missingFields: spec.fields,
      versionConsistent: null,
      notes: [spec.required ? "required artifact is missing" : "optional artifact is missing; run the related command to generate it"]
    };
  }
  const raw = await fs.readFile(spec.path, "utf8").catch(() => "");
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {
      id: spec.id,
      path: displayPath,
      exists: true,
      parseable: false,
      schemaVersion: null,
      status: "failed",
      requiredFields: spec.fields,
      missingFields: spec.fields,
      versionConsistent: null,
      notes: ["JSON is not parseable"]
    };
  }
  const missingFields = spec.fields.filter((field) => !(field in parsed));
  const malformedArrays = (spec.arrayFields ?? []).filter((field) => field in parsed && !Array.isArray(parsed[field]));
  const schemaVersion = typeof parsed.schemaVersion === "string" ? parsed.schemaVersion : null;
  const versionConsistent = spec.hasVersion && typeof parsed.version === "string" ? parsed.version === SOTURAIL_VERSION : null;
  const failed = missingFields.length > 0 || malformedArrays.length > 0 || !schemaVersion || versionConsistent === false;
  return {
    id: spec.id,
    path: displayPath,
    exists: true,
    parseable: true,
    schemaVersion,
    status: failed ? "failed" : "passed",
    requiredFields: spec.fields,
    missingFields,
    versionConsistent,
    notes: [
      ...(!schemaVersion ? ["schemaVersion is missing"] : []),
      ...(missingFields.length > 0 ? [`missing fields: ${missingFields.join(", ")}`] : []),
      ...(malformedArrays.length > 0 ? [`array fields are malformed: ${malformedArrays.join(", ")}`] : []),
      ...(versionConsistent === false ? [`version does not match CLI ${SOTURAIL_VERSION}`] : [])
    ]
  };
}

function renderSchemaCheckMarkdown(report: SchemaCheckReport): string {
  return [
    "# SotuRail Schema Check",
    "",
    `schemaVersion: ${report.schemaVersion}`,
    `createdAt: ${report.createdAt}`,
    `version: ${report.version}`,
    `status: ${report.status}`,
    "",
    "## Artifacts",
    "",
    ...report.artifacts.map((item) => `- ${item.status.toUpperCase()} ${item.id}: ${item.path} schema=${item.schemaVersion ?? "missing"} parseable=${item.parseable}`),
    "",
    "## Warnings",
    "",
    ...(report.warnings.length > 0 ? report.warnings.map((item) => `- ${item}`) : ["- none"]),
    "",
    "## Next Commands",
    "",
    ...report.nextCommands.map((command) => `- \`${command}\``),
    ""
  ].join("\n");
}

function renderV1ReadinessMarkdown(report: V1ReadinessReport): string {
  return [
    "# SotuRail v1 Readiness",
    "",
    "This is a readiness draft, not a v1.0 stability promise.",
    "",
    `schemaVersion: ${report.schemaVersion}`,
    `createdAt: ${report.createdAt}`,
    `status: ${report.status}`,
    `stableSurfacePercent: ${report.stableSurfacePercent}`,
    "",
    "## Blocking Issues",
    "",
    ...(report.blockingIssues.length > 0 ? report.blockingIssues.map((item) => `- ${item}`) : ["- none"]),
    "",
    "## Warnings",
    "",
    ...(report.warnings.length > 0 ? report.warnings.map((item) => `- ${item}`) : ["- none"]),
    "",
    "## Stable Command Candidates",
    "",
    ...report.stableCommands.map((command) => `- ${command}`),
    "",
    "## Experimental Commands",
    "",
    ...report.experimentalCommands.map((command) => `- ${command}`),
    "",
    "## Next Commands",
    "",
    ...report.nextCommands.map((command) => `- \`${command}\``),
    ""
  ].join("\n");
}

function artifact(id: string, filePath: string, required: boolean, fields: string[], hasVersion = false, arrayFields: string[] = []): ArtifactSpec {
  return { id, path: filePath, required, fields, hasVersion, arrayFields };
}

function docsExist(root: string, filePath: string, required = true): { ok: boolean; required: boolean; message: string } {
  return {
    ok: existsSync(path.join(root, filePath)),
    required,
    message: `${filePath} is missing`
  };
}

function packageVersion(root: string): string {
  try {
    const raw = readFileSync(path.join(root, "package.json"), "utf8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? SOTURAIL_VERSION;
  } catch {
    return SOTURAIL_VERSION;
  }
}
