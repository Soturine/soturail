import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { appendJsonl, getWorkspacePaths, readJsonl, relativeToRoot, writeJson } from "./config.js";
import { makeRailId } from "./rail-utils.js";

export type ObservabilitySeverity = "info" | "warning" | "error";

export interface ObservabilityEvent {
  schemaVersion: "soturail.obs.event.v1";
  id: string;
  createdAt: string;
  type: string;
  source: "soturail";
  severity: ObservabilitySeverity;
  summary: string;
  evidencePath: string;
  tags: string[];
}

export async function collectObservability(root = process.cwd()): Promise<{ events: ObservabilityEvent[]; output: string }> {
  const paths = obsPaths(root);
  await fs.mkdir(paths.dir, { recursive: true });
  const now = new Date().toISOString();
  const candidates = [
    event(root, now, "eval_report", ".soturail/eval/latest.json", "Latest eval report collected.", ["eval"]),
    event(root, now, "bench_report", ".soturail/bench/latest.json", "Latest benchmark report collected.", ["bench", "performance"]),
    event(root, now, "native_candidates", ".soturail/native/candidates.json", "Native candidate report collected.", ["native"]),
    event(root, now, "baseline_report", ".soturail/baselines/latest.json", "Baseline snapshot report collected.", ["baseline"]),
    event(root, now, "brain_doctor", ".soturail/brain/doctor.json", "Brain doctor report collected.", ["brain"]),
    event(root, now, "release_report", ".soturail/reports/latest.json", "Local report collected.", ["report"]),
    event(root, now, "status_report", ".soturail/status/latest.json", "Unified status collected.", ["status"])
  ].filter((item) => existsSync(path.join(root, item.evidencePath)));
  for (const item of candidates) await appendJsonl(paths.events, item);
  await writeTimeline(root);
  return {
    events: candidates,
    output: [
      "SotuRail obs collect",
      `events_written: ${candidates.length}`,
      `events: ${relativeToRoot(root, paths.events)}`,
      `timeline: ${relativeToRoot(root, paths.timeline)}`,
      `summary: ${relativeToRoot(root, paths.summary)}`
    ].join("\n") + "\n"
  };
}

export async function observabilitySummary(root = process.cwd()): Promise<string> {
  const paths = obsPaths(root);
  if (!existsSync(paths.summary)) await writeTimeline(root);
  return fs.readFile(paths.summary, "utf8").catch(() => "No observability summary found. Run: soturail obs collect\n");
}

export async function observabilityTimeline(root = process.cwd()): Promise<string> {
  const paths = obsPaths(root);
  if (!existsSync(paths.timeline)) await writeTimeline(root);
  const raw = await fs.readFile(paths.timeline, "utf8").catch(() => "");
  return raw ? `${raw}\n` : "No observability timeline found. Run: soturail obs collect\n";
}

export async function observabilityExport(root = process.cwd()): Promise<string> {
  const paths = obsPaths(root);
  await writeTimeline(root);
  return [
    "SotuRail obs export",
    `events: ${relativeToRoot(root, paths.events)}`,
    `timeline: ${relativeToRoot(root, paths.timeline)}`,
    `summary: ${relativeToRoot(root, paths.summary)}`
  ].join("\n") + "\n";
}

async function writeTimeline(root: string): Promise<void> {
  const paths = obsPaths(root);
  const events = (await readJsonl<ObservabilityEvent>(paths.events).catch(() => [])).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const timeline = {
    schemaVersion: "soturail.obs.timeline.v1",
    createdAt: new Date().toISOString(),
    events
  };
  await fs.mkdir(paths.dir, { recursive: true });
  await writeJson(paths.timeline, timeline);
  const counts = new Map<string, number>();
  for (const item of events) counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
  const summary = [
    "# SotuRail Observability Summary",
    "",
    "Local events only. SotuRail does not collect private shell history or upload telemetry.",
    "",
    `events: ${events.length}`,
    "",
    "## Counts",
    "",
    ...[...counts.entries()].sort().map(([key, count]) => `- ${key}: ${count}`),
    "",
    "## Latest Events",
    "",
    ...events.slice(-10).map((item) => `- ${item.createdAt} [${item.severity}] ${item.type}: ${item.summary} (${item.evidencePath})`),
    ""
  ].join("\n");
  await fs.writeFile(paths.summary, summary, "utf8");
}

function event(root: string, now: string, type: string, evidencePath: string, summary: string, tags: string[]): ObservabilityEvent {
  return {
    schemaVersion: "soturail.obs.event.v1",
    id: makeRailId("obs", `${type}:${evidencePath}:${now}`),
    createdAt: now,
    type,
    source: "soturail",
    severity: existsSync(path.join(root, evidencePath)) ? "info" : "warning",
    summary,
    evidencePath,
    tags
  };
}

function obsPaths(root: string): { dir: string; events: string; timeline: string; summary: string } {
  const dir = path.join(getWorkspacePaths(root).workspace, "observability");
  return {
    dir,
    events: path.join(dir, "events.jsonl"),
    timeline: path.join(dir, "timeline.json"),
    summary: path.join(dir, "summary.md")
  };
}
