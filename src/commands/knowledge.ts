import path from "node:path";
import type { Command } from "commander";
import { compileKnowledge, estimateKnowledge, listKnowledge, renderKnowledgeList, updateKnowledge, verifyKnowledge } from "../core/knowledge-rail.js";

export function registerKnowledgeCommand(program: Command): void {
  const knowledge = program.command("knowledge").description("Compile deterministic local source-backed knowledge packs.");
  knowledge.command("estimate").argument("<paths...>", "Local source paths").action(async (paths: string[]) => {
    process.stdout.write(`${JSON.stringify(await estimateKnowledge(paths), null, 2)}\n`);
  });
  knowledge.command("compile").argument("<paths...>", "Local source paths").requiredOption("--name <name>", "Knowledge pack name").action(async (paths: string[], options: { name: string }) => {
    const result = await compileKnowledge(options.name, paths);
    process.stdout.write(`Knowledge compiled: ${result.metadata.name}\nsources: ${result.metadata.sourceCount}\npath: ${path.normalize(path.relative(process.cwd(), result.dir))}\n`);
  });
  knowledge.command("update").argument("<name>", "Knowledge pack name").argument("<paths...>", "Additional or refreshed source paths").action(async (name: string, paths: string[]) => {
    const result = await updateKnowledge(name, paths);
    process.stdout.write(`Knowledge updated: ${result.metadata.name}\nsources: ${result.metadata.sourceCount}\npath: ${path.normalize(path.relative(process.cwd(), result.dir))}\n`);
  });
  knowledge.command("verify").argument("<name>", "Knowledge pack name").action(async (name: string) => {
    const report = await verifyKnowledge(name);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.status === "unverified") process.exitCode = 1;
  });
  knowledge.command("list").action(async () => {
    process.stdout.write(renderKnowledgeList(await listKnowledge()));
  });
}
