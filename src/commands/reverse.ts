import type { Command } from "commander";
import { reverseClaims, reverseExport, reverseGaps, reverseScan, reverseSpecs } from "../core/reverse-specification.js";

export function registerReverseCommand(program: Command): void {
  const reverse = program.command("reverse").description("Derive deterministic reverse specs, claims and gaps from local source evidence.");

  reverse.command("scan").description("Scan source/docs/tests and write a reverse scan report.").argument("<target>", "Directory or file to scan").action(async (target: string) => {
    process.stdout.write((await reverseScan(target)).output);
  });

  reverse.command("claims").description("Extract deterministic source-backed claims into Project Brain JSONL.").argument("<target>", "Directory or file to scan").action(async (target: string) => {
    process.stdout.write((await reverseClaims(target)).output);
  });

  reverse.command("specs").description("Generate draft specs from Project Brain claims.").argument("<target>", "Directory or file to scan").action(async (target: string) => {
    process.stdout.write((await reverseSpecs(target)).output);
  });

  reverse.command("gaps").description("Generate gaps from missing evidence, docs or validation.").action(async () => {
    process.stdout.write((await reverseGaps()).output);
  });

  reverse.command("export").description("Export reverse specs and gaps for agent handoff.").requiredOption("--target <target>", "agent").action(async (options: { target: string }) => {
    process.stdout.write((await reverseExport(options.target)).output);
  });
}
