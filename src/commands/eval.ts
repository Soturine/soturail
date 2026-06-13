import path from "node:path";
import type { Command } from "commander";
import { listEvaluationCases, readEvaluationReport, runEvaluationSuite } from "../core/evaluation-suite.js";
import { initEvalDataset, renderAgentQaReport, runEvalDataset, runGoldenChecks, runRegression } from "../core/agent-qa.js";

export function registerEvalCommand(program: Command): void {
  const evalCommand = program.command("eval").description("Run deterministic local SotuRail evaluation fixtures.");

  evalCommand.command("list").description("List local evaluation cases.").option("--suite <suite>", "v0.6.1 or brain", "v0.6.1").action((options: { suite: "v0.6.1" | "brain" }) => {
    process.stdout.write(listEvaluationCases({ suite: parseSuite(options.suite) }));
  });

  evalCommand.command("run").description("Run a local evaluation suite and write JSON/Markdown reports.").option("--suite <suite>", "v0.6.1 or brain", "v0.6.1").action(async (options: { suite: "v0.6.1" | "brain" }) => {
    const result = await runEvaluationSuite(process.cwd(), { suite: parseSuite(options.suite) });
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

  const dataset = evalCommand.command("dataset").description("Manage deterministic local Agent QA datasets.");
  dataset.command("init").action(async () => {
    process.stdout.write(`Eval dataset initialized: ${path.normalize(path.relative(process.cwd(), await initEvalDataset()))}\n`);
  });
  dataset.command("run").action(async () => {
    process.stdout.write(renderAgentQaReport(await runEvalDataset()));
  });

  evalCommand.command("golden").description("Run deterministic golden checks for agent-facing artifacts.").action(async () => {
    process.stdout.write(renderAgentQaReport(await runGoldenChecks()));
  });

  evalCommand.command("regression").description("Compare current deterministic golden checks with the local baseline.").action(async () => {
    process.stdout.write(renderAgentQaReport(await runRegression()));
  });
}

function parseSuite(value: string): "v0.6.1" | "brain" {
  if (value === "v0.6.1" || value === "brain") return value;
  throw new Error(`Unknown eval suite "${value}". Supported: v0.6.1, brain.`);
}
