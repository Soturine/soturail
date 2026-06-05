import type { Command } from "commander";
import {
  buildReport,
  exportReport,
  reportAgent,
  reportDiff,
  reportDoctor,
  reportGithubSummary,
  reportLatest,
  reportOpen,
  reportRedact,
  type ReportAgent,
  type ReportFormat
} from "../core/report-rail.js";

export function registerReportCommand(program: Command): void {
  const report = program.command("report").description("Build local SotuRail reports for humans, CI and agents.");

  report.command("build").description("Aggregate local evidence into JSON, Markdown and HTML reports.").action(async () => {
    process.stdout.write((await buildReport()).output);
  });

  report.command("latest").description("Print the latest report summary and paths.").action(async () => {
    process.stdout.write(await reportLatest());
  });

  report.command("open").description("Print the local HTML report path.").action(async () => {
    process.stdout.write(await reportOpen());
  });

  report.command("export").description("Export latest report in a specific format.").requiredOption("--format <format>", "html, md, or json").action(async (options: { format: string }) => {
    const format = parseFormat(options.format);
    process.stdout.write((await exportReport(process.cwd(), format)).output);
  });

  report.command("doctor").description("Check report presence, evidence paths and safety.").action(async () => {
    process.stdout.write((await reportDoctor()).output);
  });

  report.command("redact").description("Write redacted copies of latest report artifacts.").action(async () => {
    process.stdout.write(await reportRedact());
  });

  report.command("github-summary").description("Write a GitHub Actions step summary artifact.").action(async () => {
    process.stdout.write(await reportGithubSummary());
  });

  report.command("agent").description("Write an agent-readable report.").requiredOption("--agent <agent>", "codex, claude, gemini, gemini-legacy, cursor, opencode, antigravity, deepagents, deepagents-js, amp, kiro, or generic").action(async (options: { agent: string }) => {
    process.stdout.write(await reportAgent(process.cwd(), parseAgent(options.agent)));
  });

  report.command("diff").description("Compare latest report with previous report history.").action(async () => {
    process.stdout.write(await reportDiff());
  });
}

function parseFormat(value: string): ReportFormat {
  if (value === "html" || value === "md" || value === "json") return value;
  throw new Error("Supported report formats: html, md, json.");
}

function parseAgent(value: string): ReportAgent {
  if (
    value === "codex"
    || value === "claude"
    || value === "gemini"
    || value === "gemini-legacy"
    || value === "cursor"
    || value === "opencode"
    || value === "antigravity"
    || value === "deepagents"
    || value === "deepagents-js"
    || value === "generic"
    || value === "amp"
    || value === "kiro"
  ) return value;
  throw new Error("Supported report agents: codex, claude, gemini, gemini-legacy, cursor, opencode, antigravity, deepagents, deepagents-js, amp, kiro, generic.");
}
