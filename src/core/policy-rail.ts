import { promises as fs } from "node:fs";
import path from "node:path";
import { appendJsonl, ensureWorkspace, getWorkspacePaths, readJsonl } from "./config.js";
import { makeRailId } from "./rail-utils.js";

export type PolicyRiskCategory =
  | "destructive shell command"
  | "raw log expansion"
  | "npm publish"
  | "GitHub release"
  | "global config write"
  | "MCP exposure change"
  | "secret-like content";

export interface PolicyQueueItem {
  schemaVersion: "soturail.policy.queue.v1";
  id: string;
  createdAt: string;
  category: PolicyRiskCategory;
  action: string;
  reason: string;
  evidence?: string;
  status: "pending";
}

export interface PolicyDecision {
  schemaVersion: "soturail.policy.decision.v1";
  id: string;
  queueId: string;
  createdAt: string;
  decision: "approved" | "rejected";
  category: PolicyRiskCategory;
  action: string;
}

export async function queuePolicyItem(
  category: PolicyRiskCategory,
  action: string,
  reason: string,
  evidence?: string,
  root = process.cwd()
): Promise<PolicyQueueItem> {
  await ensureWorkspace(root);
  const item: PolicyQueueItem = {
    schemaVersion: "soturail.policy.queue.v1",
    id: makeRailId("pol", `${category}:${action}`),
    createdAt: new Date().toISOString(),
    category,
    action,
    reason,
    status: "pending"
  };
  if (evidence) item.evidence = evidence;
  await appendJsonl(getWorkspacePaths(root).policyQueueFile, item);
  return item;
}

export async function listPolicyQueue(root = process.cwd()): Promise<PolicyQueueItem[]> {
  return readJsonl<PolicyQueueItem>(getWorkspacePaths(root).policyQueueFile);
}

export async function explainPolicyItem(id: string, root = process.cwd()): Promise<string> {
  const item = (await listPolicyQueue(root)).find((entry) => entry.id === id);
  if (!item) throw new Error(`Policy queue item not found: ${id}`);
  return [
    "SotuRail policy item",
    `id: ${item.id}`,
    `category: ${item.category}`,
    `action: ${item.action}`,
    `reason: ${item.reason}`,
    `evidence: ${item.evidence ?? "none"}`,
    "safer_alternative: use dry-run/export/review before enabling risky action"
  ].join("\n") + "\n";
}

export async function decidePolicyItem(id: string, decision: "approved" | "rejected", root = process.cwd()): Promise<PolicyDecision> {
  await ensureWorkspace(root);
  const item = (await listPolicyQueue(root)).find((entry) => entry.id === id);
  if (!item) throw new Error(`Policy queue item not found: ${id}`);
  const record: PolicyDecision = {
    schemaVersion: "soturail.policy.decision.v1",
    id: makeRailId(decision === "approved" ? "approve" : "reject", id),
    queueId: id,
    createdAt: new Date().toISOString(),
    decision,
    category: item.category,
    action: item.action
  };
  await appendJsonl(getWorkspacePaths(root).policyDecisionsFile, record);
  return record;
}

export async function policyDoctor(root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const queue = await listPolicyQueue(root);
  return [
    "SotuRail Policy Rail doctor",
    "raw_expansion_safety: redacted by default",
    "secrets_risk: probable secrets should be redacted before reports",
    "mcp_exposure_risk: arbitrary shell execution disabled by default",
    "release_publish_risk: requires explicit human action outside policy doctor",
    "destructive_command_policy: blocked by run safety policy unless explicitly confirmed",
    `pending_queue_items: ${queue.length}`
  ].join("\n") + "\n";
}

export async function validatePolicy(root = process.cwd()): Promise<string> {
  const paths = getWorkspacePaths(root);
  const queue = await readJsonl<PolicyQueueItem>(paths.policyQueueFile);
  const decisions = await readJsonl<PolicyDecision>(paths.policyDecisionsFile);
  const ok = queue.every((item) => item.schemaVersion === "soturail.policy.queue.v1" && item.status === "pending")
    && decisions.every((item) => item.schemaVersion === "soturail.policy.decision.v1");
  const docsPresent = await exists(path.join(root, "docs", "policy-rail.md"));
  return [
    "SotuRail policy validate",
    `valid: ${ok}`,
    `queue_items: ${queue.length}`,
    `decisions: ${decisions.length}`,
    `policy_docs: ${docsPresent ? "present" : "missing"}`
  ].join("\n") + "\n";
}

export function renderPolicyQueue(items: PolicyQueueItem[]): string {
  if (items.length === 0) return "No pending policy approvals.\n";
  return [
    "SotuRail policy queue",
    `pending_count: ${items.length}`,
    "",
    ...items.map((item) => `- ${item.id} [${item.category}] ${item.action}`)
  ].join("\n") + "\n";
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
