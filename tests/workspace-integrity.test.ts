import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactStore } from "../src/core/artifact-store.js";
import { ArtifactRegistry } from "../src/core/artifact-registry.js";
import { WorkspaceGuard } from "../src/core/workspace-guard.js";
import { createWorkspaceFingerprint } from "../src/core/workspace-fingerprint.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("WorkspaceGuard", () => {
  it("rejects traversal and absolute paths outside the project", async () => {
    const root = await temporaryProject();
    const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-outside-file-"));
    temporaryDirectories.push(outsideDir);
    const outside = path.join(outsideDir, "outside.txt");
    await fs.writeFile(outside, "outside", "utf8");
    const guard = new WorkspaceGuard(root);

    await expect(guard.resolveProjectPath("../outside.txt")).rejects.toThrow(/escapes allowed boundary/i);
    await expect(guard.resolveProjectPath(outside)).rejects.toThrow(/escapes allowed boundary/i);
    await expect(guard.resolveProjectPath("inside.txt")).resolves.toBe(await fs.realpath(path.join(root, "inside.txt")));
  });

  it("accepts a canonical target under a symlinked project-root alias", async () => {
    const root = await temporaryProject();
    const aliasParent = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-root-alias-"));
    temporaryDirectories.push(aliasParent);
    const alias = path.join(aliasParent, "project");
    await fs.symlink(root, alias, process.platform === "win32" ? "junction" : "dir");
    const guard = new WorkspaceGuard(alias);

    await expect(guard.resolveProjectPath("inside.txt")).resolves.toBe(await fs.realpath(path.join(root, "inside.txt")));
    await fs.mkdir(path.join(root, ".soturail", "raw"), { recursive: true });
    await fs.writeFile(path.join(root, ".soturail", "raw", "aliased.log"), "raw", "utf8");
    await expect(guard.assertAllowedRead(".soturail/raw/aliased.log")).rejects.toThrow(/trusted policy/i);
  });

  it("rejects a symlink or junction that resolves outside the project", async () => {
    const root = await temporaryProject();
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-outside-"));
    temporaryDirectories.push(outside);
    await fs.writeFile(path.join(outside, "secret.txt"), "canary", "utf8");
    const link = path.join(root, "linked-outside");
    await fs.symlink(outside, link, process.platform === "win32" ? "junction" : "dir");

    await expect(new WorkspaceGuard(root).resolveProjectPath("linked-outside/secret.txt")).rejects.toThrow(/escapes allowed boundary/i);
  });

  it("requires trusted policy for raw logs and denies probable secret files", async () => {
    const root = await temporaryProject();
    await fs.mkdir(path.join(root, ".soturail", "raw"), { recursive: true });
    await fs.writeFile(path.join(root, ".soturail", "raw", "run.log"), "raw", "utf8");
    await fs.writeFile(path.join(root, ".env"), "TOKEN=canary", "utf8");
    const guard = new WorkspaceGuard(root);

    await expect(guard.assertAllowedRead(".soturail/raw/run.log")).rejects.toThrow(/trusted policy/i);
    await expect(guard.assertAllowedRead(".env")).rejects.toThrow(/secret paths/i);
    await expect(guard.assertAllowedRead(".soturail/raw/run.log", { allowRaw: true })).resolves.toContain("run.log");
  });
});

describe("ArtifactStore", () => {
  it("writes valid JSON atomically without leaving temporary files", async () => {
    const root = await temporaryProject();
    const target = path.join(root, ".soturail", "artifacts", "value.json");
    const store = new ArtifactStore();
    await store.writeJson(target, { version: 1, value: "ok" });
    await store.writeJson(target, { version: 2, value: "updated" });

    await expect(fs.readFile(target, "utf8").then(JSON.parse)).resolves.toEqual({ version: 2, value: "updated" });
    expect((await fs.readdir(path.dirname(target))).filter((entry) => entry.endsWith(".tmp"))).toEqual([]);
  });

  it("recovers a partial final JSONL line before appending", async () => {
    const root = await temporaryProject();
    const target = path.join(root, ".soturail", "artifacts", "events.jsonl");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, '{"id":1}\n{"id":', "utf8");
    const store = new ArtifactStore();

    const repair = await store.repairJsonl(target);
    expect(repair.recoveredPartialTail).toBe(true);
    await store.appendJsonl(target, { id: 2 });
    expect((await store.readJsonl<{ id: number }>(target)).records).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("coordinates concurrent writers without losing records", async () => {
    const root = await temporaryProject();
    const target = path.join(root, ".soturail", "artifacts", "events.jsonl");
    const store = new ArtifactStore();
    await Promise.all(Array.from({ length: 20 }, (_, id) => store.appendJsonl(target, { id })));
    const result = await store.readJsonl<{ id: number }>(target);

    expect(result.corruptLine).toBeUndefined();
    expect(result.records.map((record) => record.id).sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, id) => id));
  });
});

describe("artifact identity", () => {
  it("keeps registry paths inside their canonical roots", async () => {
    const root = await temporaryProject();
    const registry = new ArtifactRegistry(root);
    expect(registry.resolve("evidence", "run-1", "evidence.json")).toContain(path.join("evidence", "run-1"));
    expect(() => registry.resolve("evidence", "..", "raw", "secret.log")).toThrow(/escapes registry root/i);
  });

  it("changes the workspace fingerprint after a one-byte edit", async () => {
    const root = await temporaryProject();
    await initializeGit(root);
    const before = await createWorkspaceFingerprint(root);
    await fs.writeFile(path.join(root, "inside.txt"), "y", "utf8");
    const after = await createWorkspaceFingerprint(root);
    expect(after.fingerprint).not.toBe(before.fingerprint);
    expect(after.dirty).toBe(true);
  });
});

async function temporaryProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-integrity-"));
  temporaryDirectories.push(root);
  await fs.writeFile(path.join(root, "inside.txt"), "x", "utf8");
  return root;
}

async function initializeGit(root: string): Promise<void> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const exec = promisify(execFile);
  await exec("git", ["init", "-q"], { cwd: root, windowsHide: true });
  await exec("git", ["config", "user.email", "test@example.com"], { cwd: root, windowsHide: true });
  await exec("git", ["config", "user.name", "SotuRail Test"], { cwd: root, windowsHide: true });
  await exec("git", ["add", "inside.txt"], { cwd: root, windowsHide: true });
  await exec("git", ["commit", "-qm", "fixture"], { cwd: root, windowsHide: true });
}
