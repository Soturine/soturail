import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { appendJsonl, getWorkspacePaths, readJsonl } from "./config.js";
import { estimateTokens } from "./token-estimator.js";

export type CacheBlockType = "header" | "governance" | "config" | "repo-map" | "spec" | "memory";

export interface CacheBlock {
  block_id: string;
  type: CacheBlockType;
  source_path: string;
  sha256: string;
  stable_order: number;
  token_estimate: number;
  updated_at: string;
}

export interface CachePayloadSection {
  label: string;
  stable: boolean;
  content: string;
}

export interface CachePayloadResult {
  blocks: CacheBlock[];
  sections: CachePayloadSection[];
  payload: string;
  estimated_cache_stability_score: number;
}

interface StableSource {
  type: CacheBlockType;
  sourcePath: string;
  stableOrder: number;
  content: string;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function normalizeSourcePath(root: string, sourcePath: string): string {
  if (sourcePath.startsWith("internal://")) {
    return sourcePath;
  }
  return path.normalize(path.relative(path.resolve(root), path.resolve(sourcePath))).replace(/\\/g, "/");
}

function blockIdFor(type: CacheBlockType, sourcePath: string): string {
  const safe = sourcePath
    .replace(/^\.soturail\//, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${type}-${safe || "main"}`;
}

async function readIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function listSpecFiles(specsDir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.resolve(specsDir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await listSpecFiles(absolute)));
      } else if (entry.isFile() && entry.name === "spec.md") {
        results.push(absolute);
      }
    }
  } catch {
    return [];
  }
  return results.sort((left, right) => left.localeCompare(right));
}

async function collectStableSources(root: string): Promise<StableSource[]> {
  const paths = getWorkspacePaths(root);
  const sources: StableSource[] = [
    {
      type: "header",
      sourcePath: "internal://soturail/static-header",
      stableOrder: 0,
      content: [
        "# SotuRail Static Header",
        "Local-first Context OS payload. Stable blocks are ordered before dynamic session data.",
        "Metrics are local estimates unless imported provider metadata explicitly exists."
      ].join("\n")
    }
  ];

  const governanceFiles = ["AGENTS.md", "CLAUDE.md", "GEMINI.md"];
  const governanceContent: string[] = [];
  for (const file of governanceFiles) {
    const absolute = path.resolve(root, file);
    const content = await readIfExists(absolute);
    if (content) {
      governanceContent.push(`## ${file}\n${content.trim()}`);
    }
  }
  if (governanceContent.length > 0) {
    sources.push({
      type: "governance",
      sourcePath: path.resolve(root, "AGENTS.md"),
      stableOrder: 10,
      content: governanceContent.join("\n\n")
    });
  }

  const config = await readIfExists(paths.configFile);
  if (config) {
    sources.push({ type: "config", sourcePath: paths.configFile, stableOrder: 20, content: config.trim() });
  }

  const repoMapPath = path.resolve(paths.indexesDir, "repo-map.json");
  const repoMap = await readIfExists(repoMapPath);
  if (repoMap) {
    sources.push({ type: "repo-map", sourcePath: repoMapPath, stableOrder: 30, content: repoMap.trim() });
  }

  const specFiles = await listSpecFiles(paths.specsDir);
  specFiles.forEach((specFile, index) => {
    sources.push({
      type: "spec",
      sourcePath: specFile,
      stableOrder: 40 + index,
      content: ""
    });
  });

  for (const source of sources.filter((item) => item.type === "spec")) {
    const content = await readIfExists(source.sourcePath);
    if (content && /\b(Status:\s*Approved|\[approved\]|approved:\s*true)\b/i.test(content)) {
      source.content = content.trim();
    }
  }

  const memoryRecords = await readJsonl<Record<string, unknown>>(paths.memoryFile);
  const approvedMemory = memoryRecords.filter((record) => {
    const content = typeof record.content === "string" ? record.content : "";
    return record.approved === true || /\[approved\]/i.test(content);
  });
  if (approvedMemory.length > 0) {
    sources.push({
      type: "memory",
      sourcePath: paths.memoryFile,
      stableOrder: 60,
      content: approvedMemory.map((record) => JSON.stringify(record)).join("\n")
    });
  }

  return sources.filter((source) => source.content.trim().length > 0).sort((left, right) => left.stableOrder - right.stableOrder);
}

export async function buildCachePayload(
  root = process.cwd(),
  dynamicFooter = "Dynamic footer intentionally empty."
): Promise<CachePayloadResult> {
  const paths = getWorkspacePaths(root);
  const updatedAt = new Date().toISOString();
  const stableSources = await collectStableSources(root);
  const blocks: CacheBlock[] = stableSources.map((source) => {
    const normalizedSource = normalizeSourcePath(root, source.sourcePath);
    return {
      block_id: blockIdFor(source.type, normalizedSource),
      type: source.type,
      source_path: normalizedSource,
      sha256: sha256(source.content),
      stable_order: source.stableOrder,
      token_estimate: estimateTokens(source.content),
      updated_at: updatedAt
    };
  });

  await fs.mkdir(path.dirname(paths.cacheBlocks), { recursive: true });
  await fs.writeFile(paths.cacheBlocks, "", "utf8");
  for (const block of blocks) {
    await appendJsonl(paths.cacheBlocks, block);
  }

  const stableSections: CachePayloadSection[] = stableSources.map((source) => ({
    label: source.type,
    stable: true,
    content: source.content
  }));
  const sections = [
    ...stableSections,
    {
      label: "dynamic-footer",
      stable: false,
      content: dynamicFooter
    }
  ];

  const payload = sections
    .map((section) => `<!-- soturail:${section.stable ? "stable" : "dynamic"}:${section.label} -->\n${section.content.trim()}`)
    .join("\n\n");

  const stableTokens = blocks.reduce((sum, block) => sum + block.token_estimate, 0);
  const dynamicTokens = estimateTokens(dynamicFooter);
  const estimated_cache_stability_score = stableTokens + dynamicTokens === 0
    ? 0
    : Number((stableTokens / (stableTokens + dynamicTokens)).toFixed(4));

  return { blocks, sections, payload: `${payload}\n`, estimated_cache_stability_score };
}

export async function readCacheBlocks(root = process.cwd()): Promise<CacheBlock[]> {
  const paths = getWorkspacePaths(root);
  return readJsonl<CacheBlock>(paths.cacheBlocks);
}
