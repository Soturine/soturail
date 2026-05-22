import { promises as fs } from "node:fs";
import path from "node:path";
import { buildContextPack } from "./context-pack.js";
import { ensureWorkspace, getWorkspacePaths, relativeToRoot } from "./config.js";
import { listMcpTools } from "./mcp-tools.js";
import { listMcpResources } from "./mcp-resources.js";
import { getAgentProfile, listAgentProfiles, parseAgentId } from "./agent-registry.js";
import type { AgentExportFile, AgentId, AgentInstallOptions, AgentMode } from "./agent-profile.js";
import { SOTURAIL_VERSION } from "./version.js";

const agentIds = ["claude", "codex", "gemini", "cursor", "antigravity", "generic"] as const;

export interface AgentExportResult {
  written: string[];
}

export interface AgentInstallResult {
  lines: string[];
}

export async function exportAgents(agentValue: string, root = process.cwd()): Promise<AgentExportResult> {
  await ensureWorkspace(root);
  const parsed = parseAgentId(agentValue);
  const selected: AgentId[] = parsed === "all" ? [...agentIds] : [parsed];
  const paths = getWorkspacePaths(root);
  const written: string[] = [];
  for (const agent of selected) {
    const targetDir = path.join(paths.agentExportsDir, agent);
    await fs.mkdir(targetDir, { recursive: true });
    for (const file of await buildAgentExportFiles(agent, root)) {
      const filePath = path.join(targetDir, file.relativePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content, "utf8");
      written.push(relativeToRoot(root, filePath));
    }
  }
  return { written };
}

export async function installAgent(agentValue: string, options: AgentInstallOptions = {}, root = process.cwd()): Promise<AgentInstallResult> {
  await ensureWorkspace(root);
  const parsed = parseAgentId(agentValue);
  const selected: AgentId[] = parsed === "all" ? [...agentIds] : [parsed];
  const dryRun = options.dryRun === true;
  const backup = options.backup !== false;
  const lines = [`SotuRail agents install --agent ${agentValue}${options.mode ? ` --mode ${options.mode}` : ""}${dryRun ? " --dry-run" : ""}`];
  for (const agent of selected) {
    const profile = getAgentProfile(agent);
    const mode = normalizeMode(options.mode, profile.default_mode);
    if (!profile.integration_modes.includes(mode)) {
      throw new Error(`${agent} does not support mode "${mode}". Supported: ${profile.integration_modes.join(", ")}`);
    }
    const targets = installTargetsFor(agent, mode);
    lines.push(`agent: ${agent}`, `mode: ${mode}`, `risk_level: ${profile.risk_level}`);
    for (const target of targets) {
      const filePath = path.resolve(root, options.output ?? target.path);
      lines.push(...await writePlannedFile(filePath, target.content, root, { dryRun, backup }));
    }
    if (mode === "mcp") {
      lines.push("MCP config is project-local. Review before adding it to a host application.");
    }
    lines.push("Rollback: restore any .soturail.bak file or delete generated project-local files.");
  }
  return { lines };
}

export async function uninstallAgent(agentValue: string, options: { dryRun?: boolean } = {}, root = process.cwd()): Promise<string> {
  const parsed = parseAgentId(agentValue);
  const selected: AgentId[] = parsed === "all" ? [...agentIds] : [parsed];
  const lines = [`SotuRail agents uninstall --agent ${agentValue}${options.dryRun ? " --dry-run" : ""}`];
  for (const agent of selected) {
    for (const target of installTargetsFor(agent, getAgentProfile(agent).default_mode)) {
      const filePath = path.resolve(root, target.path);
      const backup = `${filePath}.soturail.bak`;
      const relative = relativeToRoot(root, filePath);
      if (await exists(backup)) {
        lines.push(`${options.dryRun ? "Would restore" : "Restored"} ${relative} from ${relative}.soturail.bak`);
        if (!options.dryRun) await fs.copyFile(backup, filePath);
      } else {
        lines.push(`No backup found for ${relative}; file left unchanged`);
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

export async function agentDoctor(root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const exports = await fs.readdir(paths.agentExportsDir).catch(() => []);
  const contextPacks = await fs.readdir(paths.contextDir).catch(() => []);
  const skills = await fs.readdir(paths.skillsDir).catch(() => []);
  const workflows = await fs.readdir(paths.workflowsDir).catch(() => []);
  const nextSteps = [
    ...(contextPacks.length === 0 ? ["- soturail context pack --target all"] : []),
    ...(exports.length === 0 ? ["- soturail agents export --agent all"] : []),
    "- soturail mcp smoke",
    "- soturail workflow new \"Implement feature\""
  ];
  return [
    "SotuRail Agent Integration Doctor",
    `version: ${SOTURAIL_VERSION}`,
    `workspace: ${await exists(paths.workspace) ? "ready" : "missing"}`,
    "mcp: ready",
    `context_packs: ${contextPacks.length > 0 ? "ready" : "none yet"}`,
    `skills: ${skills.length} found`,
    `workflows: ${workflows.length} local record(s)`,
    `available_agents: ${listAgentProfiles().map((profile) => profile.id).join(", ")}`,
    `exports: ${exports.length > 0 ? exports.join(", ") : "none yet"}`,
    "hooks: dry-run-first",
    "safe_default: true",
    "",
    "Next steps:",
    ...nextSteps
  ].join("\n") + "\n";
}

export async function buildAgentExportFiles(agent: AgentId, root = process.cwd()): Promise<AgentExportFile[]> {
  const contextTarget = agent === "antigravity" ? "antigravity" : agent;
  const context = await buildContextPack(contextTarget, root);
  const prompt = promptOnly(agent);
  switch (agent) {
    case "claude":
      return [
        { relativePath: "CLAUDE.md", content: prompt },
        { relativePath: "mcp-config.json", content: `${JSON.stringify(mcpConfig("claude"), null, 2)}\n` },
        { relativePath: "safe-hooks.md", content: claudeSafeHooks() },
        { relativePath: "context-pack.md", content: context.payload }
      ];
    case "codex":
      return [
        { relativePath: "AGENTS.md", content: prompt },
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
    case "gemini":
      return [
        { relativePath: "GEMINI.md", content: prompt },
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
    case "cursor":
      return [
        { relativePath: "cursor-rules.md", content: cursorRules() },
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
    case "antigravity":
      return [
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
    case "generic":
      return [
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
  }
}

export function mcpConfig(agent: AgentId | "cursor" | "generic" = "generic"): Record<string, unknown> {
  return {
    name: "soturail",
    agent,
    transport: "stdio",
    command: "soturail",
    args: ["mcp", "serve", "--transport", "stdio"],
    safety: {
      arbitrary_shell_execution: false,
      raw_logs_redacted_by_default: true,
      review_before_enabling: true
    },
    resources: listMcpResourcesPreview(),
    tools: listMcpTools().map((tool) => tool.name).filter((name) => name !== "soturail.run")
  };
}

function listMcpResourcesPreview(): string[] {
  return [
    "soturail://repo-map",
    "soturail://tree",
    "soturail://rules",
    "soturail://approved-memory",
    "soturail://self-report",
    "soturail://benchmarks/latest",
    "soturail://roadmap"
  ];
}

function promptOnly(agent: AgentId): string {
  const profile = getAgentProfile(agent);
  return [
    `# SotuRail ${profile.display_name} Integration`,
    "",
    "SotuRail aims to unify local-first context engineering ideas into one auditable workflow.",
    "",
    `Agent: ${profile.id}`,
    `Risk level: ${profile.risk_level}`,
    `Supported modes: ${profile.integration_modes.join(", ")}`,
    "",
    "## Rules",
    "",
    "- Use `soturail index` before large repository changes.",
    "- Use `soturail context pack --target generic` or the target-specific pack for stable project context.",
    "- Use `soturail read <file> --query \"goal\"` for large files.",
    "- Use `soturail run <command>` for tests/builds/logs so raw evidence is recoverable.",
    "- Use `soturail expand <raw_id>` only when a compressed summary lacks needed evidence; redaction is on by default.",
    "- Never route `git push` through `soturail run`.",
    "- Do not enable generated hooks or scripts without human review.",
    "",
    "## MCP",
    "",
    profile.supports_mcp
      ? "Use `soturail mcp config --agent " + agent + "` to export a reviewed stdio server snippet."
      : "MCP host configuration is not assumed for this agent; use prompt-only/context-pack guidance.",
    ""
  ].join("\n");
}

function cursorRules(): string {
  return `${promptOnly("cursor")}\n## Cursor Rule Export\n\nPlace this content in a reviewed project rules location such as .cursor/rules/soturail.mdc only after checking your local Cursor setup.\n`;
}

function claudeSafeHooks(): string {
  return [
    "# SotuRail Claude Safe Hooks",
    "",
    "Review this template before enabling it in Claude Code.",
    "",
    "The hook should block destructive shell patterns, warn about `git push`, and suggest `soturail run` for tests/builds/logs.",
    "",
    "Do not enable arbitrary shell execution through MCP."
  ].join("\n") + "\n";
}

function normalizeMode(value: string | undefined, fallback: AgentMode): AgentMode {
  if (!value) return fallback;
  if (value === "prompt-only" || value === "mcp" || value === "safe-hooks" || value === "rules") return value;
  throw new Error(`Unknown agent mode "${value}".`);
}

function installTargetsFor(agent: AgentId, mode: AgentMode): Array<{ path: string; content: string }> {
  if (agent === "claude" && mode === "mcp") {
    return [{ path: ".soturail/exports/mcp/claude/mcp-config.json", content: `${JSON.stringify(mcpConfig("claude"), null, 2)}\n` }];
  }
  if (agent === "claude" && mode === "safe-hooks") {
    return [{ path: ".soturail/exports/agents/claude/safe-hooks.md", content: claudeSafeHooks() }];
  }
  if (agent === "cursor" && mode === "rules") {
    return [{ path: ".cursor/rules/soturail.mdc", content: cursorRules() }];
  }
  const map: Record<AgentId, string> = {
    claude: "CLAUDE.md",
    codex: "AGENTS.md",
    gemini: "GEMINI.md",
    cursor: ".cursor/rules/soturail.mdc",
    antigravity: ".soturail/exports/agents/antigravity/prompt-only.md",
    generic: ".soturail/exports/agents/generic/prompt-only.md"
  };
  return [{ path: map[agent], content: promptOnly(agent) }];
}

async function writePlannedFile(
  filePath: string,
  content: string,
  root: string,
  options: { dryRun: boolean; backup: boolean }
): Promise<string[]> {
  const relative = relativeToRoot(root, filePath).replace(/\\/g, "/");
  const existsAlready = await exists(filePath);
  const lines = [`${options.dryRun ? "Would write" : "Write"} ${relative}`];
  if (existsAlready && options.backup) {
    lines.push(`${options.dryRun ? "Would create" : "Create"} backup ${relative}.soturail.bak`);
  }
  if (!options.dryRun) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    if (existsAlready && options.backup) await fs.copyFile(filePath, `${filePath}.soturail.bak`);
    await fs.writeFile(filePath, content, "utf8");
  }
  return lines;
}

async function exists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}
