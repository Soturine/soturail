import { createHash } from "node:crypto";
import { z } from "zod";

export const SkillTargetSchema = z.enum(["claude", "codex", "gemini", "cursor", "generic"]);
export type SkillTarget = z.infer<typeof SkillTargetSchema>;

export const SkillMetadataSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().min(1),
  author: z.string().min(1),
  risk_level: z.enum(["low", "medium", "high"]),
  targets: z.array(SkillTargetSchema).min(1),
  allowed_tools: z.array(z.string()).default([]),
  forbidden_patterns: z.array(z.string()).default([]),
  requires_human_approval: z.array(z.string()).default([]),
  created_at: z.string().min(1),
  content_hash: z.string().regex(/^[a-f0-9]{64}$/)
});

export type SkillMetadata = z.infer<typeof SkillMetadataSchema>;

export interface SkillRecord {
  metadata: SkillMetadata;
  markdown: string;
  dir: string;
}

export const defaultForbiddenPatterns = [
  "rm -rf",
  "curl | sh",
  "git push",
  "cat .env",
  "printenv | curl",
  "secret exfiltration"
];
export const defaultHumanApprovals = ["destructive_command", "remote_write", "dependency_install"];

export function slugifySkillName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "skill";
}

export function stableSkillHash(metadata: Omit<SkillMetadata, "content_hash">, markdown: string): string {
  const normalized = JSON.stringify({ ...metadata, content_hash: undefined, markdown });
  return createHash("sha256").update(normalized).digest("hex");
}

export function stringifySkillYaml(metadata: SkillMetadata): string {
  const scalar = (value: string) => value.includes(":") || value.includes("#") ? JSON.stringify(value) : value;
  const lines: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${scalar(item)}`);
    } else {
      lines.push(`${key}: ${scalar(String(value))}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

export function parseSkillYaml(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let currentArray: string | null = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const arrayMatch = line.match(/^([A-Za-z0-9_]+):\s*$/);
    if (arrayMatch?.[1]) {
      currentArray = arrayMatch[1];
      result[currentArray] = [];
      continue;
    }
    const itemMatch = line.match(/^\s*-\s*(.+)$/);
    if (itemMatch?.[1] && currentArray && Array.isArray(result[currentArray])) {
      (result[currentArray] as string[]).push(unquote(itemMatch[1].trim()));
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv?.[1]) {
      currentArray = null;
      result[kv[1]] = unquote(kv[2] ?? "");
    }
  }
  return result;
}

function unquote(value: string): string {
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  return value;
}
