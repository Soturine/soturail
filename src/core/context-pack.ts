import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths, loadConfig, readJsonl } from "./config.js";
import { getCurrentGitCommit } from "./git.js";
import { listMcpResources } from "./mcp-resources.js";
import { readSkills } from "./skill-store.js";
import { listWorkflows } from "./workflow-store.js";
import { createSharedContextArtifact, type SharedContextArtifact } from "./context-artifact.js";
import { createWorkspaceFingerprint } from "./workspace-fingerprint.js";
import { artifactStore } from "./artifact-store.js";

export type ContextTarget = "claude" | "codex" | "gemini" | "cursor" | "antigravity" | "generic";

export interface ContextPackOptions {
  now?: string;
  maxBytes?: number;
  maxTokens?: number;
}

export interface ContextPackResult {
  target: ContextTarget;
  path: string;
  payload: string;
  stablePrefix: string;
  artifact: SharedContextArtifact;
}

export const contextTargets: ContextTarget[] = ["claude", "codex", "gemini", "cursor", "antigravity", "generic"];

export async function buildAllContextPacks(root = process.cwd(), options: ContextPackOptions = {}): Promise<ContextPackResult[]> {
  const results: ContextPackResult[] = [];
  for (const target of contextTargets) {
    results.push(await buildContextPack(target, root, options));
  }
  return results;
}

export async function buildContextPack(
  target: ContextTarget,
  root = process.cwd(),
  options: ContextPackOptions = {}
): Promise<ContextPackResult> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const now = options.now ?? new Date().toISOString();
  const config = await loadConfig(root);
  const sections = [
    ["Static SotuRail Header", staticHeader(target)],
    ["Governance Files Summary", await governanceSummary(root)],
    ["Project Config", JSON.stringify(config, null, 2)],
    ["Repo Map Summary", await readOptional(path.join(paths.indexesDir, "repo-map.json"), "No repo map found. Run soturail index.")],
    ["Approved Rules", await readOptional(paths.rulesFile, "No approved rules found.")],
    ["Approved Specs", await approvedSpecs(root)],
    ["Approved Memory", await approvedMemory(root)],
    ["Skills Summary", await skillsSummary(root)],
    ["Workflow Summary", await workflowSummary(root)],
    ["MCP Resource List", await mcpResourceSummary()]
  ] as const;
  const stableItems = sections.map(([title, content], index) => ({
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    content: `## ${title}\n\n${content.trim()}\n`,
    priority: 900 - index * 50,
    classification: index <= 2 || title === "Approved Rules" ? "LOSSLESS_ONLY" as const : "COMPRESSIBLE" as const
  }));
  const dynamic = [
    "<!-- soturail:dynamic-footer -->",
    "## Dynamic Footer",
    "",
    `generated_at: ${now}`,
    `git_commit: ${await getCurrentGitCommit(root) ?? "unknown"}`,
    "raw_ids: dynamic; expand only when compressed summaries are insufficient",
    "last_commands: dynamic local session state is intentionally kept after stable blocks",
    ""
  ].join("\n");
  const workspace = await createWorkspaceFingerprint(root);
  const artifact = createSharedContextArtifact(
    [...stableItems, { id: "dynamic-footer", content: dynamic, priority: 1000, classification: "LOSSLESS_ONLY" }],
    workspace,
    { maxBytes: options.maxBytes ?? config.context.max_bytes, maxTokens: options.maxTokens ?? config.context.max_tokens }
  );
  const payload = artifact.payload;
  const stable = payload.split("<!-- soturail:dynamic-footer -->")[0]?.trimEnd() ?? payload;
  const filePath = path.join(paths.contextDir, `${target}-context.md`);
  await artifactStore.writeText(filePath, payload);
  await artifactStore.writeJson(path.join(paths.contextDir, `${target}-context.artifact.json`), artifact);
  return { target, path: filePath, payload, stablePrefix: stable, artifact };
}

export async function contextDoctor(root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const existing = await fs.readdir(paths.contextDir).catch(() => []);
  return [
    "SotuRail context doctor",
    "stable_order: header, governance, config, repo_map, approved_rules, approved_specs, approved_memory, skills, dynamic_footer",
    `context_dir: ${path.normalize(path.relative(root, paths.contextDir))}`,
    `existing_packs: ${existing.length}`,
    "hard_budget: enabled"
  ].join("\n") + "\n";
}

export function explainContextPacks(): string {
  return [
    "SotuRail context packs keep stable content before dynamic session data.",
    "Order: static header -> governance -> config -> repo map -> approved rules -> approved specs -> approved memory -> skills -> workflows -> MCP resources -> dynamic footer.",
    "Timestamps, raw_ids, recent command status and transient logs stay in the dynamic footer."
  ].join("\n") + "\n";
}

async function governanceSummary(root: string): Promise<string> {
  const files = ["AGENTS.md", "CLAUDE.md", "GEMINI.md", "README.md"];
  const lines: string[] = [];
  for (const file of files) {
    const text = await readOptional(path.join(root, file), "");
    if (text) lines.push(`### ${file}\n\n${text.split(/\r?\n/).slice(0, 20).join("\n")}`);
  }
  return lines.join("\n\n") || "No governance files found.";
}

async function approvedSpecs(root: string): Promise<string> {
  const paths = getWorkspacePaths(root);
  const out: string[] = [];
  const entries = await fs.readdir(paths.specsDir).catch(() => []);
  for (const entry of entries) {
    const spec = await readOptional(path.join(paths.specsDir, entry, "spec.md"), "");
    if (spec) out.push(`### ${entry}\n\n${spec.slice(0, 4000)}`);
  }
  return out.join("\n\n") || "No approved specs found.";
}

async function approvedMemory(root: string): Promise<string> {
  const paths = getWorkspacePaths(root);
  const approved = await readJsonl<{ id?: string; text?: string; content?: string; approved?: boolean }>(paths.memoryApprovedFile);
  const legacy = (await readJsonl<{ id?: string; text?: string; content?: string; approved?: boolean }>(paths.memoryFile)).filter((item) => item.approved);
  const records = [...approved, ...legacy];
  return records.length > 0
    ? records.map((item) => `- ${item.id ?? "legacy"}: ${item.text ?? item.content ?? ""}`).join("\n")
    : "No approved memory found.";
}

async function skillsSummary(root: string): Promise<string> {
  const skills = await readSkills(root);
  return skills.length > 0
    ? skills.map((skill) => `- ${skill.metadata.id}: ${skill.metadata.description} [${skill.metadata.risk_level}]`).join("\n")
    : "No skills found.";
}

async function workflowSummary(root: string): Promise<string> {
  const workflows = await listWorkflows(root);
  return workflows.length > 0
    ? workflows.map((workflow) => `- ${workflow.id}: ${workflow.title} [${workflow.state}]`).join("\n")
    : "No workflows found.";
}

async function mcpResourceSummary(): Promise<string> {
  return (await listMcpResources()).map((resource) => `- ${resource.uri}: ${resource.description}`).join("\n");
}

async function readOptional(filePath: string, fallback: string): Promise<string> {
  return fs.readFile(filePath, "utf8").catch(() => fallback);
}

function staticHeader(target: string): string {
  return [
    "SotuRail context pack.",
    `target: ${target}`,
    "Local-first, cache-friendly, stable project context appears before dynamic session data.",
    "Do not claim provider cache hits unless provider metadata is explicitly imported."
  ].join("\n");
}
