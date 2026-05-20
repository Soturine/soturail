import type { Command } from "commander";
import { MetricsStore } from "../core/metrics-store.js";
import { RawStore } from "../core/raw-store.js";

export async function expandRawLog(rawId: string, root = process.cwd()): Promise<Buffer> {
  const rawStore = new RawStore(root);
  const buffer = await rawStore.readRaw(rawId);
  if (!buffer) {
    throw new Error(`No raw log found for raw_id "${rawId}". Check .soturail/raw/index.jsonl or run soturail stats.`);
  }
  const metrics = new MetricsStore(root);
  await metrics.append({ type: "expand", raw_id: rawId });
  return buffer;
}

export function registerExpandCommand(program: Command): void {
  program
    .command("expand")
    .description("Print the original raw log for a raw_id.")
    .argument("<raw_id>", "Raw log id from soturail run")
    .action(async (rawId: string) => {
      const buffer = await expandRawLog(rawId);
      process.stdout.write(buffer);
    });
}
