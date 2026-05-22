import path from "node:path";
import type { Command } from "commander";
import { ensureWorkspace, type EnsureResult, writeFileIfMissing } from "../core/config.js";

const text = {
  agents: `# AGENTS.md

SotuRail context rails for AI coding agents.

- Prefer soturail index before asking an agent to reason about the whole repo.
- Use soturail read <file> --query "goal" for large files.
- Run commands through soturail run so raw logs remain recoverable.
- Do not run git push automatically.
`,
  claude: `# CLAUDE.md

Claude Code should treat SotuRail output as scoped context.

Stable project blocks belong before dynamic session data. Raw logs are recoverable with soturail expand <raw_id>.
`,
  gemini: `# GEMINI.md

Gemini CLI should use SotuRail as a local context boundary.

Prefer repo maps and progressive reads over dumping entire repositories into prompts.
`,
  architecture: `# Architecture

SotuRail is local-first TypeScript/Node.js software.

Core loops:

1. Scan the repository into a Heuristic Repo Map.
2. Read large files progressively.
3. Run commands through a safe tee-stream adapter.
4. Store raw logs locally and summarize them for agent context.
5. Keep stable prompt blocks before dynamic session data.
`,
  mvp: `# MVP

SotuRail focuses on local context rails for AI coding agents:

- init
- index
- read
- run
- expand
- spec
- memory
- doctor
- stats
`,
  usage: `# Usage

\`\`\`bash
soturail init
soturail index
soturail read src/cli.ts --query "commands"
soturail run npm test
soturail expand <raw_id>
\`\`\`
`,
  security: `# Security Model

SotuRail blocks dangerous commands by default, including rm -rf, sudo, format, dd if=, curl | sh, del /s and git push.

Bypass requires the exact unsafe confirmation phrase and should be used rarely.
`,
  caching: `# Prompt Caching

SotuRail separates stable and dynamic blocks. Dynamic data such as timestamps, raw ids, command status and recent logs belongs after stable governance, config, repo maps, approved specs and approved memory.

SotuRail reports estimated cache stability only unless provider metadata is imported.
`,
  metrics: `# Metrics

Metrics are append-only local JSONL events. Token counts are deterministic estimates and not provider billing numbers.
`,
  release: `# Release Checklist

- npm install
- npm run build
- npm test
- Review docs and security model
- Confirm no telemetry exists
- Do not git push automatically
`,
  screenshots: `# Screenshots

Add terminal screenshots or Markdown previews here when preparing releases.
`,
  ptBr: `# Visao geral

SotuRail e um Context OS local-first para agentes de IA de desenvolvimento. Ele indexa repositorios, le arquivos progressivamente, executa comandos com logs brutos recuperaveis e organiza contexto estavel para prompt caching.
`,
  benchmarking: `# Benchmarking

Run soturail bench prepare, soturail bench run and soturail bench report to generate local benchmark evidence.
`,
  hooks: `# Agent Hooks

SotuRail provides dry-run hook installers and prompt-only fallbacks for Claude, Codex, Gemini and Cursor.
`,
  nativeRunner: `# Native Runner

The optional Rust reducer engine is detected automatically and TypeScript reducers remain the fallback.
`,
  reducers: `# Reducers

SotuRail reducers preserve raw-log recovery while compressing Git, test, JSON and generic output.
`,
  responseCompression: `# Agent Response Compression

soturail format compresses verbose AI responses into deterministic task-oriented modes.
`,
  knowledgeToRules: `# Knowledge-to-Rules

soturail ingest turns Markdown, TXT, JSON and YAML into structured local rules and validators.
`,
  rules: `# Rules

Rules are stored under .soturail/rules and can be listed, checked and exported.
`,
  agentsDoc: `# Agent Integrations

SotuRail exports reviewed, project-local agent integration files for Claude, Codex, Gemini, Cursor, Antigravity and generic agents.

\`\`\`bash
soturail agents list
soturail agents doctor
soturail agents export --agent all
soturail agents install --agent claude --mode mcp --dry-run
soturail agents install --agent cursor --mode rules --dry-run
\`\`\`

Exports live under .soturail/exports/agents/<agent>/ and should be reviewed before use. Install commands are dry-run-first and backup-first.
`,
  specWorkflow: `# Spec-Driven Workflow

soturail spec manages constitution, spec, plan, tasks, verification, context budget and security impact files.
`,
  mcp: `# MCP

SotuRail can expose local context through a small MCP-compatible stdio server.

\`\`\`bash
soturail mcp doctor
soturail mcp manifest
soturail mcp serve --transport stdio
\`\`\`

The MCP server exposes read-oriented resources and safe tools. It does not expose arbitrary shell execution by default.
`,
  skillRail: `# Skill Rail

Skill Rail creates local, reviewable agent skills under .soturail/skills.

\`\`\`bash
soturail skills init code-review
soturail skills list
soturail skills validate
soturail skills export --target claude
\`\`\`
`,
  contextPacks: `# Context Packs

Context packs put stable project context before dynamic session metadata.

\`\`\`bash
soturail context pack --target generic
soturail context pack --target claude
\`\`\`

Generated packs are written under .soturail/context.
`,
  comparisons: `# Comparisons

SotuRail aims to unify local-first context engineering ideas into one workflow.

It is an independent implementation inspired by common workflow patterns around terminal reduction, response compression, Spec-Driven workflows, memory, rules, hooks, MCP and skill exports. It does not vendor competing projects.
`,
  workflowRail: `# Workflow Rail

Workflow Rail stores local task state under .soturail/workflows and can optionally plan Git worktree isolation.

\`\`\`bash
soturail workflow new "Implement feature"
soturail workflow list
soturail workflow show <id>
soturail workflow start <id> --worktree --dry-run
soturail workflow close <id>
\`\`\`

SotuRail does not push, merge or delete worktrees automatically.
`,
  firstWorkflow: `# First Real Workflow

This workflow starts in a clean project.

\`\`\`bash
mkdir my-soturail-test
cd my-soturail-test
soturail init
soturail index
soturail context pack --target generic
soturail skills init code-review
soturail skills validate
soturail skills export --target claude
soturail mcp doctor
soturail mcp manifest
soturail run node --version
soturail stats
\`\`\`

## Windows Notes

PowerShell and CMD quote commands differently. Do not paste Markdown fence markers into CMD. Quote paths with spaces.

## What should happen?

SotuRail creates .soturail, repo indexes, a generic context pack, a local skill, an exported Claude skill and local stats. Stats may show zero commands until you run a command through soturail run <command>.
`,
  examplesReadme: `# SotuRail Examples

These examples are small, reviewable starting points for skills, MCP messages, context packs and hook guidance.
`,
  examplesSkillsReadme: `# Skill Examples

Copy a YAML example into .soturail/skills/<id>/skill.yml only after reviewing it. Generated skills should always pass soturail skills validate.
`,
  examplesContextReadme: `# Context Pack Examples

Use soturail context pack --target generic to create .soturail/context/generic-context.md.
`,
  examplesMcpReadme: `# MCP Examples

Send one JSON-RPC object per line to soturail mcp serve --transport stdio.
`,
  examplesHooksReadme: `# Hook Examples

Use dry-run first and review generated files before enabling hooks.
`,
  examplesAgentsReadme: `# Agent Examples

These examples show prompt-only and context-pack integration patterns for supported coding agents.

Run:

\`\`\`bash
soturail agents export --agent all
\`\`\`

Review generated files before enabling them in an agent host.
`,
  exampleAgentClaude: `# Claude Agent Export

Use:

\`\`\`bash
soturail agents export --agent claude
soturail mcp config --agent claude
\`\`\`

Review CLAUDE.md, context-pack.md, mcp-config.json and safe-hooks.md before enabling them.
`,
  exampleAgentCodex: `# Codex Agent Export

Use:

\`\`\`bash
soturail agents export --agent codex
\`\`\`

Review AGENTS.md and context-pack.md before copying guidance into a repository.
`,
  exampleAgentGemini: `# Gemini Agent Export

Use:

\`\`\`bash
soturail agents export --agent gemini
\`\`\`

Review GEMINI.md and prompt-only.md before use.
`,
  exampleAgentCursor: `# Cursor Agent Export

Use:

\`\`\`bash
soturail agents export --agent cursor
soturail agents install --agent cursor --mode rules --dry-run
\`\`\`

Review cursor-rules.md before adding it to Cursor project rules.
`,
  exampleAgentAntigravity: `# Antigravity Agent Export

Use:

\`\`\`bash
soturail agents export --agent antigravity
\`\`\`

SotuRail treats Antigravity as prompt-only/context-pack unless a stable local config format is reviewed.
`,
  examplesWorkflowsReadme: `# Workflow Examples

Workflow Rail stores local task state under .soturail/workflows.

\`\`\`bash
soturail workflow new "Fix bug"
soturail workflow list
soturail workflow show <id>
\`\`\`

Worktree operations are optional, local and dry-run friendly.
`,
  exampleWorkflowBugfix: `# Bugfix Workflow

\`\`\`bash
soturail workflow new "Fix parser bug"
soturail workflow plan <id>
soturail workflow start <id> --worktree --dry-run
soturail workflow verify <id>
\`\`\`

Keep verification explicit and reviewed.
`,
  exampleWorkflowRelease: `# Release Workflow

\`\`\`bash
soturail workflow new "Prepare release"
soturail workflow plan <id>
soturail workflow verify <id>
\`\`\`

Run release checks outside Workflow Rail until the verification file is reviewed.
`,
  exampleCodeReviewSkill: `id: code-review
name: Code Review
description: Review code changes for correctness, safety and missing tests.
version: 0.1.0
author: Rafael Ryan Ramos de Souza
risk_level: low
targets:
  - claude
  - codex
  - gemini
  - cursor
  - generic
allowed_tools:
  - read
  - search
  - summarize
  - format
forbidden_patterns:
  - rm -rf
  - curl | sh
  - git push
  - secret exfiltration
requires_human_approval:
  - destructive_command
  - remote_write
  - dependency_install
created_at: 2026-05-21T00:00:00.000Z
content_hash: 0000000000000000000000000000000000000000000000000000000000000000
`,
  exampleReleaseSkill: `id: release-manager
name: Release Manager
description: Prepare release notes, validation evidence and publication checklists.
version: 0.1.0
author: Rafael Ryan Ramos de Souza
risk_level: medium
targets:
  - claude
  - codex
  - gemini
  - cursor
  - generic
allowed_tools:
  - read
  - search
  - summarize
  - format
forbidden_patterns:
  - git push
  - npm publish without validation
  - secret exfiltration
requires_human_approval:
  - remote_write
  - dependency_install
created_at: 2026-05-21T00:00:00.000Z
content_hash: 0000000000000000000000000000000000000000000000000000000000000000
`,
  exampleBugSkill: `id: bug-triage
name: Bug Triage
description: Reduce a bug report into reproduction steps, suspected causes and verification commands.
version: 0.1.0
author: Rafael Ryan Ramos de Souza
risk_level: low
targets:
  - claude
  - codex
  - gemini
  - cursor
  - generic
allowed_tools:
  - read
  - search
  - summarize
  - format
forbidden_patterns:
  - rm -rf
  - curl | sh
  - secret exfiltration
requires_human_approval:
  - destructive_command
  - remote_write
created_at: 2026-05-21T00:00:00.000Z
content_hash: 0000000000000000000000000000000000000000000000000000000000000000
`,
  exampleJavaStudentSkill: `id: java-student-helper
name: Java Student Helper
description: Help review small Java exercises with clear explanations and safe local commands.
version: 0.1.0
author: Rafael Ryan Ramos de Souza
risk_level: low
targets:
  - claude
  - codex
  - gemini
  - cursor
  - generic
allowed_tools:
  - read
  - search
  - summarize
  - format
forbidden_patterns:
  - rm -rf
  - curl | sh
  - git push
  - secret exfiltration
requires_human_approval:
  - destructive_command
  - dependency_install
created_at: 2026-05-21T00:00:00.000Z
content_hash: 0000000000000000000000000000000000000000000000000000000000000000
`,
  examplePhpWebReviewerSkill: `id: php-web-reviewer
name: PHP Web Reviewer
description: Review PHP web code for correctness, security basics and missing tests.
version: 0.1.0
author: Rafael Ryan Ramos de Souza
risk_level: medium
targets:
  - claude
  - codex
  - gemini
  - cursor
  - generic
allowed_tools:
  - read
  - search
  - summarize
  - format
forbidden_patterns:
  - rm -rf
  - curl | sh
  - git push
  - secret exfiltration
requires_human_approval:
  - destructive_command
  - remote_write
  - dependency_install
created_at: 2026-05-21T00:00:00.000Z
content_hash: 0000000000000000000000000000000000000000000000000000000000000000
`,
  mcpInitialize: `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"clientInfo":{"name":"manual-smoke","version":"0.1.0"}}}
`,
  mcpResourcesList: `{"jsonrpc":"2.0","id":2,"method":"resources/list"}
`,
  mcpResourcesReadRepoMap: `{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"soturail://repo-map"}}
`,
  mcpToolsList: `{"jsonrpc":"2.0","id":4,"method":"tools/list"}
`,
  contextGenericWorkflow: `# Generic Context Pack Workflow

\`\`\`bash
soturail init
soturail index
soturail context pack --target generic
\`\`\`

Review .soturail/context/generic-context.md before pasting it into an agent.
`,
  promptOnlyCodex: `# Prompt-only Codex Rules

- Run soturail index before large changes.
- Prefer soturail read for large files.
- Run tests and builds through soturail run.
- Never route git push through soturail run.
`
};

function documentationTemplates(root: string): Array<{ path: string; content: string }> {
  return [
    { path: path.resolve(root, "AGENTS.md"), content: text.agents },
    { path: path.resolve(root, "CLAUDE.md"), content: text.claude },
    { path: path.resolve(root, "GEMINI.md"), content: text.gemini },
    { path: path.resolve(root, "docs", "architecture.md"), content: text.architecture },
    { path: path.resolve(root, "docs", "mvp.md"), content: text.mvp },
    { path: path.resolve(root, "docs", "usage.md"), content: text.usage },
    { path: path.resolve(root, "docs", "security-model.md"), content: text.security },
    { path: path.resolve(root, "docs", "prompt-caching.md"), content: text.caching },
    { path: path.resolve(root, "docs", "metrics.md"), content: text.metrics },
    { path: path.resolve(root, "docs", "benchmarking.md"), content: text.benchmarking },
    { path: path.resolve(root, "docs", "hooks.md"), content: text.hooks },
    { path: path.resolve(root, "docs", "native-runner.md"), content: text.nativeRunner },
    { path: path.resolve(root, "docs", "reducers.md"), content: text.reducers },
    { path: path.resolve(root, "docs", "response-compression.md"), content: text.responseCompression },
    { path: path.resolve(root, "docs", "knowledge-to-rules.md"), content: text.knowledgeToRules },
    { path: path.resolve(root, "docs", "rules.md"), content: text.rules },
    { path: path.resolve(root, "docs", "agents.md"), content: text.agentsDoc },
    { path: path.resolve(root, "docs", "spec-driven-workflow.md"), content: text.specWorkflow },
    { path: path.resolve(root, "docs", "mcp.md"), content: text.mcp },
    { path: path.resolve(root, "docs", "skill-rail.md"), content: text.skillRail },
    { path: path.resolve(root, "docs", "context-packs.md"), content: text.contextPacks },
    { path: path.resolve(root, "docs", "comparisons.md"), content: text.comparisons },
    { path: path.resolve(root, "docs", "workflow-rail.md"), content: text.workflowRail },
    { path: path.resolve(root, "docs", "first-real-workflow.md"), content: text.firstWorkflow },
    { path: path.resolve(root, "docs", "release-checklist.md"), content: text.release },
    { path: path.resolve(root, "docs", "assets", "screenshots", "README.md"), content: text.screenshots },
    { path: path.resolve(root, "docs", "pt-BR", "visao-geral.md"), content: text.ptBr },
    { path: path.resolve(root, "examples", "README.md"), content: text.examplesReadme },
    { path: path.resolve(root, "examples", "skills", "README.md"), content: text.examplesSkillsReadme },
    { path: path.resolve(root, "examples", "context-packs", "README.md"), content: text.examplesContextReadme },
    { path: path.resolve(root, "examples", "mcp", "README.md"), content: text.examplesMcpReadme },
    { path: path.resolve(root, "examples", "hooks", "README.md"), content: text.examplesHooksReadme },
    { path: path.resolve(root, "examples", "agents", "README.md"), content: text.examplesAgentsReadme },
    { path: path.resolve(root, "examples", "agents", "claude.md"), content: text.exampleAgentClaude },
    { path: path.resolve(root, "examples", "agents", "codex.md"), content: text.exampleAgentCodex },
    { path: path.resolve(root, "examples", "agents", "gemini.md"), content: text.exampleAgentGemini },
    { path: path.resolve(root, "examples", "agents", "cursor.md"), content: text.exampleAgentCursor },
    { path: path.resolve(root, "examples", "agents", "antigravity.md"), content: text.exampleAgentAntigravity },
    { path: path.resolve(root, "examples", "workflows", "README.md"), content: text.examplesWorkflowsReadme },
    { path: path.resolve(root, "examples", "workflows", "bugfix-workflow.md"), content: text.exampleWorkflowBugfix },
    { path: path.resolve(root, "examples", "workflows", "release-workflow.md"), content: text.exampleWorkflowRelease },
    { path: path.resolve(root, "examples", "skills", "code-review-skill.yml"), content: text.exampleCodeReviewSkill },
    { path: path.resolve(root, "examples", "skills", "release-manager-skill.yml"), content: text.exampleReleaseSkill },
    { path: path.resolve(root, "examples", "skills", "bug-triage-skill.yml"), content: text.exampleBugSkill },
    { path: path.resolve(root, "examples", "skills", "java-student-helper-skill.yml"), content: text.exampleJavaStudentSkill },
    { path: path.resolve(root, "examples", "skills", "php-web-reviewer-skill.yml"), content: text.examplePhpWebReviewerSkill },
    { path: path.resolve(root, "examples", "mcp", "initialize.json"), content: text.mcpInitialize },
    { path: path.resolve(root, "examples", "mcp", "resources-list.json"), content: text.mcpResourcesList },
    { path: path.resolve(root, "examples", "mcp", "resources-read-repo-map.json"), content: text.mcpResourcesReadRepoMap },
    { path: path.resolve(root, "examples", "mcp", "tools-list.json"), content: text.mcpToolsList },
    { path: path.resolve(root, "examples", "context-packs", "generic-workflow.md"), content: text.contextGenericWorkflow },
    { path: path.resolve(root, "examples", "hooks", "prompt-only-codex.md"), content: text.promptOnlyCodex }
  ];
}

export interface InitReport extends EnsureResult {}

export async function runInit(root = process.cwd()): Promise<InitReport> {
  const report = await ensureWorkspace(root);
  for (const template of documentationTemplates(root)) {
    await writeFileIfMissing(template.path, template.content, report, root);
  }
  return report;
}

export function formatInitReport(report: InitReport): string {
  const lines = [
    "SotuRail workspace initialized.",
    "",
    `Created paths (${report.created.length}):`,
    ...(report.created.length > 0 ? report.created.map((item) => `  + ${item}`) : ["  none"]),
    "",
    `Skipped existing paths (${report.skipped.length}):`,
    ...(report.skipped.length > 0 ? report.skipped.map((item) => `  = ${item}`) : ["  none"])
  ];
  return `${lines.join("\n")}\n`;
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Create a non-destructive .soturail workspace and starter docs.")
    .action(async () => {
      const report = await runInit();
      process.stdout.write(formatInitReport(report));
    });
}
