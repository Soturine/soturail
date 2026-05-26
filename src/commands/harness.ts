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

export function registerHarnessCommand(program: Command): void {
  const harness = program.command("harness").description("Record local harness failures and acceptance contracts.");

  harness
    .command("note")
    .description("Record an agent mistake, repeated failure, or missed check.")
    .argument("<text>", "Failure note")
    .option("--workflow <id>", "Workflow id")
    .option("--cause <text>", "Suspected root cause")
    .option("--prevention <candidate>", "rule, doc, hook, memory, or workflow check")
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
