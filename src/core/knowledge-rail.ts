import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths, relativeToRoot, writeJson } from "./config.js";
import { hashFile } from "./git.js";
import { normalizeWords, sha256Text, summarizeText } from "./rail-utils.js";

const supportedExtensions = new Set([".md", ".mdx", ".txt", ".json", ".yml", ".yaml", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".java", ".py"]);
const ignoredDirectories = new Set([".git", ".soturail", "node_modules", "dist", "build", "coverage"]);
const stopWords = new Set(["this", "that", "with", "from", "into", "when", "where", "what", "should", "must", "will", "have", "has", "using", "used", "local", "soturail"]);

export interface KnowledgeSource {
  path: string;
  hash: string;
  bytes: number;
  headings: string[];
  commands: string[];
  summary: string;
}

export interface KnowledgeEstimate {
  schemaVersion: "soturail.knowledge.estimate.v1";
  createdAt: string;
  files: number;
  bytes: number;
  estimatedTokens: number;
  headings: number;
  commands: number;
  paths: string[];
}

export interface KnowledgeMetadata {
  schemaVersion: "soturail.knowledge.v1";
  name: string;
  createdAt: string;
  updatedAt: string;
  status: "verified" | "stale" | "unverified";
  sourceCount: number;
  topicCount: number;
  estimatedTokens: number;
  sourceDigest: string;
  sources: string[];
}

export interface KnowledgeVerifyReport {
  schemaVersion: "soturail.knowledge.verify.v1";
  createdAt: string;
  name: string;
  status: "verified" | "stale" | "unverified";
  checkedSources: number;
  changedSources: string[];
  missingSources: string[];
  missingArtifacts: string[];
  nextCommands: string[];
}

export async function estimateKnowledge(inputs: string[], root = process.cwd()): Promise<KnowledgeEstimate> {
  const sources = await readSources(inputs, root);
  const bytes = sources.reduce((sum, source) => sum + source.bytes, 0);
  return {
    schemaVersion: "soturail.knowledge.estimate.v1",
    createdAt: new Date().toISOString(),
    files: sources.length,
    bytes,
    estimatedTokens: Math.ceil(bytes / 4),
    headings: sources.reduce((sum, source) => sum + source.headings.length, 0),
    commands: sources.reduce((sum, source) => sum + source.commands.length, 0),
    paths: sources.map((source) => source.path)
  };
}

export async function compileKnowledge(name: string, inputs: string[], root = process.cwd()): Promise<{ dir: string; metadata: KnowledgeMetadata }> {
  await ensureWorkspace(root);
  const safeName = slug(name);
  const sources = await readSources(inputs, root);
  if (sources.length === 0) throw new Error("No supported local source files found.");
  const dir = path.join(getWorkspacePaths(root).knowledgeDir, safeName);
  const topicsDir = path.join(dir, "topics");
  await fs.mkdir(topicsDir, { recursive: true });
  const createdAt = new Date().toISOString();
  const metadata: KnowledgeMetadata = {
    schemaVersion: "soturail.knowledge.v1",
    name: safeName,
    createdAt,
    updatedAt: createdAt,
    status: "verified",
    sourceCount: sources.length,
    topicCount: sources.length,
    estimatedTokens: Math.ceil(sources.reduce((sum, source) => sum + source.bytes, 0) / 4),
    sourceDigest: sha256Text(sources.map((source) => `${source.path}:${source.hash}`).join("\n")),
    sources: sources.map((source) => source.path)
  };
  await fs.writeFile(path.join(dir, "SKILL.md"), renderKnowledgeSkill(metadata, sources), "utf8");
  await fs.writeFile(path.join(dir, "glossary.md"), renderGlossary(collectTerms(sources)), "utf8");
  await fs.writeFile(path.join(dir, "patterns.md"), renderPatterns(sources), "utf8");
  await fs.writeFile(path.join(dir, "cheatsheet.md"), renderCheatsheet(sources), "utf8");
  for (const source of sources) await fs.writeFile(path.join(topicsDir, `${topicSlug(source.path)}.md`), renderTopic(source), "utf8");
  await writeJson(path.join(dir, "metadata.json"), metadata);
  await writeJson(path.join(dir, "source-map.json"), { schemaVersion: "soturail.knowledge.source-map.v1", createdAt, sources });
  return { dir, metadata };
}

export async function updateKnowledge(name: string, inputs: string[], root = process.cwd()): Promise<{ dir: string; metadata: KnowledgeMetadata }> {
  const dir = path.join(getWorkspacePaths(root).knowledgeDir, slug(name));
  const existing = await readJson<KnowledgeMetadata>(path.join(dir, "metadata.json"));
  const result = await compileKnowledge(name, [...new Set([...(existing?.sources ?? []), ...inputs])], root);
  if (existing) {
    result.metadata.createdAt = existing.createdAt;
    result.metadata.updatedAt = new Date().toISOString();
    await writeJson(path.join(result.dir, "metadata.json"), result.metadata);
  }
  return result;
}

export async function verifyKnowledge(name: string, root = process.cwd()): Promise<KnowledgeVerifyReport> {
  const dir = path.join(getWorkspacePaths(root).knowledgeDir, slug(name));
  const metadata = await readJson<KnowledgeMetadata>(path.join(dir, "metadata.json"));
  const sourceMap = await readJson<{ sources?: KnowledgeSource[] }>(path.join(dir, "source-map.json"));
  const missingArtifacts: string[] = [];
  for (const artifact of ["SKILL.md", "glossary.md", "patterns.md", "cheatsheet.md", "metadata.json", "source-map.json"]) {
    if (!await exists(path.join(dir, artifact))) missingArtifacts.push(artifact);
  }
  const missingSources: string[] = [];
  const changedSources: string[] = [];
  for (const source of sourceMap?.sources ?? []) {
    const current = await hashFile(path.resolve(root, source.path));
    if (!current) missingSources.push(source.path);
    else if (current !== source.hash) changedSources.push(source.path);
  }
  const status = !metadata || missingArtifacts.length > 0 ? "unverified" : missingSources.length > 0 || changedSources.length > 0 ? "stale" : "verified";
  const report: KnowledgeVerifyReport = {
    schemaVersion: "soturail.knowledge.verify.v1",
    createdAt: new Date().toISOString(),
    name: slug(name),
    status,
    checkedSources: sourceMap?.sources?.length ?? 0,
    changedSources,
    missingSources,
    missingArtifacts,
    nextCommands: status === "verified" ? ["soturail knowledge list"] : [`soturail knowledge update ${slug(name)} <paths...>`]
  };
  if (metadata) {
    metadata.status = status;
    metadata.updatedAt = report.createdAt;
    await writeJson(path.join(dir, "metadata.json"), metadata);
  }
  if (await exists(dir)) await writeJson(path.join(dir, "verify.json"), report);
  return report;
}

export async function listKnowledge(root = process.cwd()): Promise<Array<{ name: string; status: string; sources: number; path: string }>> {
  const base = getWorkspacePaths(root).knowledgeDir;
  const entries = await fs.readdir(base, { withFileTypes: true }).catch(() => []);
  const result = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(base, entry.name);
    const metadata = await readJson<KnowledgeMetadata>(path.join(dir, "metadata.json"));
    result.push({ name: entry.name, status: metadata?.status ?? "unverified", sources: metadata?.sourceCount ?? 0, path: relativeToRoot(root, dir) });
  }
  return result.sort((left, right) => left.name.localeCompare(right.name));
}

export function renderKnowledgeList(items: Awaited<ReturnType<typeof listKnowledge>>): string {
  return ["SotuRail knowledge packs", `count: ${items.length}`, ...(items.length ? items.map((item) => `- ${item.name} [${item.status}] sources=${item.sources} path=${item.path}`) : ["- none"]), "next: soturail knowledge compile <paths...> --name <name>"].join("\n") + "\n";
}

async function readSources(inputs: string[], root: string): Promise<KnowledgeSource[]> {
  const files = await collectFiles(inputs, root);
  const sources: KnowledgeSource[] = [];
  for (const file of files) {
    const text = await fs.readFile(file, "utf8").catch(() => "");
    if (!text.trim()) continue;
    sources.push({
      path: relativeToRoot(root, file).replace(/\\/g, "/"),
      hash: sha256Text(text),
      bytes: Buffer.byteLength(text),
      headings: [...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1]?.trim() ?? "").filter(Boolean).slice(0, 30),
      commands: extractCommands(text),
      summary: summarizeText(firstMeaningfulText(text), 240)
    });
  }
  return sources.sort((left, right) => left.path.localeCompare(right.path));
}

async function collectFiles(inputs: string[], root: string): Promise<string[]> {
  const result = new Set<string>();
  for (const input of inputs) {
    const absolute = path.resolve(root, input);
    if (!insideRoot(root, absolute)) throw new Error(`Source path escapes project root: ${input}`);
    await walk(absolute, result);
  }
  return [...result].sort();
}

async function walk(absolute: string, result: Set<string>): Promise<void> {
  const stat = await fs.stat(absolute).catch(() => null);
  if (!stat) return;
  if (stat.isFile()) {
    if (supportedExtensions.has(path.extname(absolute).toLowerCase()) && stat.size <= 1024 * 1024) result.add(absolute);
    return;
  }
  if (!stat.isDirectory() || ignoredDirectories.has(path.basename(absolute))) return;
  for (const entry of await fs.readdir(absolute)) await walk(path.join(absolute, entry), result);
}

function extractCommands(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/`((?:soturail|npm|npx|node|git)\s+[^`\r\n]+)`/g)) if (match[1]) found.add(match[1].trim());
  for (const line of text.split(/\r?\n/)) {
    const command = line.trim().match(/^(soturail|npm|npx|node|git)\s+.+$/)?.[0];
    if (command) found.add(command.slice(0, 180));
  }
  return [...found].slice(0, 30);
}

function collectTerms(sources: KnowledgeSource[]): Array<{ term: string; count: number }> {
  const counts = new Map<string, number>();
  for (const source of sources) for (const word of normalizeWords(`${source.headings.join(" ")} ${source.summary}`)) {
    if (!stopWords.has(word) && word.length >= 4) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()].map(([term, count]) => ({ term, count })).sort((a, b) => b.count - a.count || a.term.localeCompare(b.term)).slice(0, 40);
}

function renderKnowledgeSkill(metadata: KnowledgeMetadata, sources: KnowledgeSource[]): string {
  return [`# ${metadata.name} Knowledge Pack`, "", "Use this source-backed local pack progressively. Read only the topic files relevant to the task.", "", "## Sources", ...sources.map((source) => `- \`${source.path}\`: ${source.summary}`), "", "## Safety", "- Generated locally without embeddings, cloud calls or LLM summaries.", "- Verify source hashes before relying on this pack.", "- Do not treat inferred summaries as stronger than their source files.", "", "## Verification", `- Run \`soturail knowledge verify ${metadata.name}\`.`, ""].join("\n");
}

function renderTopic(source: KnowledgeSource): string {
  return [`# ${source.path}`, "", `Source hash: \`${source.hash}\``, "", "## Summary", source.summary || "No concise local summary available.", "", "## Headings", ...(source.headings.length ? source.headings.map((heading) => `- ${heading}`) : ["- none detected"]), "", "## Commands", ...(source.commands.length ? source.commands.map((command) => `- \`${command}\``) : ["- none detected"]), ""].join("\n");
}

function renderGlossary(terms: Array<{ term: string; count: number }>): string {
  return ["# Glossary", "", ...terms.map((item) => `- **${item.term}**: detected in ${item.count} source signals.`), ""].join("\n");
}

function renderPatterns(sources: KnowledgeSource[]): string {
  const commands = [...new Set(sources.flatMap((source) => source.commands))];
  return ["# Patterns", "", "## Repeated Commands", ...(commands.length ? commands.map((command) => `- \`${command}\``) : ["- none detected"]), "", "Patterns are deterministic source signals, not behavioral guarantees.", ""].join("\n");
}

function renderCheatsheet(sources: KnowledgeSource[]): string {
  return ["# Cheatsheet", "", ...sources.map((source) => `- Read \`${source.path}\` for ${source.headings.slice(0, 3).join(", ") || "local project context"}.`), ""].join("\n");
}

function firstMeaningfulText(text: string): string {
  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#") && !line.startsWith("```") && !line.startsWith("|"))[0] ?? "";
}

function topicSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "topic";
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "knowledge";
}

function insideRoot(root: string, target: string): boolean {
  const relative = path.relative(path.resolve(root), target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(() => true).catch(() => false);
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}
