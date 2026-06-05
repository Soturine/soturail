import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getWorkspacePaths, relativeToRoot, writeJson } from "./config.js";
import { SOTURAIL_VERSION } from "./version.js";

export type QualityStatus = "passed" | "warning" | "failed";
export type QualitySeverity = "info" | "warning" | "strong-warning" | "blocking";

export interface QualityFinding {
  id: string;
  type: string;
  severity: QualitySeverity;
  path: string;
  line?: number;
  message: string;
  nextCommand?: string;
}

export interface CodeHealthReport {
  schemaVersion: "soturail.code-health.v1";
  createdAt: string;
  version: string;
  status: QualityStatus;
  strict: boolean;
  summary: {
    filesScanned: number;
    warnings: number;
    blockingIssues: number;
  };
  findings: QualityFinding[];
  warnings: string[];
  nextCommands: string[];
}

export interface ArchitectureCheckReport {
  schemaVersion: "soturail.architecture.check.v1";
  createdAt: string;
  version: string;
  status: QualityStatus;
  strict: boolean;
  summary: {
    filesScanned: number;
    warnings: number;
    blockingIssues: number;
  };
  findings: QualityFinding[];
  warnings: string[];
  nextCommands: string[];
}

export interface QualityOptions {
  strict?: boolean;
}

const stableCommandFiles = new Set([
  "src/commands/status.ts",
  "src/commands/report.ts",
  "src/commands/dashboard.ts",
  "src/commands/obs.ts",
  "src/commands/bench.ts",
  "src/commands/native.ts",
  "src/commands/self.ts",
  "src/commands/release.ts",
  "src/commands/agents.ts",
  "src/commands/mcp.ts"
]);

const requiredV1Docs = [
  "README.md",
  "ROADMAP.md",
  "CHANGELOG.md",
  "docs/quickstart.md",
  "docs/v1-contract.md",
  "docs/schema-contracts.md",
  "docs/stable-command-surface.md",
  "docs/deprecation-policy.md",
  "docs/migration-v1.md",
  "docs/agent-hosts.md",
  "docs/host-matrix-schema.md",
  "docs/agent-export-contract.md",
  "docs/mcp-host-manifest.md",
  "docs/clean-code-guidelines.md",
  "docs/architecture-boundaries.md"
];

export async function runCodeHealth(root = process.cwd(), options: QualityOptions = {}): Promise<{ report: CodeHealthReport; jsonPath: string; markdownPath: string; output: string }> {
  const resolvedRoot = path.resolve(root);
  const files = await listFiles(resolvedRoot, ["src", "docs"], [".ts", ".md"]);
  const findings: QualityFinding[] = [];

  for (const file of files) {
    const relative = normalizePath(path.relative(resolvedRoot, file));
    const text = await fs.readFile(file, "utf8").catch(() => "");
    const lines = text.split(/\r?\n/);
    checkFileSize(relative, lines, findings);
    if (relative.endsWith(".ts")) {
      checkLongFunctions(relative, lines, findings);
      checkManualJson(relative, lines, findings);
      checkCriticalTodos(relative, lines, findings);
    }
  }

  findings.push(...await checkRequiredDocs(resolvedRoot));
  findings.push(...await checkMarkdownLinks(resolvedRoot));
  findings.push(...await checkScopeContamination(resolvedRoot));

  const report = makeCodeHealthReport(files.length, findings, options.strict === true);
  const dir = path.join(getWorkspacePaths(resolvedRoot).workspace, "code-health");
  const jsonPath = path.join(dir, "latest.json");
  const markdownPath = path.join(dir, "latest.md");
  await writeJson(jsonPath, report);
  await fs.writeFile(markdownPath, renderCodeHealthMarkdown(report), "utf8");
  return {
    report,
    jsonPath,
    markdownPath,
    output: renderQualityOutput("SotuRail code health", report, resolvedRoot, jsonPath, markdownPath)
  };
}

export async function runArchitectureCheck(root = process.cwd(), options: QualityOptions = {}): Promise<{ report: ArchitectureCheckReport; jsonPath: string; markdownPath: string; output: string }> {
  const resolvedRoot = path.resolve(root);
  const files = await listFiles(resolvedRoot, ["src"], [".ts"]);
  const findings: QualityFinding[] = [];

  for (const file of files) {
    const relative = normalizePath(path.relative(resolvedRoot, file));
    const text = await fs.readFile(file, "utf8").catch(() => "");
    const lines = text.split(/\r?\n/);
    if (relative.startsWith("src/core/") && /from\s+["']commander["']|from\s+["']\.\.\/commands\//.test(text)) {
      findings.push(finding("core_cli_import", "architecture_boundary", "strong-warning", relative, 1, "Core modules should not import CLI command concerns."));
    }
    if (relative.startsWith("src/commands/") && lines.length > 500) {
      findings.push(finding("command_business_logic", "architecture_boundary", "warning", relative, 1, "Command file is large; keep CLI parsing in commands/ and move domain logic to core/."));
    }
  }

  const report = makeArchitectureReport(files.length, findings, options.strict === true);
  const dir = path.join(getWorkspacePaths(resolvedRoot).workspace, "architecture");
  const jsonPath = path.join(dir, "check.json");
  const markdownPath = path.join(dir, "check.md");
  await writeJson(jsonPath, report);
  await fs.writeFile(markdownPath, renderArchitectureMarkdown(report), "utf8");
  return {
    report,
    jsonPath,
    markdownPath,
    output: renderQualityOutput("SotuRail architecture check", report, resolvedRoot, jsonPath, markdownPath)
  };
}

function checkFileSize(relative: string, lines: string[], findings: QualityFinding[]): void {
  if (lines.length > 800) {
    findings.push(finding("large_file_strong", "large_file", "strong-warning", relative, 1, `File has ${lines.length} lines; consider a focused split after v1.0 if behavior is stable.`));
    return;
  }
  if (lines.length > 500) {
    findings.push(finding("large_file", "large_file", "warning", relative, 1, `File has ${lines.length} lines; keep an eye on ownership boundaries.`));
  }
}

function checkLongFunctions(relative: string, lines: string[], findings: QualityFinding[]): void {
  let start = -1;
  let depth = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (start < 0 && /\b(async\s+)?function\b|=>\s*\{/.test(line)) {
      start = index;
      depth = braceDelta(line);
      continue;
    }
    if (start >= 0) {
      depth += braceDelta(line);
      if (depth <= 0) {
        const length = index - start + 1;
        if (length > 140) {
          findings.push(finding("very_long_function", "long_function", "strong-warning", relative, start + 1, `Function-like block is ${length} lines; split when it becomes behaviorally safe.`));
        } else if (length > 80) {
          findings.push(finding("long_function", "long_function", "warning", relative, start + 1, `Function-like block is ${length} lines; consider extracting helpers if touched again.`));
        }
        start = -1;
        depth = 0;
      }
    }
  }
}

function checkManualJson(relative: string, lines: string[], findings: QualityFinding[]): void {
  if (!stableCommandFiles.has(relative)) return;
  lines.forEach((line, index) => {
    const writesJsonLikeString = /process\.stdout\.write\([^)]*[`'"]\s*\{/.test(line) && !line.includes("JSON.stringify");
    if (writesJsonLikeString) {
      findings.push(finding("manual_json_stdout", "manual_json", "blocking", relative, index + 1, "Stable --json paths must build objects and print JSON.stringify output."));
    }
  });
}

function checkCriticalTodos(relative: string, lines: string[], findings: QualityFinding[]): void {
  if (!relative.startsWith("src/commands/") && !relative.startsWith("src/core/")) return;
  lines.forEach((line, index) => {
    if (relative === "src/core/code-health.ts" && line.includes("TODO/FIXME in stable")) return;
    if (/\b(TODO|FIXME)\b/i.test(line)) {
      findings.push(finding("critical_todo", "todo", "warning", relative, index + 1, "TODO/FIXME in stable source should be tracked before v1 hardening."));
    }
  });
}

async function checkRequiredDocs(root: string): Promise<QualityFinding[]> {
  return requiredV1Docs
    .filter((file) => !existsSync(path.join(root, file)))
    .map((file) => finding("required_doc_missing", "docs", "blocking", file, undefined, "Required v1 documentation file is missing."));
}

async function checkMarkdownLinks(root: string): Promise<QualityFinding[]> {
  const findings: QualityFinding[] = [];
  for (const relative of requiredV1Docs.filter((file) => file.endsWith(".md"))) {
    const absolute = path.join(root, relative);
    const text = await fs.readFile(absolute, "utf8").catch(() => "");
    const dir = path.dirname(absolute);
    for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = (match[1] ?? "").trim().replace(/^<|>$/g, "");
      if (!target || target.startsWith("#") || /^[a-z]+:/i.test(target)) continue;
      const withoutAnchor = target.split("#")[0];
      if (!withoutAnchor) continue;
      const candidate = path.resolve(dir, withoutAnchor);
      if (!existsSync(candidate)) {
        findings.push(finding("markdown_link_missing", "docs", "warning", relative, undefined, `Markdown link target is missing: ${target}`));
      }
    }
  }
  return findings;
}

async function checkScopeContamination(root: string): Promise<QualityFinding[]> {
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
  const findings: QualityFinding[] = [];
  for (const file of files) {
    const text = await fs.readFile(path.join(root, file), "utf8").catch(() => "");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (terms.test(line)) {
        findings.push(finding("scope_contamination", "docs", "blocking", file, index + 1, "SotuRail v1 docs must not include SoturAI/finance/trading/backtest roadmap scope."));
      }
    });
  }
  return findings;
}

function makeCodeHealthReport(filesScanned: number, findings: QualityFinding[], strict: boolean): CodeHealthReport {
  const blocking = findings.filter((item) => item.severity === "blocking");
  const warnings = findings.filter((item) => item.severity === "warning" || item.severity === "strong-warning");
  return {
    schemaVersion: "soturail.code-health.v1",
    createdAt: new Date().toISOString(),
    version: SOTURAIL_VERSION,
    status: blocking.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
    strict,
    summary: { filesScanned, warnings: warnings.length, blockingIssues: blocking.length },
    findings,
    warnings: warnings.map((item) => `${item.path}${item.line ? `:${item.line}` : ""} ${item.message}`),
    nextCommands: [
      "soturail self code-health --json",
      "soturail self architecture --check",
      "npm run typecheck",
      "npm test"
    ]
  };
}

function makeArchitectureReport(filesScanned: number, findings: QualityFinding[], strict: boolean): ArchitectureCheckReport {
  const blocking = findings.filter((item) => item.severity === "blocking");
  const warnings = findings.filter((item) => item.severity === "warning" || item.severity === "strong-warning");
  return {
    schemaVersion: "soturail.architecture.check.v1",
    createdAt: new Date().toISOString(),
    version: SOTURAIL_VERSION,
    status: blocking.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
    strict,
    summary: { filesScanned, warnings: warnings.length, blockingIssues: blocking.length },
    findings,
    warnings: warnings.map((item) => `${item.path}${item.line ? `:${item.line}` : ""} ${item.message}`),
    nextCommands: [
      "soturail self architecture --check --json",
      "soturail self code-health",
      "docs/architecture-boundaries.md"
    ]
  };
}

function renderCodeHealthMarkdown(report: CodeHealthReport): string {
  return renderQualityMarkdown("SotuRail Code Health", report);
}

function renderArchitectureMarkdown(report: ArchitectureCheckReport): string {
  return renderQualityMarkdown("SotuRail Architecture Check", report);
}

function renderQualityMarkdown(title: string, report: CodeHealthReport | ArchitectureCheckReport): string {
  return [
    `# ${title}`,
    "",
    `schemaVersion: ${report.schemaVersion}`,
    `createdAt: ${report.createdAt}`,
    `version: ${report.version}`,
    `status: ${report.status}`,
    `strict: ${report.strict}`,
    "",
    "## Summary",
    "",
    `- filesScanned: ${report.summary.filesScanned}`,
    `- warnings: ${report.summary.warnings}`,
    `- blockingIssues: ${report.summary.blockingIssues}`,
    "",
    "## Findings",
    "",
    ...(report.findings.length > 0 ? report.findings.map((item) => `- ${item.severity.toUpperCase()} ${item.path}${item.line ? `:${item.line}` : ""} ${item.message}`) : ["- none"]),
    "",
    "## Next Commands",
    "",
    ...report.nextCommands.map((command) => `- \`${command}\``),
    ""
  ].join("\n");
}

function renderQualityOutput(title: string, report: CodeHealthReport | ArchitectureCheckReport, root: string, jsonPath: string, markdownPath: string): string {
  return [
    title,
    `status: ${report.status}`,
    `strict: ${report.strict}`,
    `files_scanned: ${report.summary.filesScanned}`,
    `warnings: ${report.summary.warnings}`,
    `blocking_issues: ${report.summary.blockingIssues}`,
    `json: ${relativeToRoot(root, jsonPath)}`,
    `markdown: ${relativeToRoot(root, markdownPath)}`,
    "next_commands:",
    ...report.nextCommands.map((command) => `- ${command}`)
  ].join("\n") + "\n";
}

async function listFiles(root: string, roots: string[], extensions: string[]): Promise<string[]> {
  const output: string[] = [];
  for (const entry of roots) {
    await visit(path.join(root, entry), output, extensions);
  }
  return output.sort((a, b) => a.localeCompare(b));
}

async function visit(dir: string, output: string[], extensions: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git" || entry.name === ".soturail") continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await visit(absolute, output, extensions);
    } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
      output.push(absolute);
    }
  }
}

function finding(id: string, type: string, severity: QualitySeverity, filePath: string, line: number | undefined, message: string): QualityFinding {
  return { id, type, severity, path: normalizePath(filePath), ...(line === undefined ? {} : { line }), message };
}

function braceDelta(line: string): number {
  return [...line].reduce((sum, char) => sum + (char === "{" ? 1 : char === "}" ? -1 : 0), 0);
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}
