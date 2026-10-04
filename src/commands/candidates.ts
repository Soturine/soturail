import { promises as fs } from "node:fs";
import type { Command } from "commander";
import { listCandidates, recordCandidate } from "../core/candidate-store.js";
import { WorkspaceGuard } from "../core/workspace-guard.js";

export function registerCandidatesCommand(program: Command): void {
  const candidates = program.command("candidates").description("Record and list Semantic Worker candidate artifacts (never verified by recording).");

  candidates.command("record").description("Record one candidate draft from a JSON file.").requiredOption("--file <path>", "Project-relative JSON file with the candidate draft").option("--json", "Print JSON").action(async (options: { file: string; json?: boolean }) => {
    const file = await new WorkspaceGuard(process.cwd()).assertAllowedRead(options.file);
    const stored = await recordCandidate(JSON.parse(await fs.readFile(file, "utf8")), process.cwd());
    if (options.json) process.stdout.write(`${JSON.stringify(stored, null, 2)}\n`);
    else process.stdout.write(`Recorded ${stored.candidate.kind} ${stored.candidate.id} [${stored.candidate.verificationState}] at ${stored.path}\n`);
  });

  candidates.command("list").description("List recorded candidates with workspace freshness.").option("--kind <kind>", "claim, impact, decision, question or interpretation").option("--json", "Print JSON").action(async (options: { kind?: string; json?: boolean }) => {
    const views = await listCandidates(process.cwd(), options.kind ? { kind: options.kind } : {});
    if (options.json) process.stdout.write(`${JSON.stringify({ schemaVersion: "soturail.candidate.list.v1", candidates: views }, null, 2)}\n`);
    else process.stdout.write(["SotuRail candidates", `count: ${views.length}`, ...views.map((view) => `- ${view.candidate.id} ${view.candidate.kind} [${view.candidate.verificationState}, ${view.freshness}] ${view.path}`), ""].join("\n"));
  });
}
