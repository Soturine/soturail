import type { Command } from "commander";
import { buildStatus, renderStatusAgent, renderStatusMarkdown } from "../core/status-model.js";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Build a unified local SotuRail status model.")
    .option("--json", "Print JSON status")
    .option("--md", "Print Markdown status")
    .option("--agent", "Print concise agent-safe status")
    .action(async (options: { json?: boolean; md?: boolean; agent?: boolean }) => {
      const result = await buildStatus(process.cwd());
      if (options.json) {
        process.stdout.write(`${JSON.stringify(result.status, null, 2)}\n`);
        return;
      }
      if (options.agent) {
        process.stdout.write(renderStatusAgent(result.status));
        return;
      }
      process.stdout.write(renderStatusMarkdown(result.status));
    });
}
