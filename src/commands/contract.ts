import path from "node:path";
import { createInterface } from "node:readline/promises";
import type { Command } from "commander";
import { ArtifactRegistry } from "../core/artifact-registry.js";
import { artifactStore } from "../core/artifact-store.js";
import { ChangeContractSchema, createChangeContract, evaluateReadiness } from "../core/change-contract.js";
import { buildReadinessSnapshot, readContractFile, recordContractAttestation, reviseChangeContract, type AttestationKind } from "../core/contract-lifecycle.js";

const RISKS = ["low", "medium", "high", "critical"] as const;

export function registerContractCommand(program: Command): void {
  const contract = program.command("contract").description("Create, revise, attest and verify change contracts.");
  contract.command("create")
    .argument("<id>", "Stable contract id")
    .requiredOption("--title <title>", "Contract title")
    .requiredOption("--intent <intent>", "Requested outcome")
    .requiredOption("--criterion <criterion>", "Acceptance criterion")
    .option("--risk <risk>", "low, medium, high or critical", "medium")
    .option("--check <command>", "Required verification command")
    .option("--criterion-check <command>", "Command whose current passing run proves the criterion (objective criteria)")
    .option("--runtime-check <command...>", "Commands that provide runtime evidence")
    .option("--scope <paths...>", "Project-relative path prefixes the change may touch")
    .option("--source <paths...>", "Requirement/source files the contract is based on (bound by digest)")
    .option("--human-approval", "Require human approval")
    .action(async (id: string, options: { title: string; intent: string; criterion: string; risk: (typeof RISKS)[number]; check?: string; criterionCheck?: string; runtimeCheck?: string[]; scope?: string[]; source?: string[]; humanApproval?: boolean }) => {
      if (!/^[a-zA-Z0-9._-]+$/.test(id)) throw new Error("Contract id may contain only letters, digits, dot, underscore and dash.");
      if (!RISKS.includes(options.risk)) throw new Error(`Risk must be one of: ${RISKS.join(", ")}.`);
      const created = await createChangeContract({
        id,
        title: options.title,
        intent: options.intent,
        risk: options.risk,
        decisions: [],
        acceptanceCriteria: [options.criterion],
        requiredChecks: options.check ? [options.check] : [],
        evidencePolicy: { runtimeEvidenceRequired: options.risk === "critical", independentReviewRequired: options.risk === "high" || options.risk === "critical", humanApprovalRequired: options.humanApproval === true },
        ...(options.criterionCheck ? { criteriaEvidence: { [options.criterion]: [options.criterionCheck] } } : {}),
        ...(options.runtimeCheck?.length ? { runtimeChecks: options.runtimeCheck } : {}),
        ...(options.scope?.length ? { scope: options.scope } : {}),
        ...(options.source?.length ? { sources: options.source } : {})
      });
      const target = new ArtifactRegistry().resolve("contracts", `${id}.json`);
      await artifactStore.writeJson(target, created, ChangeContractSchema);
      process.stdout.write(`Change contract created: ${path.relative(process.cwd(), target)}\nbaseline: ${created.workspaceFingerprint}\n`);
    });

  contract.command("revise")
    .description("Create a new contract revision with lineage; the previous revision is never modified.")
    .argument("<file>", "Project-relative contract JSON to supersede")
    .requiredOption("--reason <reason>", "Why the foundation changed")
    .option("--intent <intent>", "New intent")
    .option("--criterion <criterion...>", "Replacement acceptance criteria")
    .option("--check <command...>", "Replacement required checks")
    .option("--risk <risk>", "New risk")
    .option("--scope <paths...>", "Replacement scope")
    .option("--source <paths...>", "Replacement source files")
    .action(async (file: string, options: { reason: string; intent?: string; criterion?: string[]; check?: string[]; risk?: (typeof RISKS)[number]; scope?: string[]; source?: string[] }) => {
      if (options.risk && !RISKS.includes(options.risk)) throw new Error(`Risk must be one of: ${RISKS.join(", ")}.`);
      const { contract: previous } = await readContractFile(file);
      const revised = await reviseChangeContract(previous, {
        ...(options.intent ? { intent: options.intent } : {}),
        ...(options.criterion ? { acceptanceCriteria: options.criterion } : {}),
        ...(options.check ? { requiredChecks: options.check } : {}),
        ...(options.risk ? { risk: options.risk } : {}),
        ...(options.scope ? { scope: options.scope } : {}),
        ...(options.source ? { sources: options.source } : {})
      }, options.reason);
      process.stdout.write(`Contract revision ${revised.contract.revision} written: ${revised.path}\nsupersedes: ${revised.contract.supersedes?.path}\nbaseline: ${revised.contract.workspaceFingerprint}\n`);
    });

  contract.command("attest")
    .description("Record a human attestation receipt (interactive terminal only).")
    .argument("<file>", "Project-relative contract JSON")
    .requiredOption("--kind <kind>", "human-approval, independent-review or criterion")
    .requiredOption("--by <name>", "Name of the human attesting")
    .option("--criterion <criterion>", "Acceptance criterion being attested (with --kind criterion)")
    .action(async (file: string, options: { kind: string; by: string; criterion?: string }) => {
      if (!["human-approval", "independent-review", "criterion"].includes(options.kind)) throw new Error("Attestation kind must be human-approval, independent-review or criterion.");
      const { contract: parsed } = await readContractFile(file);
      const interactive = process.stdin.isTTY === true && process.stdout.isTTY === true;
      let confirmed: string | undefined;
      if (interactive) {
        const prompt = createInterface({ input: process.stdin, output: process.stdout });
        confirmed = (await prompt.question(`Attest ${options.kind} for contract "${parsed.id}" revision ${parsed.revision ?? 1} as ${options.by}. Type the contract id to confirm: `)).trim();
        prompt.close();
      }
      const result = await recordContractAttestation(parsed, { kind: options.kind as AttestationKind, by: options.by, ...(options.criterion ? { criterion: options.criterion } : {}) }, process.cwd(), { interactive, ...(confirmed !== undefined ? { confirmedContractId: confirmed } : {}) });
      process.stdout.write(`Attestation recorded: ${result.path}\nbound to workspace: ${result.receipt.workspaceFingerprint}\n`);
    });

  contract.command("verify")
    .argument("<file>", "Project-relative contract JSON")
    .option("--criterion-passed <criterion>", "Assertion only: must be backed by recorded evidence or a human attestation")
    .option("--check-passed <check>", "Assertion only: must be backed by a current recorded passing run")
    .option("--runtime-evidence", "Assertion only: must be backed by declared runtime checks")
    .option("--independent-review", "Assertion only: must be backed by an attestation receipt")
    .option("--human-approved", "Assertion only: must be backed by an attestation receipt")
    .action(async (file: string, options: { criterionPassed?: string; checkPassed?: string; runtimeEvidence?: boolean; independentReview?: boolean; humanApproved?: boolean }) => {
      const { contract: parsed } = await readContractFile(file);
      const snapshot = await buildReadinessSnapshot(parsed, process.cwd(), {
        criteria: options.criterionPassed ? [options.criterionPassed] : [],
        checks: options.checkPassed ? [options.checkPassed] : [],
        runtimeEvidence: options.runtimeEvidence === true,
        independentReview: options.independentReview === true,
        humanApproval: options.humanApproved === true
      });
      const verdict = evaluateReadiness(parsed, snapshot);
      process.stdout.write(`${JSON.stringify({ ...verdict, integrity: snapshot.integrity, checkEvidence: snapshot.checkEvidence, satisfiedBy: snapshot.satisfiedBy, assertions: snapshot.assertions }, null, 2)}\n`);
      if (verdict.verdict !== "ready") process.exitCode = 1;
    });
}
