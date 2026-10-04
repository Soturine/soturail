import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCapabilityDescriptor, type CapabilityDescriptorV2 } from "./capability-descriptor.js";
import { readSkills } from "./skill-store.js";
import { scanSkillText } from "./skill-validator.js";

// One Skill model for every source. Portable skills follow the Agent Skills
// specification (SKILL.md frontmatter + optional references/scripts/assets);
// v1.5 Skill Rail packs are adapted into the same model without rewriting them.

export const SKILL_MODEL_SCHEMA = "soturail.skill.v2" as const;
export const USES_METADATA_KEY = "soturail-uses";
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RESOURCE_DIRS = ["references", "scripts", "assets"] as const;
/** Marker written into directories SotuRail projected for a host; such copies are not separate skills. */
export const PROJECTION_MARKER = ".soturail-projection.json";

export type SkillSource = "bundled" | "project" | "legacy-pack";

export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  allowedTools?: string;
  metadata: Record<string, string>;
}

export interface SkillModel {
  schemaVersion: typeof SKILL_MODEL_SCHEMA;
  name: string;
  description: string;
  source: SkillSource;
  dir: string;
  frontmatter: SkillFrontmatter;
  /** Canonical capability IDs this skill may use. */
  uses: string[];
  body: string;
  resources: string[];
  digest: string;
}

export interface SkillIssue {
  skill: string;
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface SkillLevel1 {
  name: string;
  description: string;
}

/** Strict parser for the frontmatter subset the Agent Skills spec uses. */
export function parseSkillMarkdown(text: string): { frontmatter: SkillFrontmatter | null; body: string; errors: string[] } {
  const normalized = text.replace(/^﻿/, "");
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(normalized);
  if (!match) return { frontmatter: null, body: normalized, errors: ["SKILL.md has no YAML frontmatter."] };
  const errors: string[] = [];
  const fields: Record<string, string> = {};
  const metadata: Record<string, string> = {};
  let inMetadata = false;
  for (const raw of (match[1] ?? "").split(/\r?\n/)) {
    if (!raw.trim() || raw.trimStart().startsWith("#")) continue;
    const nested = /^\s+([A-Za-z0-9_.-]+):\s*(.*)$/.exec(raw);
    if (nested && inMetadata) {
      metadata[nested[1] ?? ""] = unquote(nested[2] ?? "");
      continue;
    }
    const top = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(raw);
    if (!top) {
      errors.push(`Unsupported frontmatter line: ${raw.trim()}`);
      continue;
    }
    const key = top[1] ?? "";
    inMetadata = key === "metadata" && (top[2] ?? "").trim() === "";
    if (!inMetadata) fields[key] = unquote(top[2] ?? "");
  }
  const frontmatter: SkillFrontmatter = { name: fields.name ?? "", description: fields.description ?? "", metadata };
  if (fields.license) frontmatter.license = fields.license;
  if (fields.compatibility) frontmatter.compatibility = fields.compatibility;
  if (fields["allowed-tools"]) frontmatter.allowedTools = fields["allowed-tools"];
  return { frontmatter, body: normalized.slice(match[0].length), errors };
}

export function renderSkillMarkdown(frontmatter: SkillFrontmatter, body: string): string {
  const lines = ["---", `name: ${frontmatter.name}`, `description: ${quote(frontmatter.description)}`];
  if (frontmatter.license) lines.push(`license: ${quote(frontmatter.license)}`);
  if (frontmatter.compatibility) lines.push(`compatibility: ${quote(frontmatter.compatibility)}`);
  if (frontmatter.allowedTools) lines.push(`allowed-tools: ${quote(frontmatter.allowedTools)}`);
  const keys = Object.keys(frontmatter.metadata).sort();
  if (keys.length) lines.push("metadata:", ...keys.map((key) => `  ${key}: ${quote(frontmatter.metadata[key] ?? "")}`));
  return `${lines.join("\n")}\n---\n\n${body.trim()}\n`;
}

export function validateSkillModel(skill: SkillModel): SkillIssue[] {
  const issues: SkillIssue[] = [];
  const issue = (severity: SkillIssue["severity"], code: string, message: string) => issues.push({ skill: skill.name, severity, code, message });
  const { frontmatter } = skill;
  if (!NAME_PATTERN.test(frontmatter.name) || frontmatter.name.length > 64) issue("error", "name_invalid", "name must be 1-64 lowercase letters, digits and single hyphens.");
  if (skill.source !== "legacy-pack" && path.basename(skill.dir) !== frontmatter.name) issue("error", "name_dir_mismatch", "name must match the skill directory name.");
  if (!frontmatter.description || frontmatter.description.length > 1024) issue("error", "description_invalid", "description must be 1-1024 characters.");
  if (frontmatter.compatibility && frontmatter.compatibility.length > 500) issue("error", "compatibility_too_long", "compatibility must be at most 500 characters.");
  if (skill.body.split(/\r?\n/).length > 500) issue("warning", "body_too_long", "Keep SKILL.md under 500 lines; move detail to references/.");
  for (const message of scanSkillText(skill.body, `${skill.body}\n${JSON.stringify(frontmatter)}`)) issue("error", "unsafe_content", message);
  for (const id of skill.uses) {
    const descriptor = getCapabilityDescriptor(id);
    if (!descriptor) issue("error", "capability_unknown", `Skill uses unknown capability: ${id}`);
    else if (descriptor.maturity === "deprecated") issue("warning", "capability_deprecated", `Skill uses deprecated capability: ${id}`);
  }
  return issues;
}

/** Trust/approval facts derived from the capabilities a skill uses — never restated per skill. */
export function skillRequirements(skill: SkillModel): { approvalRequired: string[]; sideEffects: string[]; unavailable: string[]; evidenceRequired: string[] } {
  const descriptors = skill.uses.map((id) => getCapabilityDescriptor(id)).filter((item): item is CapabilityDescriptorV2 => Boolean(item));
  return {
    approvalRequired: descriptors.filter((item) => item.approvalRequired).map((item) => item.id),
    sideEffects: descriptors.filter((item) => item.sideEffects.scope !== "none").map((item) => `${item.id}:${item.sideEffects.scope}`),
    unavailable: descriptors.filter((item) => item.availability === "unavailable").map((item) => item.id),
    evidenceRequired: descriptors.filter((item) => item.trust.evidenceRequired).map((item) => item.id)
  };
}

export function bundledSkillsDir(): string {
  // dist/core/skill-model.js and src/core/skill-model.ts both sit two levels below the package root.
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "skills");
}

export async function loadSkillDir(dir: string, source: SkillSource): Promise<SkillModel> {
  const text = await fs.readFile(path.join(dir, "SKILL.md"), "utf8");
  const parsed = parseSkillMarkdown(text);
  if (!parsed.frontmatter) throw new Error(`${dir}: ${parsed.errors.join(" ")}`);
  if (parsed.errors.length) throw new Error(`${dir}: ${parsed.errors.join(" ")}`);
  return makeModel(parsed.frontmatter, parsed.body, dir, source, await listResources(dir), text);
}

/** Load bundled skills, project portable skills and adapted v1.5 packs into one catalog. */
export async function loadSkillCatalog(root = process.cwd(), options: { bundledDir?: string } = {}): Promise<{ skills: SkillModel[]; issues: SkillIssue[] }> {
  const skills: SkillModel[] = [];
  const issues: SkillIssue[] = [];
  const sources: Array<[string, SkillSource]> = [[options.bundledDir ?? bundledSkillsDir(), "bundled"], [path.join(root, ".agents", "skills"), "project"]];
  for (const [base, source] of sources) {
    for (const entry of await fs.readdir(base, { withFileTypes: true }).catch(() => [])) {
      if (!entry.isDirectory()) continue;
      if (source === "project" && await fs.access(path.join(base, entry.name, PROJECTION_MARKER)).then(() => true, () => false)) continue;
      try {
        skills.push(await loadSkillDir(path.join(base, entry.name), source));
      } catch (error) {
        issues.push({ skill: entry.name, severity: "error", code: "skill_unreadable", message: (error as Error).message });
      }
    }
  }
  for (const legacy of await readSkills(root)) {
    const parsed = parseSkillMarkdown(legacy.markdown);
    const frontmatter = parsed.frontmatter ?? { name: legacy.metadata.id, description: legacy.metadata.description, metadata: {} };
    skills.push(makeModel(frontmatter, parsed.body, legacy.dir, "legacy-pack", await listResources(legacy.dir), legacy.markdown));
  }
  const seen = new Map<string, SkillModel>();
  for (const skill of skills) {
    const previous = seen.get(skill.name);
    // Byte-identical host projections of the same skill are not conflicts.
    if (previous && previous.digest !== skill.digest) issues.push({ skill: skill.name, severity: "warning", code: "name_shadowed", message: `${skill.source} skill shadows ${previous.source} skill with the same name; the first one wins.` });
    if (!previous) seen.set(skill.name, skill);
    issues.push(...validateSkillModel(skill));
  }
  return { skills: [...seen.values()].sort((left, right) => left.name.localeCompare(right.name)), issues };
}

export function skillLevel1(skill: SkillModel): SkillLevel1 {
  return { name: skill.name, description: skill.description };
}

/** Level 3: read one resource on demand, contained inside the skill directory. */
export async function readSkillResource(skill: SkillModel, relative: string): Promise<string> {
  const normalized = relative.replace(/\\/g, "/");
  if (!skill.resources.includes(normalized)) throw new Error(`Skill ${skill.name} has no resource ${relative}.`);
  const target = path.resolve(skill.dir, normalized);
  const [realDir, realTarget] = await Promise.all([fs.realpath(skill.dir), fs.realpath(target)]);
  if (realTarget !== realDir && !realTarget.startsWith(`${realDir}${path.sep}`)) throw new Error(`Resource escapes skill directory: ${relative}`);
  return fs.readFile(realTarget, "utf8");
}

function makeModel(frontmatter: SkillFrontmatter, body: string, dir: string, source: SkillSource, resources: string[], raw: string): SkillModel {
  const uses = (frontmatter.metadata[USES_METADATA_KEY] ?? "").split(/\s+/).filter(Boolean);
  return {
    schemaVersion: SKILL_MODEL_SCHEMA,
    name: frontmatter.name,
    description: frontmatter.description,
    source,
    dir,
    frontmatter,
    uses,
    body,
    resources,
    digest: createHash("sha256").update(raw).digest("hex")
  };
}

async function listResources(dir: string): Promise<string[]> {
  const found: string[] = [];
  for (const sub of RESOURCE_DIRS) {
    const walk = async (relative: string): Promise<void> => {
      for (const entry of await fs.readdir(path.join(dir, relative), { withFileTypes: true }).catch(() => [])) {
        const child = `${relative}/${entry.name}`;
        if (entry.isDirectory()) await walk(child);
        else if (entry.isFile()) found.push(child);
      }
    };
    await walk(sub);
  }
  return found.sort();
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length >= 2) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) return trimmed.slice(1, -1).replace(/''/g, "'");
  return trimmed;
}

function quote(value: string): string {
  return /^[\w .,/()-]*$/u.test(value) && !/^\s|\s$/.test(value) ? value : JSON.stringify(value);
}

/** Level 1 catalog projection shared by CLI and MCP. */
export async function skillCatalogSummary(root = process.cwd()): Promise<{ schemaVersion: "soturail.skill.catalog.v1"; skills: Array<SkillLevel1 & { source: SkillSource }>; issues: SkillIssue[] }> {
  const catalog = await loadSkillCatalog(root);
  return {
    schemaVersion: "soturail.skill.catalog.v1",
    skills: catalog.skills.map((skill) => ({ ...skillLevel1(skill), source: skill.source })),
    issues: catalog.issues
  };
}

/** Level 2 (selected SKILL.md) or Level 3 (one resource) projection shared by CLI and MCP. */
export async function describeSkill(name: string, root = process.cwd(), resource?: string): Promise<
  | { level: 2; name: string; description: string; source: SkillSource; uses: string[]; requirements: ReturnType<typeof skillRequirements>; resources: string[]; instructions: string }
  | { level: 3; name: string; resource: string; content: string }
> {
  const { skills } = await loadSkillCatalog(root);
  const skill = skills.find((item) => item.name === name);
  if (!skill) throw new Error(`Unknown skill: ${name}. List skills with soturail.skills.list or "soturail skills discover".`);
  if (resource !== undefined) return { level: 3, name, resource, content: await readSkillResource(skill, resource) };
  return { level: 2, name, description: skill.description, source: skill.source, uses: skill.uses, requirements: skillRequirements(skill), resources: skill.resources, instructions: skill.body.trim() };
}
