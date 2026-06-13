import type { Command } from "commander";
import { generateHandoff } from "../core/harness-lifecycle.js";

export function registerHandoffCommand(program: Command): void {
  const handoff = program.command("handoff").description("Generate safe local session handoffs.");

  handoff.command("generate").description("Create or update the local session handoff.")
    .option("--objective <text>", "Current objective")
    .option("--completed <text>", "Last completed work")
    .option("--blocker <text>", "Known blocker")
    .option("--next <text>", "Next recommended step")
    .action(async (options: { objective?: string; completed?: string; blocker?: string; next?: string }) => {
      await generateHandoff(options);
      process.stdout.write("SotuRail handoff generated\npath: .soturail/state/session-handoff.md\n");
    });
}
