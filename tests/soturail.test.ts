import { PassThrough } from "node:stream";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildCachePayload, readCacheBlocks } from "../src/core/cache-normalizer.js";
import { appendJsonl, defaultConfig, ensureWorkspace, getWorkspacePaths } from "../src/core/config.js";
import { isAlwaysIgnored, normalizeForIgnore, scanRepository } from "../src/core/file-scanner.js";
import { MetricsStore } from "../src/core/metrics-store.js";
import { RawStore } from "../src/core/raw-store.js";
import { isDangerousCommand, UNSAFE_CONFIRMATION, validateCommand } from "../src/core/safety-policy.js";
import { expandRawLog } from "../src/commands/expand.js";
import { runInit } from "../src/commands/init.js";
import { formatProgressiveRead } from "../src/commands/read.js";
import { executeRunCommand } from "../src/commands/run.js";
import { collectStats, formatStats } from "../src/commands/stats.js";

const tempRoots: string[] = [];

async function tempRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-test-"));
  tempRoots.push(root);
  return root;
}

async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

function drainedPassThrough(): PassThrough {
  const stream = new PassThrough();
  stream.resume();
  return stream;
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("soturail init", () => {
  it("is idempotent and does not overwrite user-edited files", async () => {
    const root = await tempRoot();
    const first = await runInit(root);
    expect(first.created).toContain(path.normalize(".soturail/config/config.json"));
    expect(await fs.readFile(path.join(root, ".soturail", "raw", "index.jsonl"), "utf8")).toBe("");

    await writeFile(path.join(root, "AGENTS.md"), "custom agent instructions\n");
    const second = await runInit(root);

    expect(await fs.readFile(path.join(root, "AGENTS.md"), "utf8")).toBe("custom agent instructions\n");
    expect(second.skipped).toContain("AGENTS.md");
  });
});

describe("file scanner", () => {
  it("honors deny rules, best-effort gitignore and normalized paths", async () => {
    const root = await tempRoot();
    await writeFile(path.join(root, ".gitignore"), "ignored.txt\nignored-dir/\n*.tmp\n");
    await writeFile(path.join(root, "src", "app.ts"), "export function run() { return 1; }\n");
    await writeFile(path.join(root, "ignored.txt"), "ignored\n");
    await writeFile(path.join(root, "ignored-dir", "inside.ts"), "export const hidden = true;\n");
    await writeFile(path.join(root, "node_modules", "pkg.js"), "module.exports = 1;\n");
    await writeFile(path.join(root, ".soturail", "raw", "x.log"), "raw\n");
    await writeFile(path.join(root, "dist", "bundle.js"), "bundle\n");
    await writeFile(path.join(root, "image.png"), "not really an image\n");
    await writeFile(path.join(root, "large.txt"), "x".repeat(2048));

    const repoMap = await scanRepository(root, { ...defaultConfig, max_file_size_kb: 1 });
    const paths = repoMap.files.map((file) => file.path);

    expect(paths).toContain("src/app.ts");
    expect(paths).not.toContain("ignored.txt");
    expect(paths).not.toContain("ignored-dir/inside.ts");
    expect(paths).not.toContain("node_modules/pkg.js");
    expect(paths).not.toContain(".soturail/raw/x.log");
    expect(paths).not.toContain("dist/bundle.js");
    expect(paths).not.toContain("image.png");
    expect(paths).not.toContain("large.txt");
    expect(normalizeForIgnore("src\\nested\\file.ts")).toBe("src/nested/file.ts");
    expect(isAlwaysIgnored(".soturail\\raw\\x.log", false)).toBe(true);
    const app = repoMap.files.find((file) => file.path === "src/app.ts");
    expect(app?.symbols[0]?.name).toBe("run");
  });
});

describe("progressive reader", () => {
  it("prints small files fully with line prefixes", () => {
    const output = formatProgressiveRead("small.txt", "alpha\nbeta");
    expect(output).toContain("[Line 1]: alpha");
    expect(output).toContain("[Line 2]: beta");
    expect(output).not.toContain("Collapsed lines");
  });

  it("selects first lines, query blocks, last lines and full escape hatch for large files", () => {
    const lines = Array.from({ length: 200 }, (_, index) =>
      index === 99 ? "line 100 has critical goal marker" : `line ${index + 1}`
    );
    const output = formatProgressiveRead("large.txt", lines.join("\n"), { query: "critical goal" });

    expect(output).toContain("[Line 1]: line 1");
    expect(output).toContain("[Line 100]: line 100 has critical goal marker");
    expect(output).toContain("[Line 200]: line 200");
    expect(output).toContain("Collapsed lines");
    expect(output).toContain("soturail read large.txt --full");
    expect(output).not.toContain("[Line 50]: line 50");
  });
});

describe("safe runner and raw store", () => {
  it("tees command output into raw logs and manifest records", async () => {
    const root = await tempRoot();
    const stdout = drainedPassThrough();
    const stderr = drainedPassThrough();
    const command = `"${process.execPath}" -e "console.log('hello from runner')"`;
    const result = await executeRunCommand([command], { terminalStdout: stdout, terminalStderr: stderr }, root);
    const paths = getWorkspacePaths(root);
    const manifest = await fs.readFile(paths.rawIndex, "utf8");
    const records = manifest.trim().split(/\r?\n/).map((line) => JSON.parse(line) as { raw_id: string; path: string });
    const log = await fs.readFile(path.resolve(root, records[0]?.path ?? ""), "utf8");

    expect(result.exitCode).toBe(0);
    expect(records).toHaveLength(1);
    expect(records[0]?.raw_id).toBe(result.rawId);
    expect(log).toContain("hello from runner");
    expect(result.summary).toContain(`soturail expand ${result.rawId}`);
  });
});

describe("expand", () => {
  it("retrieves byte-equivalent raw logs from raw_id", async () => {
    const root = await tempRoot();
    await ensureWorkspace(root);
    const rawStore = new RawStore(root);
    const log = await rawStore.createLog("echo raw");
    const raw = Buffer.from("alpha\nbeta\n");
    await new Promise<void>((resolve) => log.stream.end(raw, resolve));
    await rawStore.appendRunRecord({
      raw_id: log.rawId,
      path: log.relativePath,
      command: "echo raw",
      exit_code: 0,
      created_at: log.createdAt,
      compressor: "generic-stream",
      raw_tokens_estimated: 3,
      compressed_tokens_estimated: 2
    });

    const expanded = await expandRawLog(log.rawId, root);
    const metrics = await new MetricsStore(root).readAll();

    expect(Buffer.compare(expanded, raw)).toBe(0);
    expect(metrics.some((event) => event.type === "expand" && event.raw_id === log.rawId)).toBe(true);
  });
});

describe("safety policy", () => {
  it("blocks dangerous commands and requires exact confirmation", () => {
    expect(isDangerousCommand("rm -rf dist")).toBe(true);
    expect(isDangerousCommand("git push origin main")).toBe(true);
    expect(validateCommand("npm test").ok).toBe(true);
    expect(validateCommand("sudo npm install").ok).toBe(false);
    expect(validateCommand("git push", "yes").ok).toBe(false);

    const bypassed = validateCommand("git push", UNSAFE_CONFIRMATION);
    expect(bypassed.ok).toBe(true);
    expect(bypassed.bypassed).toBe(true);
  });
});

describe("cache normalizer", () => {
  it("orders stable blocks before the dynamic footer", async () => {
    const root = await tempRoot();
    await ensureWorkspace(root);
    const paths = getWorkspacePaths(root);
    await writeFile(path.join(root, "AGENTS.md"), "Stable governance\n");
    await writeFile(path.join(paths.indexesDir, "repo-map.json"), JSON.stringify({ title: "Heuristic Repo Map", files: [] }));
    await writeFile(path.join(paths.specsDir, "main", "spec.md"), "# Main Spec\n\nStatus: Approved\n");
    await appendJsonl(paths.memoryFile, { content: "[approved] stable decision", approved: true });

    const result = await buildCachePayload(root, "dynamic footer contains raw_id=abc");
    const labels = result.sections.map((section) => section.label);
    const dynamicIndex = labels.indexOf("dynamic-footer");
    const blocks = await readCacheBlocks(root);

    expect(labels).toEqual(["header", "governance", "config", "repo-map", "spec", "memory", "dynamic-footer"]);
    expect(dynamicIndex).toBe(result.sections.length - 1);
    expect(blocks.map((block) => block.stable_order)).toEqual([...blocks.map((block) => block.stable_order)].sort((a, b) => a - b));
    expect(result.payload.indexOf("raw_id=abc")).toBeGreaterThan(result.payload.indexOf("Stable governance"));
  });
});

describe("stats", () => {
  it("reads local manifests honestly without inventing provider cache hits", async () => {
    const root = await tempRoot();
    await ensureWorkspace(root);
    const rawStore = new RawStore(root);
    await rawStore.appendRunRecord({
      raw_id: "a1",
      path: ".soturail/raw/2026-05-20/a1.log",
      command: "npm test",
      exit_code: 0,
      created_at: "2026-05-20T19:00:00.000Z",
      compressor: "test-reducer",
      raw_tokens_estimated: 80,
      compressed_tokens_estimated: 20
    });
    await rawStore.appendRunRecord({
      raw_id: "b2",
      path: ".soturail/raw/2026-05-20/b2.log",
      command: "npm test",
      exit_code: 1,
      created_at: "2026-05-20T19:01:00.000Z",
      compressor: "test-reducer",
      raw_tokens_estimated: 20,
      compressed_tokens_estimated: 30
    });
    const metrics = new MetricsStore(root);
    await metrics.append({ type: "expand", raw_id: "a1" });
    await metrics.append({ type: "omission_report", details: { reason: "manual omission" } });
    await metrics.append({ type: "doctor_cache", estimated_cache_stability_score: 0.75 });

    const stats = await collectStats(root);
    const formatted = formatStats(stats);

    expect(stats.estimated_raw_tokens).toBe(100);
    expect(stats.estimated_compressed_tokens).toBe(50);
    expect(stats.compression_ratio).toBe(2);
    expect(stats.command_count).toBe(2);
    expect(stats.expansion_count).toBe(1);
    expect(stats.manual_omission_or_failure_count).toBe(2);
    expect(stats.estimated_cache_stability_score).toBe(0.75);
    expect(stats.provider_cache_hits).toBeNull();
    expect(formatted).toContain("real_provider_cache_hits: not imported");
  });
});
