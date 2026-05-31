import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getWorkspacePaths, relativeToRoot, writeJson } from "./config.js";

export interface ReportRedaction {
  kind: string;
  count: number;
}

export interface RedactionResult {
  text: string;
  redactions: ReportRedaction[];
}

export interface ReportSafetyResult {
  schemaVersion: "soturail.report-safety.v1";
  ok: boolean;
  checkedAt: string;
  files: Array<{ path: string; exists: boolean; redactions: ReportRedaction[] }>;
  findings: string[];
}

const patterns: Array<{ kind: string; pattern: RegExp; replacement: string }> = [
  { kind: "private-key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, replacement: "[REDACTED_PRIVATE_KEY]" },
  { kind: "authorization-header", pattern: /Authorization\s*:\s*[^\r\n]+/gi, replacement: "Authorization: [REDACTED]" },
  { kind: "bearer-token", pattern: /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, replacement: "Bearer [REDACTED]" },
  { kind: "github-token", pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, replacement: "[REDACTED_GITHUB_TOKEN]" },
  { kind: "npm-token", pattern: /\bnpm_[A-Za-z0-9]{20,}\b/g, replacement: "[REDACTED_NPM_TOKEN]" },
  { kind: "secret-assignment", pattern: /\b(password|token|secret|api[_-]?key)\s*[:=]\s*["']?[^"'\s]+/gi, replacement: "$1=[REDACTED]" },
  { kind: "env-secret", pattern: /^\s*([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY)[A-Z0-9_]*)\s*=\s*[^\r\n]+/gim, replacement: "$1=[REDACTED]" },
  { kind: "contextual-high-entropy", pattern: /\b(?:credential|secret|token)\s*[:=]\s*[A-Za-z0-9_./+=-]{48,}/gi, replacement: "[REDACTED_HIGH_ENTROPY_SECRET]" }
];

export function redactText(input: string): RedactionResult {
  let text = input;
  const redactions: ReportRedaction[] = [];
  for (const item of patterns) {
    let count = 0;
    text = text.replace(item.pattern, () => {
      count += 1;
      return item.replacement;
    });
    if (count > 0) redactions.push({ kind: item.kind, count });
  }
  return { text, redactions };
}

export async function scanReportSafety(root = process.cwd()): Promise<ReportSafetyResult> {
  const paths = getWorkspacePaths(root);
  const statusDir = path.join(paths.workspace, "status");
  const files = [
    path.join(paths.reportsDir, "latest.json"),
    path.join(paths.reportsDir, "latest.md"),
    path.join(paths.reportsDir, "latest.html"),
    path.join(statusDir, "latest.md"),
    path.join(statusDir, "agent.md")
  ];
  const checked: ReportSafetyResult["files"] = [];
  for (const filePath of files) {
    if (!existsSync(filePath)) {
      checked.push({ path: relativeToRoot(root, filePath), exists: false, redactions: [] });
      continue;
    }
    const raw = await fs.readFile(filePath, "utf8").catch(() => "");
    checked.push({ path: relativeToRoot(root, filePath), exists: true, redactions: redactText(raw).redactions });
  }
  const findings = checked.flatMap((file) => file.redactions.map((redaction) => `${file.path}: ${redaction.count} ${redaction.kind}`));
  return {
    schemaVersion: "soturail.report-safety.v1",
    ok: findings.length === 0,
    checkedAt: new Date().toISOString(),
    files: checked,
    findings
  };
}

export async function writeRedactedReports(root = process.cwd()): Promise<{ output: string; safety: ReportSafetyResult; written: string[] }> {
  const paths = getWorkspacePaths(root);
  const written: string[] = [];
  const pairs = [
    [path.join(paths.reportsDir, "latest.md"), path.join(paths.reportsDir, "latest.redacted.md")],
    [path.join(paths.reportsDir, "latest.json"), path.join(paths.reportsDir, "latest.redacted.json")]
  ] as const;
  await fs.mkdir(paths.reportsDir, { recursive: true });
  for (const [input, output] of pairs) {
    const raw = await fs.readFile(input, "utf8").catch(() => "");
    if (!raw) continue;
    await fs.writeFile(output, redactText(raw).text, "utf8");
    written.push(output);
  }
  const safety = await scanReportSafety(root);
  await writeJson(path.join(paths.reportsDir, "safety.json"), safety);
  const redactionKinds = summarizeRedactions(safety.findings);
  return {
    safety,
    written,
    output: [
      "SotuRail report redact",
      `ok: ${safety.ok}`,
      `findings: ${safety.findings.length}`,
      `redactions: ${redactionKinds.length === 0 ? "none" : redactionKinds.join(", ")}`,
      "note: redaction reports list finding kinds and counts only; secret values are not printed.",
      "note: normal package hashes and integrity hashes are not redacted unless they look credential-like.",
      `written: ${written.length === 0 ? "none" : written.map((file) => relativeToRoot(root, file)).join(", ")}`
    ].join("\n") + "\n"
  };
}

function summarizeRedactions(findings: string[]): string[] {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    const match = /: (\d+) ([\w-]+)/.exec(finding);
    if (!match) continue;
    const countText = match[1];
    const kind = match[2];
    if (!countText || !kind) continue;
    counts.set(kind, (counts.get(kind) ?? 0) + Number(countText));
  }
  return [...counts.entries()].sort().map(([kind, count]) => `${kind}=${count}`);
}
