import { estimateTokens } from "../core/token-estimator.js";
import { reduceGenericStream } from "./generic-stream.js";
import { isGitCommand, reduceGitOutput } from "./git-reducer.js";
import { compactJsonToon } from "./json-toon.js";
import { isTestCommand, reduceTestOutput } from "./test-reducer.js";

export interface CompressionResult {
  compressor: string;
  summary: string;
  compressed_tokens_estimated: number;
}

export function compressOutput(command: string, raw: string, rawId: string): CompressionResult {
  const jsonSummary = compactJsonToon(raw);
  if (jsonSummary) {
    return {
      compressor: "json-toon-lite",
      summary: `${jsonSummary}Raw log: soturail expand ${rawId}\n`,
      compressed_tokens_estimated: estimateTokens(jsonSummary)
    };
  }

  if (isGitCommand(command)) {
    const summary = reduceGitOutput(raw, rawId);
    return {
      compressor: "git-reducer",
      summary,
      compressed_tokens_estimated: estimateTokens(summary)
    };
  }

  if (isTestCommand(command, raw)) {
    const summary = reduceTestOutput(raw, rawId);
    return {
      compressor: "test-reducer",
      summary,
      compressed_tokens_estimated: estimateTokens(summary)
    };
  }

  const summary = reduceGenericStream(raw, { rawId });
  return {
    compressor: "generic-stream",
    summary,
    compressed_tokens_estimated: estimateTokens(summary)
  };
}
