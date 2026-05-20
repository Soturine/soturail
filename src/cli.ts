#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerExpandCommand } from "./commands/expand.js";
import { registerIndexCommand } from "./commands/index.js";
import { registerInitCommand } from "./commands/init.js";
import { registerMemoryCommand } from "./commands/memory.js";
import { registerReadCommand } from "./commands/read.js";
import { registerRunCommand } from "./commands/run.js";
import { registerSpecCommand } from "./commands/spec.js";
import { registerStatsCommand } from "./commands/stats.js";

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("soturail")
    .description("Local-first Context OS rails for AI coding agents.")
    .version("0.1.0")
    .showHelpAfterError();

  registerInitCommand(program);
  registerIndexCommand(program);
  registerReadCommand(program);
  registerRunCommand(program);
  registerExpandCommand(program);
  registerSpecCommand(program);
  registerMemoryCommand(program);
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
