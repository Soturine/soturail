import { PassThrough } from "node:stream";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildCachePayload, readCacheBlocks } from "../src/core/cache-normalizer.js";
import { buildContextPack } from "../src/core/context-pack.js";
import { appendJsonl, defaultConfig, ensureWorkspace, getWorkspacePaths } from "../src/core/config.js";
import { isAlwaysIgnored, normalizeForIgnore, scanRepository } from "../src/core/file-scanner.js";
import { handleMcpMessage, mcpDoctor, mcpManifest } from "../src/core/mcp-server.js";
import { readMcpResource } from "../src/core/mcp-resources.js";
import { MetricsStore } from "../src/core/metrics-store.js";
import { RawStore } from "../src/core/raw-store.js";
import { isDangerousCommand, UNSAFE_CONFIRMATION, validateCommand } from "../src/core/safety-policy.js";
import { createSkill, renderSkillList } from "../src/core/skill-store.js";
import { exportSkills } from "../src/core/skill-exporter.js";
import { validateSkills } from "../src/core/skill-validator.js";
import { reduceAgentResponse } from "../src/compressors/agent-response-reducer.js";
import { compressOutput } from "../src/compressors/index.js";
import { compactJsonToonWithMetrics } from "../src/compressors/json-toon.js";
import { compareEngines, runBenchmarks } from "../src/commands/bench.js";
import { buildProgram } from "../src/cli.js";
import { expandRawLog, redactProbableSecrets } from "../src/commands/expand.js";
import { exportHook, hooksDoctor, installHooks, promptOnly } from "../src/commands/hooks.js";
import { runIndex } from "../src/commands/index.js";
import { ingestCommand } from "../src/commands/ingest.js";
import { approveMemory, listMemory, proposeMemory, rejectMemory } from "../src/commands/memory.js";
import { runInit } from "../src/commands/init.js";
import { formatProgressiveRead } from "../src/commands/read.js";
import { executeRunCommand } from "../src/commands/run.js";
import { checkRules, listRules } from "../src/commands/rules.js";
import { collectStats, formatStats } from "../src/commands/stats.js";
import { applyBlockDedupe } from "../src/core/block-dedupe.js";
import { DedupeStore } from "../src/core/dedupe-store.js";
import { runReleasePreflight, verifyPackedPackage } from "../src/core/release-preflight.js";
import { selfDoctor, writeSelfReport } from "../src/core/self-dogfood.js";
import { SOTURAIL_VERSION } from "../src/core/version.js";

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

async function makeSotuRailLikeFixture(): Promise<string> {
  const root = await tempRoot();
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail", version: "0.0.0-test" }));
  await writeFile(path.join(root, "README.md"), "# SotuRail\n");
  await writeFile(path.join(root, "CHANGELOG.md"), "# Changelog\n");
  await writeFile(path.join(root, "ROADMAP.md"), "# Roadmap\n");
  await writeFile(path.join(root, "src", "cli.ts"), "export const cli = true;\n");
  await writeFile(path.join(root, "src", "commands", "index.ts"), "export const command = true;\n");
  await writeFile(path.join(root, "src", "core", "index.ts"), "export const core = true;\n");
  await writeFile(path.join(root, "tests", "fixture.test.ts"), "export const test = true;\n");
  await writeFile(path.join(root, "docs", "usage.md"), "# Usage\n");
  return root;
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

  it("scaffolds v0.3 docs and examples in a clean workspace", async () => {
    const root = await tempRoot();
    const report = await runInit(root);
    const expected = [
      path.join("docs", "mcp.md"),
      path.join("docs", "skill-rail.md"),
      path.join("docs", "context-packs.md"),
      path.join("docs", "comparisons.md"),
      path.join("docs", "workflow-rail.md"),
      path.join("docs", "first-real-workflow.md"),
      path.join("examples", "README.md"),
      path.join("examples", "skills", "README.md"),
      path.join("examples", "skills", "code-review-skill.yml"),
      path.join("examples", "skills", "release-manager-skill.yml"),
      path.join("examples", "skills", "bug-triage-skill.yml"),
      path.join("examples", "mcp", "initialize.json"),
      path.join("examples", "mcp", "resources-list.json"),
      path.join("examples", "mcp", "resources-read-repo-map.json"),
      path.join("examples", "mcp", "tools-list.json"),
      path.join("examples", "context-packs", "generic-workflow.md"),
      path.join("examples", "hooks", "prompt-only-codex.md")
    ];

    for (const relative of expected) {
      await expect(fs.access(path.join(root, relative))).resolves.toBeUndefined();
      expect(report.created).toContain(path.normalize(relative));
    }
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

  it("redacts probable secrets by default for CLI-facing expansion", () => {
    const redacted = redactProbableSecrets([
      "Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456",
      "OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz123456",
      "GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz123456"
    ].join("\n"));

    expect(redacted).toContain("Bearer [SOTURAIL_REDACTED]");
    expect(redacted).toContain("OPENAI_API_KEY=[SOTURAIL_REDACTED]");
    expect(redacted).not.toContain("abcdefghijklmnopqrstuvwxyz123456");
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

    expect(labels).toEqual(["static_header", "governance", "config", "repo_map", "approved_specs", "approved_memory", "dynamic-footer"]);
    expect(dynamicIndex).toBe(result.sections.length - 1);
    expect(blocks.map((block) => block.stable_order)).toEqual([...blocks.map((block) => block.stable_order)].sort((a, b) => a - b));
    expect(result.payload.indexOf("raw_id=abc")).toBeGreaterThan(result.payload.indexOf("Stable governance"));
  });

  it("keeps identical static prefix when only the dynamic footer changes", async () => {
    const root = await tempRoot();
    await ensureWorkspace(root);
    await writeFile(path.join(root, "AGENTS.md"), "Stable governance\n");
    const first = await buildCachePayload(root, "dynamic footer raw_id=one");
    const second = await buildCachePayload(root, "dynamic footer raw_id=two");
    const marker = "<!-- soturail:dynamic:dynamic-footer -->";

    expect(first.payload.split(marker)[0]).toBe(second.payload.split(marker)[0]);
  });
});

describe("dedupe", () => {
  it("summarizes repeated identical output while preserving both raw logs", async () => {
    const root = await tempRoot();
    const stdout = drainedPassThrough();
    const stderr = drainedPassThrough();
    const command = `"${process.execPath}" -e "console.log('same output')"`;
    const first = await executeRunCommand([command], { terminalStdout: stdout, terminalStderr: stderr }, root);
    const second = await executeRunCommand([command], { terminalStdout: stdout, terminalStderr: stderr }, root);
    const records = await new RawStore(root).readManifest();

    expect(second.summary).toContain(`Output identical to previous raw_id ${first.rawId}`);
    expect(records).toHaveLength(2);
  });

  it("reuses safe blocks without removing error blocks", async () => {
    const root = await tempRoot();
    await ensureWorkspace(root);
    const store = new DedupeStore(root);
    const safeBlock = Array.from({ length: 8 }, (_, index) => `cache hit package-${index}`).join("\n");
    const errorBlock = [
      "ERROR failed test",
      "AssertionError: expected 1 to be 2",
      "    at tests/app.test.ts:8:12",
      "security warning",
      "line 5",
      "line 6",
      "line 7",
      "line 8"
    ].join("\n");
    const first = await applyBlockDedupe(safeBlock, store, {
      rawId: "raw-one",
      blockMinLines: 8,
      recentWindow: 10,
      preserveErrorBlocks: true,
      similarMode: "off"
    });
    for (const block of first.newBlocks) {
      await store.appendBlock({ kind: "block", ...block });
    }

    const second = await applyBlockDedupe(`${safeBlock}\n${errorBlock}`, store, {
      rawId: "raw-two",
      blockMinLines: 8,
      recentWindow: 10,
      preserveErrorBlocks: true,
      similarMode: "off"
    });

    expect(second.output).toContain("[deduped block:");
    expect(second.output).toContain("AssertionError");
    expect(second.output).toContain("tests/app.test.ts:8:12");
    expect(second.reusedBlocks).toHaveLength(1);
  });
});

describe("branding assets", () => {
  it("keeps SVG logos vector-only and transparent for the main fox logo", async () => {
    const root = process.cwd();
    const fox = await fs.readFile(path.join(root, "docs", "assets", "soturail-fox.svg"), "utf8");
    const icon = await fs.readFile(path.join(root, "docs", "assets", "soturail-icon.svg"), "utf8");

    expect(fox).toContain("<title");
    expect(icon).toContain("<desc");
    expect(`${fox}\n${icon}`).not.toMatch(/base64|<image\b/i);
    expect(fox).not.toMatch(/<rect\b[^>]*(width="(?:100%|320|256)"|height="(?:100%|220|256)")[^>]*fill=/i);
  });
});

describe("reducers and benchmarks", () => {
  it("preserves critical developer command signals and raw recovery hints", () => {
    const tsc = compressOutput("tsc --noEmit", "src/app.ts(12,7): error TS2322: Type 'string' is not assignable to type 'number'.\n", "raw-tsc");
    const vitest = compressOutput("npm test", "FAIL tests/app.test.ts > saves user\nAssertionError: expected 1 to be 2\n    at tests/app.test.ts:8:12\n", "raw-vitest");
    const npmInstall = compressOutput("npm install", "npm WARN deprecated left-pad@1.0.0\n3 moderate severity vulnerabilities\nRun npm audit for details\n", "raw-npm");
    const docker = compressOutput("docker logs app", "2026-05-21T00:00:00Z info ok\n2026-05-21T00:00:01Z ERROR connection refused\n", "raw-docker");
    const java = compressOutput("java Main", "Exception in thread \"main\" java.lang.NullPointerException\n\tat com.example.Main.main(Main.java:12)\n", "raw-java");

    expect(tsc.summary).toContain("src/app.ts(12,7)");
    expect(tsc.summary).toContain("Raw log: soturail expand raw-tsc");
    expect(vitest.summary).toContain("saves user");
    expect(vitest.summary).toContain("AssertionError");
    expect(npmInstall.summary).toContain("vulnerabilities");
    expect(docker.summary).toContain("ERROR connection refused");
    expect(java.summary).toContain("NullPointerException");
    expect(java.summary).toContain("Main.java:12");
  });

  it("reduces the default noisy JSON shape while preserving important values", () => {
    const raw = JSON.stringify({
      status: "error",
      message: "Permission denied",
      path: "src/app.ts",
      items: Array.from({ length: 120 }, (_, index) => ({ id: index, ok: index !== 77, error: index === 77 ? "timeout" : null }))
    }, null, 2);
    const reduced = compactJsonToonWithMetrics(raw);

    expect(reduced).not.toBeNull();
    expect(reduced?.text).toContain("Permission denied");
    expect(reduced?.text).toContain("timeout");
    expect(reduced?.text).toContain("src/app.ts");
    expect(reduced?.text.length).toBeLessThan(raw.length);
    expect(reduced?.metrics.arrays_collapsed_count).toBeGreaterThan(0);
  });

  it("reports benchmark categories and separates knowledge structuring from compression", async () => {
    const root = await tempRoot();
    await writeFile(path.join(root, "README.md"), "# Project\n\n## Quick start\n");
    await writeFile(path.join(root, "LICENSE"), "MIT\n");
    await writeFile(path.join(root, "package.json"), JSON.stringify({ engines: { node: ">=20" } }));
    await writeFile(path.join(root, ".github", "workflows", "ci.yml"), "name: CI\n");
    const results = await runBenchmarks({ engine: "ts" }, root);
    const report = await fs.readFile(path.join(root, "benchmarks", "reports", "latest.md"), "utf8");
    const categories = [...new Set(results.map((result) => result.category))];
    const json = results.find((result) => result.case_id === "json_tool_payload");
    const rules = results.find((result) => result.category === "knowledge_structuring");

    expect(categories).toEqual(expect.arrayContaining([
      "terminal_reducer",
      "agent_response_compression",
      "knowledge_structuring",
      "cache_stability",
      "native_engine",
      "skill_rail",
      "mcp",
      "context_pack",
      "agent_integration",
      "memory_workflow"
    ]));
    expect(report).toContain("cache_stability");
    expect(report).toContain("Knowledge structuring cases are extraction and validation tasks");
    expect(json?.reduction_percent).toBeGreaterThan(0);
    expect(rules?.compression_ratio_percent).toBeNull();
  });

  it("reports native comparison as unavailable when no native binary exists", async () => {
    const root = await tempRoot();
    const output = await compareEngines(root);
    expect(output).toContain("Native engine not available");
  });
});

describe("agent response compression", () => {
  const verbose = [
    "I think the bug is probably in src/app.ts:12 and it fails with AssertionError.",
    "Security warning: do not run rm -rf or git push automatically.",
    "Run npm test after the fix.",
    "```ts",
    "export const value = 1;",
    "```"
  ].join("\n");

  it("preserves code blocks, commands, paths and security warnings", () => {
    const result = reduceAgentResponse(verbose, "concise");

    expect(result.output).toContain("```ts\nexport const value = 1;\n```");
    expect(result.output).toContain("npm test");
    expect(result.output).toContain("src/app.ts:12");
    expect(result.output).toContain("Security warning");
    expect(result.preserved_security_warnings_count).toBeGreaterThan(0);
  });

  it("creates review, commit and debug shaped output", () => {
    expect(reduceAgentResponse(verbose, "review").output).toContain("High:");
    expect(reduceAgentResponse(verbose, "commit").output).toMatch(/^(fix|feat|docs|test)\(/);
    expect(reduceAgentResponse(verbose, "debug").output).toContain("Symptom:");
  });
});

describe("knowledge to rules", () => {
  it("extracts rules and validates required repository files", async () => {
    const root = await tempRoot();
    await ensureWorkspace(root);
    await writeFile(path.join(root, "README.md"), "# Project\n\n## Quick start\n");
    await writeFile(path.join(root, "LICENSE"), "MIT\n");
    await writeFile(path.join(root, "package.json"), JSON.stringify({ engines: { node: ">=20" } }));
    await writeFile(path.join(root, ".github", "workflows", "ci.yml"), "name: CI\n");
    await writeFile(
      path.join(root, "requirements.md"),
      [
        "# Runtime",
        "- Project must run on Node.js 20 or newer.",
        "- README.md must include a section named Quick start.",
        "- LICENSE must be present.",
        "- .github/workflows/ci.yml is required for CI workflow."
      ].join("\n")
    );

    const ingest = await ingestCommand("requirements.md", { type: "requirements" }, root);
    const listed = await listRules(root);
    const checked = await checkRules(root);

    expect(ingest).toContain("Extracted rules:");
    expect(listed).toContain("Node.js");
    expect(checked).toContain("validator_success_count");
    expect(await fs.readFile(path.join(root, ".soturail", "rules", "rules.yml"), "utf8")).toContain("source_section");
  });
});

describe("hooks", () => {
  it("prints safe modes and next steps from doctor", async () => {
    const root = await tempRoot();
    const output = await hooksDoctor(root);

    expect(output).toContain("safe_modes:");
    expect(output).toContain("- claude: safe-hooks, mcp");
    expect(output).toContain("soturail hooks install --agent claude --mode safe-hooks --dry-run");
    expect(output).toContain("Review generated hooks before enabling.");
  });

  it("supports dry-run, prompt-only output and backup creation", async () => {
    const root = await tempRoot();
    await writeFile(path.join(root, "AGENTS.md"), "existing\n");
    const dryRun = await installHooks("codex", { dryRun: true }, root);
    expect(dryRun).toContain("Would update AGENTS.md");
    expect(await fs.readFile(path.join(root, "AGENTS.md"), "utf8")).toBe("existing\n");

    const installed = await installHooks("codex", {}, root);
    const prompt = await promptOnly("codex");

    expect(installed).toContain("Create backup AGENTS.md.soturail.bak");
    expect(await fs.readFile(path.join(root, "AGENTS.md.soturail.bak"), "utf8")).toBe("existing\n");
    expect(prompt).toContain("Use soturail index");
  });

  it("generates a conservative Claude hook template with destructive command guard", async () => {
    const root = await tempRoot();
    await writeFile(path.join(root, ".claude", "settings.json"), "{\"existing\":true}\n");
    const dryRun = await installHooks("claude", { dryRun: true }, root);
    const newShapeDryRun = await installHooks("claude", { dryRun: true, mode: "safe-hooks" }, root);
    expect(dryRun).toContain("Would write .claude/settings.json");
    expect(dryRun).toContain("Would write .claude/hooks/soturail-pre-tool-use.js");
    expect(newShapeDryRun).toContain("--mode safe-hooks");

    const installed = await installHooks("claude", {}, root);
    const exported = await exportHook("claude", root);
    const hook = await fs.readFile(path.join(root, ".claude", "hooks", "soturail-pre-tool-use.js"), "utf8");
    const backup = await fs.readFile(path.join(root, ".claude", "settings.json.soturail.bak"), "utf8");

    expect(installed).toContain("Claude hook template is conservative");
    expect(exported).toContain(".soturail/exports/hooks/claude.md");
    expect(backup).toContain("existing");
    expect(hook).toContain("git push");
    expect(hook).toContain("SotuRail blocked a destructive Claude shell command");
  });
});

describe("skill rail", () => {
  it("creates, validates and exports a Claude skill", async () => {
    const root = await tempRoot();
    const skill = await createSkill("Demo Skill", root);
    const validation = await validateSkills(root);
    const exported = await exportSkills("claude", root);

    expect(skill.metadata.id).toBe("demo-skill");
    expect(validation.ok).toBe(true);
    expect(exported).toContain(".soturail");
    await expect(fs.access(path.join(root, ".soturail", "exports", "skills", "claude", "demo-skill.md"))).resolves.toBeUndefined();
  });

  it("creates a richer starter skill and renders readable list output", async () => {
    const root = await tempRoot();
    const emptyList = renderSkillList([], root);
    const skill = await createSkill("Demo Skill", root);
    const validation = await validateSkills(root);
    const listOutput = renderSkillList([skill], root);
    const yaml = await fs.readFile(path.join(root, ".soturail", "skills", "demo-skill", "skill.yml"), "utf8");
    const markdown = await fs.readFile(path.join(root, ".soturail", "skills", "demo-skill", "SKILL.md"), "utf8");

    expect(emptyList).toContain("No local skills found.");
    expect(emptyList).toContain("soturail skills init <name>");
    expect(validation.ok).toBe(true);
    expect(yaml).toContain("  - generic");
    expect(yaml).toContain("  - summarize");
    expect(yaml).toContain("  - dependency_install");
    expect(markdown).toContain("## Safe Workflow");
    expect(markdown).toContain("## Verification Checklist");
    expect(listOutput).toContain("SotuRail skills");
    expect(listOutput).toContain("skills_count: 1");
    expect(listOutput).toContain("- demo-skill [low]");
    expect(listOutput).toContain("Name: Demo Skill");
    expect(listOutput).toContain("Targets: claude, codex, gemini, cursor, generic");
    expect(listOutput).toContain(`Path: ${path.normalize(path.join(".soturail", "skills", "demo-skill"))}`);
    await expect(fs.access(path.join(root, ".soturail", "skills", "demo-skill", "examples", "README.md"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(root, ".soturail", "skills", "demo-skill", "validators", "README.md"))).resolves.toBeUndefined();
  });
});

describe("context packs", () => {
  it("keeps stable prefix identical when dynamic timestamp changes", async () => {
    const root = await tempRoot();
    await ensureWorkspace(root);
    await writeFile(path.join(root, "AGENTS.md"), "Stable governance\n");
    const first = await buildContextPack("generic", root, { now: "2026-05-21T00:00:00.000Z" });
    const second = await buildContextPack("generic", root, { now: "2026-05-21T00:01:00.000Z" });
    const marker = "<!-- soturail:dynamic-footer -->";

    expect(first.payload.split(marker)[0]).toBe(second.payload.split(marker)[0]);
    expect(first.payload).toContain("## Dynamic Footer");
  });
});

describe("mcp", () => {
  it("generates a manifest and reads resources without starting the server", async () => {
    const root = await tempRoot();
    await writeFile(path.join(root, "ROADMAP.md"), "# Roadmap\n");
    const manifest = await mcpManifest("0.3.0");
    const resource = await readMcpResource("soturail://roadmap", root);
    const response = await handleMcpMessage({ jsonrpc: "2.0", id: 1, method: "resources/list" }, root, "0.3.0");

    expect(manifest.resources.map((item) => item.uri)).toContain("soturail://repo-map");
    expect(resource.text).toContain("Roadmap");
    expect(response.result.resources.length).toBeGreaterThan(0);
  });

  it("handles JSON-RPC smoke messages without exposing shell execution", async () => {
    const root = await tempRoot();
    await ensureWorkspace(root);
    await writeFile(path.join(root, ".soturail", "indexes", "repo-map.json"), JSON.stringify({ kind: "Heuristic Repo Map", files: [] }, null, 2));
    const initialize = await handleMcpMessage({ jsonrpc: "2.0", id: 1, method: "initialize" }, root, "0.3.1");
    const resources = await handleMcpMessage({ jsonrpc: "2.0", id: 2, method: "resources/list" }, root, "0.3.1");
    const repoMap = await handleMcpMessage({
      jsonrpc: "2.0",
      id: 3,
      method: "resources/read",
      params: { uri: "soturail://repo-map" }
    }, root, "0.3.1");
    const tools = await handleMcpMessage({ jsonrpc: "2.0", id: 4, method: "tools/list" }, root, "0.3.1");
    const toolNames = tools.result.tools.map((tool: { name: string }) => tool.name);

    expect(initialize.result.serverInfo.version).toBe("0.3.1");
    expect(resources.result.resources.map((item: { uri: string }) => item.uri)).toContain("soturail://repo-map");
    expect(repoMap.result.contents[0].text).toContain("Heuristic Repo Map");
    expect(toolNames).toContain("soturail.context.pack");
    expect(toolNames).not.toContain("soturail.run");
  });
});

describe("memory approval workflow", () => {
  it("proposes, approves, rejects and lists local memory", async () => {
    const root = await tempRoot();
    const pending = await proposeMemory("Remember this for v0.3 tests.", {}, root);
    const approved = await approveMemory(pending.id, root);
    const rejected = await proposeMemory("Reject this memory.", {}, root);
    const rejectOutput = await rejectMemory(rejected.id, root);
    const approvedList = await listMemory("approved", root);
    const pendingList = await listMemory("pending", root);

    expect(approved.status).toBe("approved");
    expect(rejectOutput).toContain(rejected.id);
    expect(approvedList).toContain(pending.id);
    expect(pendingList).not.toContain(rejected.id);
  });
});

describe("native explicit mode", () => {
  it("fails clearly when native engine is requested but unavailable", async () => {
    const root = await tempRoot();
    const oldPath = process.env.PATH;
    process.env.PATH = "";
    try {
      await expect(
        executeRunCommand([`"${process.execPath}" -e "console.log('native')"`], {
          engine: "native",
          terminalStdout: drainedPassThrough(),
          terminalStderr: drainedPassThrough()
        }, root)
      ).rejects.toThrow(/Native engine requested/);
    } finally {
      process.env.PATH = oldPath;
    }
  });
});

describe("self dogfooding", () => {
  it("exposes the self command in the CLI", () => {
    const program = buildProgram();
    expect(program.commands.map((command) => command.name())).toContain("self");
  });

  it("self doctor succeeds in a SotuRail-like fixture", async () => {
    const root = await makeSotuRailLikeFixture();
    const result = await selfDoctor(root);

    expect(result.ok).toBe(true);
    expect(result.package_name).toBe("soturail");
  });

  it("self doctor fails outside a SotuRail-like fixture", async () => {
    const root = await tempRoot();
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "not-soturail" }));
    const result = await selfDoctor(root);

    expect(result.ok).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("writes a cache-friendly self report with stable information before dynamic metadata", async () => {
    const root = await makeSotuRailLikeFixture();
    await ensureWorkspace(root);
    const doctor = await selfDoctor(root);
    const reportPath = await writeSelfReport({
      root,
      doctor,
      index: { indexed_files_count: 7, ignored_files_count: 2, ignored_directories_count: 1 },
      build: { ok: true, exit_code: 0, raw_id: "build123", raw_tokens: 2, reduced_tokens: 10, summary: "" },
      test: { ok: true, exit_code: 0, raw_id: "test123", raw_tokens: 2, reduced_tokens: 10, summary: "" },
      bench: { ok: true, raw_id: "bench123", cases_count: 1, summary: "cases_count: 1", results: [] },
      errors: []
    });
    const report = await fs.readFile(reportPath, "utf8");

    expect(path.normalize(reportPath)).toContain(path.normalize(".soturail/reports/self-dogfood.md"));
    expect(report.indexOf("## Stable Project Description")).toBeLessThan(report.indexOf("## Dynamic Execution Data"));
    expect(report).toContain("package_name: soturail");
    expect(report).toContain("build_raw_id: build123");
  });
});

describe("release reliability", () => {
  it("keeps CLI version output in sync with package.json", async () => {
    const packageJson = JSON.parse(await fs.readFile(path.join(process.cwd(), "package.json"), "utf8")) as { version: string };
    const program = buildProgram();

    expect(SOTURAIL_VERSION).toBe(packageJson.version);
    expect(program.version()).toBe(packageJson.version);
  });

  it("fails preflight when package and CLI versions differ", async () => {
    const root = await tempRoot();
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail", version: "1.2.3" }, null, 2));
    await writeFile(path.join(root, "package-lock.json"), JSON.stringify({
      name: "soturail",
      version: "1.2.3",
      lockfileVersion: 3,
      packages: { "": { name: "soturail", version: "1.2.3" } }
    }, null, 2));
    await writeFile(path.join(root, "README.md"), "npx soturail --help\nnpm install -g soturail\nsoturail --version\n");
    await writeFile(path.join(root, "CHANGELOG.md"), "## [1.2.3]\n");
    await writeFile(path.join(root, "RELEASE_NOTES_v1.2.3.md"), "# Notes\n");
    await writeFile(path.join(root, "LICENSE"), "MIT\n");
    await writeFile(
      path.join(root, "dist", "cli.js"),
      "if (process.argv.includes('--version')) console.log('1.2.2');\n"
    );

    const result = await runReleasePreflight(root, { runAudit: false, runPack: false });

    expect(result.ok).toBe(false);
    expect(result.gates.find((gate) => gate.id === "cli_version")?.ok).toBe(false);
  });

  it("has v0.3.3 release notes, changelog entry and lockfile version sync", async () => {
    const root = process.cwd();
    const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8")) as { version: string };
    const packageLock = JSON.parse(await fs.readFile(path.join(root, "package-lock.json"), "utf8")) as {
      version: string;
      packages: { "": { version: string } };
    };
    const changelog = await fs.readFile(path.join(root, "CHANGELOG.md"), "utf8");

    expect(packageJson.version).toBe("0.3.3");
    expect(packageLock.version).toBe(packageJson.version);
    expect(packageLock.packages[""].version).toBe(packageJson.version);
    await expect(fs.access(path.join(root, "RELEASE_NOTES_v0.3.3.md"))).resolves.toBeUndefined();
    expect(changelog).toContain("## [0.3.3]");
  });

  it("requires release notes and changelog entries during preflight", async () => {
    const root = await tempRoot();
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail", version: "9.9.9" }, null, 2));
    await writeFile(path.join(root, "package-lock.json"), JSON.stringify({
      name: "soturail",
      version: "9.9.9",
      lockfileVersion: 3,
      packages: { "": { name: "soturail", version: "9.9.9" } }
    }, null, 2));
    await writeFile(path.join(root, "README.md"), "npx soturail --help\nnpm install -g soturail\nsoturail --version\n");
    await writeFile(path.join(root, "LICENSE"), "MIT\n");
    await writeFile(path.join(root, "CHANGELOG.md"), "## [9.9.8]\n");
    await writeFile(path.join(root, "dist", "cli.js"), "if (process.argv.includes('--version')) console.log('9.9.9');\n");

    const result = await runReleasePreflight(root, { runAudit: false, runPack: false });

    expect(result.ok).toBe(false);
    expect(result.gates.find((gate) => gate.id === "changelog_entry")?.ok).toBe(false);
    expect(result.gates.find((gate) => gate.id === "release_notes")?.ok).toBe(false);
  });

  it("keeps runtime audit and npm pack release gates clean", async () => {
    const result = await runReleasePreflight(process.cwd(), { runAudit: true, runPack: true });
    const packedGate = result.gates.find((gate) => gate.id === "packed_package_cli_version");

    expect(result.gates.find((gate) => gate.id === "runtime_audit")?.ok).toBe(true);
    expect(result.gates.find((gate) => gate.id === "npm_pack_no_raw_logs")?.ok).toBe(true);
    expect(packedGate?.ok, packedGate?.details).toBe(true);
    expect(packedGate?.details).toContain("strategy=installed_tarball_cli_no_npx_no_global");
    expect(packedGate?.details).toContain("help_exit_code=0");
  }, 40000);

  it("detects stale CLI metadata inside a packed tarball", async () => {
    const root = await tempRoot();
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "soturail",
      version: "1.2.3",
      type: "module",
      bin: { soturail: "dist/cli.js" },
      files: ["dist", "README.md", "LICENSE"]
    }, null, 2));
    await writeFile(path.join(root, "README.md"), "# Fixture\n");
    await writeFile(path.join(root, "LICENSE"), "MIT\n");
    await writeFile(path.join(root, "dist", "core", "version.js"), "export const SOTURAIL_VERSION = \"1.2.2\";\n");
    await writeFile(path.join(root, "dist", "cli.js"), "#!/usr/bin/env node\nconsole.log('1.2.2');\n");

    const result = await verifyPackedPackage(root, "soturail", "1.2.3");

    expect(result.ok).toBe(false);
    expect(result.details).toContain("expected 1.2.3");
    expect(result.details).toContain("strategy=installed_tarball_cli_no_npx_no_global");
    expect(result.details).toContain("npx_usage=none");
  }, 40000);

  it("does not accept a fake global or cached CLI when the packed CLI is stale", async () => {
    const root = await tempRoot();
    const fakeBin = path.join(root, "fake-bin");
    await fs.mkdir(fakeBin, { recursive: true });
    if (process.platform === "win32") {
      await writeFile(path.join(fakeBin, "soturail.cmd"), "@echo off\r\necho 1.2.3\r\n");
      await writeFile(path.join(fakeBin, "npx.cmd"), "@echo off\r\necho 1.2.3\r\n");
    } else {
      await writeFile(path.join(fakeBin, "soturail"), "#!/usr/bin/env sh\necho 1.2.3\n");
      await writeFile(path.join(fakeBin, "npx"), "#!/usr/bin/env sh\necho 1.2.3\n");
      await fs.chmod(path.join(fakeBin, "soturail"), 0o755);
      await fs.chmod(path.join(fakeBin, "npx"), 0o755);
    }
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "soturail",
      version: "1.2.3",
      type: "module",
      bin: { soturail: "dist/cli.js" },
      files: ["dist", "README.md", "LICENSE"]
    }, null, 2));
    await writeFile(path.join(root, "README.md"), "# Fixture\n");
    await writeFile(path.join(root, "LICENSE"), "MIT\n");
    await writeFile(path.join(root, "dist", "core", "version.js"), "export const SOTURAIL_VERSION = \"1.2.2\";\n");
    await writeFile(path.join(root, "dist", "cli.js"), "#!/usr/bin/env node\nconsole.log('1.2.2');\n");
    const oldPath = process.env.PATH;
    process.env.PATH = `${fakeBin}${path.delimiter}${oldPath ?? ""}`;
    try {
      const result = await verifyPackedPackage(root, "soturail", "1.2.3");

      expect(result.ok).toBe(false);
      expect(result.cliVersion).toBe("1.2.2");
      expect(result.details).toContain("global_cli_usage=none");
      expect(result.details).toContain("npx_usage=none");
    } finally {
      process.env.PATH = oldPath;
    }
  }, 40000);
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
    expect(stats.estimated_reduced_payload_tokens).toBe(50);
    expect(stats.estimated_net_tokens_sent).toBeGreaterThan(50);
    expect(stats.terminal_reducer_estimated_tokens_saved).toBe(60);
    expect(stats.metadata_overhead_tokens).toBe(stats.summary_overhead_tokens);
    expect(stats.net_estimated_tokens_saved).toBe(stats.estimated_raw_tokens - stats.estimated_net_tokens_sent);
    expect(stats.dedupe_recent_window).toBe(10);
    expect(stats.compression_ratio).toBe(2);
    expect(stats.command_count).toBe(2);
    expect(stats.expansion_count).toBe(1);
    expect(stats.manual_omission_or_failure_count).toBe(2);
    expect(stats.estimated_cache_stability_score).toBe(0.75);
    expect(stats.provider_cache_hits).toBeNull();
    expect(formatted).toContain("real_provider_cache_hits: not imported");
  });

  it("marks tiny outputs ineffective when metadata overhead is larger than the raw output", async () => {
    const root = await tempRoot();
    await ensureWorkspace(root);
    await new RawStore(root).appendRunRecord({
      raw_id: "tiny",
      path: ".soturail/raw/2026-05-21/tiny.log",
      command: "node -e \"console.log('ok')\"",
      exit_code: 0,
      created_at: "2026-05-21T12:00:00.000Z",
      compressor: "generic-stream",
      raw_tokens_estimated: 1,
      compressed_tokens_estimated: 2
    });

    const stats = await collectStats(root);
    const formatted = formatStats(stats);

    expect(stats.compression_effective).toBe(false);
    expect(stats.small_output_warning).toBe(true);
    expect(formatted).toContain("Compression was not effective for this small command");
  });
});

describe("documentation files", () => {
  it("includes Windows, Skill Rail and Workflow Rail docs", async () => {
    const root = process.cwd();

    await expect(fs.access(path.join(root, "docs", "windows.md"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(root, "docs", "skill-rail.md"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(root, "docs", "workflow-rail.md"))).resolves.toBeUndefined();
  });
});

describe("clean-folder installed workflow", () => {
  it("runs the v0.3 happy path without dirtying the repository", async () => {
    const root = await tempRoot();
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "clean-folder", version: "0.0.0" }, null, 2));
    await writeFile(path.join(root, "README.md"), "# Clean Folder\n\nQuick start\n");
    await writeFile(path.join(root, "src", "app.ts"), "export function hello() { return 'world'; }\n");

    await runInit(root);
    const indexOutput = await runIndex(root);
    const pack = await buildContextPack("generic", root);
    const skill = await createSkill("demo-skill", root);
    const listOutput = renderSkillList([skill], root);
    const validation = await validateSkills(root);
    const exported = await exportSkills("claude", root);
    const doctor = await mcpDoctor("0.3.1");
    const manifest = await mcpManifest("0.3.1");
    const hookDoctor = await hooksDoctor(root);
    const stats = formatStats(await collectStats(root));

    expect(indexOutput).toContain("Heuristic Repo Map written");
    await expect(fs.access(path.join(root, "docs", "mcp.md"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(root, "docs", "first-real-workflow.md"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(root, "examples", "mcp", "initialize.json"))).resolves.toBeUndefined();
    await expect(fs.access(pack.path)).resolves.toBeUndefined();
    await expect(fs.access(path.join(root, ".soturail", "exports", "skills", "claude", "demo-skill.md"))).resolves.toBeUndefined();
    expect(listOutput).toContain("skills_count: 1");
    expect(validation.ok).toBe(true);
    expect(exported).toContain("demo-skill.md");
    expect(doctor).toContain("arbitrary_shell_execution: disabled");
    expect(manifest.resources.length).toBeGreaterThan(0);
    expect(manifest.tools.map((tool) => tool.name)).toContain("soturail.context.pack");
    expect(hookDoctor).toContain("Next steps:");
    expect(stats).toContain("command_count:");
  });
});
