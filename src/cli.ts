#!/usr/bin/env node
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { registerBenchCommand } from "./commands/bench.js";
import { registerAgentsCommand } from "./commands/agents.js";
import { registerDedupeCommand } from "./commands/dedupe.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerExpandCommand } from "./commands/expand.js";
import { registerFsCommand } from "./commands/fs.js";
import { registerFormatCommand } from "./commands/format.js";
import { registerHarnessCommand } from "./commands/harness.js";
import { registerHooksCommand } from "./commands/hooks.js";
import { registerIngestCommand } from "./commands/ingest.js";
import { registerIndexCommand } from "./commands/index.js";
import { registerInitCommand } from "./commands/init.js";
import { registerMemoryCommand } from "./commands/memory.js";
import { registerMcpCommand } from "./commands/mcp.js";
import { registerNativeCommand } from "./commands/native.js";
import { registerContextCommand } from "./commands/context.js";
import { registerReadCommand } from "./commands/read.js";
import { registerPolicyCommand } from "./commands/policy.js";
import { registerRunCommand } from "./commands/run.js";
import { registerRulesCommand } from "./commands/rules.js";
import { registerSelfCommand } from "./commands/self.js";
import { registerSkillsCommand } from "./commands/skills.js";
import { registerSpecCommand } from "./commands/spec.js";
import { registerStatsCommand } from "./commands/stats.js";
import { registerReleaseCommand } from "./commands/release.js";
import { registerWorkflowCommand } from "./commands/workflow.js";
import { SOTURAIL_VERSION } from "./core/version.js";

export function buildProgram(): Command {
  const program = new Command();
  program.enablePositionalOptions();
  program
    .name("soturail")
    .description("Local-first Context OS rails for AI coding agents.")
    .version(SOTURAIL_VERSION)
    .showHelpAfterError();

  registerInitCommand(program);
  registerAgentsCommand(program);
  registerIndexCommand(program);
  registerReadCommand(program);
  registerRunCommand(program);
  registerBenchCommand(program);
  registerContextCommand(program);
  registerDedupeCommand(program);
  registerExpandCommand(program);
  registerFsCommand(program);
  registerFormatCommand(program);
  registerHarnessCommand(program);
  registerHooksCommand(program);
  registerIngestCommand(program);
  registerSpecCommand(program);
  registerMemoryCommand(program);
  registerMcpCommand(program);
  registerNativeCommand(program);
  registerPolicyCommand(program);
  registerRulesCommand(program);
  registerReleaseCommand(program);
  registerSelfCommand(program);
  registerSkillsCommand(program);
  registerDoctorCommand(program);
  registerStatsCommand(program);
  registerWorkflowCommand(program);

  return program;
}

function canonicalEntrypointPath(inputPath: string): string {
  const resolved = path.resolve(inputPath);
  try {
    return path.normalize(realpathSync.native(resolved));
  } catch {
    try {
      return path.normalize(realpathSync(resolved));
    } catch {
      return path.normalize(resolved);
    }
  }
}

export function isCliEntrypoint(invokedPath: string | undefined, currentFile: string): boolean {
  if (!invokedPath) return false;
  const invoked = canonicalEntrypointPath(invokedPath);
  const current = canonicalEntrypointPath(currentFile);
  return process.platform === "win32" ? invoked.toLowerCase() === current.toLowerCase() : invoked === current;
}

const currentFile = fileURLToPath(import.meta.url);
if (isCliEntrypoint(process.argv[1], currentFile)) {
  buildProgram().parseAsync(process.argv).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`SotuRail error: ${message}\n`);
    process.exitCode = 1;
  });
}
