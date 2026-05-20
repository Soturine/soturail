import { promises as fs } from "node:fs";
import path from "node:path";
import type { SotuRailConfig } from "./config.js";
import { writeJson } from "./config.js";

const ALWAYS_IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage"]);
const ALWAYS_IGNORED_PATH_PREFIXES = [".soturail/raw"];

export interface GitignoreRule {
  pattern: string;
  negate: boolean;
  directoryOnly: boolean;
  anchored: boolean;
}

export interface ExtractedSymbol {
  name: string;
  kind: string;
  line: number;
}

export interface ExtractedContract {
  kind: string;
  value: string;
  line: number;
}

export interface RepoMapFile {
  path: string;
  size_bytes: number;
  language: string;
  symbols: ExtractedSymbol[];
  contracts: ExtractedContract[];
}

export interface ScanStats {
  scanned_files: number;
  ignored_files: number;
  ignored_directories: number;
}

export interface RepoMap {
  title: "Heuristic Repo Map";
  generated_at: string;
  root: string;
  total_files: number;
  stats: ScanStats;
  files: RepoMapFile[];
}

export function normalizeForIgnore(inputPath: string): string {
  return path
    .normalize(inputPath)
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

export function parseGitignore(content: string): GitignoreRule[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const negate = line.startsWith("!");
      const withoutNegation = negate ? line.slice(1) : line;
      const directoryOnly = withoutNegation.endsWith("/");
      const anchored = withoutNegation.startsWith("/");
      const clean = normalizeForIgnore(withoutNegation.replace(/^\/+/, "").replace(/\/+$/, ""));
      return { pattern: clean, negate, directoryOnly, anchored };
    })
    .filter((rule) => rule.pattern.length > 0);
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^/]*");
  return new RegExp(`^${escaped}$`);
}

function basename(relativePath: string): string {
  const normalized = normalizeForIgnore(relativePath);
  const parts = normalized.split("/");
  return parts[parts.length - 1] ?? normalized;
}

function ruleMatches(rule: GitignoreRule, relativePath: string, isDirectory: boolean): boolean {
  const normalized = normalizeForIgnore(relativePath);
  if (rule.directoryOnly && !isDirectory && !normalized.startsWith(`${rule.pattern}/`)) {
    return false;
  }

  if (rule.directoryOnly) {
    return normalized === rule.pattern || normalized.startsWith(`${rule.pattern}/`);
  }

  if (rule.pattern.includes("*")) {
    const target = rule.anchored || rule.pattern.includes("/") ? normalized : basename(normalized);
    return globToRegExp(rule.pattern).test(target);
  }

  if (rule.anchored || rule.pattern.includes("/")) {
    return normalized === rule.pattern || normalized.startsWith(`${rule.pattern}/`);
  }

  return normalized.split("/").includes(rule.pattern) || basename(normalized) === rule.pattern;
}

export function isIgnoredByRules(relativePath: string, isDirectory: boolean, rules: GitignoreRule[]): boolean {
  let ignored = false;
  for (const rule of rules) {
    if (ruleMatches(rule, relativePath, isDirectory)) {
      ignored = !rule.negate;
    }
  }
  return ignored;
}

export function isAlwaysIgnored(relativePath: string, isDirectory: boolean): boolean {
  const normalized = normalizeForIgnore(relativePath);
  const firstSegment = normalized.split("/")[0] ?? normalized;
  if (isDirectory && ALWAYS_IGNORED_DIRS.has(firstSegment)) {
    return true;
  }
  if (ALWAYS_IGNORED_DIRS.has(firstSegment)) {
    return true;
  }
  return ALWAYS_IGNORED_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

function extensionOf(relativePath: string): string {
  return path.extname(relativePath).replace(".", "").toLowerCase();
}

function languageFor(relativePath: string): string {
  const ext = extensionOf(relativePath);
  if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext)) {
    return "typescript/javascript";
  }
  if (ext === "py") {
    return "python";
  }
  if (ext === "java") {
    return "java";
  }
  if (ext === "json") {
    return "json";
  }
  if (["md", "mdx"].includes(ext)) {
    return "markdown";
  }
  return ext.length > 0 ? ext : "text";
}

function extractSymbols(relativePath: string, text: string): { symbols: ExtractedSymbol[]; contracts: ExtractedContract[] } {
  const language = languageFor(relativePath);
  const lines = text.split(/\r?\n/);
  const symbols: ExtractedSymbol[] = [];
  const contracts: ExtractedContract[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    const contractMatch = trimmed.match(/^(?:import|export)\s+.+/);
    if (contractMatch && ["typescript/javascript", "python"].includes(language)) {
      contracts.push({ kind: "module-boundary", value: trimmed.slice(0, 200), line: lineNumber });
    }

    if (language === "typescript/javascript") {
      const symbolMatch = trimmed.match(
        /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:class|interface|type|function|const|let|var)\s+([A-Za-z_$][\w$]*)/
      );
      if (symbolMatch?.[1]) {
        const kind = trimmed.includes("class")
          ? "class"
          : trimmed.includes("interface")
            ? "interface"
            : trimmed.includes("type")
              ? "type"
              : trimmed.includes("function")
                ? "function"
                : "value";
        symbols.push({ name: symbolMatch[1], kind, line: lineNumber });
      }
      return;
    }

    if (language === "python") {
      const symbolMatch = trimmed.match(/^(?:async\s+)?(?:def|class)\s+([A-Za-z_][\w]*)/);
      if (symbolMatch?.[1]) {
        symbols.push({ name: symbolMatch[1], kind: trimmed.startsWith("class") ? "class" : "function", line: lineNumber });
      }
      return;
    }

    if (language === "java") {
      const classMatch = trimmed.match(/\b(?:class|interface|enum|record)\s+([A-Za-z_][\w]*)/);
      if (classMatch?.[1]) {
        symbols.push({ name: classMatch[1], kind: "type", line: lineNumber });
      }
      const methodMatch = trimmed.match(
        /^(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?[\w<>\[\]]+\s+([A-Za-z_][\w]*)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\{?$/
      );
      if (methodMatch?.[1] && !["if", "for", "while", "switch"].includes(methodMatch[1])) {
        symbols.push({ name: methodMatch[1], kind: "method", line: lineNumber });
      }
    }
  });

  return { symbols, contracts };
}

async function readGitignore(root: string): Promise<GitignoreRule[]> {
  try {
    const raw = await fs.readFile(path.resolve(root, ".gitignore"), "utf8");
    return parseGitignore(raw);
  } catch {
    return [];
  }
}

export async function scanRepository(root: string, config: SotuRailConfig): Promise<RepoMap> {
  const resolvedRoot = path.resolve(root);
  const rules = await readGitignore(resolvedRoot);
  const files: RepoMapFile[] = [];
  const stats: ScanStats = { scanned_files: 0, ignored_files: 0, ignored_directories: 0 };
  const ignoredExtensions = new Set(config.ignore_extensions.map((ext) => ext.replace(/^\./, "").toLowerCase()));
  const maxBytes = config.max_file_size_kb * 1024;

  async function walk(current: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.resolve(current, entry.name);
      const relative = normalizeForIgnore(path.relative(resolvedRoot, absolute));

      if (entry.isSymbolicLink()) {
        stats.ignored_files += 1;
        continue;
      }

      if (entry.isDirectory()) {
        if (isAlwaysIgnored(relative, true) || isIgnoredByRules(relative, true, rules)) {
          stats.ignored_directories += 1;
          continue;
        }
        await walk(absolute);
        continue;
      }

      if (!entry.isFile()) {
        stats.ignored_files += 1;
        continue;
      }

      if (isAlwaysIgnored(relative, false) || isIgnoredByRules(relative, false, rules)) {
        stats.ignored_files += 1;
        continue;
      }

      if (ignoredExtensions.has(extensionOf(relative))) {
        stats.ignored_files += 1;
        continue;
      }

      const fileStats = await fs.stat(absolute);
      if (fileStats.size > maxBytes) {
        stats.ignored_files += 1;
        continue;
      }

      let text = "";
      try {
        text = await fs.readFile(absolute, "utf8");
      } catch {
        stats.ignored_files += 1;
        continue;
      }

      const extracted = extractSymbols(relative, text);
      files.push({
        path: relative,
        size_bytes: fileStats.size,
        language: languageFor(relative),
        symbols: extracted.symbols,
        contracts: extracted.contracts
      });
      stats.scanned_files += 1;
    }
  }

  await walk(resolvedRoot);
  files.sort((left, right) => left.path.localeCompare(right.path));
  return {
    title: "Heuristic Repo Map",
    generated_at: new Date().toISOString(),
    root: path.basename(resolvedRoot),
    total_files: files.length,
    stats,
    files
  };
}

export function buildTreeText(repoMap: RepoMap): string {
  const lines = [
    "Heuristic Repo Map",
    `Root: ${repoMap.root}`,
    `Files indexed: ${repoMap.total_files}`,
    ""
  ];
  for (const file of repoMap.files) {
    const symbols = file.symbols.map((symbol) => `${symbol.kind}:${symbol.name}`).join(", ");
    lines.push(`${file.path} (${file.language}, ${file.size_bytes} bytes)${symbols ? ` - ${symbols}` : ""}`);
  }
  return `${lines.join("\n")}\n`;
}

export async function writeRepoMap(root: string, repoMap: RepoMap): Promise<{ repoMapPath: string; treePath: string }> {
  const indexesDir = path.resolve(root, ".soturail", "indexes");
  const repoMapPath = path.resolve(indexesDir, "repo-map.json");
  const treePath = path.resolve(indexesDir, "tree.txt");
  await writeJson(repoMapPath, repoMap);
  await fs.writeFile(treePath, buildTreeText(repoMap), "utf8");
  return { repoMapPath, treePath };
}
