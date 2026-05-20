import { estimateTokens } from "../core/token-estimator.js";
import { reduceWithNative, type ReducerEngine, type ReductionKind } from "../core/native-engine.js";
import { reduceGenericStream } from "./generic-stream.js";
import { isGitCommand, reduceGitOutput } from "./git-reducer.js";
import { compactJsonToonWithMetrics } from "./json-toon.js";
import { isTestCommand, reduceTestOutput } from "./test-reducer.js";

export interface CompressionResult {
  compressor: string;
  summary: string;
  compressed_tokens_estimated: number;
  engine: "ts" | "native";
  details?: Record<string, unknown>;
}

export function compressOutput(command: string, raw: string, rawId: string): CompressionResult {
  const jsonSummary = compactJsonToonWithMetrics(raw);
  if (jsonSummary) {
    const summary = `${jsonSummary.text.replace("<raw_id>", rawId)}Raw log: soturail expand ${rawId}\n`;
    return {
      compressor: "json-toon-lite",
      summary,
      compressed_tokens_estimated: estimateTokens(summary),
      engine: "ts",
      details: { ...jsonSummary.metrics }
    };
  }

  if (isGitCommand(command)) {
    const summary = reduceGitOutput(raw, rawId);
    return {
      compressor: "git-reducer",
      summary,
      compressed_tokens_estimated: estimateTokens(summary),
      engine: "ts"
    };
  }

  if (isTestCommand(command, raw)) {
    const summary = reduceTestOutput(raw, rawId);
    return {
      compressor: "test-reducer",
      summary,
      compressed_tokens_estimated: estimateTokens(summary),
      engine: "ts"
    };
  }

  const summary = reduceGenericStream(raw, { rawId });
  return {
    compressor: "generic-stream",
    summary,
    compressed_tokens_estimated: estimateTokens(summary),
    engine: "ts"
  };
}

export async function compressOutputWithEngine(
  command: string,
  raw: string,
  rawId: string,
  engine: ReducerEngine = "auto",
  root = process.cwd()
): Promise<CompressionResult> {
  if (engine === "ts") {
    return compressOutput(command, raw, rawId);
  }

  const nativeKind = nativeKindFor(command, raw);
  if (engine === "native" || (engine === "auto" && nativeKind !== null)) {
    const nativeLabel = nativeKind ?? "reduce-generic";
    const nativeSummary = nativeKind ? await reduceWithNative(nativeKind, raw, rawId, root) : null;
    if (nativeSummary) {
      return {
        compressor: `native-${nativeLabel.replace("reduce-", "")}`,
        summary: nativeSummary,
        compressed_tokens_estimated: estimateTokens(nativeSummary),
        engine: "native"
      };
    }
    if (engine === "native") {
      const fallback = compressOutput(command, raw, rawId);
      return {
        ...fallback,
        compressor: `native-unavailable-${nativeLabel.replace("reduce-", "")}`,
        summary: `Native reducer unavailable; fell back to TypeScript reducer.\n\n${fallback.summary}`
      };
    }
  }

  return compressOutput(command, raw, rawId);
}

function nativeKindFor(command: string, raw: string): ReductionKind | null {
  if (raw.trim().startsWith("{") || raw.trim().startsWith("[")) {
    return "reduce-json";
  }
  if (isGitCommand(command)) {
    return "reduce-git";
  }
  if (isTestCommand(command, raw)) {
    return "reduce-test";
  }
  return "reduce-generic";
}
