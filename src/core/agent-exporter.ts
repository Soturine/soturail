import { promises as fs } from "node:fs";
import path from "node:path";
import { buildContextPack, type ContextTarget } from "./context-pack.js";
import { ensureWorkspace, getWorkspacePaths, relativeToRoot } from "./config.js";
import { listMcpTools } from "./mcp-tools.js";
import { listMcpResources } from "./mcp-resources.js";
import { getAgentProfile, listAgentProfiles, parseAgentId } from "./agent-registry.js";
import type { AgentExportFile, AgentId, AgentInstallOptions, AgentMode } from "./agent-profile.js";
import { redactText } from "./report-redaction.js";
import { SOTURAIL_VERSION } from "./version.js";
import {
  AGENT_POLICY_NOTES,
  agentStatus,
  buildAgentHostMatrix,
  getAgentCapability,
  listAgentCapabilities,
  payloadRecommendationsFor,
  renderAgentStatus
} from "./agent-runtime.js";

export interface AgentExportResult {
  written: string[];
}

export interface AgentExportOptions {
  out?: string;
  format?: string;
  include?: string;
  role?: string;
}

export interface AgentInstallResult {
  lines: string[];
}

export interface AgentHostDoctorReport {
  schemaVersion: "soturail.agent-host-doctor.v1";
  createdAt: string;
  version: string;
  host: string;
  status: "passed" | "warning" | "failed";
  matrixStatus: string;
  exportPaths: string[];
  checks: Array<{ id: string; status: "passed" | "warning" | "failed"; summary: string }>;
  warnings: string[];
  blockingIssues: string[];
  nextCommands: string[];
}

export interface AgentHostDoctorSummary {
  schemaVersion: "soturail.agent-host-doctor-summary.v1";
  createdAt: string;
  version: string;
  status: "passed" | "warning" | "failed";
  hosts: AgentHostDoctorReport[];
  warnings: string[];
  blockingIssues: string[];
  nextCommands: string[];
}

export async function exportAgents(agentValue: string, rootOrOptions: string | AgentExportOptions = process.cwd(), maybeRoot = process.cwd()): Promise<AgentExportResult> {
  const root = typeof rootOrOptions === "string" ? rootOrOptions : maybeRoot;
  const options: AgentExportOptions = typeof rootOrOptions === "string" ? {} : rootOrOptions;
  await ensureWorkspace(root);
  const parsed = parseAgentId(agentValue);
  const selected: AgentId[] = parsed === "all" ? allAgentIds() : [parsed];
  const paths = getWorkspacePaths(root);
  const written: string[] = [];
  for (const agent of selected) {
    const targetDirs = exportTargetDirs(root, paths.agentExportsDir, agent, selected.length, options);
    for (const targetDir of targetDirs) {
      await fs.mkdir(targetDir, { recursive: true });
      for (const file of await buildAgentExportFiles(agent, root, options)) {
        const filePath = path.join(targetDir, file.relativePath);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, file.content, "utf8");
        written.push(relativeToRoot(root, filePath));
      }
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

export async function agentHostDoctor(agentValue: string, root = process.cwd()): Promise<AgentHostDoctorReport> {
  await ensureWorkspace(root);
  const parsed = parseAgentId(agentValue);
  if (parsed === "all") throw new Error("Use agents doctor --all for all host checks.");
  const matrix = buildAgentHostMatrix();
  const row = matrix.hosts.find((host) => host.id === parsed);
  const exportResult = await exportAgents(parsed, root);
  const generatedFiles = exportResult.written.filter((file) => file.includes(`/agents/${parsed}/`) || file.includes(`\\agents\\${parsed}\\`));
  const exportTexts = await Promise.all(exportResult.written
    .filter((file) => file.endsWith(".md") || file.endsWith(".json"))
    .map((file) => fs.readFile(path.resolve(root, file), "utf8").catch(() => "")));
  const joined = exportTexts.join("\n");
  const redaction = redactText(joined);
  const unsafeClaim = /(mutationAllowed\s*:\s*true|mutationAllowed"\s*:\s*true|arbitrary_shell_execution"\s*:\s*true|arbitrary shell execution enabled)/i.test(joined);
  const rawPathLeak = /\.soturail[\\/]+raw/i.test(joined);
  const contamination = /\b(SoturAI|trading|backtest|portfolio|broker)\b/i.test(joined);
  const warnings: string[] = [];
  const blockingIssues: string[] = [];
  if (!row) blockingIssues.push(`No matrix row exists for ${parsed}.`);
  if (redaction.redactions.length > 0) blockingIssues.push(`Export text contains ${redaction.redactions.length} probable secret pattern(s).`);
  if (unsafeClaim) blockingIssues.push("Export text appears to claim mutable or arbitrary-shell MCP behavior.");
  if (rawPathLeak) blockingIssues.push("Export text references raw evidence paths; agent handoffs should use redacted summaries.");
  if (contamination) blockingIssues.push("Export text contains non-SotuRail scope contamination terms.");
  if (generatedFiles.length === 0) warnings.push("No v1.1 .soturail/agents mirror files were generated.");
  if (parsed === "antigravity" && !/experimental|high-priority|Google-local/i.test(joined)) warnings.push("Antigravity export should describe the experimental Google-local transition boundary.");
  if (parsed === "gemini-legacy" && !/legacy|compatible/i.test(joined)) warnings.push("Gemini legacy export should include compatibility notes.");
  if ((parsed === "deepagents" || parsed === "deepagents-js") && !/role pack|runtime boundary|does not run/i.test(joined)) warnings.push("DeepAgents export should make the role-pack-only boundary explicit.");
  const checks: AgentHostDoctorReport["checks"] = [
    { id: "matrix-row", status: row ? "passed" : "failed", summary: row ? `${row.status} host matrix row present.` : "Host missing from matrix." },
    { id: "export-generated", status: exportResult.written.length > 0 ? "passed" : "failed", summary: `${exportResult.written.length} export artifact(s) generated.` },
    { id: "v110-export-path", status: generatedFiles.length > 0 ? "passed" : "warning", summary: `${generatedFiles.length} v1.1 .soturail/agents artifact(s) generated.` },
    { id: "secret-redaction", status: redaction.redactions.length === 0 ? "passed" : "failed", summary: redaction.redactions.length === 0 ? "No probable secret patterns found." : "Probable secret patterns were found and must be redacted." },
    { id: "mcp-read-only", status: unsafeClaim ? "failed" : "passed", summary: "Generated exports describe MCP as read-only/resource-first by default." },
    { id: "scope-contamination", status: contamination ? "failed" : "passed", summary: "Generated exports stay within SotuRail scope." }
  ];
  const status: AgentHostDoctorReport["status"] = blockingIssues.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed";
  const report: AgentHostDoctorReport = {
    schemaVersion: "soturail.agent-host-doctor.v1",
    createdAt: new Date().toISOString(),
    version: SOTURAIL_VERSION,
    host: parsed,
    status,
    matrixStatus: row?.status ?? "unknown",
    exportPaths: exportResult.written,
    checks,
    warnings,
    blockingIssues,
    nextCommands: [
      `soturail agents export --agent ${parsed}`,
      `soturail report agent --agent ${reportAgentName(parsed)}`,
      `soturail mcp resources host-manifest --host ${parsed}`,
      "soturail agents matrix"
    ]
  };
  await writeAgentHostDoctorArtifacts(root, parsed, report);
  return report;
}

export async function agentHostDoctorAll(root = process.cwd()): Promise<AgentHostDoctorSummary> {
  await ensureWorkspace(root);
  const hosts = [];
  for (const profile of listAgentProfiles()) {
    hosts.push(await agentHostDoctor(profile.id, root));
  }
  const warnings = hosts.flatMap((host) => host.warnings.map((warning) => `${host.host}: ${warning}`));
  const blockingIssues = hosts.flatMap((host) => host.blockingIssues.map((issue) => `${host.host}: ${issue}`));
  const summary: AgentHostDoctorSummary = {
    schemaVersion: "soturail.agent-host-doctor-summary.v1",
    createdAt: new Date().toISOString(),
    version: SOTURAIL_VERSION,
    status: blockingIssues.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
    hosts,
    warnings,
    blockingIssues,
    nextCommands: [
      "soturail agents matrix",
      "soturail agents export --agent all",
      "soturail mcp resources host-manifest --host codex"
    ]
  };
  const agentsDir = path.join(getWorkspacePaths(root).workspace, "agents");
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.writeFile(path.join(agentsDir, "doctor-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(agentsDir, "doctor-summary.md"), renderAgentHostDoctorSummary(summary), "utf8");
  return summary;
}

export function renderAgentHostDoctor(report: AgentHostDoctorReport): string {
  return [
    "SotuRail agent host doctor",
    `schemaVersion: ${report.schemaVersion}`,
    `version: ${report.version}`,
    `host: ${report.host}`,
    `status: ${report.status}`,
    `matrix_status: ${report.matrixStatus}`,
    "",
    "Checks:",
    ...report.checks.map((check) => `- ${check.id}: ${check.status} - ${check.summary}`),
    "",
    "Export paths:",
    ...report.exportPaths.map((file) => `- ${file}`),
    "",
    "Warnings:",
    ...(report.warnings.length > 0 ? report.warnings.map((warning) => `- ${warning}`) : ["- none"]),
    "",
    "Blocking issues:",
    ...(report.blockingIssues.length > 0 ? report.blockingIssues.map((issue) => `- ${issue}`) : ["- none"]),
    "",
    "Next commands:",
    ...report.nextCommands.map((command) => `- ${command}`)
  ].join("\n") + "\n";
}

export function renderAgentHostDoctorSummary(summary: AgentHostDoctorSummary): string {
  return [
    "SotuRail agent host doctor summary",
    `schemaVersion: ${summary.schemaVersion}`,
    `version: ${summary.version}`,
    `status: ${summary.status}`,
    `hosts_checked: ${summary.hosts.length}`,
    "",
    "| host | status | matrix | exports |",
    "|---|---|---|---|",
    ...summary.hosts.map((host) => `| ${host.host} | ${host.status} | ${host.matrixStatus} | ${host.exportPaths.length} |`),
    "",
    "Warnings:",
    ...(summary.warnings.length > 0 ? summary.warnings.map((warning) => `- ${warning}`) : ["- none"]),
    "",
    "Blocking issues:",
    ...(summary.blockingIssues.length > 0 ? summary.blockingIssues.map((issue) => `- ${issue}`) : ["- none"]),
    "",
    "Next commands:",
    ...summary.nextCommands.map((command) => `- ${command}`)
  ].join("\n") + "\n";
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

export async function buildAgentExportFiles(agent: AgentId, root = process.cwd(), options: AgentExportOptions = {}): Promise<AgentExportFile[]> {
  const contextTarget = contextTargetFor(agent);
  const context = await buildContextPack(contextTarget, root);
  const prompt = promptOnly(agent, options);
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
        { relativePath: "AGENTS.md", content: prompt },
        { relativePath: "GEMINI.md", content: prompt },
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
    case "gemini-legacy":
      return [
        { relativePath: "AGENTS.md", content: prompt },
        { relativePath: "GEMINI.md", content: prompt },
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
    case "cursor":
      return [
        { relativePath: "rules.md", content: cursorRules() },
        { relativePath: "cursor-rules.md", content: cursorRules() },
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
    case "antigravity":
      return [
        { relativePath: "AGENTS.md", content: prompt },
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
    case "generic":
      return [
        { relativePath: "AGENT_CONTEXT.md", content: prompt },
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
    case "opencode":
      return [
        { relativePath: "AGENTS.md", content: prompt },
        { relativePath: "context-pack.md", content: context.payload },
        { relativePath: "prompt-only.md", content: prompt }
      ];
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

function promptOnly(agent: AgentId, options: AgentExportOptions = {}): string {
  const profile = getAgentProfile(agent);
  const capability = getAgentCapability(agent);
  const roleLine = options.role ? `Role focus: ${options.role}` : "Role focus: general project assistance";
  const includeLine = options.include ? `Include hint: ${options.include}` : "Include hint: verified status, reports, Project Brain briefs and host-safe context only";
  return [
    `# SotuRail ${profile.display_name} Integration`,
    "",
    "SotuRail is a local-first Context OS for AI coding agents. It builds auditable local artifacts for humans, CI and agent hosts.",
    "",
    "SotuRail is not a cloud gateway, autonomous editing agent, telemetry uploader, vector database or provider-specific plugin.",
    "",
    `Agent: ${profile.id}`,
    `Risk level: ${profile.risk_level}`,
    `Supported modes: ${profile.integration_modes.join(", ")}`,
    `Payloads: ${capability.recommendedPayloads.join(" + ")}`,
    roleLine,
    includeLine,
    "",
    "## Verified Starting Points",
    "",
    "- Status: `.soturail/status/latest.json` and `.soturail/status/agent.md`.",
    "- Reports: `.soturail/reports/latest.md`, `.soturail/reports/latest.json` and `.soturail/reports/agent-" + reportAgentName(agent) + ".md`.",
    "- Project Brain: `.soturail/brain/exports/agent-brief.md` and host-specific exports when generated.",
    "- Schemas/readiness: `.soturail/schemas/check.json` and `.soturail/readiness/v1.json`.",
    "- MCP host manifest: `.soturail/mcp/host-manifest.json` from `soturail mcp resources host-manifest --host " + agent + "`.",
    "",
    "## Safe Commands",
    "",
    "- `soturail status --agent`",
    "- `soturail report agent --agent " + reportAgentName(agent) + "`",
    "- `soturail agents doctor --host " + agent + "`",
    "- `soturail brain doctor --repair-plan`",
    "- `soturail brain export --agent " + brainExportName(agent) + " --limit 20`",
    "- `soturail self schemas --check --strict`",
    "- `soturail self readiness --v1 --strict`",
    "- `soturail release check --strict`",
    "",
    "## Forbidden Defaults",
    "",
    "- Do not assume network access, cloud telemetry, external LLM calls or paid embeddings.",
    "- Do not expose write/mutation MCP resources by default.",
    "- Do not use shell execution through MCP; SotuRail manifests are read-only by default.",
    "- Do not publish, tag, push, delete or rewrite history without explicit human approval.",
    "- Do not include private environment files, tokens, credentials or raw run evidence in host handoff files.",
    "",
    "## Host-Aware Policy Notes",
    "",
    ...AGENT_POLICY_NOTES.map((note) => `- ${note}`),
    "",
    "## MCP",
    "",
    profile.supports_mcp
      ? "Use `soturail mcp config --agent " + mcpConfigName(agent) + "` for a reviewed stdio snippet and `soturail mcp resources host-manifest --host " + agent + "` for read-only resource mapping."
      : "MCP host configuration is not assumed for this agent; use prompt-only/context-pack guidance plus the read-only host manifest.",
    "",
    "## Warnings",
    "",
    hostSpecificWarning(agent),
    "- High Project Brain suspect/stale counts mean evidence may be old. They do not necessarily mean the code is broken; run the repair-plan commands before overclaiming.",
    "",
    "## Next Commands",
    "",
    "- `soturail agents matrix`",
    "- `soturail agents export --agent " + agent + "`",
    "- `soturail mcp resources host-manifest --host " + agent + "`",
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
    "gemini-legacy": ".soturail/exports/agents/gemini-legacy/AGENTS.md",
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
  if (agent === "gemini-legacy") return "gemini";
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

function exportTargetDirs(root: string, legacyExportsDir: string, agent: AgentId, selectedCount: number, options: AgentExportOptions): string[] {
  if (options.out) {
    const requested = path.resolve(root, options.out);
    return [selectedCount === 1 ? requested : path.join(requested, agent)];
  }
  const workspaceAgentsDir = path.join(getWorkspacePaths(root).workspace, "agents", agent);
  return [path.join(legacyExportsDir, agent), workspaceAgentsDir];
}

async function writeAgentHostDoctorArtifacts(root: string, host: AgentId, report: AgentHostDoctorReport): Promise<void> {
  const dir = path.join(getWorkspacePaths(root).workspace, "agents", host);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "doctor.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(dir, "doctor.md"), renderAgentHostDoctor(report), "utf8");
}

function reportAgentName(agent: AgentId): string {
  if (agent === "amp" || agent === "kiro") return "generic";
  return agent;
}

function brainExportName(agent: AgentId): string {
  if (agent === "opencode" || agent === "amp" || agent === "kiro" || agent === "deepagents" || agent === "deepagents-js" || agent === "gemini-legacy") return "generic";
  return agent;
}

function mcpConfigName(agent: AgentId): "claude" | "cursor" | "generic" {
  if (agent === "claude" || agent === "cursor") return agent;
  return "generic";
}

function hostSpecificWarning(agent: AgentId): string {
  if (agent === "antigravity") return "- Antigravity is high-priority but experimental; use AGENTS.md/context-pack handoffs until stable Google-local project config is documented.";
  if (agent === "gemini" || agent === "gemini-legacy") return "- Gemini-compatible exports are prompt/context artifacts. Treat legacy/compatible hosts as prompt-only unless a host contract is verified.";
  if (agent === "opencode") return "- OpenCode support is generic-compatible AGENTS.md/context export, not a claim of full host-native integration.";
  if (agent === "deepagents" || agent === "deepagents-js") return "- DeepAgents exports are role-pack/context artifacts only. SotuRail does not run a Deep Agents runtime.";
  return "- Review generated files before copying them into a host-specific project location.";
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
      relativePath: "role-pack.md",
      content: [
        `# SotuRail ${title} Role Pack`,
        "",
        "Use this as reviewed context for a host that supports role-oriented prompts.",
        "",
        "Boundary: SotuRail exports role/context artifacts only. It does not install dependencies, run a Deep Agents runtime or create autonomous editing loops.",
        "",
        prompt.trim(),
        ""
      ].join("\n")
    },
    {
      relativePath: "subagents.md",
      content: [
        `# SotuRail ${title} Subagent Notes`,
        "",
        "- Planner: read status/report/schema artifacts before proposing work.",
        "- Executor: use local safe commands and preserve user changes.",
        "- Reviewer: verify reports, tests, redaction and release gates.",
        "- Release manager: check package version, release notes, schemas and npm publish gates.",
        "",
        "These are prompt notes, not a runtime registration file.",
        ""
      ].join("\n")
    },
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
