import { createHash, randomUUID } from "node:crypto";
import type { WorkspaceFingerprint } from "./workspace-fingerprint.js";

export type ContextClassification = "LOSSLESS_ONLY" | "COMPRESSIBLE" | "SEMANTIC_OPTIONAL";

export interface ContextArtifactItem {
  id: string;
  content: string;
  priority: number;
  classification: ContextClassification;
}

export interface SharedContextArtifact {
  schemaVersion: "soturail.context-artifact.v1";
  id: string;
  workspaceFingerprint: string;
  createdAt: string;
  budget: { maxBytes: number; maxTokens: number; usedBytes: number; estimatedTokens: number; hardLimitRespected: boolean };
  selected: Array<{ id: string; bytes: number; classification: ContextClassification; truncated: boolean }>;
  omitted: Array<{ id: string; reason: string }>;
  payload: string;
  digest: string;
}

export function createSharedContextArtifact(items: ContextArtifactItem[], workspace: WorkspaceFingerprint, budget: { maxBytes: number; maxTokens: number }): SharedContextArtifact {
  const byteLimit = Math.min(budget.maxBytes, budget.maxTokens * 4);
  const selected: SharedContextArtifact["selected"] = [];
  const omitted: SharedContextArtifact["omitted"] = [];
  const parts: Array<{ index: number; content: string }> = [];
  let usedBytes = 0;
  const prioritized = items.map((item, index) => ({ item, index })).sort((left, right) => right.item.priority - left.item.priority || left.item.id.localeCompare(right.item.id));
  for (const { item, index } of prioritized) {
    const separator = parts.length ? "\n\n" : "";
    const fullBytes = Buffer.byteLength(separator + item.content);
    const remaining = byteLimit - usedBytes;
    if (fullBytes <= remaining) {
      parts.push({ index, content: item.content });
      usedBytes += fullBytes;
      selected.push({ id: item.id, bytes: fullBytes, classification: item.classification, truncated: false });
      continue;
    }
    if (item.classification === "COMPRESSIBLE" && remaining > Buffer.byteLength(separator) + 64) {
      const contentBudget = remaining - Buffer.byteLength(separator);
      const truncated = truncateUtf8(item.content, contentBudget);
      parts.push({ index, content: truncated });
      const bytes = Buffer.byteLength(separator + truncated);
      usedBytes += bytes;
      selected.push({ id: item.id, bytes, classification: item.classification, truncated: true });
    } else {
      omitted.push({ id: item.id, reason: `${item.classification} item exceeds remaining hard budget.` });
    }
  }
  const payload = parts.sort((left, right) => left.index - right.index).map((part) => part.content).join("\n\n");
  return {
    schemaVersion: "soturail.context-artifact.v1",
    id: `ctx-${randomUUID()}`,
    workspaceFingerprint: workspace.fingerprint,
    createdAt: new Date().toISOString(),
    budget: { maxBytes: budget.maxBytes, maxTokens: budget.maxTokens, usedBytes: Buffer.byteLength(payload), estimatedTokens: Math.ceil(payload.length / 4), hardLimitRespected: Buffer.byteLength(payload) <= byteLimit },
    selected,
    omitted,
    payload,
    digest: createHash("sha256").update(payload).digest("hex")
  };
}

function truncateUtf8(value: string, maxBytes: number): string {
  const suffix = "\n[TRUNCATED: hard context budget reached]";
  const suffixBytes = Buffer.byteLength(suffix);
  if (maxBytes <= suffixBytes) return suffix.slice(0, maxBytes);
  let output = value;
  while (Buffer.byteLength(output) > maxBytes - suffixBytes) output = output.slice(0, Math.max(0, output.length - Math.ceil((Buffer.byteLength(output) - maxBytes + suffixBytes) / 2)));
  while (Buffer.byteLength(output + suffix) > maxBytes) output = output.slice(0, -1);
  return output + suffix;
}
