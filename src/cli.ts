#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { registerBenchCommand } from "./commands/bench.js";
import { registerDedupeCommand } from "./commands/dedupe.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerExpandCommand } from "./commands/expand.js";
import { registerFormatCommand } from "./commands/format.js";
import { registerHooksCommand } from "./commands/hooks.js";
import { registerIngestCommand } from "./commands/ingest.js";
import { registerIndexCommand } from "./commands/index.js";
import { registerInitCommand } from "./commands/init.js";
import { registerMemoryCommand } from "./commands/memory.js";
import { registerNativeCommand } from "./commands/native.js";
import { registerReadCommand } from "./commands/read.js";
import { registerRunCommand } from "./commands/run.js";
import { registerRulesCommand } from "./commands/rules.js";
import { registerSelfCommand } from "./commands/self.js";
import { registerSpecCommand } from "./commands/spec.js";
import { registerStatsCommand } from "./commands/stats.js";
import { registerReleaseCommand } from "./commands/release.js";
import { SOTURAIL_VERSION } from "./core/version.js";

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("soturail")
    .description("Local-first Context OS rails for AI coding agents.")
    .version(SOTURAIL_VERSION)
    .showHelpAfterError();

  registerInitCommand(program);
  registerIndexCommand(program);
  registerReadCommand(program);
  registerRunCommand(program);
  registerBenchCommand(program);
  registerDedupeCommand(program);
  registerExpandCommand(program);
  registerFormatCommand(program);
  registerHooksCommand(program);
  registerIngestCommand(program);
  registerSpecCommand(program);
  registerMemoryCommand(program);
  registerNativeCommand(program);
  registerRulesCommand(program);
  registerReleaseCommand(program);
  registerSelfCommand(program);
  registerDoctorCommand(program);
  registerStatsCommand(program);

  return program;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  buildProgram().parseAsync(process.argv).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`SotuRail error: ${message}\n`);
    process.exitCode = 1;
  });
}
