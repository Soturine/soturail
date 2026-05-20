import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { ensureWorkspace, getWorkspacePaths, writeJson } from "../core/config.js";
import { MetricsStore } from "../core/metrics-store.js";

export type HookHost = "claude" | "codex" | "gemini" | "cursor";
const hosts: HookHost[] = ["claude", "codex", "gemini", "cursor"];

export interface HookInstallOptions {
  dryRun?: boolean;
}

interface HookTarget {
  host: HookHost;
  file: string;
  mode: "prompt-only" | "adapter-template";
  content: string;
}

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
    "host APIs vary; prompt-only fallback is always available"
  ].join("\n") + "\n";
}

export async function installHooks(hostValue: string, options: HookInstallOptions = {}, root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const parsed = parseHost(hostValue);
  const selected = parsed === "all" ? hosts : [parsed];
  const dryRun = options.dryRun === true;
  const lines = [`SotuRail hooks install ${hostValue}${dryRun ? " --dry-run" : ""}`];
  const installed: Record<string, unknown>[] = [];
  for (const host of selected) {
    const target = targetFor(host);
    lines.push(...(await installTarget(target, root, dryRun)));
    installed.push({ host, target: target.file, mode: target.mode, installed_at: new Date().toISOString() });
  }
  if (!dryRun) {
    const paths = getWorkspacePaths(root);
    await writeJson(paths.hooksHosts, { hosts: installed });
    await new MetricsStore(root).append({ type: "hook_install", details: { host: hostValue, count: installed.length } });
  }
  return `${lines.join("\n")}\n`;
}

export async function uninstallHooks(hostValue: string, root = process.cwd()): Promise<string> {
  const parsed = parseHost(hostValue);
  const selected = parsed === "all" ? hosts : [parsed];
  const lines = [`SotuRail hooks uninstall ${hostValue}`];
  for (const host of selected) {
    const target = targetFor(host);
    const absolute = path.resolve(root, target.file);
    const backup = `${absolute}.soturail.bak`;
    if (await fs.access(backup).then(() => true).catch(() => false)) {
      await fs.copyFile(backup, absolute);
      lines.push(`Restored backup for ${target.file}`);
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

export function registerHooksCommand(program: Command): void {
  const hooks = program.command("hooks").description("Install or inspect agent hook and prompt-only integrations.");
  hooks.command("list").description("List supported hook hosts.").action(async () => {
    process.stdout.write(await listHooks());
  });
  hooks.command("doctor").description("Check hook registry state.").action(async () => {
    process.stdout.write(await hooksDoctor());
  });
  hooks.command("install").description("Install hook rules for a host.").argument("<host>", "claude, codex, gemini, cursor, or all").option("--dry-run", "Print changes without writing").action(async (host: string, options: HookInstallOptions) => {
    process.stdout.write(await installHooks(host, options));
  });
  hooks.command("uninstall").description("Restore backed up host files when available.").argument("<host>", "claude, codex, gemini, cursor, or all").action(async (host: string) => {
    process.stdout.write(await uninstallHooks(host));
  });
  hooks.command("prompt-only").description("Print prompt-only fallback rules.").argument("<host>", "claude, codex, gemini, cursor, or all").action(async (host: string) => {
    process.stdout.write(await promptOnly(host));
  });
}
