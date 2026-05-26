import path from "node:path";
import type { Command } from "commander";
import { buildAllContextPacks, buildContextPack, contextDoctor, explainContextPacks, type ContextTarget } from "../core/context-pack.js";
import {
  buildRolePack,
  contextBudget,
  offloadContext,
  parseRolePack,
  pruneContext,
  renderSelection,
  restoreOffload,
  routeContext,
  selectContext
} from "../core/context-intelligence.js";

const targets = ["claude", "codex", "gemini", "cursor", "antigravity", "generic", "all"] as const;

export function registerContextCommand(program: Command): void {
  const context = program.command("context").description("Build cache-friendly prompt/context packs.");

  context
    .command("pack")
    .description("Generate an agent target pack or role-specific context pack.")
    .option("--target <target>", "claude, codex, gemini, cursor, antigravity, generic, or all")
    .option("--role <role>", "planner, executor, reviewer, release-manager, or researcher")
    .action(async (options: { target?: string; role?: string }) => {
      if (options.role) {
        const result = await buildRolePack(parseRolePack(options.role));
        process.stdout.write(`Role context pack written: ${path.normalize(path.relative(process.cwd(), result.path))}\n`);
        return;
      }
      if (!options.target) {
        throw new Error("Use context pack --target <target> or context pack --role <role>.");
      }
      const target = parseTarget(options.target);
      if (target === "all") {
        const results = await buildAllContextPacks();
        process.stdout.write(`Context packs written:\n${results.map((result) => path.normalize(path.relative(process.cwd(), result.path))).join("\n")}\n`);
      } else {
        const result = await buildContextPack(target);
        process.stdout.write(`Context pack written: ${path.normalize(path.relative(process.cwd(), result.path))}\n`);
      }
    });

  context
    .command("select")
    .description("Select task-relevant local files and memory with reasons.")
    .requiredOption("--query <query>", "Task description")
    .option("--limit <count>", "Maximum selected items", "10")
    .action(async (options: { query: string; limit: string }) => {
      process.stdout.write(renderSelection(await selectContext(options.query, Number.parseInt(options.limit, 10) || 10)));
    });

  context
    .command("prune")
    .description("Select compact task context under a local token budget.")
    .requiredOption("--query <query>", "Task description")
    .option("--budget <tokens>", "Estimated token budget", "8000")
    .action(async (options: { query: string; budget: string }) => {
      process.stdout.write(await pruneContext(options.query, Number.parseInt(options.budget, 10) || 8000));
    });

  context.command("offload").description("Offload a long file or raw_id into local context storage.").argument("<input>", "raw_id or local file").action(async (input: string) => {
    const record = await offloadContext(input);
    process.stdout.write([
      "SotuRail context offload",
      `offload_id: ${record.id}`,
      `path: ${path.normalize(path.relative(process.cwd(), record.path))}`,
      `estimated_tokens: ${record.estimatedTokens}`,
      `summary: ${record.summary}`,
      `recovery: soturail context restore ${record.id}`
    ].join("\n") + "\n");
  });

  context.command("restore").description("Restore an offloaded context artifact.").argument("<offload-id>", "Offload id").action(async (id: string) => {
    process.stdout.write(await restoreOffload(id));
  });

  context
    .command("budget")
    .description("Estimate context cost drivers before agent handoff.")
    .option("--target <target>", "agent target", "generic")
    .option("--explain", "Include recommendations")
    .action(async (options: { target: string; explain?: boolean }) => {
      process.stdout.write(await contextBudget(options.target, options.explain === true));
    });

  context
    .command("route")
    .description("Route a task to a deterministic local context expert.")
    .requiredOption("--query <query>", "Task description")
    .option("--role <role>", "Optional role override for handoff display")
    .action((options: { query: string; role?: string }) => {
      const result = routeContext(options.query);
      process.stdout.write([
        "SotuRail context route",
        `query: ${options.query}`,
        `expert: ${result.expert}`,
        `role: ${options.role ?? result.role}`,
        `reason: ${result.reason}`,
        "next: soturail context select --query \"<task>\""
      ].join("\n") + "\n");
    });

  context.command("explain").description("Explain context pack cache ordering.").action(() => {
    process.stdout.write(explainContextPacks());
  });

  context.command("doctor").description("Check context pack workspace state.").action(async () => {
    process.stdout.write(await contextDoctor());
  });
}

function parseTarget(value: string): ContextTarget | "all" {
  if ((targets as readonly string[]).includes(value)) return value as ContextTarget | "all";
  throw new Error(`Unknown context target "${value}".`);
}
