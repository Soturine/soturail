import path from "node:path";
import type { Command } from "commander";
import { createFsSnapshot, fsDiff, planEdit, renderSnapshot, touchedFiles } from "../core/fs-evidence.js";

export function registerFsCommand(program: Command): void {
  const fsCommand = program.command("fs").description("Record filesystem evidence for local workflows.");

  fsCommand.command("snapshot").description("Store a lightweight file manifest.").action(async () => {
    process.stdout.write(renderSnapshot(process.cwd(), await createFsSnapshot()));
  });

  fsCommand.command("touched").description("List files changed since the latest snapshot.").action(async () => {
    process.stdout.write(await touchedFiles());
  });

  fsCommand.command("diff").description("Summarize git diff evidence when available.").action(async () => {
    process.stdout.write(await fsDiff());
  });

  fsCommand.command("plan-edit").description("Write an intended-edit note without changing files.").argument("<description>", "Edit intent").action(async (description: string) => {
    const result = await planEdit(description);
    process.stdout.write(`Planned edit recorded: ${result.id}\npath: ${path.normalize(path.relative(process.cwd(), result.path))}\n`);
  });
}
