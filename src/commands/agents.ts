import type { Command } from "commander";
import { explainAgents, lintAgentDocs, splitContextPlan } from "../core/agent-docs-hygiene.js";
import {
  agentDoctor,
  agentHostDoctor,
  agentHostDoctorAll,
  exportAgents,
  installAgent,
  renderAgentHostDoctor,
  renderAgentHostDoctorSummary,
  uninstallAgent
} from "../core/agent-exporter.js";
import { formatAgentList } from "../core/agent-registry.js";
import { agentStatus, buildAgentHostMatrix, listAgentCapabilities, renderAgentCapabilities, renderAgentHostMatrix, renderAgentStatus } from "../core/agent-runtime.js";
import { SOTURAIL_VERSION } from "../core/version.js";

interface AgentOptions {
  agent?: string;
  host?: string;
  mode?: string;
  dryRun?: boolean;
  yes?: boolean;
  backup?: boolean;
  output?: string;
  out?: string;
  format?: string;
  include?: string;
  role?: string;
  all?: boolean;
  json?: boolean;
}

export function registerAgentsCommand(program: Command): void {
  const agents = program.command("agents").description("Export and install safe agent integration profiles.");

  agents.command("list").description("List supported agent integration profiles.").action(() => {
    process.stdout.write(formatAgentList());
  });

  agents
    .command("capabilities")
    .description("Show the host capability matrix for supported and experimental agent targets.")
    .option("--json", "Print machine-readable JSON")
    .action((options: { json?: boolean }) => {
      if (options.json) {
        process.stdout.write(`${JSON.stringify({
          schemaVersion: "soturail.agent-capabilities.v1",
          createdAt: new Date().toISOString(),
          version: SOTURAIL_VERSION,
          status: "warning",
          agents: listAgentCapabilities(),
          warnings: ["Experimental hosts remain prompt-only or dry-run-first until promoted."],
          nextCommands: ["soturail agents matrix", "soturail agents doctor --verbose"]
        }, null, 2)}\n`);
        return;
      }
      process.stdout.write(renderAgentCapabilities());
    });

  agents
    .command("matrix")
    .description("Show the v1 agent host compatibility matrix.")
    .option("--json", "Print machine-readable JSON")
    .action((options: { json?: boolean }) => {
      const report = buildAgentHostMatrix();
      process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : renderAgentHostMatrix(report));
    });

  agents
    .command("status")
    .description("Inspect local agent files, exports, context packs, policy and run state.")
    .option("--json", "Print machine-readable JSON")
    .action(async (options: { json?: boolean }) => {
      const status = await agentStatus();
      process.stdout.write(options.json ? `${JSON.stringify(status, null, 2)}\n` : renderAgentStatus(status));
    });

  agents
    .command("doctor")
    .description("Check agent integration readiness.")
    .option("--verbose", "Include host matrix, policy and dry-run guidance")
    .option("--host <host>", "Run host-specific v1.1 doctor")
    .option("--all", "Run host-specific doctor checks for every host")
    .option("--json", "Print machine-readable JSON for host-specific doctor output")
    .action(async (options: AgentOptions & { verbose?: boolean }) => {
      if (options.all) {
        const summary = await agentHostDoctorAll(process.cwd());
        process.stdout.write(options.json ? `${JSON.stringify(summary, null, 2)}\n` : renderAgentHostDoctorSummary(summary));
        return;
      }
      if (options.host) {
        const report = await agentHostDoctor(options.host, process.cwd());
        process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : renderAgentHostDoctor(report));
        return;
      }
      process.stdout.write(await agentDoctor(process.cwd(), { verbose: options.verbose === true }));
    });

  agents.command("lint").description("Lint root agent docs for size, freshness and safety notes.").action(async () => {
    process.stdout.write(await lintAgentDocs());
  });

  agents.command("split-context").description("Suggest moving large agent context into referenced files.").option("--dry-run", "Preview only", true).action(async (options: { dryRun?: boolean }) => {
    process.stdout.write(await splitContextPlan(options.dryRun !== false));
  });

  agents
    .command("explain")
    .description("Explain what each agent export receives and what stays local.")
    .requiredOption("--agent <agent>", "claude, codex, gemini, gemini-legacy, cursor, antigravity, generic, opencode, amp, kiro, deepagents, deepagents-js, or all")
    .action((options: { agent: string }) => {
      process.stdout.write(explainAgents(options.agent));
    });

  agents
    .command("export")
    .description("Export prompt/context integration files for review.")
    .requiredOption("--agent <agent>", "claude, codex, gemini, gemini-legacy, cursor, antigravity, generic, opencode, amp, kiro, deepagents, deepagents-js, or all")
    .option("--out <path>", "Override the output directory for exports")
    .option("--format <format>", "Export format hint: markdown, tagged, or json")
    .option("--include <scope>", "Include hint for safe context selection")
    .option("--role <role>", "Role hint for role-pack style exports")
    .action(async (options: AgentOptions) => {
      const exportOptions: { out?: string; format?: string; include?: string; role?: string } = {};
      if (options.out) exportOptions.out = options.out;
      if (options.format) exportOptions.format = options.format;
      if (options.include) exportOptions.include = options.include;
      if (options.role) exportOptions.role = options.role;
      const result = await exportAgents(options.agent ?? "all", exportOptions, process.cwd());
      process.stdout.write(`Agent exports written:\n${result.written.join("\n")}\n`);
    });

  agents
    .command("install")
    .description("Install reviewed project-local agent integration files.")
    .requiredOption("--agent <agent>", "claude, codex, gemini, gemini-legacy, cursor, antigravity, generic, opencode, amp, kiro, deepagents, deepagents-js, or all")
    .option("--mode <mode>", "prompt-only, mcp, safe-hooks, or rules")
    .option("--dry-run", "Print planned changes without writing")
    .option("--yes", "Acknowledge reviewed project-local install")
    .option("--backup", "Create backups before modifying existing files", true)
    .option("--output <path>", "Override output path for single-agent install")
    .action(async (options: AgentOptions) => {
      const result = await installAgent(options.agent ?? "all", options);
      process.stdout.write(`${result.lines.join("\n")}\n`);
    });

  agents
    .command("uninstall")
    .description("Restore backups for project-local agent integration files when available.")
    .requiredOption("--agent <agent>", "claude, codex, gemini, gemini-legacy, cursor, antigravity, generic, opencode, amp, kiro, deepagents, deepagents-js, or all")
    .option("--dry-run", "Print planned rollback without writing")
    .action(async (options: AgentOptions) => {
      process.stdout.write(await uninstallAgent(options.agent ?? "all", options.dryRun === undefined ? {} : { dryRun: options.dryRun }));
    });
}
