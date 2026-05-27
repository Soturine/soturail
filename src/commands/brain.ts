import type { Command } from "commander";
import { brainDoctor, brainProfile, consolidateBrain, exportBrain, initBrain, recallBrain, scanBrain, staleBrain, type BrainAgentTarget } from "../core/project-brain.js";

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

  brain.command("stale").description("Check evidence hashes and write stale/suspect events.").option("--repair-plan", "Write a safe stale evidence repair plan").action(async (options: { repairPlan?: boolean }) => {
    process.stdout.write((await staleBrain(process.cwd(), { repairPlan: options.repairPlan === true })).output);
  });

  brain.command("consolidate").description("Group duplicate and near-duplicate Project Brain claims without deleting history.").option("--dry-run", "Report only; preserve append-only history", true).action(async (options: { dryRun?: boolean }) => {
    process.stdout.write((await consolidateBrain(process.cwd(), { dryRun: options.dryRun !== false })).output);
  });

  brain.command("doctor").description("Check Project Brain storage, JSONL health, freshness and exports.").option("--json", "Print machine-readable doctor report").option("--repair-plan", "Also write stale repair guidance").action(async (options: { json?: boolean; repairPlan?: boolean }) => {
    const result = await brainDoctor(process.cwd(), { repairPlan: options.repairPlan === true });
    process.stdout.write(options.json ? `${JSON.stringify(result.report, null, 2)}\n` : result.output);
  });

  brain.command("export").description("Export an agent-safe Project Brain brief.").requiredOption("--agent <agent>", "claude, codex, gemini, cursor, or generic").option("--limit <count>", "Maximum items per section", "10").option("--include-suspect", "Include suspect claims in warning sections").action(async (options: { agent: string; limit?: string; includeSuspect?: boolean }) => {
    process.stdout.write((await exportBrain(parseBrainAgent(options.agent), process.cwd(), {
      limit: Number.parseInt(options.limit ?? "10", 10) || 10,
      includeSuspect: options.includeSuspect === true
    })).output);
  });
}

function parseBrainAgent(value: string): BrainAgentTarget {
  if ((brainAgents as readonly string[]).includes(value)) return value as BrainAgentTarget;
  throw new Error(`Unknown brain export agent "${value}". Supported: ${brainAgents.join(", ")}.`);
}
