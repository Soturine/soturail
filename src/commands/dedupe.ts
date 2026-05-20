import type { Command } from "commander";
import { DedupeStore } from "../core/dedupe-store.js";

export function registerDedupeCommand(program: Command): void {
  const dedupe = program.command("dedupe").description("Inspect cross-call output dedupe state.");
  dedupe.command("stats").description("Print dedupe index stats.").action(async () => {
    const records = await new DedupeStore().readAll();
    const hashes = new Set(records.map((record) => record.output_sha256));
    const duplicateGroups = records.length - hashes.size;
    process.stdout.write(
      [
        "SotuRail dedupe stats",
        `records: ${records.length}`,
        `unique_output_hashes: ${hashes.size}`,
        `repeat_records: ${duplicateGroups}`
      ].join("\n") + "\n"
    );
  });
}
