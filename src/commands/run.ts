import type { Writable } from "node:stream";
import { promises as fs } from "node:fs";
import type { Command } from "commander";
import { DedupeStore, sha256Text } from "../core/dedupe-store.js";
import { ensureWorkspace } from "../core/config.js";
import { MetricsStore } from "../core/metrics-store.js";
import { NativeRunnerAdapter, type RunnerOptions } from "../core/native-runner-adapter.js";
import { RawStore, type RawRunRecord } from "../core/raw-store.js";
import { validateCommand } from "../core/safety-policy.js";
import { estimateTokens } from "../core/token-estimator.js";
import { detectNativeEngine, runWithNative, type ReducerEngine } from "../core/native-engine.js";
import { compressOutputWithEngine } from "../compressors/index.js";

export interface RunCliOptions {
  interactive?: boolean;
  unsafeConfirm?: string;
  native?: boolean;
  engine?: ReducerEngine;
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
  if (parts.length === 1) {
    return parts[0]?.trim() ?? "";
  }
  return parts.map(shellQuoteIfNeeded).join(" ").trim();
}

function shellQuoteIfNeeded(part: string): string {
  if (!/\s/.test(part)) {
    return part;
  }
  if ((part.startsWith("\"") && part.endsWith("\"")) || (part.startsWith("'") && part.endsWith("'"))) {
    return part;
  }
  return `"${part.replace(/(["\\$`])/g, "\\$1")}"`;
}

function normalizeEngine(value: ReducerEngine | undefined): ReducerEngine {
  if (value === undefined) {
    return "auto";
  }
  if (["auto", "ts", "native"].includes(value)) {
    return value;
  }
  throw new Error(`Unknown reducer engine "${value}". Use auto, ts, or native.`);
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

  const requestedEngine = options.native ? "native" : normalizeEngine(options.engine);
  const nativeInfo = requestedEngine === "ts" ? { available: false } : await detectNativeEngine(root);
  if (requestedEngine === "native" && !nativeInfo.available) {
    throw new Error("Native engine requested but soturail-native was not found. Run npm run build:native or use --engine ts.");
  }
  const rawStore = new RawStore(root);
  const metrics = new MetricsStore(root);
  const dedupe = new DedupeStore(root);
  const log = await rawStore.createLog(command);

  const result = nativeInfo.available
    ? await runNativePath(commandParts, log, options, root)
    : await runTypeScriptPath(command, log.stream, options, root);
  const outputHash = sha256Text(result.rawText);
  const previous = await dedupe.findReusable(outputHash, result.exitCode);
  const compression = previous
    ? {
        compressor: "dedupe",
        summary: `Output identical to previous raw_id ${previous.raw_id}; use soturail expand ${previous.raw_id} for full output.\nCurrent raw log is still preserved as ${log.rawId}.\n`,
        compressed_tokens_estimated: estimateTokens(`Output identical to previous raw_id ${previous.raw_id}.`),
        engine: "ts" as const
      }
    : await compressOutputWithEngine(command, result.rawText, log.rawId, nativeInfo.available ? requestedEngine : "ts", root);
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
  const metadataTokens = estimateTokens([
    "SotuRail run complete.",
    `Exit code: ${result.exitCode}`,
    `Compressor: ${compression.compressor}`,
    `raw_id: ${log.rawId}`,
    `Recovery: soturail expand ${log.rawId}`,
    `Command: ${command}`
  ].join("\n"));
  const netTokens = record.compressed_tokens_estimated + metadataTokens;
  await rawStore.appendRunRecord(record);
  await dedupe.append({
    output_sha256: outputHash,
    raw_id: log.rawId,
    command,
    exit_code: result.exitCode,
    raw_path: log.relativePath,
    created_at: log.createdAt
  });
  if (previous) {
    await metrics.append({
      type: "dedupe_hit",
      raw_id: log.rawId,
      details: { previous_raw_id: previous.raw_id, output_sha256: outputHash }
    });
  }
  await metrics.append({
    type: "command_run",
    raw_id: log.rawId,
    command,
    exit_code: result.exitCode,
    raw_tokens_estimated: record.raw_tokens_estimated,
    compressed_tokens_estimated: record.compressed_tokens_estimated,
    estimated_raw_tokens: record.raw_tokens_estimated,
    estimated_reduced_payload_tokens: record.compressed_tokens_estimated,
    estimated_soturail_metadata_tokens: metadataTokens,
    estimated_net_tokens_sent: netTokens,
    summary_overhead_tokens: metadataTokens,
    compression_effective: netTokens <= record.raw_tokens_estimated,
    small_output_warning: netTokens > record.raw_tokens_estimated
  });

  const summary = [
    "",
    "SotuRail run complete.",
    `Exit code: ${result.exitCode}`,
    `Compressor: ${compression.compressor}`,
    `Engine: ${compression.engine}`,
    `raw_id: ${log.rawId}`,
    `Recovery: soturail expand ${log.rawId}`,
    ...(netTokens > record.raw_tokens_estimated
      ? ["Compression was not effective for this small command, but raw recovery paths and audit metadata were preserved."]
      : []),
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

async function runTypeScriptPath(
  command: string,
  rawLogStream: Writable,
  options: RunExecutionOptions,
  root: string
): Promise<{ exitCode: number; rawText: string }> {
  const adapter = new NativeRunnerAdapter();
  const runnerOptions: RunnerOptions = {
    command,
    cwd: root,
    interactive: options.interactive === true,
    rawLogStream
  };
  if (options.terminalStdout) {
    runnerOptions.terminalStdout = options.terminalStdout;
  }
  if (options.terminalStderr) {
    runnerOptions.terminalStderr = options.terminalStderr;
  }
  return adapter.run(runnerOptions);
}

async function runNativePath(
  commandParts: string[],
  log: Awaited<ReturnType<RawStore["createLog"]>>,
  options: RunExecutionOptions,
  root: string
): Promise<{ exitCode: number; rawText: string }> {
  await closeLogStream(log.stream);
  const summaryJsonPath = `${log.absolutePath}.summary.json`;
  const nativeOptions = {
    commandParts,
    rawLogPath: log.absolutePath,
    summaryJsonPath,
    cwd: root,
    interactive: options.interactive === true
  } as {
    commandParts: string[];
    rawLogPath: string;
    summaryJsonPath: string;
    cwd: string;
    interactive: boolean;
    terminalStdout?: Writable;
    terminalStderr?: Writable;
  };
  if (options.terminalStdout) {
    nativeOptions.terminalStdout = options.terminalStdout;
  }
  if (options.terminalStderr) {
    nativeOptions.terminalStderr = options.terminalStderr;
  }
  const native = await runWithNative(nativeOptions, root);
  if (!native) {
    throw new Error("Native engine was detected but native run failed to start.");
  }
  const rawText = await fs.readFile(log.absolutePath, "utf8");
  return { exitCode: native.exitCode, rawText };
}

async function closeLogStream(stream: Writable): Promise<void> {
  await new Promise<void>((resolve) => stream.end(resolve));
}

export function registerRunCommand(program: Command): void {
  program
    .command("run")
    .description("Run a command through the safe tee-stream runner.")
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .option("--interactive", "Forward stdin/TTY behavior when possible")
    .option("--native", "Prefer the optional native reducer engine")
    .option("--engine <engine>", "Reducer engine: auto, ts, or native", "auto")
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
      if (options.native !== undefined) {
        runOptions.native = options.native;
      }
      if (options.engine !== undefined) {
        runOptions.engine = options.engine;
      }
      const result = await executeRunCommand(commandParts, runOptions);
      process.stdout.write(result.summary);
      process.exitCode = result.exitCode;
    });
}
