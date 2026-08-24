import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ZodType } from "zod";

export interface JsonlReadResult<T> {
  records: T[];
  recoveredPartialTail: boolean;
  corruptLine?: number;
}

export class ArtifactStore {
  async writeText(filePath: string, content: string): Promise<void> {
    await atomicWrite(filePath, Buffer.from(content, "utf8"));
  }

  async writeJson<T>(filePath: string, value: T, schema?: ZodType<T>): Promise<void> {
    const validated = schema ? schema.parse(value) : value;
    await this.writeText(filePath, `${JSON.stringify(validated, null, 2)}\n`);
  }

  async appendJsonl(filePath: string, value: unknown): Promise<void> {
    await withFileLock(filePath, async () => {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await recoverPartialJsonlTail(filePath);
      const handle = await fs.open(filePath, "a");
      try {
        await handle.writeFile(`${JSON.stringify(value)}\n`, "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
    });
  }

  async readJsonl<T>(filePath: string): Promise<JsonlReadResult<T>> {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return parseJsonl<T>(raw);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { records: [], recoveredPartialTail: false };
      throw error;
    }
  }

  async repairJsonl(filePath: string): Promise<JsonlReadResult<unknown>> {
    return withFileLock(filePath, async () => {
      const recoveredPartialTail = await recoverPartialJsonlTail(filePath);
      const result = await this.readJsonl(filePath);
      return { ...result, recoveredPartialTail: recoveredPartialTail || result.recoveredPartialTail };
    });
  }
}

export const artifactStore = new ArtifactStore();

async function atomicWrite(filePath: string, content: Buffer): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const temp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`);
  const handle = await fs.open(temp, "wx", 0o600);
  try {
    await handle.writeFile(content);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await fs.rename(temp, filePath);
  } catch (error) {
    await fs.unlink(temp).catch(() => undefined);
    throw error;
  }
  const directoryHandle = await fs.open(dir, "r").catch(() => null);
  if (directoryHandle) {
    try {
      await directoryHandle.sync().catch(() => undefined);
    } finally {
      await directoryHandle.close();
    }
  }
}

function parseJsonl<T>(raw: string): JsonlReadResult<T> {
  const lines = raw.split(/\r?\n/);
  const records: T[] = [];
  const hasTerminatingNewline = raw.length === 0 || /\r?\n$/.test(raw);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line) as T);
    } catch {
      const isPartialTail = index === lines.length - 1 && !hasTerminatingNewline;
      if (isPartialTail) return { records, recoveredPartialTail: true };
      return { records, recoveredPartialTail: false, corruptLine: index + 1 };
    }
  }
  return { records, recoveredPartialTail: false };
}

async function recoverPartialJsonlTail(filePath: string): Promise<boolean> {
  let raw: Buffer;
  try {
    raw = await fs.readFile(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
  if (raw.length === 0 || raw.at(-1) === 0x0a) return false;
  const lastNewline = raw.lastIndexOf(0x0a);
  const tail = raw.subarray(lastNewline + 1).toString("utf8");
  try {
    JSON.parse(tail);
    const handle = await fs.open(filePath, "a");
    try {
      await handle.writeFile("\n", "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    return false;
  } catch {
    const handle = await fs.open(filePath, "r+");
    try {
      await handle.truncate(lastNewline + 1);
      await handle.sync();
    } finally {
      await handle.close();
    }
    return true;
  }
}

async function withFileLock<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const lockPath = `${filePath}.lock`;
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  let lock: Awaited<ReturnType<typeof fs.open>> | undefined;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      lock = await fs.open(lockPath, "wx", 0o600);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const stat = await fs.stat(lockPath).catch(() => null);
      if (stat && Date.now() - stat.mtimeMs > 30_000) await fs.unlink(lockPath).catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  if (!lock) throw new Error(`Timed out waiting for artifact writer lock: ${filePath}`);
  try {
    return await operation();
  } finally {
    await lock.close();
    await fs.unlink(lockPath).catch(() => undefined);
  }
}
