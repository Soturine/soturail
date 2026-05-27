import type { Command } from "commander";
import { brainDoctor, brainProfile, exportBrain, initBrain, recallBrain, scanBrain, staleBrain, type BrainAgentTarget } from "../core/project-brain.js";

const brainAgents = ["claude", "codex", "gemini", "cursor", "generic"] as const;

export function registerBrainCommand(program: Command): void {
  const brain = program.command("brain").description("Manage the verified local Project Brain.");

  brain.command("init").description("Create Project Brain JSONL storage, JSON views and export folders.").action(async () => {
    process.stdout.write((await initBrain()).output);
  });

  brain.command("scan").description("Scan local project evidence into Project Brain views and claims.").action(async () => {
    process.stdout.write((await scanBrain()).output);
  });

  brain.command("profile").description("Print the current Project Brain profile.").action(async () => {
    process.stdout.write(await brainProfile());
  });

  brain.command("recall").description("Recall claims, decisions, bugs, gaps and rules by local scoring.").argument("<query>", "Search query").option("--limit <count>", "Maximum results", "8").action(async (query: string, options: { limit: string }) => {
    process.stdout.write(await recallBrain(query, process.cwd(), Number.parseInt(options.limit, 10) || 8));
  });

  brain.command("stale").description("Check evidence hashes and write stale/suspect events.").action(async () => {
    process.stdout.write((await staleBrain()).output);
  });

  brain.command("doctor").description("Check Project Brain storage, JSONL health, freshness and exports.").action(async () => {
    process.stdout.write((await brainDoctor()).output);
  });

  brain.command("export").description("Export an agent-safe Project Brain brief.").requiredOption("--agent <agent>", "claude, codex, gemini, cursor, or generic").action(async (options: { agent: string }) => {
    process.stdout.write((await exportBrain(parseBrainAgent(options.agent))).output);
  });
}

function parseBrainAgent(value: string): BrainAgentTarget {
  if ((brainAgents as readonly string[]).includes(value)) return value as BrainAgentTarget;
  throw new Error(`Unknown brain export agent "${value}". Supported: ${brainAgents.join(", ")}.`);
}
