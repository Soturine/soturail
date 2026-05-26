import path from "node:path";
import type { Command } from "commander";
import { listEvaluationCases, readEvaluationReport, runEvaluationSuite } from "../core/evaluation-suite.js";

export function registerEvalCommand(program: Command): void {
  const evalCommand = program.command("eval").description("Run deterministic local SotuRail evaluation fixtures.");

  evalCommand.command("list").description("List local evaluation cases.").action(() => {
    process.stdout.write(listEvaluationCases());
  });

  evalCommand.command("run").description("Run the v0.6.1 local evaluation suite and write JSON/Markdown reports.").action(async () => {
    const result = await runEvaluationSuite();
    process.stdout.write([
      "SotuRail eval run",
      `suite: ${result.suite}`,
      `cases_count: ${result.cases.length}`,
      `passed: ${result.summary.passed}`,
      `failed: ${result.summary.failed}`,
      `warnings: ${result.summary.warnings}`,
      `json: ${path.normalize(path.relative(process.cwd(), result.reports.json))}`,
      `markdown: ${path.normalize(path.relative(process.cwd(), result.reports.markdown))}`
    ].join("\n") + "\n");
  });

  evalCommand.command("report").description("Print the latest local evaluation report.").action(async () => {
    process.stdout.write(await readEvaluationReport());
  });
}
