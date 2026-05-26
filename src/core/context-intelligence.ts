import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths, loadConfig, readJsonl, relativeToRoot, writeJson } from "./config.js";
import { scanRepository, type RepoMapFile } from "./file-scanner.js";
import type { MemoryRailRecord } from "./memory-rail.js";
import { RawStore } from "./raw-store.js";
import { keywordScore, makeRailId, redactProbableSecrets, summarizeText } from "./rail-utils.js";
import { estimateTokens, tokenEstimateNote } from "./token-estimator.js";

export type ContextExpert = "code" | "docs" | "release" | "security" | "workflow" | "memory" | "research";
export type RolePack = "planner" | "executor" | "reviewer" | "release-manager" | "researcher";

export interface ContextSelection {
  schemaVersion: "soturail.context.selection.v1";
  id: string;
  createdAt: string;
  query: string;
  limit: number;
  expert: ContextExpert;
  role: RolePack;
  items: ContextSelectionItem[];
}

export interface ContextSelectionItem {
  kind: "file" | "memory";
  path?: string;
  id?: string;
  score: number;
  reason: string;
  summary: string;
  estimatedTokens: number;
}

export interface OffloadRecord {
  schemaVersion: "soturail.context.offload.v1";
  id: string;
  createdAt: string;
  source: string;
  path: string;
  summary: string;
  bytes: number;
  estimatedTokens: number;
}

const roleDefinitions: Record<RolePack, { purpose: string; include: string[]; omit: string[] }> = {
  planner: {
    purpose: "Plan work from roadmap, specs, constraints, previous decisions and workflow state.",
    include: ["README.md", "ROADMAP.md", "docs/", ".soturail/memory/consolidated.jsonl", ".soturail/workflows/"],
    omit: ["raw logs", "large generated artifacts", "secret-like files"]
  },
  executor: {
    purpose: "Execute a local task with target files, repo map, failing tests and safe commands.",
    include: [".soturail/indexes/tree.txt", "target files", "tests/", ".soturail/context/selections/"],
    omit: ["unrelated long docs", "raw logs unless explicitly restored"]
  },
  reviewer: {
    purpose: "Review diffs, tests, rules, acceptance criteria and security notes.",
    include: ["git diff", "tests/", ".soturail/rules/", ".soturail/harness/failures.jsonl"],
    omit: ["unchanged dependency trees", "local secrets"]
  },
  "release-manager": {
    purpose: "Prepare release evidence from version, changelog, release notes, package verification and registry state.",
    include: ["package.json", "CHANGELOG.md", "RELEASE_NOTES_*.md", "docs/release-workflow.md"],
    omit: ["npm tokens", "browser auth secrets", "raw package caches"]
  },
  researcher: {
    purpose: "Collect local docs, ecosystem notes, comparison constraints and citation reminders.",
    include: ["docs/", "examples/", "README.md", "ROADMAP.md"],
    omit: ["uncited claims", "provider secrets", "raw logs"]
  }
};

export async function selectContext(query: string, limit = 10, root = process.cwd()): Promise<ContextSelection> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const config = await loadConfig(root);
  const repo = await scanRepository(root, config);
  const route = routeContext(query);
  const fileItems = await rankFiles(repo.files, query, root);
  const memoryItems = (await readJsonl<MemoryRailRecord>(paths.memoryRecordsFile)).map((record) => {
    const score = keywordScore(query, `${record.text} ${record.tags.join(" ")}`);
    return {
      kind: "memory" as const,
      id: record.id,
      score: score.score,
      reason: score.reason,
      summary: record.text,
      estimatedTokens: estimateTokens(record.text)
    };
  });
  const selection: ContextSelection = {
    schemaVersion: "soturail.context.selection.v1",
    id: makeRailId("ctx", query),
    createdAt: new Date().toISOString(),
    query,
    limit,
    expert: route.expert,
    role: route.role,
    items: [...fileItems, ...memoryItems]
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
  };
  await writeJson(path.join(paths.contextSelectionsDir, `${selection.id}.json`), selection);
  return selection;
}

export function renderSelection(selection: ContextSelection): string {
  const lines = [
    "SotuRail context select",
    `query: ${selection.query}`,
    `selection_id: ${selection.id}`,
    `expert: ${selection.expert}`,
    `role: ${selection.role}`,
    `items_count: ${selection.items.length}`,
    ""
  ];
  for (const item of selection.items) {
    const source = item.path ?? item.id ?? "unknown";
    lines.push(
      `- ${item.kind}: ${source}`,
      `  Score: ${item.score}`,
      `  Reason: ${item.reason}`,
      `  Estimated tokens: ${item.estimatedTokens}`,
      `  Summary: ${item.summary}`,
      `  Recovery: ${item.kind === "file" ? `open ${source}` : `soturail memory recall "${selection.query}"`}`,
      ""
    );
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export async function pruneContext(query: string, budget = 8000, root = process.cwd()): Promise<string> {
  const selection = await selectContext(query, 20, root);
  let used = 0;
  const included: ContextSelectionItem[] = [];
  const omitted: ContextSelectionItem[] = [];
  for (const item of selection.items) {
    if (used + item.estimatedTokens <= budget) {
      included.push(item);
      used += item.estimatedTokens;
    } else {
      omitted.push(item);
    }
  }
  const lines = [
    "SotuRail context prune",
    `query: ${query}`,
    `budget_tokens: ${budget}`,
    `estimated_tokens_used: ${used}`,
    `selection_id: ${selection.id}`,
    "",
    "Included context:"
  ];
  for (const item of included) {
    lines.push(`- ${item.kind}: ${item.path ?? item.id} (${item.estimatedTokens} tokens)`, `  Reason: ${item.reason}`, `  Summary: ${item.summary}`, `  Recovery: ${item.kind === "file" ? `open ${item.path}` : `soturail memory recall "${query}"`}`);
  }
  lines.push("", "Omitted context:");
  for (const item of omitted) {
    lines.push(`- ${item.kind}: ${item.path ?? item.id} (${item.estimatedTokens} tokens)`, "  Recovery: rerun with a larger --budget or use context restore/offload pointers.");
  }
  lines.push("", "Recovery pointers:", `- Full selection: .soturail/context/selections/${selection.id}.json`, "- Long content: soturail context offload <raw-id-or-file>", "- Restore offload: soturail context restore <offload-id>");
  return `${lines.join("\n")}\n`;
}

export async function offloadContext(input: string, root = process.cwd()): Promise<OffloadRecord> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  let source = input;
  let content: Buffer | null = null;
  const filePath = path.resolve(root, input);
  try {
    content = await fs.readFile(filePath);
    source = relativeToRoot(root, filePath);
  } catch {
    content = await new RawStore(root).readRaw(input);
    if (!content) throw new Error(`Could not find local file or raw_id: ${input}`);
    source = `raw_id:${input}`;
  }
  const text = redactProbableSecrets(content.toString("utf8"));
  const id = makeRailId("offload", source);
  const contentPath = path.join(paths.contextOffloadDir, `${id}.txt`);
  await fs.writeFile(contentPath, text, "utf8");
  const record: OffloadRecord = {
    schemaVersion: "soturail.context.offload.v1",
    id,
    createdAt: new Date().toISOString(),
    source,
    path: contentPath,
    summary: summarizeText(text, 600),
    bytes: Buffer.byteLength(text, "utf8"),
    estimatedTokens: estimateTokens(text)
  };
  await writeJson(path.join(paths.contextOffloadDir, `${id}.json`), { ...record, path: relativeToRoot(root, contentPath) });
  return record;
}

export async function restoreOffload(id: string, root = process.cwd()): Promise<string> {
  const contentPath = path.join(getWorkspacePaths(root).contextOffloadDir, `${id}.txt`);
  return fs.readFile(contentPath, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") throw new Error(`Offload not found: ${id}`);
    throw error;
  });
}

export async function contextBudget(target = "generic", explain = false, root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const drivers = [
    await driver("root_agent_docs", root, ["CLAUDE.md", "AGENTS.md", "GEMINI.md"]),
    await driver("role_packs", root, [relativeToRoot(root, paths.contextRolePacksDir)]),
    await driver("memory", root, [relativeToRoot(root, paths.memoryRecordsFile), relativeToRoot(root, paths.memoryConsolidatedFile)]),
    await driver("skills", root, [relativeToRoot(root, paths.skillsDir)]),
    await driver("mcp_exposure", root, [relativeToRoot(root, paths.mcpExportsDir)]),
    await driver("raw_logs", root, [relativeToRoot(root, paths.rawIndex)]),
    await driver("offloaded_logs", root, [relativeToRoot(root, paths.contextOffloadDir)]),
    await driver("context_packs", root, [relativeToRoot(root, paths.contextDir)]),
    await driver("run_workspace_evidence", root, [relativeToRoot(root, paths.runsDir), relativeToRoot(root, paths.reportsDir)])
  ];
  const total = drivers.reduce((sum, item) => sum + item.estimatedTokens, 0);
  const lines = [
    "SotuRail context budget",
    `target: ${target}`,
    `estimated_total_tokens: ${total}`,
    tokenEstimateNote(),
    "",
    "Drivers:",
    ...drivers.map((item) => `- ${item.name}: ${item.estimatedTokens} tokens (${item.paths.join(", ") || "none"})`)
  ];
  if (explain) {
    lines.push(
      "",
      "Recommendations:",
      "- Keep root agent docs short and reference richer docs.",
      "- Use `soturail context pack --role <role>` for scoped planner/executor/reviewer/release-manager/researcher handoffs.",
      "- Use `soturail context prune` for task handoff.",
      "- Use `soturail context offload` for long logs and generated artifacts.",
      "- Keep run workspace evidence local unless a specific artifact is selected."
    );
  }
  return `${lines.join("\n")}\n`;
}

export function routeContext(query: string): { expert: ContextExpert; reason: string; role: RolePack } {
  const lower = query.toLowerCase();
  const candidates: Array<[ContextExpert, RolePack, RegExp, string]> = [
    ["security", "reviewer", /(secret|token|auth|vulnerab|audit|policy|permission|risk)/, "security and policy keyword"],
    ["release", "release-manager", /(release|publish|npm|version|changelog|tag|github release|pack)/, "release keyword"],
    ["docs", "researcher", /(doc|readme|guide|example|copy|wording)/, "documentation keyword"],
    ["workflow", "planner", /(workflow|task|plan|worktree|verify|handoff|run workspace)/, "workflow keyword"],
    ["memory", "planner", /(memory|remember|recall|decision|fact)/, "memory keyword"],
    ["research", "researcher", /(research|compare|ecosystem|citation|source)/, "research keyword"],
    ["code", "executor", /(bug|fix|test|build|typescript|code|function|class|error)/, "code keyword"]
  ];
  const match = candidates.find(([, , pattern]) => pattern.test(lower));
  return match ? { expert: match[0], role: match[1], reason: match[3] } : { expert: "code", role: "executor", reason: "default local code routing" };
}

export async function buildRolePack(role: RolePack, root = process.cwd()): Promise<{ path: string; content: string }> {
  await ensureWorkspace(root);
  const definition = roleDefinitions[role];
  if (!definition) throw new Error(`Unknown role "${role}".`);
  const content = [
    `# SotuRail Role Pack: ${role}`,
    "",
    "schemaVersion: soturail.context.role-pack.v1",
    `createdAt: ${new Date().toISOString()}`,
    "",
    "## Purpose",
    definition.purpose,
    "",
    "## Included Sources",
    ...definition.include.map((item) => `- ${item}`),
    "",
    "## Omitted Sources",
    ...definition.omit.map((item) => `- ${item}`),
    "",
    "## Estimated Tokens",
    `${estimateTokens(definition.purpose + definition.include.join(" ") + definition.omit.join(" "))}`,
    "",
    "## Recovery Pointers",
    "- Regenerate target context packs with `soturail context pack --target all`.",
    "- Restore offloaded content with `soturail context restore <offload-id>`.",
    "- Recover raw command output with `soturail expand <raw_id>`.",
    "",
    "## Safety Notes",
    "- Raw logs and secret-like files are not included by default.",
    "- Use policy approval for publish, global config writes, destructive commands or raw expansion.",
    ""
  ].join("\n");
  const output = path.join(getWorkspacePaths(root).contextRolePacksDir, `${role}.md`);
  await fs.writeFile(output, content, "utf8");
  return { path: output, content };
}

export function parseRolePack(value: string): RolePack {
  if (Object.prototype.hasOwnProperty.call(roleDefinitions, value)) return value as RolePack;
  throw new Error(`Unknown role "${value}". Supported roles: ${Object.keys(roleDefinitions).join(", ")}.`);
}

async function rankFiles(files: RepoMapFile[], query: string, root: string): Promise<ContextSelectionItem[]> {
  const items: ContextSelectionItem[] = [];
  for (const file of files) {
    const score = keywordScore(query, `${file.path} ${file.language} ${file.symbols.map((symbol) => symbol.name).join(" ")}`);
    if (score.score <= 0) continue;
    const preview = await fs
      .readFile(path.resolve(root, file.path), "utf8")
      .then((raw) => summarizeText(redactProbableSecrets(raw), 300))
      .catch(() => `${file.language}, ${file.size_bytes} bytes`);
    items.push({
      kind: "file",
      path: file.path,
      score: score.score,
      reason: score.reason,
      summary: preview,
      estimatedTokens: estimateTokens(preview)
    });
  }
  return items;
}

async function driver(name: string, root: string, inputs: string[]): Promise<{ name: string; paths: string[]; estimatedTokens: number }> {
  let estimatedTokens = 0;
  const present: string[] = [];
  for (const input of inputs) {
    const absolute = path.resolve(root, input);
    const stat = await fs.stat(absolute).catch(() => null);
    if (!stat) continue;
    present.push(input);
    if (stat.isDirectory()) {
      estimatedTokens += (await fs.readdir(absolute).catch(() => [])).length * 40;
    } else {
      estimatedTokens += estimateTokens(await fs.readFile(absolute, "utf8").catch(() => ""));
    }
  }
  return { name, paths: present, estimatedTokens };
}
