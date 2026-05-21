import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { ensureWorkspace, getWorkspacePaths, writeJson } from "../core/config.js";
import { MetricsStore } from "../core/metrics-store.js";

export type HookHost = "claude" | "codex" | "gemini" | "cursor" | "antigravity";
const hosts: HookHost[] = ["claude", "codex", "gemini", "cursor", "antigravity"];

export interface HookInstallOptions {
  dryRun?: boolean;
  agent?: string;
  mode?: "safe-hooks" | "mcp" | "prompt-only";
}

interface HookTarget {
  host: HookHost;
  file: string;
  mode: "prompt-only" | "adapter-template";
  content: string;
}

const claudePreToolHook = `#!/usr/bin/env node
const fs = require("node:fs");

const input = fs.readFileSync(0, "utf8");
let payload = {};
try {
  payload = input.trim() ? JSON.parse(input) : {};
} catch {
  payload = { raw: input };
}

const text = JSON.stringify(payload);
const dangerous = [
  /\\brm\\s+-[^\\n]*r[^\\n]*f/i,
  /(^|[;&|]\\s*)sudo\\b/i,
  /(^|[;&|]\\s*)git\\s+push\\b/i,
  /\\bcurl\\b[^|]*\\|\\s*(sh|bash)\\b/i,
  /\\bdd\\s+[^\\n]*\\bif=/i,
  /(^|[;&|]\\s*)del\\s+\\/s\\b/i
];

if (dangerous.some((pattern) => pattern.test(text))) {
  console.error("SotuRail blocked a destructive Claude shell command. Do not route git push through soturail run.");
  process.exit(2);
}

if (/\\b(npm|pnpm|yarn|bun|cargo|pytest|vitest|jest|tsc|node)\\b/.test(text)) {
  console.error("SotuRail suggestion: run tests/builds/log commands through soturail run so raw logs are recoverable.");
}
process.exit(0);
`;

const claudePostToolHook = `#!/usr/bin/env node
const fs = require("node:fs");
const input = fs.readFileSync(0, "utf8");
if (/raw_id/.test(input)) {
  console.error("SotuRail note: use soturail expand <raw_id> when the compressed summary lacks needed evidence.");
}
process.exit(0);
`;

function rules(host: HookHost): string {
  return `# SotuRail prompt-only rules for ${host}

- Use soturail index before large repository changes.
- Use soturail read <file> --query "goal" instead of reading giant files directly.
- Use soturail run for tests, builds and logs so raw output is recoverable.
- Use soturail expand <raw_id> only when the compressed summary lacks needed information.
- Never use soturail run for git push.
`;
}

function targetFor(host: HookHost): HookTarget {
  switch (host) {
    case "claude":
      return { host, file: "CLAUDE.md", mode: "adapter-template", content: `${rules(host)}\n## Pre-tool adapter template\n\nWhen supported by host hooks, route shell commands through: soturail run <command...>\n` };
    case "codex":
      return { host, file: "AGENTS.md", mode: "prompt-only", content: rules(host) };
    case "gemini":
      return { host, file: "GEMINI.md", mode: "prompt-only", content: rules(host) };
    case "cursor":
      return { host, file: ".cursor/rules/soturail.mdc", mode: "prompt-only", content: rules(host) };
    case "antigravity":
      return { host, file: ".soturail/exports/hooks/antigravity-prompt-only.md", mode: "prompt-only", content: rules(host) };
  }
}

function parseHost(value: string): HookHost | "all" {
  if (value === "all") {
    return "all";
  }
  if (hosts.includes(value as HookHost)) {
    return value as HookHost;
  }
  throw new Error(`Unknown hook host "${value}".`);
}

async function installTarget(target: HookTarget, root: string, dryRun: boolean): Promise<string[]> {
  const absolute = path.resolve(root, target.file);
  const actions = [`${dryRun ? "Would update" : "Update"} ${target.file} (${target.mode})`];
  try {
    await fs.access(absolute);
    actions.push(`${dryRun ? "Would create" : "Create"} backup ${target.file}.soturail.bak`);
    if (!dryRun) {
      await fs.copyFile(absolute, `${absolute}.soturail.bak`);
      const existing = await fs.readFile(absolute, "utf8");
      const marker = "<!-- soturail-hooks -->";
      const next = existing.includes(marker) ? existing : `${existing.trimEnd()}\n\n${marker}\n${target.content}`;
      await fs.writeFile(absolute, `${next.trimEnd()}\n`, "utf8");
    }
  } catch {
    actions.push(`${dryRun ? "Would create" : "Create"} ${target.file}`);
    if (!dryRun) {
      await fs.mkdir(path.dirname(absolute), { recursive: true });
      await fs.writeFile(absolute, `<!-- soturail-hooks -->\n${target.content}`, "utf8");
    }
  }
  return actions;
}

async function writeWithBackup(filePath: string, content: string, root: string, dryRun: boolean): Promise<string[]> {
  const relative = path.normalize(path.relative(root, filePath)).replace(/\\/g, "/");
  const actions = [`${dryRun ? "Would write" : "Write"} ${relative}`];
  try {
    await fs.access(filePath);
    actions.push(`${dryRun ? "Would create" : "Create"} backup ${relative}.soturail.bak`);
    if (!dryRun) {
      await fs.copyFile(filePath, `${filePath}.soturail.bak`);
    }
  } catch {
    actions.push(`${dryRun ? "Would create" : "Create"} ${relative}`);
  }
  if (!dryRun) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf8");
  }
  return actions;
}

async function installClaude(root: string, dryRun: boolean): Promise<string[]> {
  const settingsPath = path.resolve(root, ".claude", "settings.json");
  const preHookPath = path.resolve(root, ".claude", "hooks", "soturail-pre-tool-use.js");
  const postHookPath = path.resolve(root, ".claude", "hooks", "soturail-post-tool-use.js");
  const settings = await buildClaudeSettings(settingsPath);
  return [
    ...(await writeWithBackup(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, root, dryRun)),
    ...(await writeWithBackup(preHookPath, claudePreToolHook, root, dryRun)),
    ...(await writeWithBackup(postHookPath, claudePostToolHook, root, dryRun)),
    "Claude hook template is conservative; verify the schema against your installed Claude Code version."
  ];
}

async function buildClaudeSettings(settingsPath: string): Promise<Record<string, unknown>> {
  const existing = await readJsonObject(settingsPath);
  const hooks = isRecord(existing.hooks) ? { ...existing.hooks } : {};
  hooks.PreToolUse = appendClaudeHook(hooks.PreToolUse, "Bash", "node .claude/hooks/soturail-pre-tool-use.js");
  hooks.PostToolUse = appendClaudeHook(hooks.PostToolUse, "Bash", "node .claude/hooks/soturail-post-tool-use.js");
  return {
    ...existing,
    hooks,
    soturail: {
      ...(isRecord(existing.soturail) ? existing.soturail : {}),
      mode: "conservative-template",
      note: "If your Claude Code version uses a different hook schema, copy these commands into the supported hook slots manually."
    }
  };
}

async function readJsonObject(filePath: string): Promise<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function appendClaudeHook(value: unknown, matcher: string, command: string): unknown[] {
  const entries = Array.isArray(value) ? [...value] : [];
  if (!entries.some((entry) => JSON.stringify(entry).includes(command))) {
    entries.push({ matcher, hooks: [{ type: "command", command }] });
  }
  return entries;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function listHooks(): Promise<string> {
  return `${hosts
    .map((host) => {
      const target = targetFor(host);
      return `${host}: ${target.mode}, target ${target.file}`;
    })
    .join("\n")}\n`;
}

export async function hooksDoctor(root = process.cwd()): Promise<string> {
  const paths = getWorkspacePaths(root);
  const registryExists = await fs.access(paths.hooksHosts).then(() => true).catch(() => false);
  return [
    "SotuRail hooks doctor",
    `supported_hosts: ${hosts.join(", ")}`,
    `registry: ${registryExists ? ".soturail/hooks/hosts.json exists" : "not installed yet"}`,
    "safe_modes:",
    "- claude: safe-hooks, mcp",
    "- codex: prompt-only",
    "- gemini: prompt-only",
    "- cursor: prompt-only",
    "- antigravity: prompt-only",
    "",
    "Next steps:",
    "- soturail hooks list",
    "- soturail hooks install --agent claude --mode safe-hooks --dry-run",
    "- soturail hooks install --agent codex --mode prompt-only --dry-run",
    "- soturail hooks install --agent antigravity --mode prompt-only --dry-run",
    "- soturail hooks export --agent claude",
    "- Review generated hooks before enabling.",
    "",
    "host APIs vary; prompt-only fallback is always available"
  ].join("\n") + "\n";
}

export async function installHooks(hostValue: string, options: HookInstallOptions = {}, root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const parsed = parseHost(hostValue);
  const selected = parsed === "all" ? hosts : [parsed];
  const dryRun = options.dryRun === true;
  const mode = options.mode ?? (hostValue === "claude" ? "safe-hooks" : "prompt-only");
  const lines = [`SotuRail hooks install ${hostValue} --mode ${mode}${dryRun ? " --dry-run" : ""}`];
  const installed: Record<string, unknown>[] = [];
  for (const host of selected) {
    if (host === "claude" && mode !== "prompt-only") {
      lines.push(...(await installClaude(root, dryRun)));
      installed.push({ host, target: ".claude/settings.json", mode, installed_at: new Date().toISOString() });
      if (mode === "mcp") {
        lines.push("Claude MCP mode: add soturail mcp serve --transport stdio in the host's reviewed MCP server configuration.");
      }
    } else {
      const target = targetFor(host);
      lines.push(...(await installTarget(target, root, dryRun)));
      installed.push({ host, target: target.file, mode: "prompt-only", installed_at: new Date().toISOString() });
    }
  }
  if (!dryRun) {
    const paths = getWorkspacePaths(root);
    await writeJson(paths.hooksHosts, { hosts: installed });
    await new MetricsStore(root).append({ type: "hook_install", details: { host: hostValue, count: installed.length } });
  }
  return `${lines.join("\n")}\n`;
}

export async function uninstallHooks(hostValue: string, root = process.cwd(), options: { dryRun?: boolean } = {}): Promise<string> {
  const parsed = parseHost(hostValue);
  const selected = parsed === "all" ? hosts : [parsed];
  const lines = [`SotuRail hooks uninstall ${hostValue}${options.dryRun ? " --dry-run" : ""}`];
  for (const host of selected) {
    const target = targetFor(host);
    const absolute = path.resolve(root, target.file);
    const backup = `${absolute}.soturail.bak`;
    if (await fs.access(backup).then(() => true).catch(() => false)) {
      if (!options.dryRun) await fs.copyFile(backup, absolute);
      lines.push(`${options.dryRun ? "Would restore" : "Restored"} backup for ${target.file}`);
    } else {
      lines.push(`No backup found for ${target.file}; left file unchanged`);
    }
  }
  return `${lines.join("\n")}\n`;
}

export async function promptOnly(hostValue: string): Promise<string> {
  const parsed = parseHost(hostValue);
  const selected = parsed === "all" ? hosts : [parsed];
  return selected.map((host) => targetFor(host).content).join("\n---\n") + "\n";
}

export async function exportHook(hostValue: string, root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const parsed = parseHost(hostValue);
  const selected = parsed === "all" ? hosts : [parsed];
  const paths = getWorkspacePaths(root);
  await fs.mkdir(paths.hookExportsDir, { recursive: true });
  const written: string[] = [];
  for (const host of selected) {
    const content = host === "claude"
      ? `# SotuRail Claude Hook Export\n\nReview before enabling.\n\n## Prompt Rules\n\n${rules(host)}\n## Pre Tool Hook\n\n\`\`\`js\n${claudePreToolHook}\n\`\`\`\n`
      : `# SotuRail ${host} Prompt-Only Export\n\n${rules(host)}\n`;
    const filePath = path.join(paths.hookExportsDir, `${host}.md`);
    await fs.writeFile(filePath, content, "utf8");
    written.push(path.normalize(path.relative(root, filePath)).replace(/\\/g, "/"));
  }
  return `Hook export written:\n${written.join("\n")}\n`;
}

export function registerHooksCommand(program: Command): void {
  const hooks = program.command("hooks").description("Install or inspect agent hook and prompt-only integrations.");
  hooks.command("list").description("List supported hook hosts.").action(async () => {
    process.stdout.write(await listHooks());
  });
  hooks.command("doctor").description("Check hook registry state.").action(async () => {
    process.stdout.write(await hooksDoctor());
  });
  hooks.command("install").description("Install hook rules for a host.").argument("[host]", "claude, codex, gemini, cursor, antigravity, or all").option("--agent <agent>", "Agent host").option("--mode <mode>", "safe-hooks, mcp, or prompt-only").option("--dry-run", "Print changes without writing").action(async (host: string | undefined, options: HookInstallOptions) => {
    process.stdout.write(await installHooks(host ?? options.agent ?? "all", options));
  });
  hooks.command("uninstall").description("Restore backed up host files when available.").argument("[host]", "claude, codex, gemini, cursor, antigravity, or all").option("--agent <agent>", "Agent host").option("--dry-run", "Print rollback without writing").action(async (host: string | undefined, options: { agent?: string; dryRun?: boolean }) => {
    process.stdout.write(await uninstallHooks(host ?? options.agent ?? "all", process.cwd(), options.dryRun === undefined ? {} : { dryRun: options.dryRun }));
  });
  hooks.command("prompt-only").description("Print prompt-only fallback rules.").argument("<host>", "claude, codex, gemini, cursor, antigravity, or all").action(async (host: string) => {
    process.stdout.write(await promptOnly(host));
  });
  hooks.command("export").description("Export hook or prompt-only guidance for review.").option("--agent <agent>", "claude, codex, gemini, cursor, antigravity, or all", "all").action(async (options: { agent: string }) => {
    process.stdout.write(await exportHook(options.agent));
  });
}
