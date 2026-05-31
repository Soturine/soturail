import type { Command } from "commander";
import { collectObservability, observabilityExport, observabilitySummary, observabilityTimeline } from "../core/observability-rail.js";

export function registerObsCommand(program: Command): void {
  const obs = program.command("obs").description("Collect local SotuRail observability events without telemetry upload.");

  obs.command("collect").description("Collect events from local SotuRail artifacts.").action(async () => {
    process.stdout.write((await collectObservability()).output);
  });

  obs.command("summary").description("Print the local observability summary.").action(async () => {
    process.stdout.write(await observabilitySummary());
  });

  obs.command("timeline").description("Print the local observability timeline JSON.").action(async () => {
    process.stdout.write(await observabilityTimeline());
  });

  obs.command("export").description("Print observability artifact paths.").action(async () => {
    process.stdout.write(await observabilityExport());
  });
}
