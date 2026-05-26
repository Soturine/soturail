import { promises as fs } from "node:fs";
import path from "node:path";
import { getWorkspacePaths, readJsonl, relativeToRoot } from "./config.js";
import { listAgentProfiles } from "./agent-registry.js";
import type { AgentId } from "./agent-profile.js";
import { SOTURAIL_VERSION } from "./version.js";

export type CapabilityStatus =
  | "supported"
  | "experimental"
  | "prompt-only"
  | "planned"
  | "unknown"
  | "not-supported"
  | "docs-only"
  | "dry-run-first";

export interface AgentCapability {
  id: AgentId;
  displayName: string;
  maturity: CapabilityStatus;
  instructionDocs: CapabilityStatus;
  rulesSettings: CapabilityStatus;
  hooks: CapabilityStatus;
  mcp: CapabilityStatus;
  skills: CapabilityStatus;
  contextPacks: CapabilityStatus;
  rolePacks: CapabilityStatus;
  policyNotes: CapabilityStatus;
  installSupport: CapabilityStatus;
  dryRunSupport: CapabilityStatus;
  backupSupport: CapabilityStatus;
  promptOnlyFallback: CapabilityStatus;
  safeInstallModes: string[];
  defaultInstallMode: string;
  configPaths: string[];
  recommendedPayloads: string[];
  notes: string[];
}

export interface AgentRuntimeStatus {
  schemaVersion: "soturail.agent-status.v1";
  version: string;
  root: string;
  detectedFiles: Array<{ path: string; present: boolean; kind: string }>;
  contextPacks: string[];
  rolePacks: string[];
  skills: string[];
  mcp: {
    exports: string[];
    manifestPresent: boolean;
  };
  policy: {
    queuePresent: boolean;
    queueItems: number;
    decisionsPresent: boolean;
    decisions: number;
  };
  runs: string[];
  nextSteps: string[];
  setupExamples: string[];
}

export const AGENT_POLICY_NOTES = [
  "No arbitrary shell execution is exposed through SotuRail MCP.",
  "Raw log expansion requires explicit review; redaction is enabled by default.",
  "Probable secrets should stay local and be redacted before agent handoff.",
  "Global config files are not written by default.",
  "Hooks and config writes are dry-run/backup-first.",
  "Publish, release and destructive actions require human approval.",
  "Generated files should be reviewed before enabling in an agent host."
];

const capabilityOverrides: Record<AgentId, Omit<AgentCapability, "id" | "displayName">> = {
  claude: {
    maturity: "dry-run-first",
    instructionDocs: "supported",
    rulesSettings: "supported",
    hooks: "experimental",
    mcp: "supported",
    skills: "supported",
    contextPacks: "supported",
    rolePacks: "supported",
    policyNotes: "supported",
    installSupport: "dry-run-first",
    dryRunSupport: "supported",
    backupSupport: "supported",
    promptOnlyFallback: "supported",
    safeInstallModes: ["prompt-only", "mcp", "safe-hooks"],
    defaultInstallMode: "prompt-only",
    configPaths: ["CLAUDE.md", ".claude/settings.json", ".soturail/exports/agents/claude/"],
    recommendedPayloads: ["Markdown", "XML-like tagged blocks", "MCP stdio config", "short CLAUDE.md references"],
    notes: ["Claude support is project-local and review-first; safe hooks are templates, not automatically enabled."]
  },
  codex: {
    maturity: "prompt-only",
    instructionDocs: "supported",
    rulesSettings: "prompt-only",
    hooks: "not-supported",
    mcp: "planned",
    skills: "supported",
    contextPacks: "supported",
    rolePacks: "supported",
    policyNotes: "supported",
    installSupport: "prompt-only",
    dryRunSupport: "supported",
    backupSupport: "supported",
    promptOnlyFallback: "supported",
    safeInstallModes: ["prompt-only"],
    defaultInstallMode: "prompt-only",
    configPaths: ["AGENTS.md", ".soturail/exports/agents/codex/"],
    recommendedPayloads: ["AGENTS.md", "Markdown context packs", "JSON reports", "prompt-only fallback"],
    notes: ["Codex support is conservative: AGENTS.md plus SotuRail context artifacts."]
  },
  gemini: {
    maturity: "prompt-only",
    instructionDocs: "supported",
    rulesSettings: "prompt-only",
    hooks: "not-supported",
    mcp: "planned",
    skills: "supported",
    contextPacks: "supported",
    rolePacks: "supported",
    policyNotes: "supported",
    installSupport: "prompt-only",
    dryRunSupport: "supported",
    backupSupport: "supported",
    promptOnlyFallback: "supported",
    safeInstallModes: ["prompt-only"],
    defaultInstallMode: "prompt-only",
    configPaths: ["GEMINI.md", ".soturail/exports/agents/gemini/"],
    recommendedPayloads: ["GEMINI.md", "Markdown", "JSON summaries", "large-context docs"],
    notes: ["Gemini support uses portable prompt/context artifacts and does not assume hooks."]
  },
  cursor: {
    maturity: "dry-run-first",
    instructionDocs: "supported",
    rulesSettings: "supported",
    hooks: "not-supported",
    mcp: "experimental",
    skills: "supported",
    contextPacks: "supported",
    rolePacks: "supported",
    policyNotes: "supported",
    installSupport: "dry-run-first",
    dryRunSupport: "supported",
    backupSupport: "supported",
    promptOnlyFallback: "supported",
    safeInstallModes: ["prompt-only", "rules"],
    defaultInstallMode: "prompt-only",
    configPaths: [".cursor/rules/soturail.mdc", ".soturail/exports/agents/cursor/"],
    recommendedPayloads: ["Cursor rules", "Markdown docs", "file references", "compact tables"],
    notes: ["Cursor rules are project-local files and should be reviewed before enabling."]
  },
  antigravity: {
    maturity: "prompt-only",
    instructionDocs: "prompt-only",
    rulesSettings: "planned",
    hooks: "not-supported",
    mcp: "planned",
    skills: "supported",
    contextPacks: "supported",
    rolePacks: "supported",
    policyNotes: "supported",
    installSupport: "prompt-only",
    dryRunSupport: "supported",
    backupSupport: "supported",
    promptOnlyFallback: "supported",
    safeInstallModes: ["prompt-only"],
    defaultInstallMode: "prompt-only",
    configPaths: [".soturail/exports/agents/antigravity/prompt-only.md"],
    recommendedPayloads: ["Markdown", "context pack export", "prompt-only fallback"],
    notes: ["Antigravity remains prompt-only until stable local config surfaces are confirmed."]
  },
  generic: {
    maturity: "supported",
    instructionDocs: "supported",
    rulesSettings: "prompt-only",
    hooks: "not-supported",
    mcp: "supported",
    skills: "supported",
    contextPacks: "supported",
    rolePacks: "supported",
    policyNotes: "supported",
    installSupport: "prompt-only",
    dryRunSupport: "supported",
    backupSupport: "supported",
    promptOnlyFallback: "supported",
    safeInstallModes: ["prompt-only", "mcp"],
    defaultInstallMode: "prompt-only",
    configPaths: [".soturail/exports/agents/generic/prompt-only.md"],
    recommendedPayloads: ["Markdown", "JSON reports", "MCP stdio notes", "prompt-only fallback"],
    notes: ["Generic support is portable Markdown plus reviewed MCP snippets."]
  },
  opencode: promptOnlyHost("opencode", [".soturail/exports/agents/opencode/prompt-only.md"], [
    "Markdown",
    "AGENTS-style root instructions",
    "context pack references",
    "prompt-only fallback"
  ]),
  amp: promptOnlyHost("amp", [".soturail/exports/agents/amp/prompt-only.md"], [
    "Markdown",
    "JSON summaries",
    "context pack references",
    "prompt-only fallback"
  ]),
  kiro: promptOnlyHost("kiro", [".soturail/exports/agents/kiro/prompt-only.md"], [
    "Markdown",
    "Mermaid workflow notes",
    "context pack references",
    "prompt-only fallback"
  ]),
  deepagents: experimentalDeepHost("deepagents", [".soturail/exports/agents/deepagents/deepagents.md"]),
  "deepagents-js": experimentalDeepHost("deepagents-js", [".soturail/exports/agents/deepagents-js/deepagents-js.md"])
};

export function listAgentCapabilities(): AgentCapability[] {
  return listAgentProfiles().map((profile) => ({
    id: profile.id,
    displayName: profile.display_name,
    ...capabilityOverrides[profile.id]
  }));
}

export function getAgentCapability(id: AgentId): AgentCapability {
  const capability = listAgentCapabilities().find((item) => item.id === id);
  if (!capability) throw new Error(`Unknown agent "${id}".`);
  return capability;
}

export function renderAgentCapabilities(): string {
  const rows = listAgentCapabilities();
  return [
    "SotuRail Agent Host Capability Matrix",
    `version: ${SOTURAIL_VERSION}`,
    "arbitrary_shell_execution: not exposed",
    "",
    "Legend: supported, experimental, prompt-only, planned, unknown, not-supported, docs-only, dry-run-first.",
    "",
    "Copy/paste setup examples:",
    "- Claude Code: soturail agents install --agent claude --dry-run",
    "- Codex: soturail agents install --agent codex --dry-run",
    "- Gemini CLI: soturail agents install --agent gemini --dry-run",
    "- Cursor: soturail agents install --agent cursor --dry-run",
    "- Antigravity: soturail agents export --agent antigravity",
    "- Deep Agents-style: soturail agents export --agent deepagents",
    "",
    ...rows.flatMap((row) => [
      `- ${row.displayName} (${row.id})`,
      `  maturity: ${row.maturity}`,
      `  instruction_docs: ${row.instructionDocs}`,
      `  rules_settings: ${row.rulesSettings}`,
      `  hooks: ${row.hooks}`,
      `  mcp: ${row.mcp}`,
      `  skills: ${row.skills}`,
      `  context_packs: ${row.contextPacks}`,
      `  role_packs: ${row.rolePacks}`,
      `  install_support: ${row.installSupport}`,
      `  dry_run: ${row.dryRunSupport}`,
      `  backup: ${row.backupSupport}`,
      `  recommended_payloads: ${row.recommendedPayloads.join(" + ")}`,
      `  setup_command: ${setupCommandFor(row.id)}`,
      ""
    ]),
    "Policy notes:",
    ...AGENT_POLICY_NOTES.map((note) => `- ${note}`)
  ].join("\n").trimEnd() + "\n";
}

export function payloadRecommendationsFor(id: AgentId): string[] {
  return getAgentCapability(id).recommendedPayloads;
}

export async function agentStatus(root = process.cwd()): Promise<AgentRuntimeStatus> {
  const paths = getWorkspacePaths(root);
  const detectedFiles = await Promise.all([
    detect(root, "CLAUDE.md", "instruction_doc"),
    detect(root, "AGENTS.md", "instruction_doc"),
    detect(root, "GEMINI.md", "instruction_doc"),
    detect(root, ".claude/settings.json", "settings"),
    detect(root, ".cursor/rules", "rules_dir"),
    detect(root, ".cursor/rules/soturail.mdc", "rules_file"),
    detect(root, relativeToRoot(root, paths.agentExportsDir), "agent_exports"),
    detect(root, relativeToRoot(root, paths.contextDir), "context"),
    detect(root, relativeToRoot(root, paths.contextRolePacksDir), "role_packs"),
    detect(root, relativeToRoot(root, paths.skillsDir), "skills"),
    detect(root, relativeToRoot(root, paths.policyDir), "policy"),
    detect(root, relativeToRoot(root, paths.runsDir), "runs")
  ]);
  const contextEntries = await listFiles(paths.contextDir);
  const contextPacks = contextEntries.filter((entry) => entry.endsWith(".md"));
  const rolePacks = (await listFiles(paths.contextRolePacksDir)).filter((entry) => entry.endsWith(".md"));
  const skills = await listFiles(paths.skillsDir);
  const mcpExports = await listFiles(paths.mcpExportsDir);
  const queueItems = await readJsonl<unknown>(paths.policyQueueFile).catch(() => []);
  const decisions = await readJsonl<unknown>(paths.policyDecisionsFile).catch(() => []);
  const runs = await listFiles(paths.runsDir);
  const nextSteps = [
    ...(contextPacks.length === 0 ? ["soturail context pack --target all"] : []),
    ...(rolePacks.length === 0 ? ["soturail context pack --role planner"] : []),
    "soturail agents capabilities",
    "soturail agents install --agent claude --dry-run",
    "soturail policy doctor"
  ];
  const setupExamples = [
    "soturail init",
    "soturail agents status",
    "soturail context budget --explain",
    "soturail context pack --role planner",
    "soturail agents install --agent claude --dry-run",
    "soturail agents export --agent claude"
  ];
  return {
    schemaVersion: "soturail.agent-status.v1",
    version: SOTURAIL_VERSION,
    root: path.resolve(root),
    detectedFiles,
    contextPacks,
    rolePacks,
    skills,
    mcp: {
      exports: mcpExports,
      manifestPresent: mcpExports.length > 0
    },
    policy: {
      queuePresent: await exists(paths.policyQueueFile),
      queueItems: queueItems.length,
      decisionsPresent: await exists(paths.policyDecisionsFile),
      decisions: decisions.length
    },
    runs,
    nextSteps,
    setupExamples
  };
}

export function renderAgentStatus(status: AgentRuntimeStatus): string {
  return [
    "SotuRail agents status",
    `version: ${status.version}`,
    `workspace: ${path.basename(status.root) || status.root}`,
    "",
    "Detected agent files:",
    ...status.detectedFiles.map((item) => `- ${item.path}: ${item.present ? "present" : "missing"} (${item.kind})`),
    "",
    `context_packs: ${status.contextPacks.length > 0 ? status.contextPacks.join(", ") : "none yet"}`,
    `role_packs: ${status.rolePacks.length > 0 ? status.rolePacks.join(", ") : "none yet"}`,
    `skills: ${status.skills.length}`,
    `mcp_exports: ${status.mcp.exports.length > 0 ? status.mcp.exports.join(", ") : "none yet"}`,
    `policy_queue_items: ${status.policy.queueItems}`,
    `policy_decisions: ${status.policy.decisions}`,
    `runs: ${status.runs.length}`,
    "",
    "Recommended next steps:",
    ...status.nextSteps.map((step) => `- ${step}`),
    "",
    "Copy/paste setup path:",
    ...status.setupExamples.map((step) => `- ${step}`),
    "",
    "Short root docs guidance:",
    "- Keep root agent files brief: identity, safety, commands and links.",
    "- Put bulky task context in .soturail/context/ and role packs."
  ].join("\n") + "\n";
}

function setupCommandFor(id: AgentId): string {
  if (id === "antigravity" || id === "opencode" || id === "amp" || id === "kiro") return `soturail agents export --agent ${id}`;
  if (id === "deepagents" || id === "deepagents-js") return `soturail agents export --agent ${id}`;
  return `soturail agents install --agent ${id} --dry-run`;
}

async function detect(root: string, relativePath: string, kind: string): Promise<{ path: string; present: boolean; kind: string }> {
  return {
    path: relativePath.replace(/\\/g, "/"),
    present: await exists(path.resolve(root, relativePath)),
    kind
  };
}

async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => !entry.name.startsWith(".")).map((entry) => entry.name).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

async function exists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}

function promptOnlyHost(
  id: AgentId,
  configPaths: string[],
  recommendedPayloads: string[]
): Omit<AgentCapability, "id" | "displayName"> {
  return {
    maturity: "prompt-only",
    instructionDocs: "prompt-only",
    rulesSettings: "planned",
    hooks: "not-supported",
    mcp: "planned",
    skills: "supported",
    contextPacks: "supported",
    rolePacks: "supported",
    policyNotes: "supported",
    installSupport: "prompt-only",
    dryRunSupport: "supported",
    backupSupport: "supported",
    promptOnlyFallback: "supported",
    safeInstallModes: ["prompt-only"],
    defaultInstallMode: "prompt-only",
    configPaths,
    recommendedPayloads,
    notes: [`${id} support is a conservative prompt-only fallback until stable local host surfaces are confirmed.`]
  };
}

function experimentalDeepHost(
  id: AgentId,
  configPaths: string[]
): Omit<AgentCapability, "id" | "displayName"> {
  return {
    maturity: "experimental",
    instructionDocs: "docs-only",
    rulesSettings: "docs-only",
    hooks: "not-supported",
    mcp: "docs-only",
    skills: "supported",
    contextPacks: "supported",
    rolePacks: "supported",
    policyNotes: "supported",
    installSupport: "prompt-only",
    dryRunSupport: "supported",
    backupSupport: "supported",
    promptOnlyFallback: "supported",
    safeInstallModes: ["prompt-only"],
    defaultInstallMode: "prompt-only",
    configPaths,
    recommendedPayloads: ["role packs", "workflow evidence", "policy notes", "Markdown", "JSON config notes"],
    notes: ["Experimental export artifacts only; no runtime integration or package dependency is installed."]
  };
}
