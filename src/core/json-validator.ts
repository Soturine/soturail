import { promises as fs } from "node:fs";
import path from "node:path";

export interface DuplicateKeyFinding {
  key: string;
  count: number;
  line: number;
  column: number;
}

export interface HugeArrayFinding {
  path: string;
  length: number;
}

export interface JsonValidationReport {
  file: string;
  strict: boolean;
  validJson: boolean;
  parseError: string | null;
  duplicateKeys: DuplicateKeyFinding[];
  probableSecrets: string[];
  hugeArrays: HugeArrayFinding[];
  result: "pass" | "warn" | "fail";
}

export async function validateJsonFile(file: string, options: { strict?: boolean } = {}, root = process.cwd()): Promise<JsonValidationReport> {
  const absolute = path.resolve(root, file);
  const raw = await fs.readFile(absolute, "utf8");
  const duplicateKeys = options.strict ? detectDuplicateKeys(raw) : [];
  const probableSecrets = detectProbableSecrets(raw);
  let parsed: unknown = null;
  let parseError: string | null = null;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }
  const hugeArrays = parseError ? [] : findHugeArrays(parsed);
  const validJson = parseError === null;
  const warningCount = duplicateKeys.length + probableSecrets.length + hugeArrays.length;
  return {
    file,
    strict: options.strict === true,
    validJson,
    parseError,
    duplicateKeys,
    probableSecrets,
    hugeArrays,
    result: !validJson ? "fail" : warningCount > 0 ? "warn" : "pass"
  };
}

export function renderJsonValidation(report: JsonValidationReport): string {
  const lines = [
    "SotuRail JSON strict validate",
    `file: ${report.file}`,
    `strict: ${report.strict}`,
    `valid_json: ${report.validJson}`,
    `result: ${report.result}`
  ];
  if (report.parseError) lines.push(`parse_error: ${report.parseError}`);
  lines.push(
    `duplicate_keys: ${report.duplicateKeys.length}`,
    `probable_secrets: ${report.probableSecrets.length}`,
    `huge_arrays: ${report.hugeArrays.length}`,
    "",
    "Duplicate keys:"
  );
  lines.push(
    ...(report.duplicateKeys.length > 0
      ? report.duplicateKeys.map((finding) => `- ${finding.key} (${finding.count} copies at ${finding.line}:${finding.column})`)
      : ["- none"])
  );
  lines.push("", "Probable secrets:");
  lines.push(...(report.probableSecrets.length > 0 ? report.probableSecrets.map((finding) => `- ${finding}`) : ["- none"]));
  lines.push("", "Huge arrays:");
  lines.push(...(report.hugeArrays.length > 0 ? report.hugeArrays.map((finding) => `- ${finding.path}: ${finding.length} items`) : ["- none"]));
  lines.push("", "Safety:", "- Redact probable secrets before agent handoff.", "- Summarize or offload huge arrays instead of pasting them into prompts.");
  return `${lines.join("\n")}\n`;
}

function detectDuplicateKeys(raw: string): DuplicateKeyFinding[] {
  const findings: DuplicateKeyFinding[] = [];
  const stack: Array<{ keys: Map<string, { count: number; index: number }> }> = [];
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (char === "{") {
      stack.push({ keys: new Map() });
      continue;
    }
    if (char === "}") {
      stack.pop();
      continue;
    }
    if (char !== "\"") continue;
    const parsed = readJsonString(raw, i);
    if (!parsed) continue;
    const next = skipWhitespace(raw, parsed.end + 1);
    if (raw[next] === ":" && stack.length > 0) {
      const frame = stack[stack.length - 1]!;
      const previous = frame.keys.get(parsed.value);
      if (previous) {
        previous.count += 1;
        const position = lineColumn(raw, parsed.start);
        findings.push({ key: parsed.value, count: previous.count, line: position.line, column: position.column });
      } else {
        frame.keys.set(parsed.value, { count: 1, index: parsed.start });
      }
    }
    i = parsed.end;
  }
  return findings;
}

function readJsonString(raw: string, start: number): { value: string; start: number; end: number } | null {
  for (let i = start + 1; i < raw.length; i += 1) {
    const char = raw[i];
    if (char === "\\") {
      i += 1;
      continue;
    }
    if (char === "\"") {
      try {
        return { value: JSON.parse(raw.slice(start, i + 1)) as string, start, end: i };
      } catch {
        return { value: raw.slice(start + 1, i), start, end: i };
      }
    }
  }
  return null;
}

function skipWhitespace(raw: string, index: number): number {
  let i = index;
  while (i < raw.length && /\s/.test(raw[i] ?? "")) i += 1;
  return i;
}

function lineColumn(raw: string, index: number): { line: number; column: number } {
  const before = raw.slice(0, index);
  const lines = before.split(/\r?\n/);
  return { line: lines.length, column: (lines[lines.length - 1]?.length ?? 0) + 1 };
}

function detectProbableSecrets(raw: string): string[] {
  const findings = new Set<string>();
  const patterns: Array<[RegExp, string]> = [
    [/"?(api[_-]?key|token|secret|password|authorization)"?\s*:/gi, "secret-like key name"],
    [/authorization\s*:\s*bearer\s+[A-Za-z0-9._-]+/gi, "authorization bearer value"],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/g, "private key block"]
  ];
  for (const [pattern, label] of patterns) {
    if (pattern.test(raw)) findings.add(label);
  }
  return [...findings];
}

function findHugeArrays(value: unknown, currentPath = "$"): HugeArrayFinding[] {
  if (Array.isArray(value)) {
    const own = value.length > 50 ? [{ path: currentPath, length: value.length }] : [];
    return [...own, ...value.flatMap((item, index) => findHugeArrays(item, `${currentPath}[${index}]`))];
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => findHugeArrays(child, `${currentPath}.${key}`));
  }
  return [];
}
