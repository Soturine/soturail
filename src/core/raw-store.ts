import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { WriteStream } from "node:fs";
import { appendJsonl, getWorkspacePaths, readJsonl, relativeToRoot } from "./config.js";

export interface RawRunRecord {
  raw_id: string;
  path: string;
  command: string;
  exit_code: number;
  created_at: string;
  compressor: string;
  raw_tokens_estimated: number;
  compressed_tokens_estimated: number;
}

export interface RawLogHandle {
  rawId: string;
  absolutePath: string;
  relativePath: string;
  createdAt: string;
  stream: WriteStream;
}

function dayStamp(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fileStamp(date: Date): string {
  return date.toISOString().replace(/[-:.]/g, "").replace("T", "T").replace("Z", "Z");
}

export class RawStore {
  constructor(private readonly root = process.cwd()) {}

  async createLog(command: string, date = new Date()): Promise<RawLogHandle> {
    const paths = getWorkspacePaths(this.root);
    const rawId = randomBytes(4).toString("hex");
    const dir = path.resolve(paths.rawDir, dayStamp(date));
    await fs.mkdir(dir, { recursive: true });
    const absolutePath = path.resolve(dir, `${fileStamp(date)}-${rawId}.log`);
    const stream = createWriteStream(absolutePath, { flags: "wx" });
    return {
      rawId,
      absolutePath,
      relativePath: relativeToRoot(paths.root, absolutePath),
      createdAt: date.toISOString(),
      stream
    };
  }

  async appendRunRecord(record: RawRunRecord): Promise<void> {
    const paths = getWorkspacePaths(this.root);
    await appendJsonl(paths.rawIndex, record);
  }

  async readManifest(): Promise<RawRunRecord[]> {
    const paths = getWorkspacePaths(this.root);
    return readJsonl<RawRunRecord>(paths.rawIndex);
  }

  async find(rawId: string): Promise<RawRunRecord | null> {
    const records = await this.readManifest();
    return records.find((record) => record.raw_id === rawId) ?? null;
  }

  async readRaw(rawId: string): Promise<Buffer | null> {
    const record = await this.find(rawId);
    if (!record) {
      return null;
    }
    const paths = getWorkspacePaths(this.root);
    const absolutePath = path.resolve(paths.root, record.path);
    return fs.readFile(absolutePath);
  }

  getAbsolutePath(record: RawRunRecord): string {
    const paths = getWorkspacePaths(this.root);
    return path.resolve(paths.root, record.path);
  }
}
