import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { appendJsonl, getWorkspacePaths, readJsonl } from "./config.js";

export interface DedupeRecord {
  kind?: "output";
  output_sha256: string;
  raw_id: string;
  command: string;
  exit_code: number;
  raw_path: string;
  created_at: string;
}

export interface DedupeBlockRecord {
  kind: "block";
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

export interface DedupeBlockHitRecord {
  kind: "block_hit";
  block_id: string;
  current_raw_id: string;
  previous_raw_id: string;
  line_count: number;
  tokens_saved: number;
  created_at: string;
}

export function sha256Text(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export class DedupeStore {
  constructor(private readonly root = process.cwd()) {}

  async findReusable(outputHash: string, exitCode: number): Promise<DedupeRecord | null> {
    const records = await this.readAll();
    for (const record of [...records].reverse()) {
      if (record.output_sha256 !== outputHash || record.exit_code !== exitCode) {
        continue;
      }
      if (await this.rawExists(record.raw_path)) {
        return record;
      }
    }
    return null;
  }

  async append(record: DedupeRecord): Promise<void> {
    const paths = getWorkspacePaths(this.root);
    await appendJsonl(paths.dedupeIndex, { kind: "output", ...record });
  }

  async readAll(): Promise<DedupeRecord[]> {
    const paths = getWorkspacePaths(this.root);
    const records = await readJsonl<DedupeRecord & { kind?: string }>(paths.dedupeIndex);
    return records.filter((record) => record.kind === undefined || record.kind === "output");
  }

  async appendBlock(record: DedupeBlockRecord): Promise<void> {
    const paths = getWorkspacePaths(this.root);
    await appendJsonl(paths.dedupeIndex, record);
  }

  async appendBlockHit(record: DedupeBlockHitRecord): Promise<void> {
    const paths = getWorkspacePaths(this.root);
    await appendJsonl(paths.dedupeIndex, record);
  }

  async readBlocks(): Promise<DedupeBlockRecord[]> {
    const paths = getWorkspacePaths(this.root);
    const records = await readJsonl<DedupeBlockRecord & { kind?: string }>(paths.dedupeIndex);
    return records.filter((record): record is DedupeBlockRecord => record.kind === "block");
  }

  async readBlockHits(): Promise<DedupeBlockHitRecord[]> {
    const paths = getWorkspacePaths(this.root);
    const records = await readJsonl<DedupeBlockHitRecord & { kind?: string }>(paths.dedupeIndex);
    return records.filter((record): record is DedupeBlockHitRecord => record.kind === "block_hit");
  }

  async findReusableBlock(
    hash: string,
    normalizedHash: string,
    options: { recentWindow: number; allowSimilar: boolean }
  ): Promise<DedupeBlockRecord | null> {
    const blocks = await this.readBlocks();
    const recent = blocks.slice(-Math.max(1, options.recentWindow));
    for (const block of [...recent].reverse()) {
      if (block.block_sha256 === hash || (options.allowSimilar && block.normalized_sha256 === normalizedHash)) {
        return block;
      }
    }
    return null;
  }

  async stats(): Promise<{
    outputRecords: number;
    uniqueOutputHashes: number;
    recentBlocks: number;
    dedupedBlocks: number;
    estimatedTokensSaved: number;
    indexPath: string;
  }> {
    const paths = getWorkspacePaths(this.root);
    const output = await this.readAll();
    const blocks = await this.readBlocks();
    const hits = await this.readBlockHits();
    return {
      outputRecords: output.length,
      uniqueOutputHashes: new Set(output.map((record) => record.output_sha256)).size,
      recentBlocks: blocks.length,
      dedupedBlocks: hits.length,
      estimatedTokensSaved: hits.reduce((sum, hit) => sum + hit.tokens_saved, 0),
      indexPath: path.normalize(path.relative(paths.root, paths.dedupeIndex))
    };
  }

  private async rawExists(rawPath: string): Promise<boolean> {
    const paths = getWorkspacePaths(this.root);
    try {
      await fs.access(path.resolve(paths.root, rawPath));
      return true;
    } catch {
      return false;
    }
  }
}
