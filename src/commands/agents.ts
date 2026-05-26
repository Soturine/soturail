import type { Command } from "commander";
import { explainAgents, lintAgentDocs, splitContextPlan } from "../core/agent-docs-hygiene.js";
import { agentDoctor, exportAgents, installAgent, uninstallAgent } from "../core/agent-exporter.js";
import { formatAgentList } from "../core/agent-registry.js";
import { agentStatus, listAgentCapabilities, renderAgentCapabilities, renderAgentStatus } from "../core/agent-runtime.js";

interface AgentOptions {
  agent?: string;
  mode?: string;
  dryRun?: boolean;
  yes?: boolean;
  backup?: boolean;
  output?: string;
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
        process.stdout.write(`${JSON.stringify({ schemaVersion: "soturail.agent-capabilities.v1", agents: listAgentCapabilities() }, null, 2)}\n`);
        return;
      }
      process.stdout.write(renderAgentCapabilities());
    });

  agents
    .command("status")
    .description("Inspect local agent files, exports, context packs, policy and run state.")
    .option("--json", "Print machine-readable JSON")
    .action(async (options: { json?: boolean }) => {
      const status = await agentStatus();
      process.stdout.write(options.json ? `${JSON.stringify(status, null, 2)}\n` : renderAgentStatus(status));
    });

  agents.command("doctor").description("Check agent integration readiness.").option("--verbose", "Include host matrix, policy and dry-run guidance").action(async (options: { verbose?: boolean }) => {
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
    .requiredOption("--agent <agent>", "claude, codex, gemini, cursor, antigravity, generic, opencode, amp, kiro, deepagents, deepagents-js, or all")
    .action((options: { agent: string }) => {
      process.stdout.write(explainAgents(options.agent));
    });

  agents
    .command("export")
    .description("Export prompt/context integration files for review.")
    .requiredOption("--agent <agent>", "claude, codex, gemini, cursor, antigravity, generic, opencode, amp, kiro, deepagents, deepagents-js, or all")
    .action(async (options: AgentOptions) => {
      const result = await exportAgents(options.agent ?? "all");
      process.stdout.write(`Agent exports written:\n${result.written.join("\n")}\n`);
    });

  agents
    .command("install")
    .description("Install reviewed project-local agent integration files.")
    .requiredOption("--agent <agent>", "claude, codex, gemini, cursor, antigravity, generic, opencode, amp, kiro, deepagents, deepagents-js, or all")
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
    .requiredOption("--agent <agent>", "claude, codex, gemini, cursor, antigravity, generic, opencode, amp, kiro, deepagents, deepagents-js, or all")
    .option("--dry-run", "Print planned rollback without writing")
    .action(async (options: AgentOptions) => {
      process.stdout.write(await uninstallAgent(options.agent ?? "all", options.dryRun === undefined ? {} : { dryRun: options.dryRun }));
    });
}
