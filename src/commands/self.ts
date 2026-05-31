import path from "node:path";
import type { Command } from "commander";
import { baselineSnapshot } from "../core/baseline-snapshot.js";
import {
  assertSotuRailRepository,
  createEmptySelfState,
  formatSelfBench,
  formatSelfDoctor,
  formatSelfIndex,
  formatSelfRunStep,
  selfAll,
  selfBench,
  selfBuild,
  selfDoctor,
  selfIndex,
  selfTest,
  writeSelfReport
} from "../core/self-dogfood.js";

export function registerSelfCommand(program: Command): void {
  const self = program.command("self").description("Run SotuRail's self-dogfooding workflow.");

  self.command("doctor").description("Verify that the current workspace is the SotuRail repository.").action(async () => {
    const result = await selfDoctor(path.resolve(process.cwd()));
    process.stdout.write(formatSelfDoctor(result));
    if (!result.ok) {
      process.exitCode = 1;
    }
  });

  self.command("index").description("Index the SotuRail repository through its own scanner.").action(async () => {
    const result = await selfIndex(path.resolve(process.cwd()));
    process.stdout.write(formatSelfIndex(result));
  });

  self.command("build").description("Run npm run build through SotuRail's safe runner.").action(async () => {
    const result = await selfBuild(path.resolve(process.cwd()), process.stdout, process.stderr);
    process.stdout.write(formatSelfRunStep("build", result));
    process.exitCode = result.ok ? 0 : 1;
  });

  self.command("test").description("Run npm test through SotuRail's safe runner.").action(async () => {
    const result = await selfTest(path.resolve(process.cwd()), process.stdout, process.stderr);
    process.stdout.write(formatSelfRunStep("test", result));
    process.exitCode = result.ok ? 0 : 1;
  });

  self.command("bench").description("Run the SotuRail benchmark suite and capture local evidence.").action(async () => {
    const result = await selfBench(path.resolve(process.cwd()), process.stdout, process.stderr);
    process.stdout.write(formatSelfBench(result));
    process.exitCode = result.ok ? 0 : 1;
  });

  self
    .command("baseline")
    .description("Create or report clean baseline source/package artifacts.")
    .option("--check", "Validate baseline readiness and print recommended artifact commands")
    .option("--zip", "Create or print a clean git archive source zip command")
    .option("--bundle", "Create or print a git bundle history backup command")
    .option("--pack", "Create or print an npm pack package snapshot command")
    .action(async (options: { check?: boolean; zip?: boolean; bundle?: boolean; pack?: boolean }) => {
      const selected = [
        options.zip ? "zip" : null,
        options.bundle ? "bundle" : null,
        options.pack ? "pack" : null,
        options.check || (!options.zip && !options.bundle && !options.pack) ? "check" : null
      ].filter(Boolean);
      if (selected.length !== 1) throw new Error("Choose one baseline mode: --check, --zip, --bundle, or --pack.");
      process.stdout.write((await baselineSnapshot(path.resolve(process.cwd()), selected[0] as "check" | "zip" | "bundle" | "pack")).output);
    });

  self.command("report").description("Write .soturail/reports/self-dogfood.md from current local evidence.").action(async () => {
    const root = path.resolve(process.cwd());
    const state = createEmptySelfState();
    state.doctor = await assertSotuRailRepository(root);
    const reportPath = await writeSelfReport({ ...state, root });
    process.stdout.write(`SotuRail self report written: ${path.normalize(path.relative(root, reportPath))}\n`);
  });

  self.command("all").description("Run doctor, index, build, test, bench and report.").action(async () => {
    const root = path.resolve(process.cwd());
    const result = await selfAll(root, process.stdout, process.stderr);
    process.stdout.write(`SotuRail self all complete.\n`);
    process.stdout.write(`report: ${result.report_path ? path.normalize(path.relative(root, result.report_path)) : "not written"}\n`);
    if (result.errors.length > 0) {
      process.stdout.write(`errors: ${result.errors.join("; ")}\n`);
      process.exitCode = 1;
    }
  });
}
