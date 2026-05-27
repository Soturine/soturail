import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runEvaluationSuite } from "../src/core/evaluation-suite.js";
import { brainDoctor, brainProfile, exportBrain, initBrain, recallBrain, rulesFromBrain, scanBrain, staleBrain } from "../src/core/project-brain.js";
import { reverseClaims, reverseExport, reverseGaps, reverseScan, reverseSpecs } from "../src/core/reverse-specification.js";

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v080-"));
  await mkdir(path.join(root, "src", "core"), { recursive: true });
  await mkdir(path.join(root, "src", "commands"), { recursive: true });
  await mkdir(path.join(root, "docs", "releases"), { recursive: true });
  await mkdir(path.join(root, "tests"), { recursive: true });
  await writeFile(path.join(root, "README.md"), "# Brain Fixture\n\nSotuRail local-first Context OS fixture.\n", "utf8");
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail-brain-fixture", version: "1.2.3", engines: { node: ">=20" } }, null, 2), "utf8");
  await writeFile(path.join(root, "CHANGELOG.md"), "## [1.2.3]\n\n- Brain fixture.\n", "utf8");
  await writeFile(path.join(root, "src", "cli.ts"), [
    "registerBrainCommand(program);",
    "registerReverseCommand(program);",
    "registerWorkflowCommand(program);",
    ""
  ].join("\n"), "utf8");
  await writeFile(path.join(root, "src", "core", "version.ts"), "export const SOTURAIL_VERSION = \"1.2.3\";\n", "utf8");
  await writeFile(path.join(root, "src", "core", "release-preflight.ts"), "export const releaseNotesPath = \"docs/releases/RELEASE_NOTES_v1.2.3.md\";\n", "utf8");
  await writeFile(path.join(root, "src", "core", "agent-runtime.ts"), "export const policy = \"No arbitrary shell execution through MCP by default.\";\n", "utf8");
  await writeFile(path.join(root, "src", "core", "workflow-store.ts"), "export const workflowStorage = \".soturail/workflows/\";\n", "utf8");
  await writeFile(path.join(root, "src", "core", "diagram-validator.ts"), "export const diagramNote = \"lightweight Mermaid validation, not a full parser\";\n", "utf8");
  await writeFile(path.join(root, "src", "core", "evaluation-suite.ts"), "export const evalPath = \".soturail/eval/latest.json\";\n", "utf8");
  await writeFile(path.join(root, "src", "commands", "brain.ts"), "program.command(\"brain\");\n", "utf8");
  await writeFile(path.join(root, "src", "commands", "reverse.ts"), "program.command(\"reverse\");\n", "utf8");
  await writeFile(path.join(root, "docs", "releases", "README.md"), "# Release Notes\n\nRelease notes live under docs/releases/.\n", "utf8");
  await writeFile(path.join(root, "docs", "diagram-rail.md"), "# Diagram Rail\n\nNo full Mermaid parser is available yet.\n", "utf8");
  await writeFile(path.join(root, "tests", "v080.test.ts"), "expect('brain').toBe('brain');\n", "utf8");
  return root;
}

describe("v0.8.0 Project Brain and Reverse Specification Rail", () => {
  it("initializes brain storage and scans project evidence", async () => {
    const root = await tempProject();
    const init = await initBrain(root);
    const scan = await scanBrain(root);
    const profile = JSON.parse(await readFile(path.join(root, ".soturail", "brain", "project-profile.json"), "utf8")) as { projectName: string; releaseNotesPath: string };
    const claims = await readFile(path.join(root, ".soturail", "brain", "claims.jsonl"), "utf8");

    expect(init.output).toContain("SotuRail brain init");
    expect(scan.output).toContain("SotuRail brain scan");
    expect(profile.projectName).toBe("soturail-brain-fixture");
    expect(profile.releaseNotesPath).toContain("docs");
    expect(claims).toContain("Release notes live under docs/releases");
  });

  it("profiles, recalls, detects stale evidence and runs doctor", async () => {
    const root = await tempProject();
    await scanBrain(root);
    const profile = await brainProfile(root);
    const recall = await recallBrain("release notes docs releases", root);
    await rm(path.join(root, "src", "core", "release-preflight.ts"));
    const stale = await staleBrain(root);
    const doctor = await brainDoctor(root);

    expect(profile).toContain("SotuRail brain profile");
    expect(recall).toContain("Release notes");
    expect(recall).toContain("Reason:");
    expect(stale.output).toContain("stale:");
    expect(stale.freshness.stale).toBeGreaterThan(0);
    expect(doctor.output).toContain("SotuRail brain doctor");
    expect(doctor.output).toContain("claims:");
  });

  it("exports agent briefs and derives linked rules from brain", async () => {
    const root = await tempProject();
    await scanBrain(root);
    const rules = await rulesFromBrain(root);
    const exportResult = await exportBrain("codex", root);
    const brief = await readFile(exportResult.path, "utf8");
    const rulesMarkdown = await readFile(rules.markdownPath, "utf8");

    expect(rules.rules.length).toBeGreaterThan(0);
    expect(rules.rules.every((rule) => rule.sourceClaimIds.length > 0 || (rule.sourceDecisionIds?.length ?? 0) > 0)).toBe(true);
    expect(rulesMarkdown).toContain("Brain-Derived Rules");
    expect(brief).toContain("Verified Claims");
    expect(brief).toContain("Active Rules");
    expect(brief).toContain("Safe Commands");
    expect(brief).toContain("Do not overclaim");
  });

  it("runs reverse scan, claims, specs, gaps and agent export", async () => {
    const root = await tempProject();
    const scan = await reverseScan("./src", root);
    const claims = await reverseClaims("./src", root);
    const specs = await reverseSpecs("./src", root);
    const gaps = await reverseGaps(root);
    const exported = await reverseExport("agent", root);
    const spec = await readFile(specs.paths[0] ?? "", "utf8");
    const handoff = await readFile(exported.path, "utf8");

    expect(scan.report.filesScanned).toBeGreaterThan(0);
    expect(claims.output).toContain("claims_added:");
    expect(specs.paths.length).toBe(4);
    expect(spec).toContain("## Source Claims");
    expect(spec).toContain("## Acceptance Criteria");
    expect(gaps.output).toContain("gaps_found:");
    expect(handoff).toContain("Reverse Specification Agent Brief");
  });

  it("runs the brain evaluation suite", async () => {
    const root = await tempProject();
    const run = await runEvaluationSuite(root, { suite: "brain" });
    const markdown = await readFile(run.reports.markdown, "utf8");

    expect(run.schemaVersion).toBe("soturail.eval.v1");
    expect(run.suite).toBe("brain");
    expect(run.summary.failed).toBe(0);
    expect(markdown).toContain("SotuRail Evaluation Report");
    expect(markdown).toContain("brain-claim-quality");
  });
});
