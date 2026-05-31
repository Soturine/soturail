import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { baselineSnapshot } from "../src/core/baseline-snapshot.js";
import { buildDashboard, dashboardDoctor } from "../src/core/dashboard-rail.js";
import { writeReportResourceManifest } from "../src/core/mcp-resources.js";
import { writeNativeCandidateReport } from "../src/core/native-candidates.js";
import { collectObservability, observabilityExport, observabilitySummary, observabilityTimeline } from "../src/core/observability-rail.js";
import { buildReport, exportReport, reportAgent, reportDiff, reportDoctor, reportGithubSummary, reportLatest, reportRedact } from "../src/core/report-rail.js";
import { buildStatus } from "../src/core/status-model.js";
import { runBenchmarkRail } from "../src/core/benchmark-rail.js";
import { SOTURAIL_VERSION } from "../src/core/version.js";

async function tempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v0100-"));
  await mkdir(path.join(root, ".git"), { recursive: true });
  await mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await mkdir(path.join(root, "dist"), { recursive: true });
  await mkdir(path.join(root, "docs", "releases"), { recursive: true });
  await mkdir(path.join(root, "src", "core"), { recursive: true });
  await writeFile(path.join(root, "README.md"), "# Report Fixture\n\nSotuRail local reports fixture.\n", "utf8");
  await writeFile(path.join(root, "CHANGELOG.md"), `## [${SOTURAIL_VERSION}]\n\n- Report rail fixture.\n`, "utf8");
  await writeFile(path.join(root, "LICENSE"), "MIT\n", "utf8");
  await writeFile(path.join(root, ".github", "workflows", "ci.yml"), "name: ci\n", "utf8");
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail-report-fixture", version: SOTURAIL_VERSION, bin: { soturail: "dist/cli.js" }, files: ["dist", "README.md", "LICENSE", "docs"] }, null, 2), "utf8");
  await writeFile(path.join(root, "package-lock.json"), JSON.stringify({ name: "soturail-report-fixture", version: SOTURAIL_VERSION, lockfileVersion: 3, packages: { "": { name: "soturail-report-fixture", version: SOTURAIL_VERSION } } }, null, 2), "utf8");
  await writeFile(path.join(root, "dist", "cli.js"), `if (process.argv.includes('--version')) console.log('${SOTURAIL_VERSION}');\n`, "utf8");
  await writeFile(path.join(root, "src", "core", "version.ts"), `export const SOTURAIL_VERSION = "${SOTURAIL_VERSION}";\n`, "utf8");
  await writeFile(path.join(root, "docs", "releases", `RELEASE_NOTES_v${SOTURAIL_VERSION}.md`), "# Notes\n", "utf8");
  return root;
}

describe("v0.10.0 local reports observability and dashboard rail", () => {
  it("writes unified status artifacts for JSON Markdown and agent readers", async () => {
    const root = await tempProject();
    const result = await buildStatus(root);
    const json = JSON.parse(await readFile(result.paths.json, "utf8")) as typeof result.status;
    const markdown = await readFile(result.paths.markdown, "utf8");
    const agent = await readFile(result.paths.agent, "utf8");

    expect(json.schemaVersion).toBe("soturail.status.v1");
    expect(json.release.packageVersion).toBe(SOTURAIL_VERSION);
    expect(markdown).toContain("SotuRail Status");
    expect(agent).toContain("Current Project Status");
    expect(agent).toContain("Do Not Do");
  });

  it("builds reports exports latest summaries agent reports and GitHub summaries", async () => {
    const root = await tempProject();
    await runBenchmarkRail(root, "brain");
    await writeNativeCandidateReport(root);
    await baselineSnapshot(root, "check");

    const built = await buildReport(root);
    const latest = await reportLatest(root);
    const htmlExport = await exportReport(root, "html");
    const mdExport = await exportReport(root, "md");
    const jsonExport = await exportReport(root, "json");
    const doctor = await reportDoctor(root);
    const githubSummary = await reportGithubSummary(root);
    const agent = await reportAgent(root, "codex");
    const diff = await reportDiff(root);

    expect(built.report.schemaVersion).toBe("soturail.report.v1");
    expect(built.report.sections.some((section) => section.id === "brain-health")).toBe(true);
    expect(latest).toContain("SotuRail report latest");
    expect(htmlExport.path.endsWith("export.html")).toBe(true);
    expect(mdExport.path.endsWith("export.md")).toBe(true);
    expect(jsonExport.path.endsWith("export.json")).toBe(true);
    expect(doctor.output).toContain("safety_ok:");
    expect(githubSummary).toContain("github-step-summary.md");
    expect(agent).toContain("agent-codex.md");
    expect(diff).toContain("SotuRail report diff");
  });

  it("redacts obvious fake secrets from report copies", async () => {
    const root = await tempProject();
    await buildReport(root);
    const reportsDir = path.join(root, ".soturail", "reports");
    await writeFile(path.join(reportsDir, "latest.md"), "token=ghp_abcdefghijklmnopqrstuvwxyz123456\nAuthorization: Bearer fakefakefakefakefakefakefakefake\n", "utf8");
    await writeFile(path.join(reportsDir, "latest.json"), JSON.stringify({ token: "npm_abcdefghijklmnopqrstuvwxyz123456" }), "utf8");

    const output = await reportRedact(root);
    const redacted = await readFile(path.join(reportsDir, "latest.redacted.md"), "utf8");
    const safety = await readFile(path.join(reportsDir, "safety.json"), "utf8");

    expect(output).toContain("findings:");
    expect(redacted).toContain("[REDACTED");
    expect(redacted).not.toContain("ghp_abcdefghijklmnopqrstuvwxyz123456");
    expect(safety).toContain("soturail.report-safety.v1");
  });

  it("builds a static local dashboard and rejects external network references", async () => {
    const root = await tempProject();
    const dashboard = await buildDashboard(root);
    const okDoctor = await dashboardDoctor(root);
    await writeFile(dashboard.index, "<script src=\"https://cdn.example.invalid/app.js\"></script>", "utf8");
    const badDoctor = await dashboardDoctor(root);

    expect(dashboard.output).toContain("server_required: false");
    expect(okDoctor).toContain("ok: true");
    expect(badDoctor).toContain("external_network_refs: true");
  });

  it("collects observability events and exports local summaries", async () => {
    const root = await tempProject();
    await runBenchmarkRail(root, "brain");
    await writeNativeCandidateReport(root);
    await baselineSnapshot(root, "check");
    await buildReport(root);

    const collect = await collectObservability(root);
    const summary = await observabilitySummary(root);
    const timeline = await observabilityTimeline(root);
    const exported = await observabilityExport(root);

    expect(collect.events.length).toBeGreaterThan(0);
    expect(summary).toContain("SotuRail Observability Summary");
    expect(timeline).toContain("soturail.obs.timeline.v1");
    expect(exported).toContain("SotuRail obs export");
    expect(await readFile(path.join(root, ".soturail", "observability", "events.jsonl"), "utf8")).toContain("soturail.obs.event.v1");
  });

  it("writes read-only MCP report resource manifest", async () => {
    const root = await tempProject();
    const manifest = await writeReportResourceManifest(root);
    const raw = await readFile(manifest.path, "utf8");

    expect(manifest.output).toContain("report-resources.json");
    expect(raw).toContain("soturail.mcp.report-resources.v1");
    expect(raw).toContain("soturail://reports/latest");
    expect(raw).toContain("\"mutationAllowed\": false");
  });
});
