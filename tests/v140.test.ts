import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { registerEvalCommand } from "../src/commands/eval.js";
import { registerEvidenceCommand } from "../src/commands/evidence.js";
import { registerKnowledgeCommand } from "../src/commands/knowledge.js";
import { registerSkillsCommand } from "../src/commands/skills.js";
import { registerTaskletCommand } from "../src/commands/tasklet.js";
import { collectEvidence, reportEvidence, verifyEvidence } from "../src/core/evidence-provenance.js";
import { initEvalDataset, runEvalDataset, runGoldenChecks, runRegression } from "../src/core/agent-qa.js";
import { compileKnowledge, estimateKnowledge, listKnowledge, updateKnowledge, verifyKnowledge } from "../src/core/knowledge-rail.js";
import { buildSkill, createSkillTemplate, lintSkillsV2, writeSkillV2Report } from "../src/core/skill-rail-v2.js";
import { createTasklet, exportTasklet, listTasklets, runTasklet } from "../src/core/tasklet-rail.js";
import { SOTURAIL_VERSION } from "../src/core/version.js";

describe("v1.4.0 knowledge evidence evaluation skills and tasklets", () => {
  it("estimates, compiles, updates, verifies and lists local knowledge packs", async () => {
    const root = await tempProject();
    const estimate = await estimateKnowledge(["README.md", "docs"], root);
    const compiled = await compileKnowledge("project-guide", ["README.md", "docs"], root);
    const verified = await verifyKnowledge("project-guide", root);
    await writeFile(path.join(root, "docs", "guide.md"), "# Guide updated\n\nRun `npm test`.\n", "utf8");
    const updated = await updateKnowledge("project-guide", ["docs/guide.md"], root);
    const listed = await listKnowledge(root);

    expect(estimate.files).toBe(2);
    expect(compiled.metadata.sourceCount).toBe(2);
    expect(verified.status).toBe("verified");
    expect(updated.metadata.sources).toContain("docs/guide.md");
    expect(listed.some((item) => item.name === "project-guide")).toBe(true);
    for (const file of ["SKILL.md", "glossary.md", "patterns.md", "cheatsheet.md", "metadata.json", "source-map.json"]) {
      expect(existsSync(path.join(compiled.dir, file))).toBe(true);
    }
  });

  it("collects evidence without claiming unsupported verification", async () => {
    const root = await tempProject();
    await compileKnowledge("project-guide", ["README.md"], root);
    const collected = await collectEvidence(root);
    const verified = await verifyEvidence(root);
    const reported = await reportEvidence(root);
    const parsed = JSON.parse(await readFile(path.join(collected.dir, "evidence.json"), "utf8"));

    expect(["unverified", "inferred", "verified", "blocked"]).toContain(collected.evidence.status);
    expect(parsed.filesRead[0].status).toBe("inferred");
    expect(verified.evidence.warnings.join(" ")).toContain("without running commands");
    expect(reported.report).toContain("No unsupported verification is claimed");
    expect(existsSync(path.join(collected.dir, "provenance.md"))).toBe(true);
  });

  it("runs deterministic datasets, golden checks and regression reports", async () => {
    const root = await tempProject();
    await compileKnowledge("project-guide", ["README.md"], root);
    await createTasklet("review-docs", root);
    await collectEvidence(root);
    const datasetPath = await initEvalDataset(root);
    const dataset = await runEvalDataset(root);
    const golden = await runGoldenChecks(root);
    const regression = await runRegression(root);

    expect(JSON.parse(await readFile(datasetPath, "utf8")).schemaVersion).toBe("soturail.eval.dataset.v1");
    expect(dataset.schemaVersion).toBe("soturail.agent-qa.v1");
    expect(golden.cases.some((item) => item.id === "host-export-safety")).toBe(true);
    expect(regression.kind).toBe("regression");
    expect(golden.cases.find((item) => item.id === "evidence-honesty")?.result).not.toBe("fail");
  });

  it("creates and builds Skill Rail 2.0 packs with safety reports", async () => {
    const root = await tempProject();
    const template = await createSkillTemplate("docs-review", root);
    const built = await buildSkill("project-guide", ["README.md", "docs"], root);
    const lint = await lintSkillsV2(root);
    const report = await writeSkillV2Report(root);

    expect(existsSync(path.join(template, "metadata.json"))).toBe(true);
    expect(existsSync(path.join(built, "source-map.json"))).toBe(true);
    expect(existsSync(path.join(built, "topics"))).toBe(true);
    expect(lint.issues.some((issue) => issue.severity === "error")).toBe(false);
    expect(JSON.parse(await readFile(report.json, "utf8")).schemaVersion).toBe("soturail.skills.report.v2");
  });

  it("creates, lists, dry-runs and exports tasklets without shell execution", async () => {
    const root = await tempProject();
    const created = await createTasklet("review-docs", root);
    const listed = await listTasklets(root);
    const simulation = await runTasklet("review-docs", root);
    const exported = await exportTasklet("review-docs", root);

    expect(created.created).toBe(true);
    expect(listed.map((item) => item.name)).toContain("review-docs");
    expect(simulation.mode).toBe("dry-run");
    expect(simulation.shellCommandsExecuted).toBe(false);
    expect(await readFile(exported, "utf8")).toContain("not an autonomous agent");
  });

  it("exposes the v1.4 rails through the CLI registration style", async () => {
    const root = await tempProject();
    const knowledge = await captureCommand(root, registerKnowledgeCommand, ["knowledge", "compile", "README.md", "--name", "guide"]);
    const evidence = await captureCommand(root, registerEvidenceCommand, ["evidence", "collect"]);
    const dataset = await captureCommand(root, registerEvalCommand, ["eval", "dataset", "init"]);
    const skill = await captureCommand(root, registerSkillsCommand, ["skills", "template", "docs-review"]);
    const tasklet = await captureCommand(root, registerTaskletCommand, ["tasklet", "create", "review-docs"]);
    const simulation = JSON.parse(await captureCommand(root, registerTaskletCommand, ["tasklet", "run", "review-docs", "--dry-run"]));

    expect(knowledge).toContain("Knowledge compiled: guide");
    expect(evidence).toContain("Evidence collected:");
    expect(dataset).toContain("Eval dataset initialized:");
    expect(skill).toContain("Skill template:");
    expect(tasklet).toContain("Tasklet created:");
    expect(simulation.shellCommandsExecuted).toBe(false);
  });

  it("keeps the reorganized documentation indexed and linked", async () => {
    const root = process.cwd();
    for (const file of [
      "docs/README.md",
      "docs/rails/knowledge/knowledge-rail.md",
      "docs/rails/evidence/evidence-provenance-rail.md",
      "docs/rails/evaluation/agent-qa-rail.md",
      "docs/rails/skills/skill-rail-2.md",
      "docs/rails/tasklets/tasklet-rail.md",
      "docs/releases/RELEASE_NOTES_v1.4.0.md"
    ]) expect(existsSync(path.join(root, file))).toBe(true);
  });

  it("keeps the package and CLI version synchronized for v1.4.0", async () => {
    const packageJson = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf8")) as { version: string };
    expect(packageJson.version).toBe("1.4.0");
    expect(SOTURAIL_VERSION).toBe(packageJson.version);
  });
});

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v140-"));
  await mkdir(path.join(root, ".git"), { recursive: true });
  await mkdir(path.join(root, "docs"), { recursive: true });
  await writeFile(path.join(root, "README.md"), "# Fixture\n\nLocal-first Context OS. Run `npm test`.\n", "utf8");
  await writeFile(path.join(root, "docs", "guide.md"), "# Guide\n\nUse source-backed evidence and safe commands.\n", "utf8");
  return root;
}

async function captureCommand(root: string, register: (program: Command) => void, argv: string[]): Promise<string> {
  const program = new Command();
  program.exitOverride();
  register(program);
  const previousCwd = process.cwd();
  const previousWrite = process.stdout.write;
  const previousExitCode = process.exitCode;
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
    process.exitCode = previousExitCode;
  }
}
