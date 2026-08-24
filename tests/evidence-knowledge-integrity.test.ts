import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { collectEvidence, verifyEvidence } from "../src/core/evidence-provenance.js";
import { compileKnowledge, updateKnowledge } from "../src/core/knowledge-rail.js";

const exec = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("workspace-bound evidence", () => {
  it("marks evidence stale after a one-byte workspace edit", async () => {
    const root = await temporaryGitProject();
    const collected = await collectEvidence(root);
    expect(collected.evidence.freshness).toBe("current");

    await fs.writeFile(path.join(root, "source.md"), "y", "utf8");
    const verified = await verifyEvidence(root);
    expect(verified.evidence.status).toBe("stale");
    expect(verified.evidence.freshness).toBe("stale");
    expect(verified.evidence.blockers.some((blocker) => blocker.startsWith("Workspace fingerprint changed:"))).toBe(true);
    await expect(fs.readFile(path.join(verified.dir, "envelope.json"), "utf8").then(JSON.parse)).resolves.toMatchObject({ artifactType: "evidence", freshness: "stale" });
  });
});

describe("knowledge source integrity", () => {
  it("avoids normalized slug collisions and removes topics for deleted sources", async () => {
    const root = await temporaryGitProject();
    await fs.mkdir(path.join(root, "a"), { recursive: true });
    await fs.writeFile(path.join(root, "a", "b.md"), "# First\nalpha\n", "utf8");
    await fs.writeFile(path.join(root, "a-b.md"), "# Second\nbeta\n", "utf8");
    const compiled = await compileKnowledge("collision", ["a/b.md", "a-b.md"], root);
    const topicsDir = path.join(compiled.dir, "topics");
    const topics = await fs.readdir(topicsDir);
    expect(topics).toHaveLength(2);
    expect(new Set(topics).size).toBe(2);

    await fs.unlink(path.join(root, "a", "b.md"));
    await updateKnowledge("collision", ["a-b.md"], root);
    expect(await fs.readdir(topicsDir)).toHaveLength(1);
  });
});

async function temporaryGitProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-evidence-"));
  temporaryDirectories.push(root);
  await fs.writeFile(path.join(root, "source.md"), "x", "utf8");
  await fs.writeFile(path.join(root, ".gitignore"), ".soturail/\n", "utf8");
  await exec("git", ["init", "-q"], { cwd: root, windowsHide: true });
  await exec("git", ["config", "user.email", "test@example.com"], { cwd: root, windowsHide: true });
  await exec("git", ["config", "user.name", "SotuRail Test"], { cwd: root, windowsHide: true });
  await exec("git", ["add", "."], { cwd: root, windowsHide: true });
  await exec("git", ["commit", "-qm", "fixture"], { cwd: root, windowsHide: true });
  return root;
}
