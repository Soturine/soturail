import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { ensureWorkspace, getWorkspacePaths, writeJson } from "../core/config.js";
import { ingestDocument, isIngestType, type IngestType } from "../core/document-ingest.js";
import { MetricsStore } from "../core/metrics-store.js";
import { extractRules, rulesToYaml } from "../core/rule-extractor.js";

export interface IngestOptions {
  type?: string;
}

export async function ingestCommand(file: string, options: IngestOptions = {}, root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const type = options.type ?? "docs";
  if (!isIngestType(type)) {
    throw new Error(`Unknown ingest type "${type}".`);
  }
  const paths = getWorkspacePaths(root);
  const document = await ingestDocument(file, type as IngestType, root);
  const rules = extractRules(document);
  await fs.mkdir(paths.rulesValidatorsDir, { recursive: true });
  await fs.writeFile(paths.rulesFile, rulesToYaml(rules), "utf8");
  await fs.writeFile(
    paths.rulesChecklist,
    `# SotuRail Rules Checklist\n\n${rules.map((rule) => `- [ ] ${rule.title} (${rule.severity})`).join("\n")}\n`,
    "utf8"
  );
  await writeJson(paths.rulesCitations, rules.map((rule) => ({
    id: rule.id,
    source_file: rule.source_file,
    source_section: rule.source_section,
    content_hash: rule.content_hash
  })));
  await new MetricsStore(root).append({
    type: "rules_ingest",
    details: {
      file: path.normalize(file).replace(/\\/g, "/"),
      ingest_type: type,
      extracted_rules_count: rules.length,
      citations_count: rules.length
    }
  });
  return [
    `Ingested ${document.source_file} as ${type}.`,
    `Extracted rules: ${rules.length}`,
    `Rules: ${path.normalize(path.relative(root, paths.rulesFile)).replace(/\\/g, "/")}`,
    `Checklist: ${path.normalize(path.relative(root, paths.rulesChecklist)).replace(/\\/g, "/")}`,
    `Citations: ${path.normalize(path.relative(root, paths.rulesCitations)).replace(/\\/g, "/")}`
  ].join("\n") + "\n";
}

export function registerIngestCommand(program: Command): void {
  program
    .command("ingest")
    .description("Ingest Markdown, TXT, JSON or YAML into structured local rules.")
    .argument("<file>", "Source file")
    .option("--type <type>", "rules, requirements, docs, or course", "docs")
    .action(async (file: string, options: IngestOptions) => {
      process.stdout.write(await ingestCommand(file, options));
    });
}
