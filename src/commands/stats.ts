import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { readCacheBlocks } from "../core/cache-normalizer.js";
import { getWorkspacePaths, loadConfig } from "../core/config.js";
import { DedupeStore } from "../core/dedupe-store.js";
import { MetricsStore } from "../core/metrics-store.js";
import { RawStore } from "../core/raw-store.js";
import { estimateTokens } from "../core/token-estimator.js";

export interface StatsReport {
  estimated_raw_tokens: number;
  estimated_compressed_tokens: number;
  estimated_reduced_payload_tokens: number;
  estimated_soturail_metadata_tokens: number;
  estimated_net_tokens_sent: number;
  summary_overhead_tokens: number;
  compression_effective: boolean;
  small_output_warning: boolean;
  terminal_reducer_estimated_tokens_saved: number;
  dedupe_estimated_tokens_saved: number;
  metadata_overhead_tokens: number;
  net_estimated_tokens_saved: number;
  dedupe_blocks_reused: number;
  dedupe_recent_window: number;
  compression_ratio: number | null;
  command_count: number;
  expansion_count: number;
  manual_omission_or_failure_count: number;
  estimated_cache_stability_score: number;
  provider_cache_hits: number | null;
  provider_cache_source: string | null;
}

async function readProviderCacheMetadata(root: string): Promise<{ hits: number; source: string } | null> {
  const paths = getWorkspacePaths(root);
  const filePath = path.resolve(paths.metricsDir, "provider-cache.json");
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as Record<string, unknown>;
    const hits = parsed.provider_cache_hits;
    if (typeof hits === "number" && Number.isFinite(hits)) {
      return { hits, source: path.normalize(path.relative(root, filePath)).replace(/\\/g, "/") };
    }
    return null;
  } catch {
    return null;
  }
}

export async function collectStats(root = process.cwd()): Promise<StatsReport> {
  const rawStore = new RawStore(root);
  const metrics = new MetricsStore(root);
  const records = await rawStore.readManifest();
  const events = await metrics.readAll();
  const blocks = await readCacheBlocks(root);
  const config = await loadConfig(root);
  const dedupeStats = await new DedupeStore(root).stats();
  const rawTokens = records.reduce((sum, record) => sum + record.raw_tokens_estimated, 0);
  const compressedTokens = records.reduce((sum, record) => sum + record.compressed_tokens_estimated, 0);
  const metadataTokens = records.reduce((sum, record) => sum + estimateMetadataTokens(record), 0);
  const netTokens = compressedTokens + metadataTokens;
  const terminalSaved = records.reduce(
    (sum, record) => sum + Math.max(0, record.raw_tokens_estimated - record.compressed_tokens_estimated),
    0
  );
  const dedupeSavedFromEvents = events.reduce((sum, event) => {
    const value = event.details?.dedupe_estimated_tokens_saved ?? event.details?.estimated_tokens_saved;
    return sum + (typeof value === "number" && Number.isFinite(value) ? value : 0);
  }, 0);
  const dedupeBlocksReused = events.reduce((sum, event) => {
    const value = event.details?.dedupe_blocks_reused ?? event.details?.reused_blocks;
    return sum + (typeof value === "number" && Number.isFinite(value) ? value : 0);
  }, 0);
  const expansionCount = events.filter((event) => event.type === "expand").length;
  const omissionCount = events.filter((event) => event.type === "omission_report").length;
  const failureCount = records.filter((record) => record.exit_code !== 0).length;
  const lastDoctorCache = [...events]
    .reverse()
    .find((event) => event.type === "doctor_cache" && typeof event.estimated_cache_stability_score === "number");
  const stableTokens = blocks.reduce((sum, block) => sum + block.token_estimate, 0);
  const cacheScore = typeof lastDoctorCache?.estimated_cache_stability_score === "number"
    ? lastDoctorCache.estimated_cache_stability_score
    : stableTokens > 0
      ? Number((stableTokens / (stableTokens + 800)).toFixed(4))
      : 0;
  const provider = await readProviderCacheMetadata(root);

  return {
    estimated_raw_tokens: rawTokens,
    estimated_compressed_tokens: compressedTokens,
    estimated_reduced_payload_tokens: compressedTokens,
    estimated_soturail_metadata_tokens: metadataTokens,
    estimated_net_tokens_sent: netTokens,
    summary_overhead_tokens: metadataTokens,
    compression_effective: netTokens <= rawTokens,
    small_output_warning: netTokens > rawTokens,
    terminal_reducer_estimated_tokens_saved: terminalSaved,
    dedupe_estimated_tokens_saved: dedupeSavedFromEvents || dedupeStats.estimatedTokensSaved,
    metadata_overhead_tokens: metadataTokens,
    net_estimated_tokens_saved: rawTokens - netTokens,
    dedupe_blocks_reused: dedupeBlocksReused || dedupeStats.dedupedBlocks,
    dedupe_recent_window: config.dedupe.recentWindow,
    compression_ratio: compressedTokens > 0 ? Number((rawTokens / compressedTokens).toFixed(2)) : null,
    command_count: records.length,
    expansion_count: expansionCount,
    manual_omission_or_failure_count: omissionCount + failureCount,
    estimated_cache_stability_score: cacheScore,
    provider_cache_hits: provider?.hits ?? null,
    provider_cache_source: provider?.source ?? null
  };
}

function estimateMetadataTokens(record: { raw_id: string; command: string; exit_code: number; compressor: string }): number {
  return estimateTokens([
    "SotuRail run complete.",
    `Exit code: ${record.exit_code}`,
    `Compressor: ${record.compressor}`,
    `raw_id: ${record.raw_id}`,
    `Recovery: soturail expand ${record.raw_id}`,
    `Command: ${record.command}`
  ].join("\n"));
}

export function formatStats(report: StatsReport): string {
  const providerLine = report.provider_cache_hits === null
    ? "real_provider_cache_hits: not imported"
    : `real_provider_cache_hits: ${report.provider_cache_hits} (source: ${report.provider_cache_source})`;
  return [
    "SotuRail local stats",
    `estimated_raw_tokens: ${report.estimated_raw_tokens}`,
    `estimated_compressed_tokens: ${report.estimated_compressed_tokens}`,
    `estimated_reduced_payload_tokens: ${report.estimated_reduced_payload_tokens}`,
    `estimated_soturail_metadata_tokens: ${report.estimated_soturail_metadata_tokens}`,
    `estimated_net_tokens_sent: ${report.estimated_net_tokens_sent}`,
    `summary_overhead_tokens: ${report.summary_overhead_tokens}`,
    `terminal_reducer_estimated_tokens_saved: ${report.terminal_reducer_estimated_tokens_saved}`,
    `dedupe_estimated_tokens_saved: ${report.dedupe_estimated_tokens_saved}`,
    `metadata_overhead_tokens: ${report.metadata_overhead_tokens}`,
    `net_estimated_tokens_saved: ${report.net_estimated_tokens_saved}`,
    `dedupe_blocks_reused: ${report.dedupe_blocks_reused}`,
    `dedupe_recent_window: ${report.dedupe_recent_window}`,
    `compression_effective: ${report.compression_effective}`,
    `small_output_warning: ${report.small_output_warning}`,
    `compression_ratio: ${report.compression_ratio === null ? "n/a" : `${report.compression_ratio}:1`}`,
    `command_count: ${report.command_count}`,
    `expansion_count: ${report.expansion_count}`,
    `manual_omission_or_failure_count: ${report.manual_omission_or_failure_count}`,
    `estimated_cache_stability_score: ${report.estimated_cache_stability_score}`,
    providerLine,
    "",
    ...(report.small_output_warning
      ? ["Compression was not effective for this small command, but raw recovery paths and audit metadata were preserved.", ""]
      : []),
    "Token counts and cache stability are local estimates unless provider metadata is explicitly imported."
  ].join("\n");
}

export function registerStatsCommand(program: Command): void {
  program
    .command("stats")
    .description("Print honest local metrics from raw and metrics manifests.")
    .action(async () => {
      const report = await collectStats();
      process.stdout.write(`${formatStats(report)}\n`);
    });
}
