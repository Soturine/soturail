import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { ArtifactRegistry } from "../core/artifact-registry.js";
import { artifactStore } from "../core/artifact-store.js";
import { ChangeContractSchema, createChangeContract, evaluateReadiness } from "../core/change-contract.js";
import { createWorkspaceFingerprint } from "../core/workspace-fingerprint.js";
import { WorkspaceGuard } from "../core/workspace-guard.js";

export function registerContractCommand(program: Command): void {
  const contract = program.command("contract").description("Create and verify deterministic change contracts.");
  contract.command("create")
    .argument("<id>", "Stable contract id")
    .requiredOption("--title <title>", "Contract title")
    .requiredOption("--intent <intent>", "Requested outcome")
    .requiredOption("--criterion <criterion>", "Acceptance criterion")
    .option("--risk <risk>", "low, medium, high or critical", "medium")
    .option("--check <command>", "Required verification command")
    .option("--human-approval", "Require human approval")
    .action(async (id: string, options: { title: string; intent: string; criterion: string; risk: "low" | "medium" | "high" | "critical"; check?: string; humanApproval?: boolean }) => {
      if (!/^[a-zA-Z0-9._-]+$/.test(id)) throw new Error("Contract id may contain only letters, digits, dot, underscore and dash.");
      const created = await createChangeContract({
        id,
        title: options.title,
        intent: options.intent,
        risk: options.risk,
        decisions: [],
        acceptanceCriteria: [options.criterion],
        requiredChecks: options.check ? [options.check] : [],
        evidencePolicy: { runtimeEvidenceRequired: options.risk === "critical", independentReviewRequired: options.risk === "high" || options.risk === "critical", humanApprovalRequired: options.humanApproval === true }
      });
      const target = new ArtifactRegistry().resolve("contracts", `${id}.json`);
      await artifactStore.writeJson(target, created, ChangeContractSchema);
      process.stdout.write(`Change contract created: ${path.relative(process.cwd(), target)}\n`);
    });
  contract.command("verify")
    .argument("<file>", "Project-relative contract JSON")
    .option("--criterion-passed <criterion>", "Satisfied acceptance criterion")
    .option("--check-passed <check>", "Observed passing check")
    .option("--runtime-evidence", "Runtime evidence is attached")
    .option("--independent-review", "Independent review is attached")
    .option("--human-approved", "Human approval is attached")
    .action(async (file: string, options: { criterionPassed?: string; checkPassed?: string; runtimeEvidence?: boolean; independentReview?: boolean; humanApproved?: boolean }) => {
      const absolute = await new WorkspaceGuard().assertAllowedRead(file);
      const parsed = ChangeContractSchema.parse(JSON.parse(await fs.readFile(absolute, "utf8")));
      const workspace = await createWorkspaceFingerprint();
      const verdict = evaluateReadiness(parsed, {
        workspaceFingerprint: workspace.fingerprint,
        acceptanceCriteriaPassed: options.criterionPassed ? [options.criterionPassed] : [],
        checksPassed: options.checkPassed ? [options.checkPassed] : [],
        evidenceFreshness: "current",
        runtimeEvidence: options.runtimeEvidence === true,
        independentReview: options.independentReview === true,
        humanApproval: options.humanApproved === true,
        blockers: []
      });
      process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`);
      if (verdict.verdict !== "ready") process.exitCode = 1;
    });
}
