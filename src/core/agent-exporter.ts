import { promises as fs } from "node:fs";
import path from "node:path";
import { buildContextPack, type ContextTarget } from "./context-pack.js";
import { ensureWorkspace, getWorkspacePaths, relativeToRoot } from "./config.js";
import { listMcpTools } from "./mcp-tools.js";
import { listMcpResources } from "./mcp-resources.js";
import { getAgentProfile, listAgentProfiles, parseAgentId } from "./agent-registry.js";
import type { AgentExportFile, AgentId, AgentInstallOptions, AgentMode } from "./agent-profile.js";
import { SOTURAIL_VERSION } from "./version.js";
import {
  AGENT_POLICY_NOTES,
  agentStatus,
  getAgentCapability,
  listAgentCapabilities,
  payloadRecommendationsFor,
  renderAgentStatus
} from "./agent-runtime.js";

export interface AgentExportResult {
  written: string[];
}

export interface AgentInstallResult {
  lines: string[];
}

export async function exportAgents(agentValue: string, root = process.cwd()): Promise<AgentExportResult> {
  await ensureWorkspace(root);
  const parsed = parseAgentId(agentValue);
  const selected: AgentId[] = parsed === "all" ? allAgentIds() : [parsed];
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
  const selected: AgentId[] = parsed === "all" ? allAgentIds() : [parsed];
  const dryRun = options.dryRun === true;
  const backup = options.backup !== false;
  const lines = [
    `SotuRail agents install --agent ${agentValue}${options.mode ? ` --mode ${options.mode}` : ""}${dryRun ? " --dry-run" : ""}`,
    `dry_run: ${dryRun}`,
    "scope: project-local files only"
  ];
  for (const agent of selected) {
    const profile = getAgentProfile(agent);
    const capability = getAgentCapability(agent);
    const mode = normalizeMode(options.mode, profile.default_mode);
    if (!profile.integration_modes.includes(mode)) {
      throw new Error(`${agent} does not support mode "${mode}". Supported: ${profile.integration_modes.join(", ")}`);
    }
    const targets = installTargetsFor(agent, mode);
    lines.push("", `agent: ${agent}`, `display_name: ${profile.display_name}`, `mode: ${mode}`, `risk_level: ${profile.risk_level}`);
    for (const target of targets) {
      const filePath = path.resolve(root, options.output ?? target.path);
      lines.push(...await writePlannedFile(filePath, target.content, root, { dryRun, backup }));
    }
    lines.push("References:");
    for (const reference of installReferencesFor(agent)) lines.push(`- ${reference}`);
    lines.push(`Payload recommendation: ${capability.recommendedPayloads.join(" + ")}`);
    lines.push("Policy warnings:");
    for (const note of AGENT_POLICY_NOTES) lines.push(`- ${note}`);
    if (mode === "mcp") {
      lines.push("MCP config is project-local. Review before adding it to a host application.");
    }
    if (dryRun) {
      lines.push(`Apply after review: soturail agents install --agent ${agent}${mode !== profile.default_mode ? ` --mode ${mode}` : ""} --backup --yes`);
    }
    lines.push("Rollback: restore any .soturail.bak file or delete generated project-local files.");
  }
  return { lines };
}

export async function uninstallAgent(agentValue: string, options: { dryRun?: boolean } = {}, root = process.cwd()): Promise<string> {
  const parsed = parseAgentId(agentValue);
  const selected: AgentId[] = parsed === "all" ? allAgentIds() : [parsed];
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

export async function agentDoctor(root = process.cwd(), options: { verbose?: boolean } = {}): Promise<string> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const exports = await fs.readdir(paths.agentExportsDir).catch(() => []);
  const contextPacks = await fs.readdir(paths.contextDir).catch(() => []);
  const skills = await fs.readdir(paths.skillsDir).catch(() => []);
  const workflows = await fs.readdir(paths.workflowsDir).catch(() => []);
  const nextSteps = [
    ...(contextPacks.length === 0 ? ["- soturail context pack --target all"] : []),
    ...(exports.length === 0 ? ["- soturail agents export --agent all"] : []),
    "- soturail agents status",
    "- soturail agents capabilities",
    "- soturail mcp smoke",
    "- soturail workflow new \"Implement feature\""
  ];
  const lines = [
    "SotuRail Agent Integration Doctor",
    `version: ${SOTURAIL_VERSION}`,
    "summary: local agent setup is safe-by-default, dry-run-first and project-local",
    `workspace: ${await exists(paths.workspace) ? "ready" : "missing"}`,
    "mcp: ready",
    `context_packs: ${contextPacks.length > 0 ? "ready" : "none yet"}`,
    `skills: ${skills.length} found`,
    `workflows: ${workflows.length} local record(s)`,
    `available_agents: ${listAgentProfiles().map((profile) => profile.id).join(", ")}`,
    `exports: ${exports.length > 0 ? exports.join(", ") : "none yet"}`,
    "hooks: dry-run-first",
    "safe_default: true",
    "root_docs: keep short; reference agent_docs/ and .soturail/context/ for detail",
    "",
    "Next steps:",
    ...nextSteps,
    "",
    "Fast setup path:",
    "- soturail context budget --explain",
    "- soturail context pack --role planner",
    "- soturail agents install --agent claude --dry-run"
  ];
  if (options.verbose) {
    const status = await agentStatus(root);
    lines.push(
      "",
      "Verbose runtime integration status:",
      renderAgentStatus(status).trimEnd(),
      "",
      "Host capability summary:",
      ...listAgentCapabilities().map((capability) =>
        `- ${capability.id}: install=${capability.installSupport}, mcp=${capability.mcp}, hooks=${capability.hooks}, payloads=${capability.recommendedPayloads.join(" + ")}`
      ),
      "",
      "Agent docs hygiene hints:",
      "- Keep root agent docs short; reference SotuRail context packs instead of pasting large generated context.",
      "- Use soturail agents lint before committing agent docs.",
      "- Use soturail agents split-context --dry-run to plan context offload.",
      "",
      "Copy/paste host setup examples:",
      ...hostSetupExamples(),
      "",
      "Context and role-pack guidance:",
      "- Planner: soturail context pack --role planner",
      "- Executor: soturail context pack --role executor",
      "- Reviewer: soturail context pack --role reviewer",
      "- Release manager: soturail context pack --role release-manager",
      "- Researcher: soturail context pack --role researcher",
      "",
      "Dry-run install suggestions:",
      "- soturail agents install --agent claude --dry-run",
      "- soturail agents install --agent cursor --dry-run",
      "- soturail agents install --agent gemini --dry-run",
      "",
      "Policy notes:",
      ...AGENT_POLICY_NOTES.map((note) => `- ${note}`)
    );
  }
  return lines.join("\n") + "\n";
}

function hostSetupExamples(): string[] {
  return [
    "- Claude Code: soturail agents install --agent claude --dry-run && soturail agents export --agent claude",
    "- Codex: soturail agents install --agent codex --dry-run && soturail agents export --agent codex",
    "- Gemini CLI: soturail agents install --agent gemini --dry-run && soturail agents export --agent gemini",
    "- Cursor: soturail agents install --agent cursor --dry-run && soturail agents export --agent cursor",
    "- Antigravity: soturail agents export --agent antigravity",
    "- Deep Agents-style: soturail agents export --agent deepagents",
    "- Generic host: soturail agents export --agent generic"
  ];
}

export async function buildAgentExportFiles(agent: AgentId, root = process.cwd()): Promise<AgentExportFile[]> {
  const contextTarget = contextTargetFor(agent);
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
    case "opencode":
    case "amp":
    case "kiro":
      return [
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
    case "deepagents":
      return deepAgentFiles("deepagents", context.payload, prompt);
    case "deepagents-js":
      return deepAgentFiles("deepagents-js", context.payload, prompt);
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
  const capability = getAgentCapability(agent);
  return [
    `# SotuRail ${profile.display_name} Integration`,
    "",
    "SotuRail aims to unify local-first context engineering ideas into one auditable workflow.",
    "",
    `Agent: ${profile.id}`,
    `Risk level: ${profile.risk_level}`,
    `Supported modes: ${profile.integration_modes.join(", ")}`,
    `Payloads: ${capability.recommendedPayloads.join(" + ")}`,
    "",
    "## Rules",
    "",
    "- Use `soturail index` before large repository changes.",
    "- Use `soturail brain export --agent " + agent + "` for verified Project Brain briefs when available.",
    "- Use `soturail context pack --target generic` or the target-specific pack for stable project context.",
    "- Use `soturail read <file> --query \"goal\"` for large files.",
    "- Use `soturail run <command>` for tests/builds/logs so raw evidence is recoverable.",
    "- Use `soturail expand <raw_id>` only when a compressed summary lacks needed evidence; redaction is on by default.",
    "- Never route `git push` through `soturail run`.",
    "- Do not enable generated hooks or scripts without human review.",
    "",
    "## Host-Aware Policy Notes",
    "",
    ...AGENT_POLICY_NOTES.map((note) => `- ${note}`),
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
    generic: ".soturail/exports/agents/generic/prompt-only.md",
    opencode: ".soturail/exports/agents/opencode/prompt-only.md",
    amp: ".soturail/exports/agents/amp/prompt-only.md",
    kiro: ".soturail/exports/agents/kiro/prompt-only.md",
    deepagents: ".soturail/exports/agents/deepagents/deepagents.md",
    "deepagents-js": ".soturail/exports/agents/deepagents-js/deepagents-js.md"
  };
  return [{ path: map[agent], content: promptOnly(agent) }];
}

function allAgentIds(): AgentId[] {
  return listAgentProfiles().map((profile) => profile.id);
}

function contextTargetFor(agent: AgentId): ContextTarget {
  if (agent === "claude" || agent === "codex" || agent === "gemini" || agent === "cursor" || agent === "antigravity") return agent;
  return "generic";
}

function installReferencesFor(agent: AgentId): string[] {
  const capability = getAgentCapability(agent);
  return [
    ...capability.configPaths,
    ".soturail/context/",
    ".soturail/context/role-packs/",
    ".soturail/policy/",
    ".soturail/runs/"
  ];
}

function deepAgentFiles(agent: "deepagents" | "deepagents-js", contextPayload: string, prompt: string): AgentExportFile[] {
  const title = agent === "deepagents" ? "Deep Agents-style" : "Deep Agents JS-style";
  const config = {
    schemaVersion: "soturail.agent-runtime.v1",
    agent,
    runtimeIntegration: false,
    installsDependencies: false,
    boundary: "SotuRail exports prompt/config/context artifacts only.",
    policyNotes: AGENT_POLICY_NOTES,
    payloadRecommendations: payloadRecommendationsFor(agent)
  };
  return [
    {
      relativePath: `${agent}.md`,
      content: [
        `# SotuRail ${title} Export`,
        "",
        "SotuRail prepares local context artifacts for review. It does not run a Deep Agents runtime, install deepagents packages, or create an autonomous editing loop.",
        "",
        prompt.trim(),
        "",
        "## Runtime Boundary",
        "",
        "- Context/config artifacts only.",
        "- Role packs and workflow evidence are references for a human-reviewed host.",
        "- MCP exposure remains SotuRail-controlled and does not include arbitrary shell execution.",
        "- Memory exports should be approved-memory-only and redacted before handoff.",
        "",
        "## Recovery Pointers",
        "",
        "- Context packs: .soturail/context/",
        "- Role packs: .soturail/context/role-packs/",
        "- Workflow evidence: .soturail/workflows/ or .soturail/runs/",
        "- Policy decisions: .soturail/policy/decisions.jsonl",
        ""
      ].join("\n")
    },
    { relativePath: "runtime-config.json", content: `${JSON.stringify(config, null, 2)}\n` },
    { relativePath: "context-pack.md", content: contextPayload }
  ];
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
  } else if (options.backup) {
    lines.push(`Backup: none needed for ${relative}`);
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
