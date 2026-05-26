import { promises as fs } from "node:fs";
import path from "node:path";
import { estimateTokens, tokenEstimateNote } from "./token-estimator.js";

export interface FormatCompareReport {
  file: string;
  bytes: number;
  markdownTokens: number;
  jsonTokens: number | null;
  taggedTokens: number;
  compactSuggestion: string;
  taggedSuggestion: string;
  warnings: string[];
}

export async function compareFormats(file: string, root = process.cwd()): Promise<FormatCompareReport> {
  const absolute = path.resolve(root, file);
  const raw = await fs.readFile(absolute, "utf8");
  const json = tryParseJson(raw);
  const lineCount = raw.split(/\r?\n/).length;
  const repeatedKeys = [...raw.matchAll(/"([^"]+)"\s*:/g)].map((match) => match[1] ?? "");
  const keyFrequency = new Map<string, number>();
  for (const key of repeatedKeys) keyFrequency.set(key, (keyFrequency.get(key) ?? 0) + 1);
  const maxKeyRepeats = Math.max(0, ...keyFrequency.values());
  const warnings = [];
  if (hasProbableSecret(raw)) warnings.push("probable secret-like text; redact before agent handoff");
  if (json && containsHugeArray(json)) warnings.push("huge array detected; summarize or offload repeated rows");
  if (raw.length > 12000) warnings.push("long prompt context; prefer tagged blocks or offload");
  return {
    file,
    bytes: Buffer.byteLength(raw, "utf8"),
    markdownTokens: estimateTokens(raw),
    jsonTokens: json ? estimateTokens(JSON.stringify(json)) : null,
    taggedTokens: estimateTokens(`<soturail_context source="${file}">\n${raw}\n</soturail_context>`),
    compactSuggestion: maxKeyRepeats >= 4 || lineCount > 80 ? "consider compact table/TOON-like summary for repetitive records" : "markdown is probably adequate",
    taggedSuggestion: raw.length > 4000 ? "tagged blocks may help boundary clarity" : "tagged blocks optional",
    warnings
  };
}

export function renderFormatCompare(report: FormatCompareReport): string {
  return [
    "SotuRail format compare",
    `file: ${report.file}`,
    `bytes: ${report.bytes}`,
    `markdown_estimated_tokens: ${report.markdownTokens}`,
    `json_estimated_tokens: ${report.jsonTokens ?? "not valid json"}`,
    `tagged_estimated_tokens: ${report.taggedTokens}`,
    `compact_suggestion: ${report.compactSuggestion}`,
    `tagged_suggestion: ${report.taggedSuggestion}`,
    tokenEstimateNote(),
    "",
    "Warnings:",
    ...(report.warnings.length > 0 ? report.warnings.map((warning) => `- ${warning}`) : ["- none"])
  ].join("\n") + "\n";
}

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function hasProbableSecret(raw: string): boolean {
  return /(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']?[A-Za-z0-9._-]{6,}/i.test(raw)
    || /authorization\s*:\s*bearer\s+[A-Za-z0-9._-]+/i.test(raw)
    || /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(raw);
}

function containsHugeArray(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 50 || value.some(containsHugeArray);
  if (value && typeof value === "object") return Object.values(value).some(containsHugeArray);
  return false;
}
