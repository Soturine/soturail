import type { AgentId } from "./agent-profile.js";

// Host Adapter Registry: every per-host fact SotuRail needs lives here as data.
// Core modules ask the adapter instead of branching on host names, and an
// unknown host resolves to the generic Agent Skills adapter.

export type HostContextTarget = "claude" | "codex" | "gemini" | "cursor" | "antigravity" | "generic";
export type HostBrainTarget = "claude" | "codex" | "gemini" | "cursor" | "generic";
export type HostMatrixStatus = "stable" | "experimental" | "planned" | "legacy" | "unknown" | "generic-compatible";

export interface SkillProjection {
  /** Project-relative directory the host loads Agent Skills from; null when no native loading is verified. */
  projectDir: string | null;
  verification: "verified-docs" | "generic-fallback";
  source?: string;
  verifiedOn?: string;
  limitations: string[];
}

export interface HostAdapter {
  id: AgentId;
  family: "claude" | "openai" | "cursor" | "gemini" | "google" | "langchain" | "generic";
  skills: SkillProjection;
  contextTarget: HostContextTarget;
  brainTarget: HostBrainTarget;
  reportTarget: AgentId;
  mcpConfig: "claude" | "cursor" | "generic";
  /** Wrap generated prompt sections in XML-like tags (Claude Code prompt boundaries). */
  xmlSections: boolean;
  hooks: "claude-code-settings" | null;
  setup: "install-dry-run" | "export";
  matrix: { label?: string; status?: HostMatrixStatus; priority: "high" | "normal" | "low"; reportSupport: "supported" | "prompt-only" };
  instructionFiles: string[];
  /** Compatibility-only host ID kept for SemVer; scheduled for removal. */
  deprecated?: { replacement: AgentId; removal: string; reason: string };
  contextFormats?: string[];
  reportFormats?: string[];
  notes: {
    export: string;
    report: string;
    reportSection?: { heading: string; text: string };
    brain?: string;
    exportCheck?: { pattern: RegExp; warning: string };
  };
}

const GENERIC_SKILLS: SkillProjection = {
  projectDir: ".agents/skills",
  verification: "generic-fallback",
  limitations: ["Native skill loading for this host is not verified; use the portable .agents/skills layout, MCP soturail.skills.list or AGENTS.md references."]
};

const VERIFIED_ON = "2026-10-04";
const DEFAULT_EXPORT_NOTE = "- Review generated files before copying them into a host-specific project location.";
const GENERIC_REPORT_NOTE = "This target uses a generic prompt/context handoff.";
const STABLE_REPORT_NOTE = "This host has stable or generic-stable local report handoff support in SotuRail v1.1.";
const GEMINI_EXPORT_NOTE = "- Gemini-compatible exports are prompt/context artifacts. Treat legacy/compatible hosts as prompt-only unless a host contract is verified.";
const GEMINI_REPORT_NOTE = "Gemini-compatible support uses prompt/context artifacts and legacy-compatible Markdown handoff.";
const GEMINI_SECTION = { heading: "Gemini Context", text: "Large-context readers can inspect the evidence paths above before acting. Legacy-compatible hosts remain prompt-only unless a host contract is verified." };
const DEEP_EXPORT_NOTE = "- DeepAgents exports are role-pack/context artifacts only. SotuRail does not run a Deep Agents runtime.";
const DEEP_REPORT_NOTE = "DeepAgents targets receive role-pack/context artifacts only; runtime execution is outside SotuRail.";
const DEEP_SECTION = { heading: "DeepAgents Notes", text: "Use this as role-pack/context evidence only. SotuRail does not run a Deep Agents runtime." };
const DEEP_CHECK = { pattern: /role pack|runtime boundary|does not run/i, warning: "DeepAgents export should make the role-pack-only boundary explicit." };
const DEEP_CONTEXT = ["Markdown role pack", "JSON runtime note", "context-pack.md"];
const DEEP_REPORTS = ["role-pack Markdown", "agent report Markdown"];

function adapter(input: Omit<HostAdapter, "skills" | "xmlSections" | "hooks" | "brainTarget" | "reportTarget" | "mcpConfig"> & Partial<Pick<HostAdapter, "skills" | "xmlSections" | "hooks" | "brainTarget" | "reportTarget" | "mcpConfig">>): HostAdapter {
  return { skills: GENERIC_SKILLS, xmlSections: false, hooks: null, brainTarget: "generic", reportTarget: input.id, mcpConfig: "generic", ...input };
}

export const HOST_ADAPTERS: readonly HostAdapter[] = Object.freeze([
  adapter({
    id: "claude", family: "claude", contextTarget: "claude", brainTarget: "claude", mcpConfig: "claude", xmlSections: true, hooks: "claude-code-settings", setup: "install-dry-run",
    skills: { projectDir: ".claude/skills", verification: "verified-docs", source: "https://code.claude.com/docs/en/skills", verifiedOn: VERIFIED_ON, limitations: ["Claude Code does not read .agents/skills."] },
    matrix: { status: "stable", priority: "low", reportSupport: "supported" },
    instructionFiles: ["CLAUDE.md", "context-pack.md"], reportFormats: ["Markdown", "tagged sections"],
    notes: { export: DEFAULT_EXPORT_NOTE, report: STABLE_REPORT_NOTE, brain: "Host formatting: Markdown wrapped in XML-like tags for Claude Code prompt boundaries." }
  }),
  adapter({
    id: "codex", family: "openai", contextTarget: "codex", brainTarget: "codex", setup: "install-dry-run",
    skills: { projectDir: ".agents/skills", verification: "verified-docs", source: "https://learn.chatgpt.com/docs/build-skills", verifiedOn: VERIFIED_ON, limitations: ["Optional agents/openai.yaml UI metadata is not generated."] },
    matrix: { status: "stable", priority: "low", reportSupport: "supported" },
    instructionFiles: ["AGENTS.md", "context-pack.md"],
    notes: { export: DEFAULT_EXPORT_NOTE, report: STABLE_REPORT_NOTE, reportSection: { heading: "Codex Notes", text: "Keep edits local, use evidence paths, and run checks before release." }, brain: "Host formatting: AGENTS.md-friendly Markdown with source references and safe commands." }
  }),
  adapter({
    id: "gemini", family: "gemini", contextTarget: "gemini", brainTarget: "gemini", setup: "install-dry-run",
    skills: { projectDir: ".agents/skills", verification: "verified-docs", source: "https://geminicli.com/docs/cli/skills/", verifiedOn: VERIFIED_ON, limitations: ["Gemini CLI also reads .gemini/skills; the .agents/skills alias takes precedence."] },
    matrix: { label: "Gemini", status: "legacy", priority: "low", reportSupport: "supported" },
    instructionFiles: ["GEMINI.md", "AGENTS.md", "context-pack.md"],
    notes: { export: GEMINI_EXPORT_NOTE, report: GEMINI_REPORT_NOTE, reportSection: GEMINI_SECTION, brain: "Host formatting: Markdown sections suitable for larger-context review." }
  }),
  adapter({
    id: "gemini-legacy", family: "gemini", contextTarget: "gemini", setup: "export",
    deprecated: { replacement: "gemini", removal: "2.0.0", reason: "Same Gemini context target; Gemini CLI now loads portable .agents/skills." },
    matrix: { label: "Gemini legacy/compatible hosts", status: "legacy", priority: "normal", reportSupport: "supported" },
    instructionFiles: ["AGENTS.md", "GEMINI.md", "context-pack.md"],
    notes: { export: GEMINI_EXPORT_NOTE, report: GEMINI_REPORT_NOTE, reportSection: GEMINI_SECTION, exportCheck: { pattern: /legacy|compatible/i, warning: "Gemini legacy export should include compatibility notes." } }
  }),
  adapter({
    id: "cursor", family: "cursor", contextTarget: "cursor", brainTarget: "cursor", mcpConfig: "cursor", setup: "install-dry-run",
    skills: { projectDir: ".agents/skills", verification: "verified-docs", source: "https://cursor.com/docs/context/skills", verifiedOn: VERIFIED_ON, limitations: ["Cursor also loads .cursor/skills, .claude/skills and .codex/skills."] },
    matrix: { status: "stable", priority: "low", reportSupport: "supported" },
    instructionFiles: ["rules.md", "cursor-rules.md", "context-pack.md"], reportFormats: ["short Markdown rules"],
    notes: { export: DEFAULT_EXPORT_NOTE, report: STABLE_REPORT_NOTE, reportSection: { heading: "Cursor Notes", text: "Keep rules compact, source-linked and project-local." }, brain: "Host formatting: short rules-friendly sections for project rules/context handoff." }
  }),
  adapter({
    id: "antigravity", family: "google", contextTarget: "antigravity", setup: "export",
    matrix: { label: "Antigravity-style hosts", priority: "high", reportSupport: "prompt-only" },
    instructionFiles: ["AGENTS.md", "prompt-only.md", "context-pack.md"],
    notes: {
      export: "- Antigravity is high-priority but experimental; use AGENTS.md/context-pack handoffs until stable Google-local project config is documented.",
      report: "Antigravity is experimental and high-priority: use safe prompt/context exports until stable local config is verified.",
      reportSection: { heading: "Antigravity Notes", text: "Antigravity is high-priority but experimental; prefer reviewed prompt/context handoff until stable Google-local config is documented." },
      exportCheck: { pattern: /experimental|high-priority|Google-local/i, warning: "Antigravity export should describe the experimental Google-local transition boundary." }
    }
  }),
  adapter({
    id: "generic", family: "generic", contextTarget: "generic", setup: "install-dry-run",
    matrix: { status: "stable", priority: "low", reportSupport: "supported" },
    instructionFiles: ["AGENT_CONTEXT.md", "prompt-only.md", "context-pack.md"],
    notes: { export: DEFAULT_EXPORT_NOTE, report: STABLE_REPORT_NOTE }
  }),
  adapter({
    id: "opencode", family: "generic", contextTarget: "generic", setup: "export",
    matrix: { label: "OpenCode", status: "generic-compatible", priority: "normal", reportSupport: "prompt-only" },
    instructionFiles: ["AGENTS.md", "prompt-only.md", "context-pack.md"],
    notes: {
      export: "- OpenCode support is generic-compatible AGENTS.md/context export, not a claim of full host-native integration.",
      report: "OpenCode is generic-compatible: AGENTS.md and context-pack exports are supported, while host-native configuration remains unclaimed.",
      reportSection: { heading: "OpenCode Notes", text: "Use AGENTS.md/context artifacts as a generic-compatible handoff. Do not assume full host-native support." }
    }
  }),
  adapter({ id: "amp", family: "generic", contextTarget: "generic", reportTarget: "generic", setup: "export", matrix: { priority: "low", reportSupport: "prompt-only" }, instructionFiles: ["prompt-only.md", "context-pack.md"], notes: { export: DEFAULT_EXPORT_NOTE, report: GENERIC_REPORT_NOTE } }),
  adapter({ id: "kiro", family: "generic", contextTarget: "generic", reportTarget: "generic", setup: "export", matrix: { priority: "low", reportSupport: "prompt-only" }, instructionFiles: ["prompt-only.md", "context-pack.md"], notes: { export: DEFAULT_EXPORT_NOTE, report: GENERIC_REPORT_NOTE } }),
  adapter({
    id: "deepagents", family: "langchain", contextTarget: "generic", setup: "export",
    matrix: { label: "DeepAgents-style targets", priority: "normal", reportSupport: "prompt-only" },
    instructionFiles: ["role-pack.md", "subagents.md", "deepagents.md"], contextFormats: DEEP_CONTEXT, reportFormats: DEEP_REPORTS,
    notes: { export: DEEP_EXPORT_NOTE, report: DEEP_REPORT_NOTE, reportSection: DEEP_SECTION, exportCheck: DEEP_CHECK }
  }),
  adapter({
    id: "deepagents-js", family: "langchain", contextTarget: "generic", setup: "export",
    matrix: { label: "DeepAgents-style targets", priority: "normal", reportSupport: "prompt-only" },
    instructionFiles: ["role-pack.md", "subagents.md", "deepagents-js.md"], contextFormats: DEEP_CONTEXT, reportFormats: DEEP_REPORTS,
    notes: { export: DEEP_EXPORT_NOTE, report: DEEP_REPORT_NOTE, reportSection: DEEP_SECTION, exportCheck: DEEP_CHECK }
  })
]);

const DEFAULT_CONTEXT_FORMATS = ["Markdown", "context-pack.md", "agent report references"];
const DEFAULT_REPORT_FORMATS = ["Markdown", "JSON evidence paths"];

export function hostAdapterIds(): AgentId[] {
  return HOST_ADAPTERS.map((item) => item.id);
}

export function isHostId(value: string): value is AgentId {
  return HOST_ADAPTERS.some((item) => item.id === value);
}

/** Resolve a host; unknown hosts fall back to the generic Agent Skills adapter. */
export function getHostAdapter(id: string): HostAdapter {
  const found = HOST_ADAPTERS.find((item) => item.id === id) ?? HOST_ADAPTERS.find((item) => item.id === "generic");
  if (!found) throw new Error("Generic host adapter is missing.");
  return found;
}

export function hostDeprecationNotice(id: string): string | null {
  const deprecated = HOST_ADAPTERS.find((item) => item.id === id)?.deprecated;
  return deprecated ? `Deprecated host "${id}": use "${deprecated.replacement}" (removal target v${deprecated.removal}). ${deprecated.reason}` : null;
}

export function hostContextFormats(host: HostAdapter): string[] {
  return host.contextFormats ?? DEFAULT_CONTEXT_FORMATS;
}

export function hostReportFormats(host: HostAdapter): string[] {
  return host.reportFormats ?? DEFAULT_REPORT_FORMATS;
}

export function hostSetupCommand(host: HostAdapter): string {
  return host.setup === "export" ? `soturail agents export --agent ${host.id}` : `soturail agents install --agent ${host.id} --dry-run`;
}

/** Wrap or annotate a generated Markdown body for a host, without branching on names. */
export function decorateForHost(host: HostAdapter, body: string, xmlTag: string): string {
  if (host.xmlSections) return `<${xmlTag}>\n${body}\n</${xmlTag}>\n`;
  const section = host.notes.reportSection;
  return section ? `${body}\n## ${section.heading}\n\n${section.text}\n` : body;
}
