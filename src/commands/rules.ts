import { promises as fs } from "node:fs";
import type { Command } from "commander";
import { ensureWorkspace, getWorkspacePaths } from "../core/config.js";
import { MetricsStore } from "../core/metrics-store.js";
import { parseRulesYaml, rulesToYaml, type ExtractedRule } from "../core/rule-extractor.js";
import { validateRules } from "../core/rule-validator.js";

async function readRules(root = process.cwd()): Promise<ExtractedRule[]> {
  const paths = getWorkspacePaths(root);
  try {
    return parseRulesYaml(await fs.readFile(paths.rulesFile, "utf8"));
  } catch {
    return [];
  }
}

export async function listRules(root = process.cwd()): Promise<string> {
  const rules = await readRules(root);
  if (rules.length === 0) {
    return "No rules found. Run soturail ingest <file> --type docs first.\n";
  }
  return `${rules.map((rule) => `${rule.id} [${rule.severity}] ${rule.title} (${rule.validation_type})`).join("\n")}\n`;
}

export async function checkRules(root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const rules = await readRules(root);
  const results = await validateRules(rules, root);
  const success = results.filter((item) => item.ok).length;
  const failure = results.length - success;
  await new MetricsStore(root).append({
    type: "rules_check",
    details: { validator_success_count: success, validator_failure_count: failure, rules_count: rules.length }
  });
  return [
    "SotuRail rules check",
    `rules: ${rules.length}`,
    `validator_success_count: ${success}`,
    `validator_failure_count: ${failure}`,
    ...results.map((item) => `${item.ok ? "OK" : "FAIL"} ${item.rule_id} ${item.title}: ${item.message}`)
  ].join("\n") + "\n";
}

export async function exportRules(format: string, root = process.cwd()): Promise<string> {
  const rules = await readRules(root);
  if (format === "json") {
    return `${JSON.stringify(rules, null, 2)}\n`;
  }
  if (format === "yaml") {
    return rulesToYaml(rules);
  }
  throw new Error(`Unknown export format "${format}".`);
}

export function registerRulesCommand(program: Command): void {
  const rules = program.command("rules").description("List, validate and export extracted SotuRail rules.");
  rules.command("list").description("List extracted rules.").action(async () => {
    process.stdout.write(await listRules());
  });
  rules.command("check").description("Run deterministic rule validators.").action(async () => {
    process.stdout.write(await checkRules());
  });
  rules.command("export").description("Export rules as yaml or json.").option("--format <format>", "yaml or json", "yaml").action(async (options: { format: string }) => {
    process.stdout.write(await exportRules(options.format));
  });
}
