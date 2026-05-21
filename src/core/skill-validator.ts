import { promises as fs } from "node:fs";
import path from "node:path";
import { parseSkillYaml, SkillMetadataSchema, stableSkillHash, type SkillRecord } from "./skill-schema.js";
import { readSkills } from "./skill-store.js";

export interface SkillValidationIssue {
  skill_id: string;
  severity: "error" | "warning";
  message: string;
}

export interface SkillValidationResult {
  ok: boolean;
  skills_count: number;
  issues: SkillValidationIssue[];
}

const destructivePatterns = [
  /\brm\s+-[^"\n]*r[^"\n]*f\b/i,
  /\bcurl\b[^|\n]*\|\s*(sh|bash)\b/i,
  /\bwget\b[^|\n]*\|\s*(sh|bash)\b/i,
  /\bgit\s+push\b/i,
  /\bdd\s+[^"\n]*\bif=/i,
  /\bdel\s+\/s\b/i
];

const promptInjectionPatterns = [
  /ignore (all )?(previous|prior) instructions/i,
  /disregard (all )?(previous|prior) instructions/i,
  /you are no longer bound/i
];

const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/,
  /(password|api[_-]?key|secret)\s*[:=]\s*["']?[A-Za-z0-9_\-]{16,}/i
];

export async function validateSkills(root = process.cwd()): Promise<SkillValidationResult> {
  const skills = await readSkills(root);
  const issues: SkillValidationIssue[] = [];
  const seen = new Set<string>();

  for (const skill of skills) {
    await validateSkillFiles(skill, issues);
    if (seen.has(skill.metadata.id)) {
      issues.push({ skill_id: skill.metadata.id, severity: "error", message: "Duplicate skill id." });
    }
    seen.add(skill.metadata.id);

    const combined = `${skill.markdown}\n${JSON.stringify({ ...skill.metadata, forbidden_patterns: [] })}`;
    for (const pattern of destructivePatterns) {
      if (pattern.test(skill.markdown)) {
        issues.push({ skill_id: skill.metadata.id, severity: "error", message: `Hidden destructive command pattern detected: ${pattern}` });
      }
    }
    for (const pattern of promptInjectionPatterns) {
      if (pattern.test(combined)) {
        issues.push({ skill_id: skill.metadata.id, severity: "error", message: `Prompt-injection style instruction detected: ${pattern}` });
      }
    }
    for (const pattern of secretPatterns) {
      if (pattern.test(combined)) {
        issues.push({ skill_id: skill.metadata.id, severity: "error", message: "Probable embedded secret detected." });
      }
    }

    const { content_hash: _hash, ...withoutHash } = skill.metadata;
    const actual = stableSkillHash(withoutHash, skill.markdown);
    if (actual !== skill.metadata.content_hash) {
      issues.push({ skill_id: skill.metadata.id, severity: "error", message: "content_hash does not match skill.yml and SKILL.md content." });
    }
  }

  return {
    ok: issues.every((issue) => issue.severity !== "error"),
    skills_count: skills.length,
    issues
  };
}

export function formatSkillValidation(result: SkillValidationResult): string {
  const lines = [
    `Skill validation: ${result.ok ? "passed" : "failed"}`,
    `skills_count: ${result.skills_count}`
  ];
  if (result.issues.length === 0) {
    lines.push("issues: none");
  } else {
    for (const issue of result.issues) {
      lines.push(`- ${issue.severity.toUpperCase()} ${issue.skill_id}: ${issue.message}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

async function validateSkillFiles(skill: SkillRecord, issues: SkillValidationIssue[]): Promise<void> {
  const yamlPath = path.join(skill.dir, "skill.yml");
  const markdownPath = path.join(skill.dir, "SKILL.md");
  const rawYaml = await fs.readFile(yamlPath, "utf8").catch(() => "");
  const parsed = parseSkillYaml(rawYaml);
  const result = SkillMetadataSchema.safeParse(parsed);
  if (!result.success) {
    issues.push({
      skill_id: skill.metadata.id,
      severity: "error",
      message: `Invalid skill.yml: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`
    });
  }
  if (!await fs.access(markdownPath).then(() => true).catch(() => false)) {
    issues.push({ skill_id: skill.metadata.id, severity: "error", message: "Missing SKILL.md." });
  }
}
