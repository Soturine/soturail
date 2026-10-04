import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";

export function makeRailId(prefix: string, seed = ""): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${prefix}_${stamp}_${sha256Text(`${prefix}:${seed}:${Date.now()}`).slice(0, 8)}`;
}

export function sha256Text(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export async function pathExists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}

export interface StableSlugOptions {
  fallback: string;
  maxLength?: number;
  separator?: "-" | "_";
  /** Append a short digest when non-ASCII letters/digits could not be represented. */
  hashOnLoss?: boolean;
}

/**
 * Locale-neutral machine slug. ASCII input yields the historical slug unchanged;
 * Latin diacritics are folded (NFD); any remaining non-ASCII letters or digits
 * (CJK, Cyrillic, ...) add a digest of the exact input so distinct names never
 * collapse onto the same identifier.
 */
export function stableSlug(value: string, options: StableSlugOptions): string {
  const separator = options.separator ?? "-";
  const maxLength = options.maxLength ?? 64;
  const folded = value.normalize("NFD").replace(/\p{M}+/gu, "");
  const lossy = /[^\x00-\x7f]/u.test(folded.replace(/[^\p{L}\p{N}]+/gu, ""));
  const suffix = lossy && options.hashOnLoss !== false ? `${separator}${sha256Text(value).slice(0, 8)}` : "";
  const edge = separator === "-" ? /^-+|-+$/g : /^_+|_+$/g;
  const base = folded.toLowerCase().replace(/[^a-z0-9]+/g, separator).replace(edge, "").slice(0, Math.max(1, maxLength - suffix.length)).replace(edge, "");
  return `${base || options.fallback}${suffix}`;
}

/**
 * Lexical tokens for the offline fallback ranker. Script-neutral (letters,
 * marks and digits of any script survive); it is not a semantic analyzer and
 * has no per-language word lists. ASCII output is unchanged from v1.5.
 */
export function normalizeWords(value: string): string[] {
  return value
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}_./:-]+/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 200);
}

export function keywordScore(query: string, text: string): { score: number; reason: string } {
  const needle = query.trim().toLowerCase();
  const haystack = text.toLowerCase();
  const queryWords = new Set(normalizeWords(query));
  const textWords = new Set(normalizeWords(text));
  let score = needle.length > 0 && haystack.includes(needle) ? 8 : 0;
  let overlaps = 0;
  for (const word of queryWords) {
    if (textWords.has(word) || haystack.includes(word)) overlaps += 1;
  }
  score += overlaps * 2;
  const reason = score >= 8
    ? "exact phrase and keyword match"
    : overlaps > 0
      ? `keyword overlap: ${overlaps}`
      : "low local signal";
  return { score, reason };
}

export function summarizeText(text: string, maxChars = 500): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length <= maxChars ? compact : `${compact.slice(0, maxChars - 3).trimEnd()}...`;
}

export function redactProbableSecrets(text: string): string {
  return text
    .replace(/(authorization:\s*bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/g, "$1[REDACTED]")
    .replace(/\b(npm_[A-Za-z0-9]{20,})\b/g, "[REDACTED_NPM_TOKEN]")
    .replace(/\b(gh[pousr]_[A-Za-z0-9_]{20,})\b/g, "[REDACTED_GITHUB_TOKEN]")
    .replace(/\b(sk-[A-Za-z0-9]{20,})\b/g, "[REDACTED_API_KEY]")
    .replace(/\b((?:OPENAI|ANTHROPIC|GEMINI|GOOGLE|AWS|NPM|GITHUB)?_?(?:API_)?(?:KEY|TOKEN|SECRET|PASSWORD))\s*=\s*([^\s#]+)/gi, "$1=[REDACTED]")
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]");
}
