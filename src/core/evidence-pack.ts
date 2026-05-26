import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths, readJsonl, relativeToRoot } from "./config.js";
import type { HarnessFailureRecord } from "./harness-rail.js";
import type { PolicyDecision } from "./policy-rail.js";
import type { RawRunRecord } from "./raw-store.js";
import { makeRailId } from "./rail-utils.js";
import { readWorkflow } from "./workflow-store.js";

export async function buildWorkflowEvidence(id: string, root = process.cwd()): Promise<{ path: string; content: string }> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const workflow = await readWorkflow(id, root);
  const workflowDir = path.join(paths.workflowsDir, id);
  const rawRecords = await readJsonl<RawRunRecord>(paths.rawIndex);
  const policy = await readJsonl<PolicyDecision>(paths.policyDecisionsFile);
  const failures = await readJsonl<HarnessFailureRecord>(paths.harnessFailuresFile);
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
    `- snapshots: ${relativeToRoot(root, paths.fsSnapshotsDir)}`,
    "- Run `soturail fs diff` for current git diff evidence.",
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
