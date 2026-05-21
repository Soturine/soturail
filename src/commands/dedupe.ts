import type { Command } from "commander";
import { ensureWorkspace, loadConfig } from "../core/config.js";
import { DedupeStore } from "../core/dedupe-store.js";

export function registerDedupeCommand(program: Command): void {
  const dedupe = program.command("dedupe").description("Inspect cross-call output dedupe state.");
  dedupe.command("stats").description("Print dedupe index stats.").action(async () => {
    await ensureWorkspace();
    const config = await loadConfig();
    const stats = await new DedupeStore().stats();
    process.stdout.write(
      [
        "SotuRail dedupe stats",
        `enabled: ${config.dedupe.enabled}`,
        `mode: ${config.dedupe.mode}`,
        `similar_dedupe: ${config.dedupe.similar_dedupe}`,
        `recent_outputs_tracked: ${stats.outputRecords}`,
        `unique_output_hashes: ${stats.uniqueOutputHashes}`,
        `recent_blocks_tracked: ${stats.recentBlocks}`,
        `deduped_blocks_count: ${stats.dedupedBlocks}`,
        `estimated_tokens_saved: ${stats.estimatedTokensSaved}`,
        `recent_window: ${config.dedupe.recentWindow}`,
        `safety_mode: ${config.dedupe.preserveErrorBlocks ? "preserve_error_blocks" : "exact_blocks_only"}`,
        `index_path: ${stats.indexPath}`
      ].join("\n") + "\n"
    );
  });
}
