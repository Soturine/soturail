import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { approveMemory, proposeMemory, searchMemory } from "../src/commands/memory.js";
import { APPROVED_MEMORY_MIGRATION_ID, ensureApprovedMemoryMigrated, readApprovedMemory } from "../src/core/approved-memory.js";
import { ensureWorkspace, getWorkspacePaths } from "../src/core/config.js";
import { buildContextPack } from "../src/core/context-pack.js";
import { getHostAdapter, hostDeprecationNotice } from "../src/core/host-adapters.js";
import { migrateLegacySkill } from "../src/core/skill-exporter.js";
import { loadSkillCatalog } from "../src/core/skill-model.js";
import { createSkill } from "../src/core/skill-store.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })));
});

async function tempRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-legacy-"));
  temporaryDirectories.push(dir);
  return dir;
}

describe("approved memory: migrate then single reader", () => {
  it("migrates legacy-only approvals once, records a receipt and never duplicates", async () => {
    const root = await tempRoot();
    await ensureWorkspace(root);
    const paths = getWorkspacePaths(root);
    // Pre-v1.6 state: one approval present only in the legacy log, one mirrored in both stores.
    await fs.writeFile(paths.memoryApprovedFile, `${JSON.stringify({ id: "mem_both", created_at: "c", approved_at: "a", git_commit: null, text: "Usar pnpm", source: "manual", status: "approved" })}\n`);
    await fs.writeFile(paths.memoryFile, [
      JSON.stringify({ id: "mem_both", text: "Usar pnpm", content: "[approved] Usar pnpm", approved: true }),
      JSON.stringify({ timestamp: "2026-01-01T00:00:00.000Z", content: "[approved] 認証はOAuthのみ", approved: true }),
      JSON.stringify({ timestamp: "2026-01-02T00:00:00.000Z", content: "free-form note" })
    ].join("\n") + "\n");
    const receipt = await ensureApprovedMemoryMigrated(root);
    expect(receipt).toMatchObject({ id: APPROVED_MEMORY_MIGRATION_ID, migrated: 1, alreadyCanonical: 1 });
    const approved = await readApprovedMemory(root);
    expect(approved.map((item) => item.text).sort()).toEqual(["Usar pnpm", "認証はOAuthのみ"].sort());
    expect(approved.find((item) => item.text === "認証はOAuthのみ")?.migrated_from).toBe("memory/memory.jsonl");
    // Idempotent: the receipt prevents re-migration.
    expect((await ensureApprovedMemoryMigrated(root)).appliedAt).toBe(receipt.appliedAt);
    expect((await readApprovedMemory(root)).length).toBe(2);
    // Legacy log is preserved as history.
    expect(await fs.readFile(paths.memoryFile, "utf8")).toContain("free-form note");
  });

  it("stops mirroring approvals and keeps stale memory out of context packs", async () => {
    const root = await tempRoot();
    await ensureWorkspace(root);
    const paths = getWorkspacePaths(root);
    const fresh = await proposeMemory("Releases need a green SHA", {}, root);
    await approveMemory(fresh.id, root);
    const old = await proposeMemory("Use Node 20", {}, root);
    await approveMemory(old.id, root);
    expect(await fs.readFile(paths.memoryFile, "utf8")).not.toContain("Releases need a green SHA");
    const lines = (await fs.readFile(paths.memoryApprovedFile, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
    await fs.writeFile(paths.memoryApprovedFile, lines.map((item) => JSON.stringify(item.id === old.id ? { ...item, stale: true } : item)).join("\n") + "\n");
    const pack = await buildContextPack("generic", root);
    const content = await fs.readFile(pack.path, "utf8");
    expect(content.split("Releases need a green SHA").length - 1).toBe(1);
    expect(content).not.toContain("Use Node 20");
    expect(content).toContain("1 stale approved memory entry omitted");
    // Search still finds approved memory through the canonical store.
    expect((await searchMemory("green SHA", root)).length).toBe(1);
  });

  it("does not create SotuRail state when reading a project without a workspace", async () => {
    const root = await tempRoot();
    expect(await readApprovedMemory(root)).toEqual([]);
    await expect(fs.access(path.join(root, ".soturail"))).rejects.toThrow();
  });
});

describe("legacy skill packs and hosts", () => {
  it("migrates a v1.5 pack into a portable skill without modifying the pack", async () => {
    const root = await tempRoot();
    const legacy = await createSkill("Release Review", root);
    const before = await fs.readFile(path.join(legacy.dir, "skill.yml"), "utf8");
    const result = await migrateLegacySkill("release-review", root);
    expect(result.target).toBe(".agents/skills/release-review");
    expect(await fs.readFile(path.join(legacy.dir, "skill.yml"), "utf8")).toBe(before);
    const catalog = await loadSkillCatalog(root);
    expect(catalog.skills.find((skill) => skill.name === "release-review")?.source).toBe("project");
    expect(catalog.issues.map((issue) => issue.code)).toContain("legacy_superseded");
    await expect(migrateLegacySkill("release-review", root)).rejects.toThrow(/already exists/);
  });

  it("marks gemini-legacy as a deprecated compatibility profile of gemini", () => {
    expect(getHostAdapter("gemini-legacy").deprecated).toMatchObject({ replacement: "gemini", removal: "2.0.0" });
    expect(hostDeprecationNotice("gemini-legacy")).toMatch(/use "gemini"/);
    expect(hostDeprecationNotice("gemini")).toBeNull();
  });
});
