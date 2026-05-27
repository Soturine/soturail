import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listEvaluationCases, runEvaluationSuite } from "../src/core/evaluation-suite.js";
import { appendJsonl, getWorkspacePaths, readJsonl } from "../src/core/config.js";
import {
  brainDoctor,
  consolidateBrain,
  exportBrain,
  rulesFromBrain,
  scanBrain,
  staleBrain,
  type BrainClaimRecord
} from "../src/core/project-brain.js";

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v081-"));
  await mkdir(path.join(root, "src", "core"), { recursive: true });
  await mkdir(path.join(root, "src", "commands"), { recursive: true });
  await mkdir(path.join(root, "docs", "releases"), { recursive: true });
  await mkdir(path.join(root, "tests"), { recursive: true });
  await writeFile(path.join(root, "README.md"), "# Brain Polish Fixture\n\nSotuRail local-first Context OS fixture.\n", "utf8");
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail-brain-polish", version: "1.2.3", engines: { node: ">=20" } }, null, 2), "utf8");
  await writeFile(path.join(root, "CHANGELOG.md"), "## [1.2.3]\n\n- Brain polish fixture.\n", "utf8");
  await writeFile(path.join(root, "src", "cli.ts"), [
    "registerBrainCommand(program);",
    "registerReverseCommand(program);",
    "registerWorkflowCommand(program);",
    ""
  ].join("\n"), "utf8");
  await writeFile(path.join(root, "src", "core", "version.ts"), "export const SOTURAIL_VERSION = \"1.2.3\";\n", "utf8");
  await writeFile(path.join(root, "src", "core", "release-preflight.ts"), [
    "// Release notes live under docs/releases/.",
    "export const releaseNotesPath = \"docs/releases/RELEASE_NOTES_v1.2.3.md\";",
    ""
  ].join("\n"), "utf8");
  await writeFile(path.join(root, "src", "core", "agent-runtime.ts"), "export const policy = \"No arbitrary shell execution through MCP by default.\";\n", "utf8");
  await writeFile(path.join(root, "src", "core", "workflow-store.ts"), "export const workflowStorage = \".soturail/workflows/\";\n", "utf8");
  await writeFile(path.join(root, "src", "core", "diagram-validator.ts"), "export const diagramNote = \"lightweight Mermaid validation, not a full parser\";\n", "utf8");
  await writeFile(path.join(root, "src", "core", "evaluation-suite.ts"), "export const evalPath = \".soturail/eval/latest.json\";\n", "utf8");
  await writeFile(path.join(root, "src", "commands", "brain.ts"), "program.command(\"brain\");\n", "utf8");
  await writeFile(path.join(root, "src", "commands", "reverse.ts"), "program.command(\"reverse\");\n", "utf8");
  await writeFile(path.join(root, "docs", "releases", "README.md"), "# Release Notes\n\nRelease notes live under docs/releases/.\n", "utf8");
  await writeFile(path.join(root, "docs", "diagram-rail.md"), "# Diagram Rail\n\nNo full Mermaid parser is available yet.\n", "utf8");
  await writeFile(path.join(root, "tests", "v070.test.ts"), "expect('release notes').toBe('release notes');\n", "utf8");
  return root;
}

async function releaseNotesClaim(root: string): Promise<BrainClaimRecord> {
  const claims = await readJsonl<BrainClaimRecord>(getWorkspacePaths(root).brainClaimsFile);
  const claim = claims.find((item) => item.claim.includes("Release notes live under docs/releases"));
  if (!claim) throw new Error("release notes claim missing");
  return claim;
}

describe("v0.8.1 Project Brain polish", () => {
  it("groups duplicate claims in dry-run consolidation reports", async () => {
    const root = await tempProject();
    await scanBrain(root);
    const paths = getWorkspacePaths(root);
    const claim = await releaseNotesClaim(root);
    await appendJsonl(paths.brainClaimsFile, { ...claim, id: "claim_duplicate_release_notes_fixture" });

    const result = await consolidateBrain(root, { dryRun: true });
    const report = await readFile(paths.brainConsolidationReportMd, "utf8");

    expect(result.report.duplicateGroups).toBeGreaterThan(0);
    expect(result.report.mergedClaims).toBeGreaterThan(0);
    expect(report).toContain("history");
    expect(report).toContain("claim_duplicate_release_notes_fixture");
  });

  it("relocates moved source ranges and writes stale repair guidance", async () => {
    const root = await tempProject();
    await scanBrain(root);
    await writeFile(path.join(root, "src", "core", "release-preflight.ts"), [
      "// unrelated header",
      "export const placeholder = true;",
      "",
      "// Release notes live under docs/releases/.",
      "export const releaseNotesPath = \"docs/releases/RELEASE_NOTES_v1.2.3.md\";",
      ""
    ].join("\n"), "utf8");

    const result = await staleBrain(root, { repairPlan: true });
    const repair = await readFile(getWorkspacePaths(root).brainRepairPlanMd, "utf8");

    expect(result.freshness.events.some((event) => event.status === "relocated" && event.candidateRange)).toBe(true);
    expect(repair).toContain("recommended_command");
    expect(repair).toContain("human_action");
  });

  it("keeps stale and suspect claims out of verified agent brief sections", async () => {
    const root = await tempProject();
    await scanBrain(root);
    const paths = getWorkspacePaths(root);
    const claim = await releaseNotesClaim(root);
    await appendJsonl(paths.brainClaimsFile, { ...claim, id: "claim_stale_release_notes_fixture", status: "stale" });
    await appendJsonl(paths.brainClaimsFile, { ...claim, id: "claim_suspect_release_notes_fixture", status: "suspect" });

    const result = await exportBrain("codex", root, { limit: 3, includeSuspect: true });
    const verifiedSection = result.content.split("## Verified Claims")[1]?.split("## Active Rules")[0] ?? "";
    const staleSection = result.content.split("## Stale Claims")[1]?.split("## Safe Commands")[0] ?? "";
    const suspectSection = result.content.split("## Suspect Claims")[1]?.split("## Stale Claims")[0] ?? "";

    expect(verifiedSection).not.toContain("claim_stale_release_notes_fixture");
    expect(verifiedSection).not.toContain("claim_suspect_release_notes_fixture");
    expect(staleSection).toContain("claim_stale_release_notes_fixture");
    expect(suspectSection).toContain("claim_suspect_release_notes_fixture");
    expect(verifiedSection.split(/\r?\n/).filter((line) => line.startsWith("- ")).length).toBeLessThanOrEqual(3);
  });

  it("derives safer linked rules and avoids active rules from stale sources", async () => {
    const root = await tempProject();
    await scanBrain(root);
    const paths = getWorkspacePaths(root);
    const claim = await releaseNotesClaim(root);
    await appendJsonl(paths.brainStaleEventsFile, {
      schemaVersion: "soturail.brain.stale-event.v1",
      id: "stale_release_notes_fixture",
      recordId: claim.id,
      reason: "fixture stale source",
      previousHash: claim.rangeHash,
      currentHash: "sha256-fixture",
      status: "stale",
      createdAt: new Date().toISOString()
    });

    const result = await rulesFromBrain(root);
    const json = await readFile(result.jsonPath, "utf8");

    expect(result.rules.every((rule) => rule.sourceClaimIds.length > 0 || (rule.sourceDecisionIds?.length ?? 0) > 0)).toBe(true);
    expect(result.rules.some((rule) => rule.status === "active" && rule.sourceClaimIds.includes(claim.id))).toBe(false);
    expect(json).toContain("soturail.rules.from-brain.v1");
  });

  it("reports actionable doctor guidance and v0.8.1 brain eval cases", async () => {
    const root = await tempProject();
    await scanBrain(root);
    const doctor = await brainDoctor(root, { repairPlan: true });
    const listed = listEvaluationCases({ suite: "brain" });
    const run = await runEvaluationSuite(root, { suite: "brain" });

    expect(doctor.output).toContain("soturail brain consolidate --dry-run");
    expect(doctor.output).toContain("soturail brain stale --repair-plan");
    expect(doctor.output).toContain("soturail eval run --suite brain");
    expect(listed).toContain("brain-claim-deduplication");
    expect(listed).toContain("brain-stale-repair-guidance");
    expect(run.summary.failed).toBe(0);
  });
});
