import path from "node:path";
import type { Command } from "commander";
import {
  checkHarnessContract,
  explainHarnessFailure,
  harnessDoctor,
  initHarnessContract,
  listHarnessFailures,
  noteHarnessFailure,
  renderHarnessFailures
} from "../core/harness-rail.js";
import { auditHarnessLifecycle, initHarnessLifecycle, renderHarnessAudit } from "../core/harness-lifecycle.js";

export function registerHarnessCommand(program: Command): void {
  const harness = program.command("harness").description("Record local harness failures and acceptance contracts.");

  harness.command("init").description("Create the safe local Harness Lifecycle scaffold.")
    .option("--force", "Overwrite lifecycle scaffold files after explicit review")
    .action(async (options: { force?: boolean }) => {
      const result = await initHarnessLifecycle(process.cwd(), { force: options.force === true });
      process.stdout.write([
        "SotuRail harness init",
        `created: ${result.created.length}`,
        `skipped: ${result.skipped.length}`,
        ...result.created.map((file) => `- created ${file}`),
        ...result.skipped.map((file) => `- preserved ${file}`),
        "next: soturail harness audit"
      ].join("\n") + "\n");
    });

  harness.command("audit").description("Audit local harness lifecycle readiness without executing checks.")
    .option("--json", "Print machine-readable JSON")
    .action(async (options: { json?: boolean }) => {
      const report = await auditHarnessLifecycle();
      process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : renderHarnessAudit(report));
    });

  harness
    .command("note")
    .description("Record an agent mistake, repeated failure, or missed check.")
    .argument("<text>", "Failure note")
    .option("--workflow <id>", "Workflow id")
    .option("--cause <text>", "Suspected root cause")
    .option("--prevention <candidate>", "rule, doc, hook, memory, workflow check, or diagram/spec update")
    .option("--evidence <path-or-raw-id>", "Evidence path or raw id")
    .action(async (text: string, options: { workflow?: string; cause?: string; prevention?: string; evidence?: string }) => {
      const record = await noteHarnessFailure(text, options);
      process.stdout.write(`Harness failure recorded: ${record.id}\nprevention_candidate: ${record.preventionCandidate}\n`);
    });

  harness.command("list").description("List recorded harness failures.").action(async () => {
    process.stdout.write(renderHarnessFailures(await listHarnessFailures()));
  });

  harness.command("explain").description("Explain a harness failure record.").argument("<id>", "Failure id").action(async (id: string) => {
    process.stdout.write(await explainHarnessFailure(id));
  });

  harness.command("doctor").description("Check local harness readiness.").action(async () => {
    process.stdout.write(await harnessDoctor());
  });

  const contract = harness.command("contract").description("Manage local acceptance harness contracts.");
  contract.command("init").description("Create the default local harness contract.").action(async () => {
    const result = await initHarnessContract();
    process.stdout.write(`${result.created ? "Harness contract created" : "Harness contract already exists"}: ${path.normalize(path.relative(process.cwd(), result.path))}\n`);
  });
  contract.command("check").description("Validate the local harness contract without running commands.").action(async () => {
    process.stdout.write(await checkHarnessContract());
  });
}
