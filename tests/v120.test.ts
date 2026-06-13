import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { registerFeatureCommand } from "../src/commands/feature.js";
import { registerHandoffCommand } from "../src/commands/handoff.js";
import { registerHarnessCommand } from "../src/commands/harness.js";
import { registerSessionCommand } from "../src/commands/session.js";
import { exportAgents } from "../src/core/agent-exporter.js";
import { runSchemaCheck } from "../src/core/schema-readiness.js";
import {
  addFeature,
  auditHarnessLifecycle,
  completeFeature,
  generateHandoff,
  initHarnessLifecycle,
  loadFeatureList,
  startFeature
} from "../src/core/harness-lifecycle.js";

describe("v1.2.0 harness lifecycle rail", () => {
  it("creates the safe lifecycle scaffold and preserves existing files", async () => {
    const root = await tempProject();
    const first = await initHarnessLifecycle(root);
    const instructions = path.join(root, ".soturail", "harness", "instructions.md");
    await writeFile(instructions, "# User instructions\n", "utf8");
    const second = await initHarnessLifecycle(root);

    expect(first.created).toContain(path.join(".soturail", "state", "feature_list.json"));
    expect(second.skipped).toContain(path.join(".soturail", "harness", "instructions.md"));
    expect(await readFile(instructions, "utf8")).toBe("# User instructions\n");
    expect(existsSync(path.join(root, ".soturail", "state", "session-handoff.md"))).toBe(true);
  });

  it("audits lifecycle categories without running verification commands", async () => {
    const root = await tempProject();
    await initHarnessLifecycle(root);
    const report = await auditHarnessLifecycle(root);
    const json = JSON.parse(await readFile(path.join(root, ".soturail", "harness", "audit.json"), "utf8"));
    const markdown = await readFile(path.join(root, ".soturail", "harness", "audit.md"), "utf8");

    expect(report.schemaVersion).toBe("soturail.harness.audit.v1");
    expect(report.checks.map((check) => check.title)).toEqual([
      "Instructions",
      "State",
      "Verification",
      "Scope",
      "Session Lifecycle",
      "Host Compatibility",
      "Evidence/Reports",
      "Security Boundaries"
    ]);
    expect(json.score).toBe(100);
    expect(markdown).toContain("Commands run by audit: none");
    const schemaCheck = await runSchemaCheck(root);
    expect(schemaCheck.report.artifacts.find((artifact) => artifact.id === "harness_audit")?.status).toBe("passed");
    expect(schemaCheck.report.artifacts.find((artifact) => artifact.id === "feature_list")?.status).toBe("passed");
  });

  it("manages one active feature and preserves evidence", async () => {
    const root = await tempProject();
    const added = await addFeature("Harness lifecycle", ["tests pass"], root);
    const started = await startFeature(added.id, root);
    const done = await completeFeature(added.id, ["tests/v120.test.ts"], root);
    const list = await loadFeatureList(root);

    expect(started.status).toBe("active");
    expect(done.status).toBe("done");
    expect(done.evidence).toContain("tests/v120.test.ts");
    expect(list.active).toBeNull();
  });

  it("generates a bounded local handoff with the required sections", async () => {
    const root = await tempProject();
    const content = await generateHandoff({
      objective: "Ship lifecycle rail",
      completed: "Implemented deterministic local state",
      blocker: "None",
      next: "Run npm test"
    }, root);

    expect(content).toContain("## Current objective");
    expect(content).toContain("## Last completed work");
    expect(content).toContain("## Files changed");
    expect(content).toContain("## Verification status");
    expect(content).toContain("## Known blockers");
    expect(content).toContain("## Next recommended steps");
    expect(content).toContain("does not run verification commands");
  });

  it("exposes lifecycle commands through the existing CLI registration style", async () => {
    const root = await tempProject();
    const harness = await captureCommand(root, registerHarnessCommand, ["harness", "init"]);
    const session = await captureCommand(root, registerSessionCommand, ["session", "start", "Test lifecycle"]);
    const feature = await captureCommand(root, registerFeatureCommand, ["feature", "add", "Test feature"]);
    const handoff = await captureCommand(root, registerHandoffCommand, ["handoff", "generate"]);

    expect(harness).toContain("SotuRail harness init");
    expect(session).toContain("Session started:");
    expect(feature).toContain("Feature added:");
    expect(handoff).toContain("SotuRail handoff generated");
  });

  it("keeps host exports safe and identifies SotuRail as a harness/context OS", async () => {
    const root = await tempProject();
    const result = await exportAgents("all", root);
    const markdownFiles = result.written.filter((file) => file.endsWith(".md"));
    expect(markdownFiles.length).toBeGreaterThan(0);

    for (const relative of markdownFiles) {
      const text = await readFile(path.resolve(root, relative), "utf8");
      expect(text.trim().length).toBeGreaterThan(0);
      expect(text).toMatch(/SotuRail/i);
      expect(text).not.toMatch(/\b(SoturAI|trading|backtesting)\b/i);
      expect(text).not.toMatch(/destructive shell execution enabled|autonomous agent runtime/i);
    }
  });

  it("links the new lifecycle and boundary docs from README or the future rails index", async () => {
    const root = process.cwd();
    const parent = `${await readFile(path.join(root, "README.md"), "utf8")}\n${await readFile(path.join(root, "docs", "future-rails-index.md"), "utf8")}`;
    for (const doc of [
      "docs/harness-lifecycle-rail.md",
      "docs/security-boundaries.md",
      "docs/conductor-mode.md",
      "docs/agent-harness-synthesis-2026.md"
    ]) {
      expect(existsSync(path.join(root, doc))).toBe(true);
      expect(parent).toContain(doc.replace("docs/", ""));
    }
  });
});

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v120-"));
  await mkdir(path.join(root, ".git"), { recursive: true });
  await mkdir(path.join(root, "docs"), { recursive: true });
  await writeFile(path.join(root, "README.md"), "# Fixture\n", "utf8");
  await writeFile(path.join(root, "docs", "security-boundaries.md"), "# Security boundaries\n", "utf8");
  return root;
}

async function captureCommand(root: string, register: (program: Command) => void, argv: string[]): Promise<string> {
  const program = new Command();
  program.exitOverride();
  register(program);
  const previousCwd = process.cwd();
  const previousWrite = process.stdout.write;
  let output = "";
  process.stdout.write = ((chunk: string | Uint8Array) => {
    output += chunk.toString();
    return true;
  }) as typeof process.stdout.write;
  process.chdir(root);
  try {
    await program.parseAsync(["node", "test", ...argv], { from: "node" });
    return output;
  } finally {
    process.chdir(previousCwd);
    process.stdout.write = previousWrite;
  }
}
