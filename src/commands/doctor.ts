import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { buildCachePayload } from "../core/cache-normalizer.js";
import { getWorkspacePaths, validateConfigFile } from "../core/config.js";
import { MetricsStore } from "../core/metrics-store.js";
import { agentDoctor } from "../core/agent-exporter.js";

interface Check {
  name: string;
  ok: boolean;
  message: string;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkWritePermission(workspace: string): Promise<Check> {
  if (!(await exists(workspace))) {
    return { name: "write permissions", ok: false, message: "workspace does not exist" };
  }
  const probe = path.resolve(workspace, `.write-probe-${process.pid}-${Date.now()}`);
  try {
    await fs.writeFile(probe, "ok", { flag: "wx" });
    await fs.unlink(probe);
    return { name: "write permissions", ok: true, message: "workspace is writable" };
  } catch (error) {
    return { name: "write permissions", ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function checkNodeVersion(): Check {
  const major = Number(process.versions.node.split(".")[0] ?? 0);
  return {
    name: "Node.js",
    ok: major >= 20,
    message: `current version is ${process.version}; SotuRail requires Node.js >=20`
  };
}

export async function runDoctor(root = process.cwd()): Promise<Check[]> {
  const paths = getWorkspacePaths(root);
  const config = await validateConfigFile(root);
  return [
    {
      name: "workspace",
      ok: await exists(paths.workspace),
      message: (await exists(paths.workspace)) ? ".soturail workspace exists" : ".soturail workspace is missing; run soturail init"
    },
    await checkWritePermission(paths.workspace),
    checkNodeVersion(),
    { name: "config", ok: config.ok, message: config.message }
  ];
}

export function formatChecks(title: string, checks: Check[]): string {
  return `${title}\n${checks.map((check) => `${check.ok ? "OK" : "FAIL"} ${check.name}: ${check.message}`).join("\n")}\n`;
}

function promptCacheEnvKeys(): string[] {
  const known = [
    "ANTHROPIC_PROMPT_CACHING",
    "CLAUDE_CODE_ENABLE_PROMPT_CACHE",
    "OPENAI_PROMPT_CACHE",
    "GEMINI_PROMPT_CACHE",
    "SOTURAIL_PROMPT_CACHE"
  ];
  return known.filter((key) => process.env[key] !== undefined);
}

export async function runDoctorCache(root = process.cwd()): Promise<{ checks: Check[]; score: number }> {
  const result = await buildCachePayload(root, "dynamic footer: raw_id, timestamp and command status stay here");
  const firstDynamic = result.sections.findIndex((section) => !section.stable);
  const stableAfterDynamic = result.sections.some((section, index) => section.stable && index > firstDynamic);
  const envKeys = promptCacheEnvKeys();
  const checks: Check[] = [
    {
      name: "cache normalizer",
      ok: result.blocks.length > 0,
      message: `${result.blocks.length} stable block(s) written to .soturail/cache/blocks.jsonl`
    },
    {
      name: "stable before dynamic",
      ok: firstDynamic > -1 && !stableAfterDynamic,
      message: "dynamic footer is ordered after stable blocks"
    },
    {
      name: "prompt-cache env",
      ok: true,
      message: envKeys.length > 0 ? `present: ${envKeys.join(", ")}` : "no prompt-cache-related environment variables detected"
    },
    {
      name: "estimated cache stability",
      ok: true,
      message: `${result.estimated_cache_stability_score} (local estimate, not provider cache hits)`
    }
  ];
  const metrics = new MetricsStore(root);
  await metrics.append({
    type: "doctor_cache",
    estimated_cache_stability_score: result.estimated_cache_stability_score,
    details: {
      stable_blocks: result.blocks.length,
      env_keys_present: envKeys
    }
  });
  return { checks, score: result.estimated_cache_stability_score };
}

export function registerDoctorCommand(program: Command): void {
  const doctor = program.command("doctor").description("Check SotuRail local health.");
  doctor.action(async () => {
    const checks = await runDoctor();
    process.stdout.write(formatChecks("SotuRail doctor", checks));
    if (checks.some((check) => !check.ok)) {
      process.exitCode = 1;
    }
  });

  doctor
    .command("cache")
    .description("Check prompt-cache-friendly stable/dynamic separation.")
    .action(async () => {
      const result = await runDoctorCache();
      process.stdout.write(formatChecks("SotuRail doctor cache", result.checks));
      if (result.checks.some((check) => !check.ok)) {
        process.exitCode = 1;
      }
    });

  doctor
    .command("agents")
    .description("Check agent integration readiness.")
    .action(async () => {
      process.stdout.write(await agentDoctor());
    });
}
