import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { ensureWorkspace, getWorkspacePaths, readJsonl, relativeToRoot } from "./config.js";
import type { HarnessFailureRecord } from "./harness-rail.js";
import type { PolicyDecision } from "./policy-rail.js";
import type { RawRunRecord } from "./raw-store.js";
import { readBrainCounts } from "./project-brain.js";
import { detectNativeEngine } from "./native-engine.js";
import { makeRailId } from "./rail-utils.js";
import { readWorkflow } from "./workflow-store.js";
import { SOTURAIL_VERSION } from "./version.js";

const execFileAsync = promisify(execFile);

export async function buildWorkflowEvidence(id: string, root = process.cwd()): Promise<{ path: string; content: string }> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const workflow = await readWorkflow(id, root);
  const workflowDir = path.join(paths.workflowsDir, id);
  const rawRecords = await readJsonl<RawRunRecord>(paths.rawIndex);
  const policy = await readJsonl<PolicyDecision>(paths.policyDecisionsFile);
  const failures = await readJsonl<HarnessFailureRecord>(paths.harnessFailuresFile);
  const changedFiles = await gitChangedFiles(root);
  const harnessContractPath = path.join(paths.harnessContractsDir, "default.json");
  const harnessContractPresent = await exists(harnessContractPath);
  const reviewPath = path.join(workflowDir, "review.md");
  const reviewJsonPath = path.join(workflowDir, "review.json");
  const verifyPath = path.join(workflowDir, "verify.md");
  const verifyJsonPath = path.join(workflowDir, "verify.json");
  const evalReportPath = path.join(paths.workspace, "eval", "latest.md");
  const diagramValidationPath = path.join(paths.diagramsDir, "validation.json");
  const offloadIds = await listOffloadIds(paths.contextOffloadDir);
  const packageVersion = await readPackageVersion(root);
  const brainCounts = await readBrainCounts(root).catch(() => null);
  const native = await detectNativeEngine(root).catch(() => null);
  const benchJsonPath = path.join(paths.workspace, "bench", "latest.json");
  const benchMdPath = path.join(paths.workspace, "bench", "latest.md");
  const nativeCandidatePath = path.join(paths.workspace, "native", "candidates.json");
  const baselinePath = path.join(paths.workspace, "baselines", "latest.json");
  const statusJsonPath = path.join(paths.workspace, "status", "latest.json");
  const reportJsonPath = path.join(paths.reportsDir, "latest.json");
  const reportHtmlPath = path.join(paths.reportsDir, "latest.html");
  const dashboardIndexPath = path.join(paths.workspace, "dashboard", "index.html");
  const observabilityTimelinePath = path.join(paths.workspace, "observability", "timeline.json");
  const mcpReportResourcesPath = path.join(paths.workspace, "mcp", "report-resources.json");
  const releaseNotesPath = packageVersion ? path.join(root, "docs", "releases", `RELEASE_NOTES_v${packageVersion}.md`) : "";
  const reportId = makeRailId("evidence", id);
  const reportPath = path.join(paths.reportsDir, `${reportId}.md`);
  const content = [
    `# SotuRail Evidence Pack: ${workflow.title}`,
    "",
    "schemaVersion: soturail.evidence.v1",
    `createdAt: ${new Date().toISOString()}`,
    "",
    "## Workflow",
    "",
    `- workflow_id: ${workflow.id}`,
    `- state: ${workflow.state}`,
    `- plan: ${relativeToRoot(root, path.join(workflowDir, "plan.md"))}`,
    `- tasks: ${relativeToRoot(root, path.join(workflowDir, "tasks.md"))}`,
    `- verification: ${relativeToRoot(root, path.join(workflowDir, "verification.md"))}`,
    `- review_report: ${await exists(reviewPath) ? relativeToRoot(root, reviewPath) : "missing"}`,
    `- review_json: ${await exists(reviewJsonPath) ? relativeToRoot(root, reviewJsonPath) : "missing"}`,
    `- verify_report: ${await exists(verifyPath) ? relativeToRoot(root, verifyPath) : "missing"}`,
    `- verify_json: ${await exists(verifyJsonPath) ? relativeToRoot(root, verifyJsonPath) : "missing"}`,
    "",
    "## Context And Role Packs",
    "",
    `- context_dir: ${relativeToRoot(root, paths.contextDir)}`,
    `- role_packs: ${relativeToRoot(root, paths.contextRolePacksDir)}`,
    "",
    "## Commands And Raw IDs",
    "",
    ...(rawRecords.length > 0 ? rawRecords.slice(-10).map((record) => `- ${record.raw_id}: ${record.command} (exit ${record.exit_code})`) : ["- none recorded"]),
    "",
    "## Offload IDs",
    "",
    ...(offloadIds.length > 0 ? offloadIds.map((offload) => `- ${offload}`) : ["- none recorded"]),
    "",
    "## Policy Decisions",
    "",
    ...(policy.length > 0 ? policy.slice(-10).map((decision) => `- ${decision.id}: ${decision.decision} ${decision.category}`) : ["- none recorded"]),
    "",
    "## Harness Failures",
    "",
    ...(failures.length > 0 ? failures.slice(-10).map((failure) => `- ${failure.id}: ${failure.whatFailed}`) : ["- none recorded"]),
    "",
    "## Filesystem Evidence",
    "",
    "### Changed Files",
    "",
    ...(changedFiles.length > 0 ? changedFiles.map((file) => `- ${file}`) : ["- none detected"]),
    "",
    `- snapshots: ${relativeToRoot(root, paths.fsSnapshotsDir)}`,
    "- Run `soturail fs diff` for current git diff evidence.",
    "",
    "## Harness Contract",
    "",
    `- contract: ${harnessContractPresent ? relativeToRoot(root, harnessContractPath) : "none found"}`,
    "- result: run `soturail harness contract check` for current validation status.",
    "",
    "## Diagram And Evaluation Evidence",
    "",
    `- diagram_validation: ${await exists(diagramValidationPath) ? relativeToRoot(root, diagramValidationPath) : "missing"}`,
    `- eval_report: ${await exists(evalReportPath) ? relativeToRoot(root, evalReportPath) : "missing"}`,
    "",
    "## Project Brain Evidence",
    "",
    `- brain_profile: ${await exists(paths.brainProjectProfileFile) ? relativeToRoot(root, paths.brainProjectProfileFile) : "missing"}`,
    `- brain_claims: ${brainCounts?.claims ?? 0}`,
    `- brain_gaps: ${brainCounts?.gaps ?? 0}`,
    `- brain_stale_events: ${brainCounts?.staleEvents ?? 0}`,
    `- brain_suspect_or_stale: ${brainCounts?.suspectOrStale ?? 0}`,
    `- brain_doctor: ${await exists(paths.brainDoctorFile) ? relativeToRoot(root, paths.brainDoctorFile) : "missing"}`,
    "",
    "## Performance Evidence",
    "",
    `- latest_benchmark_json: ${await exists(benchJsonPath) ? relativeToRoot(root, benchJsonPath) : "missing"}`,
    `- latest_benchmark_report: ${await exists(benchMdPath) ? relativeToRoot(root, benchMdPath) : "missing"}`,
    `- native_candidate_report: ${await exists(nativeCandidatePath) ? relativeToRoot(root, nativeCandidatePath) : "missing"}`,
    `- baseline_report: ${await exists(baselinePath) ? relativeToRoot(root, baselinePath) : "missing"}`,
    `- engine_status: typescript fallback OK; native_available=${native?.available ?? false}`,
    "- performance_warnings: no native speedup claimed without a local benchmark report.",
    "",
    "## Local Report And Observability Evidence",
    "",
    `- status_json: ${await exists(statusJsonPath) ? relativeToRoot(root, statusJsonPath) : "missing"}`,
    `- report_json: ${await exists(reportJsonPath) ? relativeToRoot(root, reportJsonPath) : "missing"}`,
    `- report_html: ${await exists(reportHtmlPath) ? relativeToRoot(root, reportHtmlPath) : "missing"}`,
    `- dashboard_html: ${await exists(dashboardIndexPath) ? relativeToRoot(root, dashboardIndexPath) : "missing"}`,
    `- observability_timeline: ${await exists(observabilityTimelinePath) ? relativeToRoot(root, observabilityTimelinePath) : "missing"}`,
    `- mcp_report_resources: ${await exists(mcpReportResourcesPath) ? relativeToRoot(root, mcpReportResourcesPath) : "missing"}`,
    "- report_policy: local artifacts only; no cloud telemetry upload; static dashboard by default.",
    "",
    "## Release Evidence",
    "",
    `- package_version: ${packageVersion ?? "unknown"}`,
    `- cli_version: ${SOTURAIL_VERSION}`,
    `- changelog_entry: ${packageVersion ? `## [${packageVersion}]` : "unknown"}`,
    `- release_notes: ${releaseNotesPath && await exists(releaseNotesPath) ? relativeToRoot(root, releaseNotesPath) : "missing"}`,
    "- npm_tarball_check: run `soturail release verify-package` or `npm run release:check`.",
    `- github_tag_recommendation: ${packageVersion ? `v${packageVersion}` : "unknown"}`,
    "- npm_publish_checklist: build, test, release check, GitHub release notes, npm publish.",
    "- ci_status_note: check GitHub Actions for the pushed commit/tag.",
    "",
    "## Recovery",
    "",
    "- Raw logs: `soturail expand <raw_id>`",
    "- Offloads: `soturail context restore <offload-id>`",
    "- Policy: `soturail policy queue`",
    ""
  ].join("\n");
  await fs.writeFile(reportPath, content, "utf8");
  return { path: reportPath, content };
}

async function listOffloadIds(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir).catch(() => []);
  return entries.filter((entry) => entry.endsWith(".json")).map((entry) => entry.replace(/\.json$/, "")).sort();
}

async function readPackageVersion(root: string): Promise<string | null> {
  const raw = await fs.readFile(path.join(root, "package.json"), "utf8").catch(() => "");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? null;
  } catch {
    return null;
  }
}

async function gitChangedFiles(root: string): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync("git", ["diff", "--name-only", "--", "."], { cwd: root, timeout: 3000, windowsHide: true });
    return stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function exists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}
