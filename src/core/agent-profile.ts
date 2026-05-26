export type AgentId =
  | "claude"
  | "codex"
  | "gemini"
  | "cursor"
  | "antigravity"
  | "generic"
  | "opencode"
  | "amp"
  | "kiro"
  | "deepagents"
  | "deepagents-js";

export type AgentMode = "prompt-only" | "mcp" | "safe-hooks" | "rules";

export interface AgentProfile {
  id: AgentId;
  display_name: string;
  integration_modes: AgentMode[];
  default_mode: AgentMode;
  risk_level: "low" | "medium" | "high";
  supports_mcp: boolean;
  supports_project_rules: boolean;
  supports_hooks: boolean;
  safe_by_default: boolean;
  notes: string[];
}

export interface AgentExportFile {
  relativePath: string;
  content: string;
}

export interface AgentInstallOptions {
  dryRun?: boolean;
  yes?: boolean;
  backup?: boolean;
  output?: string;
  mode?: string;
}
