import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

export const WORKSPACE_DIR = ".soturail";

export const DEFAULT_BINARY_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "pdf",
  "zip",
  "tgz",
  "exe",
  "dll",
  "so",
  "class",
  "jar",
  "mp4",
  "mp3",
  "wav"
] as const;

export const ConfigSchema = z.object({
  schema_version: z.literal(1).default(1),
  project_name: z.string().default("soturail-project"),
  workspace_dir: z.string().default(WORKSPACE_DIR),
  max_file_size_kb: z.number().int().positive().max(10240).default(512),
  ignore_extensions: z.array(z.string()).default([...DEFAULT_BINARY_EXTENSIONS]),
  response_compression: z
    .object({
      default_mode: z.enum(["normal", "concise", "ultra", "review", "commit", "debug", "docs"]).default("normal"),
      preserve_code_blocks: z.boolean().default(true),
      preserve_security_warnings: z.boolean().default(true)
    })
    .default({ default_mode: "normal", preserve_code_blocks: true, preserve_security_warnings: true }),
  cache: z
    .object({
      dynamic_footer_token_budget: z.number().int().positive().max(10000).default(800)
    })
    .default({ dynamic_footer_token_budget: 800 }),
  dedupe: z
    .object({
      enabled: z.boolean().default(true),
      mode: z.enum(["conservative"]).default("conservative"),
      blockMinLines: z.number().int().positive().max(1000).default(8),
      recentWindow: z.number().int().positive().max(1000).default(10),
      preserveErrorBlocks: z.boolean().default(true),
      similar_dedupe: z.enum(["off", "conservative"]).default("off")
    })
    .default({
      enabled: true,
      mode: "conservative",
      blockMinLines: 8,
      recentWindow: 10,
      preserveErrorBlocks: true,
      similar_dedupe: "off"
    })
});

export type SotuRailConfig = z.infer<typeof ConfigSchema>;

export const defaultConfig: SotuRailConfig = ConfigSchema.parse({});

export interface WorkspacePaths {
  root: string;
  workspace: string;
  configDir: string;
  configFile: string;
  rawDir: string;
  rawIndex: string;
  indexesDir: string;
  memoryDir: string;
  memoryFile: string;
  memoryRecordsFile: string;
  memoryConsolidatedFile: string;
  specsDir: string;
  metricsDir: string;
  metricsFile: string;
  cacheDir: string;
  cacheBlocks: string;
  dedupeDir: string;
  dedupeIndex: string;
  hooksDir: string;
  hooksHosts: string;
  rulesDir: string;
  rulesFile: string;
  rulesChecklist: string;
  rulesCitations: string;
  rulesValidatorsDir: string;
  memoryPendingFile: string;
  memoryApprovedFile: string;
  skillsDir: string;
  exportsDir: string;
  skillExportsDir: string;
  hookExportsDir: string;
  agentExportsDir: string;
  mcpExportsDir: string;
  contextDir: string;
  contextSelectionsDir: string;
  contextOffloadDir: string;
  contextRolePacksDir: string;
  harnessDir: string;
  harnessFailuresFile: string;
  harnessContractsDir: string;
  policyDir: string;
  policyQueueFile: string;
  policyDecisionsFile: string;
  fsDir: string;
  fsSnapshotsDir: string;
  runsDir: string;
  reportsDir: string;
  workflowsDir: string;
  workflowTemplatesDir: string;
  workflowCurrentFile: string;
  workflowIndexFile: string;
  worktreesDir: string;
  diagramsDir: string;
  diagramsIndexFile: string;
}

export interface EnsureResult {
  created: string[];
  skipped: string[];
}

export function getWorkspacePaths(root = process.cwd(), workspaceDir = WORKSPACE_DIR): WorkspacePaths {
  const resolvedRoot = path.resolve(root);
  const workspace = path.resolve(resolvedRoot, workspaceDir);
  return {
    root: resolvedRoot,
    workspace,
    configDir: path.resolve(workspace, "config"),
    configFile: path.resolve(workspace, "config", "config.json"),
    rawDir: path.resolve(workspace, "raw"),
    rawIndex: path.resolve(workspace, "raw", "index.jsonl"),
    indexesDir: path.resolve(workspace, "indexes"),
    memoryDir: path.resolve(workspace, "memory"),
    memoryFile: path.resolve(workspace, "memory", "memory.jsonl"),
    memoryRecordsFile: path.resolve(workspace, "memory", "records.jsonl"),
    memoryConsolidatedFile: path.resolve(workspace, "memory", "consolidated.jsonl"),
    specsDir: path.resolve(workspace, "specs"),
    metricsDir: path.resolve(workspace, "metrics"),
    metricsFile: path.resolve(workspace, "metrics", "events.jsonl"),
    cacheDir: path.resolve(workspace, "cache"),
    cacheBlocks: path.resolve(workspace, "cache", "blocks.jsonl"),
    dedupeDir: path.resolve(workspace, "dedupe"),
    dedupeIndex: path.resolve(workspace, "dedupe", "index.jsonl"),
    hooksDir: path.resolve(workspace, "hooks"),
    hooksHosts: path.resolve(workspace, "hooks", "hosts.json"),
    rulesDir: path.resolve(workspace, "rules"),
    rulesFile: path.resolve(workspace, "rules", "rules.yml"),
    rulesChecklist: path.resolve(workspace, "rules", "checklist.md"),
    rulesCitations: path.resolve(workspace, "rules", "citations.json"),
    rulesValidatorsDir: path.resolve(workspace, "rules", "validators"),
    memoryPendingFile: path.resolve(workspace, "memory", "pending.jsonl"),
    memoryApprovedFile: path.resolve(workspace, "memory", "approved.jsonl"),
    skillsDir: path.resolve(workspace, "skills"),
    exportsDir: path.resolve(workspace, "exports"),
    skillExportsDir: path.resolve(workspace, "exports", "skills"),
    hookExportsDir: path.resolve(workspace, "exports", "hooks"),
    agentExportsDir: path.resolve(workspace, "exports", "agents"),
    mcpExportsDir: path.resolve(workspace, "exports", "mcp"),
    contextDir: path.resolve(workspace, "context"),
    contextSelectionsDir: path.resolve(workspace, "context", "selections"),
    contextOffloadDir: path.resolve(workspace, "context", "offload"),
    contextRolePacksDir: path.resolve(workspace, "context", "role-packs"),
    harnessDir: path.resolve(workspace, "harness"),
    harnessFailuresFile: path.resolve(workspace, "harness", "failures.jsonl"),
    harnessContractsDir: path.resolve(workspace, "harness", "contracts"),
    policyDir: path.resolve(workspace, "policy"),
    policyQueueFile: path.resolve(workspace, "policy", "queue.jsonl"),
    policyDecisionsFile: path.resolve(workspace, "policy", "decisions.jsonl"),
    fsDir: path.resolve(workspace, "fs"),
    fsSnapshotsDir: path.resolve(workspace, "fs", "snapshots"),
    runsDir: path.resolve(workspace, "runs"),
    reportsDir: path.resolve(workspace, "reports"),
    workflowsDir: path.resolve(workspace, "workflows"),
    workflowTemplatesDir: path.resolve(workspace, "workflows", "templates"),
    workflowCurrentFile: path.resolve(workspace, "workflows", "current.json"),
    workflowIndexFile: path.resolve(workspace, "workflows", "index.json"),
    worktreesDir: path.resolve(workspace, "worktrees"),
    diagramsDir: path.resolve(workspace, "diagrams"),
    diagramsIndexFile: path.resolve(workspace, "diagrams", "index.json")
  };
}

export function relativeToRoot(root: string, absolutePath: string): string {
  return path.normalize(path.relative(path.resolve(root), path.resolve(absolutePath)));
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string, result?: EnsureResult, root?: string): Promise<void> {
  const alreadyExists = await exists(dirPath);
  await fs.mkdir(dirPath, { recursive: true });
  if (result && root) {
    const display = relativeToRoot(root, dirPath);
    if (alreadyExists) {
      result.skipped.push(display);
    } else {
      result.created.push(display);
    }
  }
}

export async function writeFileIfMissing(
  filePath: string,
  content: string,
  result?: EnsureResult,
  root?: string
): Promise<"created" | "skipped"> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const display = root ? relativeToRoot(root, filePath) : filePath;
  if (await exists(filePath)) {
    result?.skipped.push(display);
    return "skipped";
  }
  await fs.writeFile(filePath, content, "utf8");
  result?.created.push(display);
  return "created";
}

export async function ensureWorkspace(root = process.cwd()): Promise<EnsureResult> {
  const paths = getWorkspacePaths(root);
  const result: EnsureResult = { created: [], skipped: [] };
  const dirs = [
    paths.workspace,
    paths.configDir,
    paths.rawDir,
    paths.indexesDir,
    paths.memoryDir,
    paths.specsDir,
    paths.metricsDir,
    paths.cacheDir,
    paths.dedupeDir,
    paths.hooksDir,
    paths.rulesDir,
    paths.rulesValidatorsDir,
    paths.skillsDir,
    paths.exportsDir,
    paths.skillExportsDir,
    paths.hookExportsDir,
    paths.agentExportsDir,
    paths.mcpExportsDir,
    paths.contextDir,
    paths.contextSelectionsDir,
    paths.contextOffloadDir,
    paths.contextRolePacksDir,
    paths.harnessDir,
    paths.harnessContractsDir,
    paths.policyDir,
    paths.fsDir,
    paths.fsSnapshotsDir,
    paths.runsDir,
    paths.reportsDir,
    paths.workflowsDir,
    paths.workflowTemplatesDir,
    paths.worktreesDir,
    paths.diagramsDir
  ];

  for (const dir of dirs) {
    await ensureDir(dir, result, paths.root);
  }

  await writeFileIfMissing(paths.configFile, `${JSON.stringify(defaultConfig, null, 2)}\n`, result, paths.root);
  await writeFileIfMissing(paths.rawIndex, "", result, paths.root);
  await writeFileIfMissing(paths.memoryFile, "", result, paths.root);
  await writeFileIfMissing(paths.memoryRecordsFile, "", result, paths.root);
  await writeFileIfMissing(paths.memoryConsolidatedFile, "", result, paths.root);
  await writeFileIfMissing(paths.memoryPendingFile, "", result, paths.root);
  await writeFileIfMissing(paths.memoryApprovedFile, "", result, paths.root);
  await writeFileIfMissing(paths.harnessFailuresFile, "", result, paths.root);
  await writeFileIfMissing(paths.policyQueueFile, "", result, paths.root);
  await writeFileIfMissing(paths.policyDecisionsFile, "", result, paths.root);
  await writeFileIfMissing(paths.metricsFile, "", result, paths.root);
  await writeFileIfMissing(paths.cacheBlocks, "", result, paths.root);
  await writeFileIfMissing(paths.dedupeIndex, "", result, paths.root);
  return result;
}

export async function loadConfig(root = process.cwd()): Promise<SotuRailConfig> {
  const paths = getWorkspacePaths(root);
  try {
    const raw = await fs.readFile(paths.configFile, "utf8");
    return ConfigSchema.parse(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return defaultConfig;
    }
    throw error;
  }
}

export async function validateConfigFile(root = process.cwd()): Promise<{ ok: boolean; message: string }> {
  const paths = getWorkspacePaths(root);
  try {
    const raw = await fs.readFile(paths.configFile, "utf8");
    ConfigSchema.parse(JSON.parse(raw));
    return { ok: true, message: "config.json is valid" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export async function appendJsonl(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

export async function readJsonl<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as T);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
