import { estimateTokens } from "../core/token-estimator.js";
import { buildResponsePolicy, type ResponseMode } from "../core/response-policy.js";

export interface ResponseReductionResult {
  mode: ResponseMode;
  output: string;
  raw_tokens: number;
  compressed_tokens: number;
  reduction_percent: number;
  preserved_commands_count: number;
  preserved_paths_count: number;
  preserved_code_blocks_count: number;
  preserved_security_warnings_count: number;
}

const COMMAND_LINE = /^\s*(?:npm|pnpm|yarn|bun|node|npx|git|cargo|python|pytest|vitest|jest|tsc|soturail|gh|curl|docker)\b|^\s*`[^`]+`\s*$/i;
const PATH_LINE = /(?:[A-Za-z]:)?[./\\]?[\w.-]+(?:[\\/][\w.-]+)+(?::\d+(?::\d+)?)?/;
const SECURITY_LINE = /\b(security|warning|danger|destructive|secret|token|credential|permission|denied|unsafe|rm -rf|git push|sudo)\b/i;
const FAILURE_LINE = /\b(error|failed|failure|exception|traceback|assertion|expected|received|stack|cause|fix|verify|verification|symptom)\b/i;
const FILLER = /\b(basically|simply|just|really|quite|very|I think|it seems|probably|maybe|in order to)\b/gi;

function splitCodeBlocks(input: string): Array<{ code: boolean; text: string }> {
  const parts: Array<{ code: boolean; text: string }> = [];
  const regex = /```[\s\S]*?```/g;
  let last = 0;
  for (const match of input.matchAll(regex)) {
    if (match.index !== undefined && match.index > last) {
      parts.push({ code: false, text: input.slice(last, match.index) });
    }
    parts.push({ code: true, text: match[0] ?? "" });
    last = (match.index ?? 0) + (match[0]?.length ?? 0);
  }
  if (last < input.length) {
    parts.push({ code: false, text: input.slice(last) });
  }
  return parts;
}

function lines(input: string): string[] {
  return input.split(/\r?\n/).map((line) => line.trimEnd());
}

function cleanLine(line: string): string {
  return line.replace(FILLER, "").replace(/\s{2,}/g, " ").trim();
}

function uniqueNonEmpty(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items.map((line) => line.trim()).filter(Boolean)) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

function preserveCritical(input: string): string[] {
  return uniqueNonEmpty(lines(input).filter((line) => COMMAND_LINE.test(line) || PATH_LINE.test(line) || SECURITY_LINE.test(line) || FAILURE_LINE.test(line)));
}

function reduceNormal(text: string): string {
  return uniqueNonEmpty(lines(text).map(cleanLine)).join("\n");
}

function reduceConcise(text: string): string {
  const critical = preserveCritical(text);
  const direct = uniqueNonEmpty(lines(text).map(cleanLine).filter((line) => line.length > 0 && line.length < 180)).slice(0, 24);
  return uniqueNonEmpty([...critical, ...direct]).join("\n");
}

function reduceUltra(text: string): string {
  const critical = preserveCritical(text);
  return uniqueNonEmpty(critical).slice(0, 40).join("\n");
}

function reduceReview(text: string): string {
  const inputLines = uniqueNonEmpty(lines(text));
  const high = inputLines.filter((line) => /\b(security|data loss|destructive|critical|blocker|fatal)\b/i.test(line));
  const medium = inputLines.filter((line) => /\b(bug|regression|failed|error|risk|missing test)\b/i.test(line));
  const low = inputLines.filter((line) => /\b(style|nit|docs|cleanup|suggestion)\b/i.test(line));
  return [
    "Findings",
    ...section("High", high),
    ...section("Medium", medium),
    ...section("Low", low),
    ...section("Evidence", preserveCritical(text))
  ].join("\n");
}

function section(title: string, items: string[]): string[] {
  const unique = uniqueNonEmpty(items).slice(0, 20);
  return [`\n${title}:`, ...(unique.length > 0 ? unique.map((item) => `- ${item}`) : ["- none detected"])];
}

function reduceCommit(text: string): string {
  const lower = text.toLowerCase();
  const type = lower.includes("fix") || lower.includes("bug") || lower.includes("error")
    ? "fix"
    : lower.includes("docs") || lower.includes("readme")
      ? "docs"
      : lower.includes("test")
        ? "test"
        : "feat";
  const scope = lower.includes("native")
    ? "native"
    : lower.includes("bench")
      ? "bench"
      : lower.includes("rules")
        ? "rules"
        : lower.includes("format")
          ? "format"
          : "cli";
  const evidence = preserveCritical(text).slice(0, 8);
  return [`${type}(${scope}): update ${scope} workflow`, "", "Evidence:", ...(evidence.length > 0 ? evidence.map((line) => `- ${line}`) : ["- derived from input summary"])].join("\n");
}

function reduceDebug(text: string): string {
  const inputLines = uniqueNonEmpty(lines(text));
  const symptom = inputLines.find((line) => /\b(error|failed|failure|symptom|exception)\b/i.test(line));
  const cause = inputLines.find((line) => /\b(cause|because|root|reason)\b/i.test(line));
  const fix = inputLines.find((line) => /\b(fix|change|update|patch|solution)\b/i.test(line));
  const verify = inputLines.find((line) => /\b(test|verify|verification|npm run|cargo test|pytest)\b/i.test(line));
  const command = inputLines.find((line) => COMMAND_LINE.test(line));
  return [
    `Symptom: ${symptom ?? "not explicit"}`,
    `Cause: ${cause ?? "not explicit"}`,
    `Fix: ${fix ?? "not explicit"}`,
    `Verification: ${verify ?? "not explicit"}`,
    `Next command: ${command ?? "not explicit"}`,
    "",
    "Preserved evidence:",
    ...preserveCritical(text).slice(0, 20).map((line) => `- ${line}`)
  ].join("\n");
}

function reduceDocs(text: string): string {
  return uniqueNonEmpty(lines(text).map(cleanLine))
    .filter((line) => !/^I\b/.test(line))
    .map((line) => line.replace(/^[-*]\s*/, "- "))
    .slice(0, 60)
    .join("\n");
}

export function reduceAgentResponse(input: string, mode: ResponseMode): ResponseReductionResult {
  const policy = buildResponsePolicy(mode);
  const parts = splitCodeBlocks(input);
  const preservedCodeBlocks = parts.filter((part) => part.code).map((part) => part.text);
  const text = parts.filter((part) => !part.code).map((part) => part.text).join("\n");
  const reducedText = (() => {
    switch (mode) {
      case "normal":
        return reduceNormal(text);
      case "concise":
        return reduceConcise(text);
      case "ultra":
        return reduceUltra(text);
      case "review":
        return reduceReview(text);
      case "commit":
        return reduceCommit(text);
      case "debug":
        return reduceDebug(text);
      case "docs":
        return reduceDocs(text);
    }
  })();
  const output = [reducedText, policy.preserveCodeBlocks ? preservedCodeBlocks.join("\n\n") : ""]
    .filter((item) => item.trim().length > 0)
    .join("\n\n")
    .trimEnd() + "\n";
  const rawTokens = estimateTokens(input);
  const compressedTokens = estimateTokens(output);
  return {
    mode,
    output,
    raw_tokens: rawTokens,
    compressed_tokens: compressedTokens,
    reduction_percent: rawTokens === 0 ? 0 : Number((((rawTokens - compressedTokens) / rawTokens) * 100).toFixed(2)),
    preserved_commands_count: lines(output).filter((line) => COMMAND_LINE.test(line)).length,
    preserved_paths_count: lines(output).filter((line) => PATH_LINE.test(line)).length,
    preserved_code_blocks_count: preservedCodeBlocks.length,
    preserved_security_warnings_count: lines(output).filter((line) => SECURITY_LINE.test(line)).length
  };
}
