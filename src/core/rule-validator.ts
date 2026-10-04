import { promises as fs } from "node:fs";
import path from "node:path";
import type { ExtractedRule } from "./rule-extractor.js";

export interface RuleCheckResult {
  rule_id: string;
  title: string;
  ok: boolean;
  validation_type: string;
  message: string;
}

async function exists(root: string, relativePath: string): Promise<boolean> {
  try {
    await fs.access(path.resolve(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function validateRules(rules: ExtractedRule[], root = process.cwd()): Promise<RuleCheckResult[]> {
  const results: RuleCheckResult[] = [];
  for (const rule of rules) {
    results.push(await validateRule(rule, root));
  }
  return results;
}

async function validateRule(rule: ExtractedRule, root: string): Promise<RuleCheckResult> {
  const text = `${rule.title} ${rule.description}`;
  switch (rule.validation_type) {
    case "package_json_check":
      return validatePackageJson(rule, root);
    case "required_file":
    case "documentation_presence":
      return validateRequiredFile(rule, root, text);
    case "forbidden_file":
      return validateForbiddenFile(rule, root, text);
    case "readme_section":
      return validateReadmeSections(rule, root, text);
    case "ci_workflow":
      return result(rule, await exists(root, ".github/workflows/ci.yml"), "checked .github/workflows/ci.yml");
    case "manual_check":
      return result(rule, true, "manual check recorded; no deterministic validator available");
  }
}

async function validatePackageJson(rule: ExtractedRule, root: string): Promise<RuleCheckResult> {
  try {
    const pkg = JSON.parse(await fs.readFile(path.resolve(root, "package.json"), "utf8")) as { engines?: { node?: string } };
    const node = pkg.engines?.node ?? "";
    const ok = /20|>=20|22|24/.test(node);
    return result(rule, ok, `package.json engines.node is ${node || "missing"}`);
  } catch {
    return result(rule, false, "package.json missing or invalid");
  }
}

async function validateRequiredFile(rule: ExtractedRule, root: string, text: string): Promise<RuleCheckResult> {
  const candidates = ["README.md", "LICENSE", "CHANGELOG.md", "AGENTS.md", "CLAUDE.md", "GEMINI.md", "SECURITY.md", "CONTRIBUTING.md"]
    .filter((file) => text.includes(file));
  if (candidates.length === 0) {
    return result(rule, true, "no exact required file name detected; manual review may still apply");
  }
  const missing = [];
  for (const file of candidates) {
    if (!(await exists(root, file))) {
      missing.push(file);
    }
  }
  return result(rule, missing.length === 0, missing.length === 0 ? `found ${candidates.join(", ")}` : `missing ${missing.join(", ")}`);
}

async function validateForbiddenFile(rule: ExtractedRule, root: string, text: string): Promise<RuleCheckResult> {
  const match = text.match(/(?:file|include|commit)\s+([.\w/-]+)/i);
  const file = match?.[1];
  if (!file) {
    return result(rule, true, "no exact forbidden file detected; manual review may still apply");
  }
  return result(rule, !(await exists(root, file)), `checked ${file}`);
}

async function validateReadmeSections(rule: ExtractedRule, root: string, text: string): Promise<RuleCheckResult> {
  const readme = await fs.readFile(path.resolve(root, "README.md"), "utf8").catch(() => "");
  const sectionMatch = text.match(/section named\s+["']?([^"'.]+)["']?/i);
  const required = sectionMatch?.[1]?.trim();
  if (!required) {
    return result(rule, readme.length > 0, "README.md exists; specific section not detected");
  }
  return result(rule, new RegExp(`^#+\\s+${escapeRegExp(required)}\\s*$`, "im").test(readme), `checked README section ${required}`);
}

function result(rule: ExtractedRule, ok: boolean, message: string): RuleCheckResult {
  return { rule_id: rule.id, title: rule.title, ok, validation_type: rule.validation_type, message };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
