import path from "node:path";
import type { Command } from "commander";
import { ensureWorkspace, loadConfig, relativeToRoot } from "../core/config.js";
import { scanRepository, writeRepoMap } from "../core/file-scanner.js";

export async function runIndex(root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const config = await loadConfig(root);
  const repoMap = await scanRepository(root, config);
  const written = await writeRepoMap(root, repoMap);
  const lines = [
    "Heuristic Repo Map written.",
    `Files indexed: ${repoMap.total_files}`,
    `Ignored files: ${repoMap.stats.ignored_files}`,
    `Ignored directories: ${repoMap.stats.ignored_directories}`,
    `Repo map: ${relativeToRoot(root, written.repoMapPath)}`,
    `Tree: ${relativeToRoot(root, written.treePath)}`
  ];
  return `${lines.join("\n")}\n`;
}

export function registerIndexCommand(program: Command): void {
  program
    .command("index")
    .description("Scan the repository and write a Heuristic Repo Map.")
    .action(async () => {
      const output = await runIndex(path.resolve(process.cwd()));
      process.stdout.write(output);
    });
}
