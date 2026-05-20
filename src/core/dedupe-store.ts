import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { appendJsonl, getWorkspacePaths, readJsonl } from "./config.js";

export interface DedupeRecord {
  output_sha256: string;
  raw_id: string;
  command: string;
  exit_code: number;
  raw_path: string;
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
    await appendJsonl(paths.dedupeIndex, record);
  }

  async readAll(): Promise<DedupeRecord[]> {
    const paths = getWorkspacePaths(this.root);
    return readJsonl<DedupeRecord>(paths.dedupeIndex);
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
