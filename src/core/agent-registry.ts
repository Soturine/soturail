import type { AgentId, AgentProfile } from "./agent-profile.js";

export const agentProfiles: AgentProfile[] = [
  {
    id: "claude",
    display_name: "Claude",
    integration_modes: ["prompt-only", "mcp", "safe-hooks"],
    default_mode: "prompt-only",
    risk_level: "medium",
    supports_mcp: true,
    supports_project_rules: true,
    supports_hooks: true,
    safe_by_default: true,
    notes: ["Safe-hooks exports are conservative templates; review against your Claude Code version before enabling."]
  },
  {
    id: "codex",
    display_name: "Codex",
    integration_modes: ["prompt-only"],
    default_mode: "prompt-only",
    risk_level: "low",
    supports_mcp: false,
    supports_project_rules: true,
    supports_hooks: false,
    safe_by_default: true,
    notes: ["Use AGENTS.md and context packs for repository-local guidance."]
  },
  {
    id: "gemini",
    display_name: "Gemini",
    integration_modes: ["prompt-only"],
    default_mode: "prompt-only",
    risk_level: "low",
    supports_mcp: false,
    supports_project_rules: true,
    supports_hooks: false,
    safe_by_default: true,
    notes: ["Use GEMINI.md and context packs for portable guidance."]
  },
  {
    id: "cursor",
    display_name: "Cursor",
    integration_modes: ["prompt-only", "rules"],
    default_mode: "prompt-only",
    risk_level: "low",
    supports_mcp: true,
    supports_project_rules: true,
    supports_hooks: false,
    safe_by_default: true,
    notes: ["Cursor rules are exported as reviewed project files, not silently installed globally."]
  },
  {
    id: "antigravity",
    display_name: "Antigravity",
    integration_modes: ["prompt-only"],
    default_mode: "prompt-only",
    risk_level: "low",
    supports_mcp: false,
    supports_project_rules: true,
    supports_hooks: false,
    safe_by_default: true,
    notes: ["Prompt-only/context-pack support only until a stable local config format is documented."]
  },
  {
    id: "generic",
    display_name: "Generic Agent",
    integration_modes: ["prompt-only", "mcp"],
    default_mode: "prompt-only",
    risk_level: "low",
    supports_mcp: true,
    supports_project_rules: true,
    supports_hooks: false,
    safe_by_default: true,
    notes: ["Portable Markdown export for agents without a stable project config format."]
  }
];

export function listAgentProfiles(): AgentProfile[] {
  return [...agentProfiles];
}

export function parseAgentId(value: string): AgentId | "all" {
  if (value === "all") return "all";
  const found = agentProfiles.find((profile) => profile.id === value);
  if (!found) throw new Error(`Unknown agent "${value}". Supported agents: ${agentProfiles.map((profile) => profile.id).join(", ")}, all.`);
  return found.id;
}

export function getAgentProfile(id: AgentId): AgentProfile {
  const profile = agentProfiles.find((item) => item.id === id);
  if (!profile) throw new Error(`Unknown agent "${id}".`);
  return profile;
}

export function formatAgentList(): string {
  return [
    "SotuRail agents",
    `agents_count: ${agentProfiles.length}`,
    "",
    ...agentProfiles.flatMap((profile) => [
      `- ${profile.id} [${profile.risk_level}]`,
      `  Name: ${profile.display_name}`,
      `  Modes: ${profile.integration_modes.join(", ")}`,
      `  Default: ${profile.default_mode}`,
      `  MCP: ${profile.supports_mcp ? "yes" : "no"}`,
      `  Hooks: ${profile.supports_hooks ? "yes" : "no"}`,
      `  Safe by default: ${profile.safe_by_default ? "yes" : "no"}`,
      ""
    ])
  ].join("\n").trimEnd() + "\n";
}
