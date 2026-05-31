import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getWorkspacePaths, relativeToRoot, writeJson } from "./config.js";
import { buildReport, readLatestReport, renderReportHtml, type SotuRailReport } from "./report-rail.js";
import { buildStatus, type SotuRailStatus } from "./status-model.js";

export async function buildDashboard(root = process.cwd()): Promise<{ output: string; index: string }> {
  const paths = getWorkspacePaths(root);
  const dashboardDir = path.join(paths.workspace, "dashboard");
  const dataDir = path.join(dashboardDir, "data");
  const assetsDir = path.join(dashboardDir, "assets");
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(assetsDir, { recursive: true });
  const report = await readLatestReport(root) ?? (await buildReport(root)).report;
  const status = (await buildStatus(root)).status;
  await writeJson(path.join(dataDir, "report.json"), report);
  await writeJson(path.join(dataDir, "status.json"), status);
  await fs.writeFile(path.join(assetsDir, "README.txt"), "Static local SotuRail dashboard assets. No external CDN or telemetry.\n", "utf8");
  const index = path.join(dashboardDir, "index.html");
  await fs.writeFile(index, dashboardHtml(report, status), "utf8");
  return {
    index,
    output: [
      "SotuRail dashboard build",
      `index: ${relativeToRoot(root, index)}`,
      `report_data: ${relativeToRoot(root, path.join(dataDir, "report.json"))}`,
      `status_data: ${relativeToRoot(root, path.join(dataDir, "status.json"))}`,
      "server_required: false"
    ].join("\n") + "\n"
  };
}

export async function dashboardDoctor(root = process.cwd()): Promise<string> {
  const paths = getWorkspacePaths(root);
  const dashboardDir = path.join(paths.workspace, "dashboard");
  const index = path.join(dashboardDir, "index.html");
  const report = path.join(dashboardDir, "data", "report.json");
  const status = path.join(dashboardDir, "data", "status.json");
  const html = await fs.readFile(index, "utf8").catch(() => "");
  const external = /https?:\/\//i.test(html) || /<script\s+[^>]*src=/i.test(html) || /<link\s+[^>]*href=["']https?:\/\//i.test(html);
  const tooLarge = html.length > 250_000;
  const ok = existsSync(index) && existsSync(report) && existsSync(status) && !external && !tooLarge;
  return [
    "SotuRail dashboard doctor",
    `ok: ${ok}`,
    `index_html: ${existsSync(index) ? "present" : "missing"}`,
    `report_data: ${existsSync(report) ? "present" : "missing"}`,
    `status_data: ${existsSync(status) ? "present" : "missing"}`,
    `external_network_refs: ${external}`,
    `file_size_reasonable: ${!tooLarge}`,
    "server_required: false"
  ].join("\n") + "\n";
}

export async function dashboardOpen(root = process.cwd()): Promise<string> {
  const index = path.join(getWorkspacePaths(root).workspace, "dashboard", "index.html");
  return `Dashboard HTML: ${relativeToRoot(root, index)}\nOpen this local file in a browser if desired.\n`;
}

function dashboardHtml(report: SotuRailReport, status: SotuRailStatus): string {
  const html = renderReportHtml(report);
  const cards: Array<[string, string]> = [
    ["Project Status", `dirty=${status.project.dirty}`],
    ["Release Status", status.release.releaseCheck],
    ["Brain Health", `${status.brain.claims} claims, ${status.brain.suspect} suspect/stale`],
    ["Eval Summary", `${status.eval.passed} passed, ${status.eval.failed} failed`],
    ["Benchmark Summary", `${status.bench.cases} cases, ${status.bench.warnings} warnings`],
    ["Native Candidates", `${status.native.candidates} candidates, fallback=${status.native.fallback}`],
    ["Baseline Snapshot", `${status.baseline.signalsPassed} passed, ${status.baseline.signalsFailed} failed`],
    ["Workflow Evidence", status.workflow.latestEvidence ?? "missing"],
    ["Harness Failures", String(status.harness.failures)],
    ["Diagram Validation", status.diagram.validation],
    ["Agent Readiness", status.agents.readiness],
    ["Next Commands", status.nextCommands.join(" | ")]
  ];
  const body = cards.map(([title, value]) => `<section class="card"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(value)}</p></section>`).join("\n");
  return html.replace(/<main>[\s\S]*<\/main>/, `<main>${body}</main>`);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
