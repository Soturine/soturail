import path from "node:path";
import type { Command } from "commander";
import { createTasklet, exportTasklet, listTasklets, renderTaskletList, runTasklet } from "../core/tasklet-rail.js";

export function registerTaskletCommand(program: Command): void {
  const tasklet = program.command("tasklet").description("Manage small reusable local task templates.");
  tasklet.command("create").argument("<name>", "Tasklet name").action(async (name: string) => {
    const result = await createTasklet(name);
    process.stdout.write(`${result.created ? "Tasklet created" : "Tasklet preserved"}: ${path.normalize(path.relative(process.cwd(), result.path))}\n`);
  });
  tasklet.command("list").action(async () => {
    process.stdout.write(renderTaskletList(await listTasklets()));
  });
  tasklet.command("run").argument("<name>", "Tasklet name").option("--dry-run", "Explicitly simulate without executing commands").action(async (name: string) => {
    process.stdout.write(`${JSON.stringify(await runTasklet(name), null, 2)}\n`);
  });
  tasklet.command("export").argument("<name>", "Tasklet name").action(async (name: string) => {
    const target = await exportTasklet(name);
    process.stdout.write(`Tasklet exported: ${path.normalize(path.relative(process.cwd(), target))}\n`);
  });
}
