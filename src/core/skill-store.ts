import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths } from "./config.js";
import {
  defaultForbiddenPatterns,
  defaultHumanApprovals,
  parseSkillYaml,
  SkillMetadataSchema,
  slugifySkillName,
  stableSkillHash,
  stringifySkillYaml,
  type SkillMetadata,
  type SkillRecord
} from "./skill-schema.js";

export async function createSkill(name: string, root = process.cwd()): Promise<SkillRecord> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const id = slugifySkillName(name);
  const dir = path.join(paths.skillsDir, id);
  const markdown = [
    `# ${name}`,
    "",
    "Use this skill when the task matches the description and the repository owner has approved it.",
    "",
    "## Safety",
    "",
    "- Do not run destructive shell commands.",
    "- Do not exfiltrate secrets.",
    "- Ask for human approval before remote writes or destructive actions.",
    ""
  ].join("\n");
  const base: Omit<SkillMetadata, "content_hash"> = {
    id,
    name,
    description: `Safe local-first workflow skill for ${name}.`,
    version: "0.1.0",
    author: "Rafael Ryan Ramos de Souza",
    risk_level: "low",
    targets: ["claude", "codex", "gemini", "cursor"],
    allowed_tools: ["read", "search"],
    forbidden_patterns: defaultForbiddenPatterns,
    requires_human_approval: defaultHumanApprovals,
    created_at: new Date().toISOString()
  };
  const metadata: SkillMetadata = { ...base, content_hash: stableSkillHash(base, markdown) };

  await fs.mkdir(path.join(dir, "examples"), { recursive: true });
  await fs.mkdir(path.join(dir, "validators"), { recursive: true });
  await fs.writeFile(path.join(dir, "skill.yml"), stringifySkillYaml(metadata), "utf8");
  await fs.writeFile(path.join(dir, "SKILL.md"), markdown, "utf8");
  return { metadata, markdown, dir };
}

export async function readSkills(root = process.cwd()): Promise<SkillRecord[]> {
  const paths = getWorkspacePaths(root);
  let entries: string[] = [];
  try {
    entries = await fs.readdir(paths.skillsDir);
  } catch {
    return [];
  }
  const skills: SkillRecord[] = [];
  for (const entry of entries) {
    const dir = path.join(paths.skillsDir, entry);
    const stat = await fs.stat(dir).catch(() => null);
    if (!stat?.isDirectory()) continue;
    const yaml = await fs.readFile(path.join(dir, "skill.yml"), "utf8").catch(() => "");
    const markdown = await fs.readFile(path.join(dir, "SKILL.md"), "utf8").catch(() => "");
    const parsed = parseSkillYaml(yaml);
    const result = SkillMetadataSchema.safeParse(parsed);
    if (result.success) {
      skills.push({ metadata: result.data, markdown, dir });
    } else {
      skills.push({
        metadata: {
          id: entry,
          name: entry,
          description: "Invalid skill metadata",
          version: "0.0.0",
          author: "unknown",
          risk_level: "high",
          targets: ["generic"],
          allowed_tools: [],
          forbidden_patterns: [],
          requires_human_approval: [],
          created_at: "invalid",
          content_hash: "0".repeat(64)
        },
        markdown,
        dir
      });
    }
  }
  return skills.sort((left, right) => left.metadata.id.localeCompare(right.metadata.id));
}

export function renderSkillList(skills: SkillRecord[]): string {
  if (skills.length === 0) return "No skills found. Run soturail skills init <name> first.\n";
  return skills.map((skill) => `${skill.metadata.id} [${skill.metadata.risk_level}] ${skill.metadata.name}`).join("\n") + "\n";
}
