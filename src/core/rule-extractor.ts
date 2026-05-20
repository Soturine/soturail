import { createHash } from "node:crypto";
import type { IngestedDocument } from "./document-ingest.js";

export type RuleSeverity = "low" | "medium" | "high";
export type ValidationType =
  | "package_json_check"
  | "required_file"
  | "forbidden_file"
  | "readme_section"
  | "ci_workflow"
  | "documentation_presence"
  | "manual_check";

export interface ExtractedRule {
  id: string;
  title: string;
  description: string;
  source_file: string;
  source_section: string;
  severity: RuleSeverity;
  validation_type: ValidationType;
  suggested_validator_name: string;
  created_at: string;
  content_hash: string;
}

const RULE_SIGNAL = /\b(must|shall|required|requires|should|forbid|forbidden|never|minimum|include|presence|license|changelog|readme|node\.?js|ci workflow|agents\.md|claude\.md|gemini\.md)\b/i;

export function extractRules(document: IngestedDocument, now = new Date().toISOString()): ExtractedRule[] {
  const rules: ExtractedRule[] = [];
  for (const section of document.sections) {
    const candidates = section.content
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, ""))
      .filter((line) => line.length > 0 && RULE_SIGNAL.test(line));
    candidates.forEach((candidate) => {
      const validationType = inferValidationType(candidate);
      const title = titleFrom(candidate);
      const id = stableId(`${document.source_file}:${section.title}:${candidate}`);
      rules.push({
        id,
        title,
        description: candidate,
        source_file: document.source_file,
        source_section: section.title,
        severity: inferSeverity(candidate),
        validation_type: validationType,
        suggested_validator_name: validatorName(validationType, title),
        created_at: now,
        content_hash: createHash("sha256").update(candidate).digest("hex")
      });
    });
  }
  return dedupeRules(rules);
}

function stableId(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 12);
}

function titleFrom(line: string): string {
  const clean = line.replace(/[`*_]/g, "").replace(/[.:;]$/, "");
  const words = clean.split(/\s+/).slice(0, 8).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function inferSeverity(line: string): RuleSeverity {
  if (/\b(must|shall|required|never|forbidden|security|minimum)\b/i.test(line)) {
    return "high";
  }
  if (/\b(should|recommended|include)\b/i.test(line)) {
    return "medium";
  }
  return "low";
}

function inferValidationType(line: string): ValidationType {
  if (/\bpackage\.json|node\.?js|version|engines\b/i.test(line)) {
    return "package_json_check";
  }
  if (/\b(readme section|section named|README required sections)\b/i.test(line)) {
    return "readme_section";
  }
  if (/\bci workflow|\.github\/workflows|github actions\b/i.test(line)) {
    return "ci_workflow";
  }
  if (/\b(forbidden file|must not include|never commit)\b/i.test(line)) {
    return "forbidden_file";
  }
  if (/\b(README|LICENSE|CHANGELOG|AGENTS\.md|CLAUDE\.md|GEMINI\.md|SECURITY\.md|CONTRIBUTING\.md)\b/.test(line)) {
    return "required_file";
  }
  if (/\bdocs|documentation|changelog|license\b/i.test(line)) {
    return "documentation_presence";
  }
  return "manual_check";
}

function validatorName(type: ValidationType, title: string): string {
  const safe = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
  return `${type}_${safe || "rule"}`;
}

function dedupeRules(rules: ExtractedRule[]): ExtractedRule[] {
  const seen = new Set<string>();
  const result: ExtractedRule[] = [];
  for (const rule of rules) {
    if (!seen.has(rule.id)) {
      seen.add(rule.id);
      result.push(rule);
    }
  }
  return result;
}

export function rulesToYaml(rules: ExtractedRule[]): string {
  return `${rules
    .map((rule) =>
      [
        `- id: ${rule.id}`,
        `  title: ${yamlString(rule.title)}`,
        `  description: ${yamlString(rule.description)}`,
        `  source_file: ${yamlString(rule.source_file)}`,
        `  source_section: ${yamlString(rule.source_section)}`,
        `  severity: ${rule.severity}`,
        `  validation_type: ${rule.validation_type}`,
        `  suggested_validator_name: ${rule.suggested_validator_name}`,
        `  created_at: ${rule.created_at}`,
        `  content_hash: ${rule.content_hash}`
      ].join("\n")
    )
    .join("\n")}\n`;
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

export function parseRulesYaml(yaml: string): ExtractedRule[] {
  const blocks = yaml.split(/\n(?=- id: )/).filter((block) => block.trim().length > 0);
  return blocks.map((block) => {
    const record: Record<string, string> = {};
    for (const line of block.split(/\r?\n/)) {
      const match = line.match(/^\s*-?\s*([a-z_]+):\s*(.*)$/);
      if (match?.[1]) {
        const value = match[2] ?? "";
        record[match[1]] = value.startsWith("\"") ? JSON.parse(value) as string : value;
      }
    }
    return record as unknown as ExtractedRule;
  });
}
