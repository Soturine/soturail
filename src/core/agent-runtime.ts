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
  createdAt: string;
  version: string;
  status: "passed" | "warning" | "failed" | "unknown";
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
  warnings: string[];
  nextCommands: string[];
  nextSteps: string[];
  setupExamples: string[];
}

export interface AgentHostMatrixRow {
  host: string;
  id: string;
  status: "stable" | "experimental" | "planned" | "legacy" | "unknown" | "generic-compatible";
  displayName: string;
  priority: "high" | "normal" | "low";
  instructionFiles: string[];
  contextFormats: string[];
  reportFormats: string[];
  mcpSupport: "read-only-resources" | "host-config" | "prompt-only" | "planned" | "not-supported";
  skillsSupport: CapabilityStatus;
  hooksSupport: CapabilityStatus;
  installSupport: CapabilityStatus;
  mutationAllowedByDefault: false;
  recommendedCommands: string[];
  limitations: string[];
  policyNotes: string[];
  exportSupport: CapabilityStatus;
  reportAgentSupport: CapabilityStatus;
  contextPackSupport: CapabilityStatus;
  mcpResourcesSupport: CapabilityStatus;
  installDryRunSupport: CapabilityStatus;
  knownLimitations: string[];
  recommendedCommand: string;
}

export interface AgentHostMatrixReport {
  schemaVersion: "soturail.agents.matrix.v1";
  contractId: "soturail.agent-host-matrix.v1";
  createdAt: string;
  version: string;
  status: "passed" | "warning" | "failed" | "unknown";
  hosts: AgentHostMatrixRow[];
  warnings: string[];
  nextCommands: string[];
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
    configPaths: ["GEMINI.md", ".soturail/agents/gemini/", ".soturail/exports/agents/gemini/"],
    recommendedPayloads: ["GEMINI.md", "Markdown", "JSON summaries", "large-context docs"],
    notes: ["Gemini support uses portable prompt/context artifacts and does not assume hooks."]
  },
  "gemini-legacy": {
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
    configPaths: ["AGENTS.md", "GEMINI.md", ".soturail/agents/gemini-legacy/", ".soturail/exports/agents/gemini-legacy/"],
    recommendedPayloads: ["AGENTS.md", "GEMINI.md", "Markdown", "JSON summaries", "large-context docs"],
    notes: ["Gemini legacy/compatible support is prompt-only and aimed at hosts that have not adopted a stable project config contract."]
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
    configPaths: [".cursor/rules/soturail.mdc", ".soturail/agents/cursor/", ".soturail/exports/agents/cursor/"],
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
    configPaths: [".soturail/agents/antigravity/AGENTS.md", ".soturail/exports/agents/antigravity/prompt-only.md"],
    recommendedPayloads: ["AGENTS.md", "Markdown", "context pack export", "prompt-only fallback"],
    notes: ["Antigravity is high-priority but experimental; it remains prompt-only until a stable Google-local config surface is documented."]
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
    configPaths: [".soturail/agents/generic/AGENT_CONTEXT.md", ".soturail/exports/agents/generic/prompt-only.md"],
    recommendedPayloads: ["AGENT_CONTEXT.md", "Markdown", "JSON reports", "MCP stdio notes", "prompt-only fallback"],
    notes: ["Generic support is portable Markdown plus reviewed MCP snippets."]
  },
  opencode: promptOnlyHost("opencode", [".soturail/agents/opencode/AGENTS.md", ".soturail/exports/agents/opencode/prompt-only.md"], [
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
  deepagents: experimentalDeepHost("deepagents", [".soturail/agents/deepagents/role-pack.md", ".soturail/exports/agents/deepagents/deepagents.md"]),
  "deepagents-js": experimentalDeepHost("deepagents-js", [".soturail/agents/deepagents-js/role-pack.md", ".soturail/exports/agents/deepagents-js/deepagents-js.md"])
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

export function buildAgentHostMatrix(): AgentHostMatrixReport {
  const hosts = listAgentCapabilities().map((capability): AgentHostMatrixRow => ({
    host: displayHostName(capability),
    id: capability.id,
    status: stableHostStatus(capability),
    displayName: capability.displayName,
    priority: hostPriority(capability.id),
    instructionFiles: instructionFilesFor(capability.id),
    contextFormats: contextFormatsFor(capability.id),
    reportFormats: reportFormatsFor(capability.id),
    mcpSupport: mcpSupportFor(capability),
    skillsSupport: capability.skills,
    hooksSupport: capability.hooks,
    installSupport: capability.installSupport,
    mutationAllowedByDefault: false,
    recommendedCommands: recommendedCommandsFor(capability.id),
    limitations: capability.notes,
    policyNotes: [
      "Local artifacts only.",
      "Read-only MCP resources by default.",
      "No host receives destructive tool access from SotuRail exports."
    ],
    exportSupport: capability.instructionDocs,
    reportAgentSupport: reportAgentSupport(capability.id),
    contextPackSupport: capability.contextPacks,
    mcpResourcesSupport: capability.mcp,
    installDryRunSupport: capability.dryRunSupport,
    knownLimitations: capability.notes,
    recommendedCommand: setupCommandFor(capability.id)
  }));
  const warnings = [
    "OpenCode, Antigravity-style and DeepAgents-style targets are prompt-only or experimental until host-specific surfaces are verified.",
    "No host matrix row grants destructive MCP tools or arbitrary shell execution."
  ];
  return {
    schemaVersion: "soturail.agents.matrix.v1",
    contractId: "soturail.agent-host-matrix.v1",
    createdAt: new Date().toISOString(),
    version: SOTURAIL_VERSION,
    status: "warning",
    hosts,
    warnings,
    nextCommands: [
      "soturail agents export --agent codex",
      "soturail agents doctor --all",
      "soturail mcp resources host-manifest --host codex",
      "soturail report agent --agent codex",
      "soturail mcp resources report",
      "soturail agents doctor --verbose"
    ]
  };
}

export function renderAgentHostMatrix(report = buildAgentHostMatrix()): string {
  return [
    "SotuRail agent host compatibility matrix",
    `schemaVersion: ${report.schemaVersion}`,
    `version: ${report.version}`,
    `status: ${report.status}`,
    "",
    "| host | status | export | report agent | context packs | MCP resources | dry-run install | recommended command |",
    "|---|---|---|---|---|---|---|---|",
    ...report.hosts.map((host) => `| ${host.host} | ${host.status} | ${host.exportSupport} | ${host.reportAgentSupport} | ${host.contextPackSupport} | ${host.mcpSupport} | ${host.installDryRunSupport} | \`${host.recommendedCommand}\` |`),
    "",
    "Warnings:",
    ...report.warnings.map((warning) => `- ${warning}`),
    "",
    "Next commands:",
    ...report.nextCommands.map((command) => `- ${command}`)
  ].join("\n") + "\n";
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
    detect(root, relativeToRoot(root, paths.runsDir), "runs"),
    detect(root, relativeToRoot(root, paths.brainExportsDir), "project_brain_exports")
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
    "soturail brain export --agent generic",
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
    createdAt: new Date().toISOString(),
    version: SOTURAIL_VERSION,
    status: detectedFiles.some((item) => item.present) ? "passed" : "unknown",
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
    warnings: [],
    nextCommands: nextSteps,
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
    "- Put bulky task context in .soturail/context/ and role packs.",
    "- Add verified project knowledge with `soturail brain scan` and `soturail brain export --agent <host>`."
  ].join("\n") + "\n";
}

function setupCommandFor(id: AgentId): string {
  if (id === "antigravity" || id === "opencode" || id === "amp" || id === "kiro" || id === "gemini-legacy") return `soturail agents export --agent ${id}`;
  if (id === "deepagents" || id === "deepagents-js") return `soturail agents export --agent ${id}`;
  return `soturail agents install --agent ${id} --dry-run`;
}

function displayHostName(capability: AgentCapability): string {
  if (capability.id === "antigravity") return "Antigravity-style hosts";
  if (capability.id === "gemini") return "Gemini";
  if (capability.id === "gemini-legacy") return "Gemini legacy/compatible hosts";
  if (capability.id === "deepagents" || capability.id === "deepagents-js") return "DeepAgents-style targets";
  if (capability.id === "opencode") return "OpenCode";
  return capability.displayName;
}

function stableHostStatus(capability: AgentCapability): AgentHostMatrixRow["status"] {
  if (capability.id === "generic") return "stable";
  if (capability.id === "claude" || capability.id === "codex" || capability.id === "cursor") return "stable";
  if (capability.id === "gemini" || capability.id === "gemini-legacy") return "legacy";
  if (capability.id === "opencode") return "generic-compatible";
  if (capability.maturity === "experimental") return "experimental";
  if (capability.maturity === "planned") return "planned";
  return capability.maturity === "prompt-only" ? "experimental" : "unknown";
}

function reportAgentSupport(id: AgentId): CapabilityStatus {
  if (id === "claude" || id === "codex" || id === "gemini" || id === "gemini-legacy" || id === "cursor" || id === "generic") return "supported";
  return "prompt-only";
}

function hostPriority(id: AgentId): AgentHostMatrixRow["priority"] {
  if (id === "antigravity") return "high";
  if (id === "opencode" || id === "gemini-legacy" || id === "deepagents" || id === "deepagents-js") return "normal";
  return "low";
}

function instructionFilesFor(id: AgentId): string[] {
  const files: Record<AgentId, string[]> = {
    claude: ["CLAUDE.md", "context-pack.md"],
    codex: ["AGENTS.md", "context-pack.md"],
    gemini: ["GEMINI.md", "AGENTS.md", "context-pack.md"],
    "gemini-legacy": ["AGENTS.md", "GEMINI.md", "context-pack.md"],
    cursor: ["rules.md", "cursor-rules.md", "context-pack.md"],
    antigravity: ["AGENTS.md", "prompt-only.md", "context-pack.md"],
    generic: ["AGENT_CONTEXT.md", "prompt-only.md", "context-pack.md"],
    opencode: ["AGENTS.md", "prompt-only.md", "context-pack.md"],
    amp: ["prompt-only.md", "context-pack.md"],
    kiro: ["prompt-only.md", "context-pack.md"],
    deepagents: ["role-pack.md", "subagents.md", "deepagents.md"],
    "deepagents-js": ["role-pack.md", "subagents.md", "deepagents-js.md"]
  };
  return files[id];
}

function contextFormatsFor(id: AgentId): string[] {
  if (id === "deepagents" || id === "deepagents-js") return ["Markdown role pack", "JSON runtime note", "context-pack.md"];
  return ["Markdown", "context-pack.md", "agent report references"];
}

function reportFormatsFor(id: AgentId): string[] {
  if (id === "claude") return ["Markdown", "tagged sections"];
  if (id === "cursor") return ["short Markdown rules"];
  if (id === "deepagents" || id === "deepagents-js") return ["role-pack Markdown", "agent report Markdown"];
  return ["Markdown", "JSON evidence paths"];
}

function mcpSupportFor(capability: AgentCapability): AgentHostMatrixRow["mcpSupport"] {
  if (capability.mcp === "supported") return "host-config";
  if (capability.mcp === "experimental") return "read-only-resources";
  if (capability.mcp === "planned" || capability.mcp === "docs-only") return "planned";
  if (capability.promptOnlyFallback === "supported") return "prompt-only";
  return "not-supported";
}

function recommendedCommandsFor(id: AgentId): string[] {
  return [
    setupCommandFor(id),
    `soturail agents doctor --host ${id}`,
    `soturail report agent --agent ${reportAgentIdFor(id)}`,
    `soturail mcp resources host-manifest --host ${id}`
  ];
}

function reportAgentIdFor(id: AgentId): AgentId {
  return id;
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
