import { promises as fs } from "node:fs";
import path from "node:path";
import { listAgentProfiles } from "./agent-registry.js";
import { AGENT_POLICY_NOTES, getAgentCapability } from "./agent-runtime.js";

const agentDocs = ["CLAUDE.md", "AGENTS.md", "GEMINI.md", ".cursor/rules/soturail.md", ".cursor/rules"];

export async function lintAgentDocs(root = process.cwd()): Promise<string> {
  const findings: string[] = [];
  for (const file of agentDocs) {
    const absolute = path.resolve(root, file);
    const stat = await fs.stat(absolute).catch(() => null);
    if (!stat?.isFile()) continue;
    const raw = await fs.readFile(absolute, "utf8");
    if (raw.length > 8000) findings.push(`${file}: too long (${raw.length} chars); consider referenced context files.`);
    if (!/SotuRail|local-first|Context OS/i.test(raw)) findings.push(`${file}: missing project identity signal.`);
    if (!/safe|security|approval|raw log|secret/i.test(raw)) findings.push(`${file}: missing safety notes.`);
    if (/v0\.[0-3]\./.test(raw)) findings.push(`${file}: may contain stale version-specific instructions.`);
  }
  return [
    "SotuRail agent docs lint",
    `checked_docs: ${agentDocs.join(", ")}`,
    `findings_count: ${findings.length}`,
    "",
    ...(findings.length > 0 ? findings.map((finding) => `- ${finding}`) : ["No agent doc hygiene findings."]),
    "",
    "Suggestion: keep root agent docs short and move larger context into agent_docs/ or .soturail/context/."
  ].join("\n") + "\n";
}

export async function splitContextPlan(dryRun = true, root = process.cwd()): Promise<string> {
  const existing = [];
  for (const file of agentDocs) {
    const stat = await fs.stat(path.resolve(root, file)).catch(() => null);
    if (stat?.isFile()) existing.push(file);
  }
  return [
    "SotuRail agents split-context",
    `dry_run: ${dryRun}`,
    `root_agent_docs_found: ${existing.length}`,
    "",
    "Suggested moves:",
    "- Keep project identity, safety rules and handoff commands in root agent docs.",
    "- Move long examples to agent_docs/examples.md.",
    "- Move role-specific context to .soturail/context/role-packs/.",
    "- Move generated task context to .soturail/context/selections/.",
    dryRun ? "No files changed." : "v0.5.0 only supports --dry-run suggestions."
  ].join("\n") + "\n";
}

export function explainAgents(agent: string): string {
  const profiles = listAgentProfiles().filter((profile) => agent === "all" || profile.id === agent);
  if (profiles.length === 0) throw new Error(`Unknown agent "${agent}".`);
  return [
    "SotuRail agents explain",
    `agents_count: ${profiles.length}`,
    "",
    ...profiles.flatMap((profile) => [
      `- ${profile.id}`,
      `  Receives: prompt/context exports, context packs, and reviewed docs supported by ${profile.display_name}.`,
      `  MCP: ${profile.supports_mcp ? "supported as a boundary" : "prompt-only fallback"}`,
      `  Hooks: ${profile.supports_hooks ? "review-required safe hooks" : "not enabled by default"}`,
      `  Payloads: ${getAgentCapability(profile.id).recommendedPayloads.join(" + ")}`,
      `  Kept local: raw logs, policy decisions, filesystem snapshots, and unapproved memory.`,
      `  Policy: ${AGENT_POLICY_NOTES[0]}`,
      ""
    ])
  ].join("\n").trimEnd() + "\n";
}
