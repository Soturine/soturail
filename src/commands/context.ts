import path from "node:path";
import type { Command } from "commander";
import { buildAllContextPacks, buildContextPack, contextDoctor, explainContextPacks, type ContextTarget } from "../core/context-pack.js";

const targets = ["claude", "codex", "gemini", "cursor", "antigravity", "generic", "all"] as const;

export function registerContextCommand(program: Command): void {
  const context = program.command("context").description("Build cache-friendly prompt/context packs.");

  context
    .command("pack")
    .description("Generate a context pack for an agent target.")
    .requiredOption("--target <target>", "claude, codex, gemini, cursor, antigravity, generic, or all")
    .action(async (options: { target: string }) => {
      const target = parseTarget(options.target);
      if (target === "all") {
        const results = await buildAllContextPacks();
        process.stdout.write(`Context packs written:\n${results.map((result) => path.normalize(path.relative(process.cwd(), result.path))).join("\n")}\n`);
      } else {
        const result = await buildContextPack(target);
        process.stdout.write(`Context pack written: ${path.normalize(path.relative(process.cwd(), result.path))}\n`);
      }
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
