import type { Command } from "commander";
import {
  addFeature,
  completeFeature,
  loadFeatureList,
  renderFeatureList,
  startFeature
} from "../core/harness-lifecycle.js";

export function registerFeatureCommand(program: Command): void {
  const feature = program.command("feature").description("Manage the local feature lifecycle list.");

  feature.command("add").description("Add a planned feature.")
    .argument("<title>", "Feature title")
    .option("--done <criterion...>", "Definition-of-done criterion")
    .action(async (title: string, options: { done?: string[] }) => {
      const record = await addFeature(title, options.done ?? []);
      process.stdout.write(`Feature added: ${record.id}\nstatus: ${record.status}\n`);
    });

  feature.command("start").description("Mark one feature active.")
    .argument("<id>", "Feature id")
    .action(async (id: string) => {
      const record = await startFeature(id);
      process.stdout.write(`Feature started: ${record.id}\nstatus: ${record.status}\n`);
    });

  feature.command("done").description("Mark a feature done and attach evidence paths.")
    .argument("<id>", "Feature id")
    .option("--evidence <path...>", "Evidence path")
    .action(async (id: string, options: { evidence?: string[] }) => {
      const record = await completeFeature(id, options.evidence ?? []);
      process.stdout.write(`Feature completed: ${record.id}\nstatus: ${record.status}\n`);
    });

  feature.command("list").description("List local lifecycle features.").action(async () => {
    process.stdout.write(renderFeatureList(await loadFeatureList()));
  });
}
