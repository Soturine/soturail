import type { Writable } from "node:stream";
import type { Command } from "commander";
import { ensureWorkspace } from "../core/config.js";
import { MetricsStore } from "../core/metrics-store.js";
import { NativeRunnerAdapter, type RunnerOptions } from "../core/native-runner-adapter.js";
import { RawStore, type RawRunRecord } from "../core/raw-store.js";
import { validateCommand } from "../core/safety-policy.js";
import { estimateTokens } from "../core/token-estimator.js";
import { compressOutput } from "../compressors/index.js";

export interface RunCliOptions {
  interactive?: boolean;
  unsafeConfirm?: string;
}

export interface RunExecutionOptions extends RunCliOptions {
  terminalStdout?: Writable;
  terminalStderr?: Writable;
}

export interface RunExecutionResult {
  rawId: string;
  exitCode: number;
  summary: string;
  record: RawRunRecord;
}

function commandFromParts(parts: string[]): string {
  return parts.join(" ").trim();
}

export async function executeRunCommand(
  commandParts: string[],
  options: RunExecutionOptions = {},
  root = process.cwd()
): Promise<RunExecutionResult> {
  await ensureWorkspace(root);
  const command = commandFromParts(commandParts);
  if (command.length === 0) {
    throw new Error("No command provided. Example: soturail run npm test");
  }

  const validation = validateCommand(command, options.unsafeConfirm);
  if (!validation.ok) {
    throw new Error(validation.reason ?? "Command blocked by SotuRail safety policy.");
  }

  if (validation.bypassed) {
    options.terminalStderr?.write(
      `SotuRail safety bypass accepted for ${validation.matchedPattern ?? "dangerous command"}.\n`
    );
  }

  if (options.interactive) {
    options.terminalStderr?.write(
      "Interactive mode: stdin is forwarded when possible; compression may be partial for watch/TTY sessions.\n"
    );
  }

  const rawStore = new RawStore(root);
  const metrics = new MetricsStore(root);
  const log = await rawStore.createLog(command);
  const adapter = new NativeRunnerAdapter();
  const runnerOptions: RunnerOptions = {
    command,
    cwd: root,
    interactive: options.interactive === true,
    rawLogStream: log.stream
  };
  if (options.terminalStdout) {
    runnerOptions.terminalStdout = options.terminalStdout;
  }
  if (options.terminalStderr) {
    runnerOptions.terminalStderr = options.terminalStderr;
  }

  const result = await adapter.run(runnerOptions);
  const compression = compressOutput(command, result.rawText, log.rawId);
  const record: RawRunRecord = {
    raw_id: log.rawId,
    path: log.relativePath,
    command,
    exit_code: result.exitCode,
    created_at: log.createdAt,
    compressor: compression.compressor,
    raw_tokens_estimated: estimateTokens(result.rawText),
    compressed_tokens_estimated: compression.compressed_tokens_estimated
  };
  await rawStore.appendRunRecord(record);
  await metrics.append({
    type: "command_run",
    raw_id: log.rawId,
    command,
    exit_code: result.exitCode,
    raw_tokens_estimated: record.raw_tokens_estimated,
    compressed_tokens_estimated: record.compressed_tokens_estimated
  });

  const summary = [
    "",
    "SotuRail run complete.",
    `Exit code: ${result.exitCode}`,
    `Compressor: ${compression.compressor}`,
    `raw_id: ${log.rawId}`,
    `Recovery: soturail expand ${log.rawId}`,
    "",
    compression.summary
  ].join("\n");

  return {
    rawId: log.rawId,
    exitCode: result.exitCode,
    summary,
    record
  };
}

export function registerRunCommand(program: Command): void {
  program
    .command("run")
    .description("Run a command through the safe tee-stream runner.")
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .option("--interactive", "Forward stdin/TTY behavior when possible")
    .option("--unsafe-confirm <phrase>", "Exact phrase required to bypass dangerous-command blocking")
    .argument("[command...]", "Command and arguments to execute")
    .action(async (commandParts: string[] = [], options: RunCliOptions) => {
      const runOptions: RunExecutionOptions = {
        terminalStdout: process.stdout,
        terminalStderr: process.stderr
      };
      if (options.interactive !== undefined) {
        runOptions.interactive = options.interactive;
      }
      if (options.unsafeConfirm !== undefined) {
        runOptions.unsafeConfirm = options.unsafeConfirm;
      }
      const result = await executeRunCommand(commandParts, runOptions);
      process.stdout.write(result.summary);
      process.exitCode = result.exitCode;
    });
}
