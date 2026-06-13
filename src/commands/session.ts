import type { Command } from "commander";
import { endSession, startSession } from "../core/harness-lifecycle.js";

export function registerSessionCommand(program: Command): void {
  const session = program.command("session").description("Manage local harness lifecycle sessions.");

  session.command("start").description("Start a local session with a clear objective.")
    .argument("<objective>", "Session objective")
    .action(async (objective: string) => {
      const record = await startSession(objective);
      process.stdout.write(`Session started: ${record.id}\nobjective: ${record.objective}\nnext: soturail feature list\n`);
    });

  session.command("end").description("End the active session and generate a handoff.")
    .option("--summary <text>", "Last completed work summary")
    .action(async (options: { summary?: string }) => {
      const record = await endSession(options.summary);
      process.stdout.write(`Session ended: ${record.id}\nhandoff: .soturail/state/session-handoff.md\n`);
    });
}
