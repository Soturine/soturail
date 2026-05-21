import { estimateTokens } from "./token-estimator.js";
import { sha256Text, type DedupeBlockRecord } from "./dedupe-store.js";

export type SimilarDedupeMode = "off" | "conservative";

export interface BlockDedupeOptions {
  rawId: string;
  blockMinLines: number;
  recentWindow: number;
  preserveErrorBlocks: boolean;
  similarMode: SimilarDedupeMode;
}

export interface KnownBlockLookup {
  findReusableBlock(
    hash: string,
    normalizedHash: string,
    options: { recentWindow: number; allowSimilar: boolean }
  ): Promise<DedupeBlockRecord | null>;
}

export interface BlockDedupeNewBlock {
  block_id: string;
  block_sha256: string;
  normalized_sha256: string;
  raw_id: string;
  line_count: number;
  token_estimate: number;
  has_risk: boolean;
  preview: string;
  created_at: string;
}

export interface BlockDedupeHit {
  block_id: string;
  current_raw_id: string;
  previous_raw_id: string;
  line_count: number;
  tokens_saved: number;
  created_at: string;
}

export interface BlockDedupeResult {
  output: string;
  reusedBlocks: BlockDedupeHit[];
  newBlocks: BlockDedupeNewBlock[];
  tokensSaved: number;
}

const RISK_PATTERN =
  /\b(error|failed|failure|exception|warning|warn|security|vulnerability|traceback|assertion|denied|permission|refused|timeout)\b|(?:^|\s)at\s+[\w.$<>]+\(.*:\d+\)|[\w./\\-]+\.(?:ts|tsx|js|jsx|py|java|go|rs|md):\d+(?::\d+)?/i;

export function normalizeBlockForDedupe(text: string): string {
  return text
    .replace(/\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/g, "<timestamp>")
    .replace(/\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/g, "<time>")
    .replace(/[A-Z]:\\(?:Users|Temp|tmp)\\[^\s]+/gi, "<path>")
    .replace(/\/(?:tmp|var\/folders|private\/tmp)\/[^\s]+/g, "<path>")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function blockHasRisk(text: string): boolean {
  return RISK_PATTERN.test(text);
}

export async function applyBlockDedupe(
  rawText: string,
  lookup: KnownBlockLookup,
  options: BlockDedupeOptions
): Promise<BlockDedupeResult> {
  const lines = rawText.split(/\r?\n/);
  const blockMinLines = Math.max(1, options.blockMinLines);
  const output: string[] = [];
  const newBlocks: BlockDedupeNewBlock[] = [];
  const reusedBlocks: BlockDedupeHit[] = [];
  const seenCurrent = new Set<string>();
  const createdAt = new Date().toISOString();

  for (let index = 0; index < lines.length; index += blockMinLines) {
    const blockLines = lines.slice(index, index + blockMinLines);
    const blockText = blockLines.join("\n");
    const nonEmpty = blockText.trim().length > 0;
    if (!nonEmpty || blockLines.length < blockMinLines) {
      output.push(blockText);
      continue;
    }

    const hash = sha256Text(blockText);
    const normalized = normalizeBlockForDedupe(blockText);
    const normalizedHash = sha256Text(normalized);
    const risky = blockHasRisk(blockText);
    const firstInCurrent = !seenCurrent.has(hash);
    seenCurrent.add(hash);

    const blockId = `block_${hash.slice(0, 8)}`;
    const tokenEstimate = estimateTokens(blockText);
    newBlocks.push({
      block_id: blockId,
      block_sha256: hash,
      normalized_sha256: normalizedHash,
      raw_id: options.rawId,
      line_count: blockLines.length,
      token_estimate: tokenEstimate,
      has_risk: risky,
      preview: blockLines.slice(0, 2).join(" | ").slice(0, 240),
      created_at: createdAt
    });

    if (!firstInCurrent || (options.preserveErrorBlocks && risky)) {
      output.push(blockText);
      continue;
    }

    const previous = await lookup.findReusableBlock(hash, normalizedHash, {
      recentWindow: options.recentWindow,
      allowSimilar: options.similarMode === "conservative" && !risky
    });
    if (!previous) {
      output.push(blockText);
      continue;
    }

    const tokensSaved = Math.max(0, tokenEstimate - estimateTokens(previous.block_id));
    reusedBlocks.push({
      block_id: previous.block_id,
      current_raw_id: options.rawId,
      previous_raw_id: previous.raw_id,
      line_count: blockLines.length,
      tokens_saved: tokensSaved,
      created_at: createdAt
    });
    output.push(`[deduped block: ${previous.block_id}, seen in raw_id ${previous.raw_id}, ${blockLines.length} lines]`);
  }

  return {
    output: output.join("\n"),
    reusedBlocks,
    newBlocks,
    tokensSaved: reusedBlocks.reduce((sum, hit) => sum + hit.tokens_saved, 0)
  };
}
