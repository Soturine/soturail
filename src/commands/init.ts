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

SotuRail v0.1.0 is local-first TypeScript/Node.js software.

Core loops:

1. Scan the repository into a Heuristic Repo Map.
2. Read large files progressively.
3. Run commands through a safe tee-stream adapter.
4. Store raw logs locally and summarize them for agent context.
5. Keep stable prompt blocks before dynamic session data.
`,
  mvp: `# MVP

SotuRail v0.1.0 focuses on functional local rails:

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

v0.1.0 reports estimated cache stability only. It does not claim provider cache hits.
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
    { path: path.resolve(root, "docs", "release-checklist.md"), content: text.release },
    { path: path.resolve(root, "docs", "assets", "screenshots", "README.md"), content: text.screenshots },
    { path: path.resolve(root, "docs", "pt-BR", "visao-geral.md"), content: text.ptBr }
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
