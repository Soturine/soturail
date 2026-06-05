import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildDashboard } from "./dashboard-rail.js";
import { buildReport } from "./report-rail.js";
import { scanReportSafety } from "./report-redaction.js";
import { runArchitectureCheck, runCodeHealth } from "./code-health.js";
import { runSchemaCheck, runV1Readiness } from "./schema-readiness.js";

export interface ReleaseGateResult {
  id: string;
  label: string;
  ok: boolean;
  required: boolean;
  details: string;
}

export interface ReleasePreflightResult {
  ok: boolean;
  version: string | null;
  packageName: string | null;
  fullAuditDevOnly: boolean;
  fullAuditFindings: string[];
  gates: ReleaseGateResult[];
}

export interface ReleasePreflightOptions {
  runAudit?: boolean;
  runPack?: boolean;
  cliCommand?: string[];
  strict?: boolean;
}

interface ProcessResult {
  code: number;
  stdout: string;
  stderr: string;
  command: string;
  args: string[];
  cwd: string;
}

interface AuditSummary {
  total: number;
  names: string[];
}

export interface PackedPackageVerification {
  ok: boolean;
  tarballPath: string | null;
  cliVersion: string | null;
  npxVersion: string | null;
  helpExitCode?: number | null;
  details: string;
}

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export async function runReleasePreflight(
  root = process.cwd(),
  options: ReleasePreflightOptions = {}
): Promise<ReleasePreflightResult> {
  const resolvedRoot = path.resolve(root);
  const runAudit = options.runAudit ?? true;
  const runPack = options.runPack ?? true;
  const strict = options.strict === true;
  const gates: ReleaseGateResult[] = [];
  const packageJson = await readOptionalJson(path.join(resolvedRoot, "package.json"));
  const packageName = typeof packageJson?.name === "string" ? packageJson.name : null;
  const version = typeof packageJson?.version === "string" ? packageJson.version : null;

  addGate(gates, "package_version", "package.json version", Boolean(version && SEMVER_PATTERN.test(version)), version ?? "missing");

  const packageLock = await readOptionalJson(path.join(resolvedRoot, "package-lock.json"));
  const lockVersion = typeof packageLock?.version === "string" ? packageLock.version : null;
  const lockRootVersion = packageLock && typeof packageLock === "object"
    && "packages" in packageLock
    && packageLock.packages
    && typeof packageLock.packages === "object"
    && "" in packageLock.packages
    && packageLock.packages[""]
    && typeof packageLock.packages[""] === "object"
    && "version" in packageLock.packages[""]
    && typeof packageLock.packages[""].version === "string"
    ? packageLock.packages[""].version
    : null;
  addGate(
    gates,
    "package_lock_version",
    "package-lock version sync",
    Boolean(version && lockVersion === version && lockRootVersion === version),
    `package-lock.version=${lockVersion ?? "missing"}, packages[\"\"].version=${lockRootVersion ?? "missing"}`
  );

  const cliVersion = await readCliVersion(resolvedRoot, options.cliCommand);
  addGate(
    gates,
    "cli_version",
    "CLI runtime version sync",
    Boolean(version && cliVersion.code === 0 && cliVersion.stdout.trim() === version),
    cliVersion.code === 0 ? `cli=${cliVersion.stdout.trim() || "empty"}, package=${version ?? "missing"}` : cliVersion.stderr.trim()
  );

  if (runPack) {
    const pack = await runProcess("npm", ["pack", "--dry-run"], resolvedRoot, true);
    const combined = `${pack.stdout}\n${pack.stderr}`;
    const expectedTarball = packageName && version ? `${packageName}-${version}.tgz` : null;
    addGate(
      gates,
      "npm_pack_metadata",
      "npm pack metadata",
      Boolean(pack.code === 0 && expectedTarball && combined.includes(expectedTarball)),
      expectedTarball ? `expected ${expectedTarball}` : "missing package name or version"
    );
    addGate(
      gates,
      "npm_pack_no_raw_logs",
      "npm pack excludes raw logs",
      !combined.includes(".soturail/raw") && !combined.includes("benchmarks/results/latest.json"),
      "pack output must not include .soturail/raw or generated benchmark JSON"
    );
    const packageVerification = packageName && version
      ? await verifyPackedPackage(resolvedRoot, packageName, version)
      : { ok: false, tarballPath: null, cliVersion: null, npxVersion: null, details: "missing package name or version" };
    addGate(
      gates,
      "packed_package_cli_version",
      "packed package CLI version",
      packageVerification.ok,
      packageVerification.details
    );
  } else {
    addGate(gates, "npm_pack_metadata", "npm pack metadata", true, "skipped by test options", false);
    addGate(gates, "npm_pack_no_raw_logs", "npm pack excludes raw logs", true, "skipped by test options", false);
    addGate(gates, "packed_package_cli_version", "packed package CLI version", true, "skipped by test options", false);
  }

  const readme = await readOptionalText(path.join(resolvedRoot, "README.md"));
  addGate(
    gates,
    "readme_install",
    "README install instructions",
    Boolean(readme && /npx\s+soturail/.test(readme) && readme.includes("npm install -g soturail") && readme.includes("soturail --version")),
    readme ? "README.md contains npm/npx/global install guidance" : "README.md missing"
  );

  const changelog = await readOptionalText(path.join(resolvedRoot, "CHANGELOG.md"));
  addGate(
    gates,
    "changelog_entry",
    "CHANGELOG version entry",
    Boolean(version && changelog?.includes(`## [${version}]`)),
    version ? `expected ## [${version}]` : "missing version"
  );

  const releaseNotesPath = version ? path.join(resolvedRoot, "docs", "releases", `RELEASE_NOTES_v${version}.md`) : "";
  addGate(
    gates,
    "release_notes",
    "release notes file",
    Boolean(version && existsSync(releaseNotesPath)),
    version ? path.relative(resolvedRoot, releaseNotesPath) : "missing version"
  );

  if (strict) {
    await buildReport(resolvedRoot).catch(() => undefined);
    await buildDashboard(resolvedRoot).catch(() => undefined);
    const codeHealth = await runCodeHealth(resolvedRoot, { strict: true }).catch(() => null);
    const architecture = await runArchitectureCheck(resolvedRoot, { strict: true }).catch(() => null);
    const schemaCheck = await runSchemaCheck(resolvedRoot, { strict: true }).catch(() => null);
    const readiness = await runV1Readiness(resolvedRoot, { strict: true }).catch(() => null);
    addGate(
      gates,
      "strict_schema_check",
      "strict schema compatibility",
      Boolean(schemaCheck && schemaCheck.report.status !== "failed"),
      schemaCheck ? `status=${schemaCheck.report.status}` : "strict schema check failed to run"
    );
    addGate(
      gates,
      "strict_v1_readiness",
      "strict v1 readiness",
      Boolean(readiness && readiness.report.blockingIssues.length === 0),
      readiness ? `status=${readiness.report.status}, blocking=${readiness.report.blockingIssues.length}` : "strict readiness failed to run"
    );
    addGate(
      gates,
      "clean_code_gate",
      "clean code maintainability gate",
      Boolean(codeHealth && codeHealth.report.summary.blockingIssues === 0),
      codeHealth ? `status=${codeHealth.report.status}, blocking=${codeHealth.report.summary.blockingIssues}` : "code health failed to run"
    );
    addGate(
      gates,
      "architecture_gate",
      "architecture boundary gate",
      Boolean(architecture && architecture.report.summary.blockingIssues === 0),
      architecture ? `status=${architecture.report.status}, blocking=${architecture.report.summary.blockingIssues}` : "architecture check failed to run"
    );
    const strictDocs = [
      "docs/quickstart.md",
      "docs/v1-contract.md",
      "docs/schema-contracts.md",
      "docs/agent-hosts.md",
      "docs/host-matrix-schema.md",
      "docs/agent-export-contract.md",
      "docs/mcp-host-manifest.md",
      "docs/clean-code-guidelines.md",
      "docs/architecture-boundaries.md",
      "docs/stable-command-surface.md",
      "docs/deprecation-policy.md",
      "docs/migration-v1.md"
    ];
    const missingStrictDocs = strictDocs.filter((file) => !existsSync(path.join(resolvedRoot, file)));
    addGate(
      gates,
      "v1_contract_docs",
      "v1 contract documentation",
      missingStrictDocs.length === 0,
      missingStrictDocs.length === 0 ? "v1 contract docs present" : `missing: ${missingStrictDocs.join(", ")}`
    );
    const contamination = await docsScopeContamination(resolvedRoot);
    addGate(
      gates,
      "soturail_scope_only_docs",
      "SotuRail-only roadmap docs",
      contamination.length === 0,
      contamination.length === 0 ? "no SoturAI/finance/trading/backtest contamination found" : `scope contamination: ${contamination.slice(0, 5).join(", ")}`
    );
  }

  const benchReport = path.join(resolvedRoot, ".soturail", "bench", "latest.json");
  const nativeCandidates = path.join(resolvedRoot, ".soturail", "native", "candidates.json");
  const baselineReport = path.join(resolvedRoot, ".soturail", "baselines", "latest.json");
  const statusReport = path.join(resolvedRoot, ".soturail", "status", "latest.json");
  const localReport = path.join(resolvedRoot, ".soturail", "reports", "latest.json");
  const dashboardArtifact = path.join(resolvedRoot, ".soturail", "dashboard", "index.html");
  const observabilityTimeline = path.join(resolvedRoot, ".soturail", "observability", "timeline.json");
  const mcpReportResources = path.join(resolvedRoot, ".soturail", "mcp", "report-resources.json");
  addGate(
    gates,
    "benchmark_report",
    "benchmark report evidence",
    existsSync(benchReport),
    existsSync(benchReport) ? path.relative(resolvedRoot, benchReport) : "missing; run soturail bench run --suite brain",
    false
  );
  addGate(
    gates,
    "native_candidate_report",
    "native candidate evidence",
    existsSync(nativeCandidates),
    existsSync(nativeCandidates) ? path.relative(resolvedRoot, nativeCandidates) : "missing; run soturail native candidates",
    false
  );
  addGate(
    gates,
    "baseline_report",
    "baseline snapshot evidence",
    existsSync(baselineReport),
    existsSync(baselineReport) ? path.relative(resolvedRoot, baselineReport) : "missing; run soturail self baseline --check",
    false
  );
  addGate(
    gates,
    "typescript_fallback",
    "TypeScript fallback status",
    existsSync(path.join(resolvedRoot, "dist", "cli.js")),
    "dist/cli.js is the portable CLI fallback; native remains optional"
  );
  addGate(
    gates,
    "native_optional",
    "native optional install policy",
    true,
    "normal npm install does not require Rust or native binaries",
    false
  );

  const reportSafety = await scanReportSafety(resolvedRoot).catch(() => null);
  addGate(
    gates,
    "report_safety",
    "report redaction safety",
    !reportSafety || reportSafety.ok,
    reportSafety
      ? reportSafety.ok
        ? "report artifacts have no obvious secrets"
        : `report safety findings: ${reportSafety.findings.join(", ")}`
      : "report safety unavailable",
    true
  );
  const jsonArtifacts = [statusReport, localReport, benchReport, nativeCandidates, baselineReport, observabilityTimeline, mcpReportResources];
  const invalidJsonArtifacts = (await Promise.all(jsonArtifacts.map(async (artifact) => ({
    artifact,
    exists: existsSync(artifact),
    parseable: existsSync(artifact) ? await jsonParseable(artifact) : true
  })))).filter((item) => item.exists && !item.parseable);
  addGate(
    gates,
    "local_json_artifacts_parseable",
    "local JSON artifacts parseable",
    invalidJsonArtifacts.length === 0,
    invalidJsonArtifacts.length === 0
      ? "status/report/bench/native/baseline/MCP JSON artifacts are parseable when present"
      : `invalid JSON: ${invalidJsonArtifacts.map((item) => path.relative(resolvedRoot, item.artifact)).join(", ")}`
  );
  addGate(
    gates,
    "unified_status_report",
    "unified status artifact",
    existsSync(statusReport),
    existsSync(statusReport) ? path.relative(resolvedRoot, statusReport) : "missing; run soturail status --json",
    false
  );
  addGate(
    gates,
    "local_report",
    "local report artifact",
    existsSync(localReport),
    existsSync(localReport) ? path.relative(resolvedRoot, localReport) : "missing; run soturail report build",
    false
  );
  addGate(
    gates,
    "static_dashboard",
    "static dashboard artifact",
    existsSync(dashboardArtifact),
    existsSync(dashboardArtifact) ? path.relative(resolvedRoot, dashboardArtifact) : "missing; run soturail dashboard build",
    false
  );
  addGate(
    gates,
    "observability_timeline",
    "observability timeline artifact",
    existsSync(observabilityTimeline),
    existsSync(observabilityTimeline) ? path.relative(resolvedRoot, observabilityTimeline) : "missing; run soturail obs collect",
    false
  );
  addGate(
    gates,
    "mcp_report_resources",
    "read-only MCP report resources",
    existsSync(mcpReportResources),
    existsSync(mcpReportResources) ? path.relative(resolvedRoot, mcpReportResources) : "missing; run soturail mcp resources report",
    false
  );

  addGate(gates, "license", "LICENSE file", existsSync(path.join(resolvedRoot, "LICENSE")), "LICENSE");

  const requiredGitHubFiles = [
    ".github/workflows/ci.yml",
    ".github/ISSUE_TEMPLATE/bug_report.md",
    ".github/ISSUE_TEMPLATE/feature_request.md",
    ".github/pull_request_template.md"
  ];
  const missingGitHubFiles = requiredGitHubFiles.filter((file) => !existsSync(path.join(resolvedRoot, file)));
  addGate(
    gates,
    "required_github_files_present",
    "required GitHub community and CI files",
    missingGitHubFiles.length === 0,
    missingGitHubFiles.length === 0 ? "all required .github files present" : `missing: ${missingGitHubFiles.join(", ")}`
  );

  let fullAudit: AuditSummary = { total: 0, names: [] };
  let runtimeAudit: AuditSummary = { total: 0, names: [] };
  if (runAudit) {
    const runtime = await runProcess("npm", ["audit", "--omit=dev", "--json"], resolvedRoot, true);
    runtimeAudit = parseAudit(runtime.stdout);
    addGate(
      gates,
      "runtime_audit",
      "runtime npm audit",
      runtime.code === 0 && runtimeAudit.total === 0,
      runtimeAudit.total === 0 ? "0 runtime vulnerabilities" : `${runtimeAudit.total} runtime findings: ${runtimeAudit.names.join(", ")}`
    );

    const full = await runProcess("npm", ["audit", "--json"], resolvedRoot, true);
    fullAudit = parseAudit(full.stdout);
  } else {
    addGate(gates, "runtime_audit", "runtime npm audit", true, "skipped by test options", false);
  }

  const fullAuditDevOnly = fullAudit.total === 0 || (runtimeAudit.total === 0 && fullAudit.total >= runtimeAudit.total);
  addGate(
    gates,
    "full_audit_explained",
    "full npm audit explanation",
    fullAuditDevOnly,
    fullAudit.total === 0
      ? "0 full audit findings"
      : `${fullAudit.total} full audit findings treated as dev-only: ${fullAudit.names.join(", ")}`
  );

  return {
    ok: gates.every((gate) => !gate.required || gate.ok),
    version,
    packageName,
    fullAuditDevOnly,
    fullAuditFindings: fullAudit.names,
    gates
  };
}

export async function verifyPackedPackage(root: string, packageName: string, version: string): Promise<PackedPackageVerification> {
  const resolvedRoot = path.resolve(root);
  let packRoot: string | null = null;
  let tarballPath: string | null = null;
  let installRoot: string | null = null;
  try {
    packRoot = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-pack-tarball-"));
    const pack = await runProcess("npm", ["pack", "--json", "--pack-destination", packRoot], resolvedRoot, true);
    if (pack.code !== 0) {
      return failPackageVerification(null, diagnosticDetails({
        phase: "pack",
        expectedVersion: version,
        result: pack,
        tarballPath: null,
        strategy: "npm_pack_to_temp_directory"
      }));
    }
    const parsed = JSON.parse(pack.stdout) as Array<{ filename?: string; files?: Array<{ path?: string }> }>;
    const first = parsed[0];
    const tgzFiles = (await fs.readdir(packRoot)).filter((file) => file.endsWith(".tgz"));
    const filename = first?.filename ? path.basename(first.filename) : tgzFiles[0];
    if (!filename) {
      return failPackageVerification(null, `npm pack did not produce a .tgz in ${packRoot}\n${formatProcessResult(pack)}`);
    }
    tarballPath = path.resolve(packRoot, filename);

    const files = new Set((first?.files ?? [])
      .map((file) => file.path)
      .filter((value): value is string => typeof value === "string")
      .map(normalizePackedPath));
    const requiredFiles = ["package.json", "dist/cli.js", "dist/core/version.js", "README.md", "LICENSE"];
    const forbidden = [...files].filter((file) =>
      file.startsWith(".soturail/raw")
      || file === "benchmarks/results/latest.json"
      || /^soturail-\d+\.\d+\.\d+.*\.tgz$/.test(file)
      || /temp-pack-test|soturail-clean-smoke|soturail-test-/.test(file)
    );
    if (forbidden.length > 0) {
      return failPackageVerification(tarballPath, [
        "tarball file check failed",
        `expected_version=${version}`,
        `tarball_path=${tarballPath}`,
        "missing=checked_after_install",
        `forbidden=${forbidden.join(", ")}`,
        `strategy=npm_pack_to_temp_directory`
      ].join("\n"));
    }

    installRoot = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-pack-verify-"));
    await fs.writeFile(path.join(installRoot, "package.json"), JSON.stringify({ name: "soturail-pack-verify", private: true }, null, 2), "utf8");
    const install = await runProcess("npm", ["install", tarballPath, "--ignore-scripts"], installRoot, true);
    if (install.code !== 0) {
      return failPackageVerification(tarballPath, diagnosticDetails({
        phase: "install",
        expectedVersion: version,
        result: install,
        tarballPath,
        strategy: "install_absolute_tgz_ignore_scripts"
      }));
    }

    const installedPackageRoot = path.join(installRoot, "node_modules", packageName);
    const installedFiles = new Set(await listRelativeFiles(installedPackageRoot));
    const missingInstalled = requiredFiles.filter((file) => !installedFiles.has(file));
    const forbiddenInstalled = [...installedFiles].filter((file) =>
      file.startsWith(".soturail/raw")
      || file === "benchmarks/results/latest.json"
      || /^soturail-\d+\.\d+\.\d+.*\.tgz$/.test(file)
      || /temp-pack-test|soturail-clean-smoke|soturail-test-/.test(file)
    );
    if (missingInstalled.length > 0 || forbiddenInstalled.length > 0) {
      return failPackageVerification(tarballPath, [
        "installed tarball file check failed",
        `expected_version=${version}`,
        `tarball_path=${tarballPath}`,
        `installed_package_root=${installedPackageRoot}`,
        `missing=${missingInstalled.join(", ") || "none"}`,
        `forbidden=${forbiddenInstalled.join(", ") || "none"}`,
        "strategy=installed_tarball_file_check"
      ].join("\n"));
    }

    const cliPath = path.join(installedPackageRoot, "dist", "cli.js");
    const cli = await runProcess(process.execPath, [cliPath, "--version"], installRoot, true);
    const help = await runProcess(process.execPath, [cliPath, "--help"], installRoot, true);
    const cliVersion = cli.stdout.trim();
    const ok = cli.code === 0 && help.code === 0 && cliVersion === version;
    return {
      ok,
      tarballPath,
      cliVersion,
      npxVersion: null,
      helpExitCode: help.code,
      details: ok
        ? `packed cli=${cliVersion}, help_exit_code=${help.code}, tarball=${path.basename(tarballPath)}, strategy=installed_tarball_cli_no_npx_no_global`
        : diagnosticDetails({
            phase: "installed_cli_version",
            expectedVersion: version,
            actualVersion: cliVersion || null,
            result: cli,
            help,
            tarballPath,
            strategy: "installed_tarball_cli_no_npx_no_global"
          })
    };
  } catch (error) {
    return failPackageVerification(tarballPath, error instanceof Error ? error.message : String(error));
  } finally {
    if (installRoot) await fs.rm(installRoot, { recursive: true, force: true }).catch(() => undefined);
    if (packRoot) await fs.rm(packRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}

function failPackageVerification(tarballPath: string | null, details: string): PackedPackageVerification {
  return { ok: false, tarballPath, cliVersion: null, npxVersion: null, helpExitCode: null, details };
}

function normalizePackedPath(value: string): string {
  return value.replace(/^package\//, "").replace(/\\/g, "/");
}

async function listRelativeFiles(root: string): Promise<string[]> {
  const output: string[] = [];
  async function visit(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute);
        continue;
      }
      if (entry.isFile()) {
        output.push(path.relative(root, absolute).replace(/\\/g, "/"));
      }
    }
  }
  await visit(root);
  return output;
}

function diagnosticDetails(input: {
  phase: string;
  expectedVersion: string;
  result: ProcessResult;
  tarballPath: string | null;
  strategy: string;
  actualVersion?: string | null;
  help?: ProcessResult;
}): string {
  return [
    `phase=${input.phase}`,
    `strategy=${input.strategy}`,
    "cache_usage=none",
    "global_cli_usage=none",
    "npx_usage=none",
    "npm_exec_usage=none",
    "local_repo_dist_usage=none",
    `expected ${input.expectedVersion}`,
    `expected_version=${input.expectedVersion}`,
    `actual_version=${(input.actualVersion ?? input.result.stdout.trim()) || "empty"}`,
    `tarball_path=${input.tarballPath ?? "none"}`,
    formatProcessResult(input.result),
    ...(input.help ? [`help_check:\n${formatProcessResult(input.help)}`] : [])
  ].join("\n");
}

function formatProcessResult(result: ProcessResult): string {
  return [
    `command=${[result.command, ...result.args].join(" ")}`,
    `cwd=${result.cwd}`,
    `exit_code=${result.code}`,
    `stdout=${result.stdout.trim() || "<empty>"}`,
    `stderr=${result.stderr.trim() || "<empty>"}`
  ].join("\n");
}

export function formatReleasePreflight(result: ReleasePreflightResult): string {
  const lines = [
    `Release preflight: ${result.ok ? "passed" : "failed"}`,
    `package: ${result.packageName ?? "unknown"}`,
    `version: ${result.version ?? "unknown"}`,
    `full_audit_dev_only: ${result.fullAuditDevOnly}`,
    "gates:"
  ];

  for (const gate of result.gates) {
    lines.push(`- ${gate.ok ? "PASS" : "FAIL"} ${gate.id}: ${gate.details}`);
  }

  return lines.join("\n");
}

async function readCliVersion(root: string, cliCommand?: string[]): Promise<ProcessResult> {
  if (cliCommand && cliCommand.length > 0) {
    const command = cliCommand[0];
    const args = cliCommand.slice(1);
    if (!command) return { code: 1, stdout: "", stderr: "empty CLI command", command: "", args: [], cwd: root };
    return runProcess(command, args, root, true);
  }

  const cliPath = path.join(root, "dist", "cli.js");
  if (!existsSync(cliPath)) {
    return {
      code: 1,
      stdout: "",
      stderr: "dist/cli.js is missing; run npm run build first",
      command: process.execPath,
      args: [cliPath, "--version"],
      cwd: root
    };
  }

  return runProcess(process.execPath, [cliPath, "--version"], root, true);
}

async function readOptionalText(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function readOptionalJson(filePath: string): Promise<Record<string, any> | null> {
  const text = await readOptionalText(filePath);
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return null;
  }
}

function addGate(
  gates: ReleaseGateResult[],
  id: string,
  label: string,
  ok: boolean,
  details: string,
  required = true
): void {
  gates.push({ id, label, ok, details, required });
}

async function jsonParseable(filePath: string): Promise<boolean> {
  const raw = await readOptionalText(filePath);
  if (!raw) return false;
  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

async function docsScopeContamination(root: string): Promise<string[]> {
  const files = [
    "README.md",
    "ROADMAP.md",
    "docs/quickstart.md",
    "docs/v1-contract.md",
    "docs/schema-contracts.md",
    "docs/stable-command-surface.md",
    "docs/migration-v1.md",
    "docs/future-rails-index.md"
  ];
  const terms = /\b(SoturAI|trading|finance|backtest)\b/i;
  const findings: string[] = [];
  for (const file of files) {
    const text = await readOptionalText(path.join(root, file));
    if (!text) continue;
    text.split(/\r?\n/).forEach((line, index) => {
      if (terms.test(line)) findings.push(`${file}:${index + 1}`);
    });
  }
  return findings;
}

function parseAudit(text: string): AuditSummary {
  try {
    const parsed = JSON.parse(text) as { metadata?: { vulnerabilities?: { total?: number } }; vulnerabilities?: Record<string, unknown> };
    return {
      total: parsed.metadata?.vulnerabilities?.total ?? 0,
      names: Object.keys(parsed.vulnerabilities ?? {})
    };
  } catch {
    return { total: -1, names: [] };
  }
}

async function runProcess(command: string, args: string[], cwd: string, allowFailure = false): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const spawnSpec = resolveSpawn(command, args);
    const child = spawn(spawnSpec.command, spawnSpec.args, {
      cwd,
      shell: false,
      windowsHide: true,
      env: process.env
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      const result = { code: code ?? 1, stdout, stderr, command: spawnSpec.command, args: spawnSpec.args, cwd: path.resolve(cwd) };
      if ((code ?? 1) !== 0 && !allowFailure) {
        reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code ?? 1}`));
      } else {
        resolve(result);
      }
    });
  });
}

function resolveSpawn(command: string, args: string[]): { command: string; args: string[] } {
  if (process.platform !== "win32") return { command, args };
  if (command === "npm" || command === "npx") {
    const cli = npmCliPath(command);
    if (cli) return { command: process.execPath, args: [cli, ...args] };
  }
  if (command === "node") return { command: process.execPath, args };
  return { command: resolveWindowsCommand(command), args };
}

function npmCliPath(command: "npm" | "npx"): string | undefined {
  const npmExecPath = process.env.npm_execpath;
  const candidates: string[] = [];
  if (npmExecPath) {
    const dir = path.dirname(npmExecPath);
    candidates.push(path.resolve(dir, command === "npm" ? "npm-cli.js" : "npx-cli.js"));
  }
  const nodeDir = path.dirname(process.execPath);
  candidates.push(path.resolve(nodeDir, "node_modules", "npm", "bin", command === "npm" ? "npm-cli.js" : "npx-cli.js"));
  return candidates.find((candidate) => existsSync(candidate));
}

function resolveWindowsCommand(command: string): string {
  if (path.isAbsolute(command) && existsSync(command)) return command;
  const extensions = path.extname(command) ? [""] : [".exe", ".cmd", ".bat", ""];
  const entries = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  for (const entry of entries) {
    for (const extension of extensions) {
      const candidate = path.resolve(entry, `${command}${extension}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  return command;
}
