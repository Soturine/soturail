import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { ensureWorkspace, loadConfig } from "../core/config.js";
import { MetricsStore } from "../core/metrics-store.js";
import { isResponseMode, type ResponseMode } from "../core/response-policy.js";
import { reduceAgentResponse } from "../compressors/agent-response-reducer.js";
import { compareFormats, renderFormatCompare } from "../core/format-compare.js";

export interface FormatOptions {
  mode?: string;
}

export async function formatFile(file: string, options: FormatOptions = {}, root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const config = await loadConfig(root);
  const modeCandidate = options.mode ?? config.response_compression.default_mode;
  if (!isResponseMode(modeCandidate)) {
    throw new Error(`Unknown response compression mode "${modeCandidate}".`);
  }
  const absolute = path.resolve(root, file);
  const input = await fs.readFile(absolute, "utf8");
  const result = reduceAgentResponse(input, modeCandidate as ResponseMode);
  await new MetricsStore(root).append({
    type: "response_format",
    details: {
      file,
      mode: result.mode,
      raw_tokens: result.raw_tokens,
      compressed_tokens: result.compressed_tokens,
      reduction_percent: result.reduction_percent,
      preserved_commands_count: result.preserved_commands_count,
      preserved_paths_count: result.preserved_paths_count,
      preserved_code_blocks_count: result.preserved_code_blocks_count,
      preserved_security_warnings_count: result.preserved_security_warnings_count
    }
  });
  return [
    `SotuRail format mode: ${result.mode}`,
    `Estimated tokens: ${result.raw_tokens} -> ${result.compressed_tokens} (${result.reduction_percent}% reduction)`,
    "",
    result.output
  ].join("\n");
}

export function registerFormatCommand(program: Command): void {
  const format = program
    .command("format")
    .description("Compress verbose AI or documentation output into task-oriented modes.")
    .argument("[input-file]", "Input text file")
    .option("--mode <mode>", "normal, concise, ultra, review, commit, debug, or docs", "normal");

  format
    .command("compare")
    .description("Compare local format size/safety hints for a file.")
    .argument("<input-file>", "Input file")
    .action(async (file: string) => {
      process.stdout.write(renderFormatCompare(await compareFormats(file)));
    });

  format.action(async (file: string | undefined, options: FormatOptions) => {
    if (!file) throw new Error("Missing input file. Example: soturail format README.md --mode concise");
    process.stdout.write(await formatFile(file, options));
  });
}
