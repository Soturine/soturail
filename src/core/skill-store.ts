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
    `Use this skill when an agent needs a safe, local-first workflow for ${name}.`,
    "",
    "## Description",
    "",
    `Guide the agent through a reviewed ${name} workflow using SotuRail context, progressive reads and reversible command evidence.`,
    "",
    "## Safe Workflow",
    "",
    "1. Start with `soturail index` when repository context may be stale.",
    "2. Use `soturail read <file> --query \"goal\"` for large or unfamiliar files.",
    "3. Use `soturail context pack --target generic` when a compact project brief is needed.",
    "4. Run tests, builds or diagnostics through `soturail run <command>` so raw logs remain recoverable.",
    "5. Summarize findings with file paths, commands run and verification status.",
    "",
    "## Safety",
    "",
    "- Do not run destructive shell commands.",
    "- Do not expose secrets or environment values.",
    "- Ask for human approval before remote writes, dependency installation or destructive actions.",
    "- Treat generated hooks, skills and scripts as review-required artifacts.",
    "",
    "## Verification Checklist",
    "",
    "- [ ] Relevant files were read through SotuRail or referenced explicitly.",
    "- [ ] Commands that produce logs were run through SotuRail when practical.",
    "- [ ] Security-sensitive actions were avoided or explicitly approved.",
    "- [ ] Final response includes next action and recovery path when raw logs exist.",
    "",
    "## Example Input",
    "",
    "> Review the current change and suggest the safest next verification command.",
    "",
    "## Example Output",
    "",
    "- Summary: concise finding or confirmation.",
    "- Evidence: file paths and commands reviewed.",
    "- Verification: next command to run through SotuRail.",
    ""
  ].join("\n");
  const base: Omit<SkillMetadata, "content_hash"> = {
    id,
    name,
    description: `Safe local-first workflow skill for ${name}.`,
    version: "0.1.0",
    author: "Rafael Ryan Ramos de Souza",
    risk_level: "low",
    targets: ["claude", "codex", "gemini", "cursor", "generic"],
    allowed_tools: ["read", "search", "summarize", "format"],
    forbidden_patterns: defaultForbiddenPatterns,
    requires_human_approval: defaultHumanApprovals,
    created_at: new Date().toISOString()
  };
  const metadata: SkillMetadata = { ...base, content_hash: stableSkillHash(base, markdown) };

  await fs.mkdir(path.join(dir, "examples"), { recursive: true });
  await fs.mkdir(path.join(dir, "validators"), { recursive: true });
  await fs.writeFile(path.join(dir, "skill.yml"), stringifySkillYaml(metadata), "utf8");
  await fs.writeFile(path.join(dir, "SKILL.md"), markdown, "utf8");
  await fs.writeFile(path.join(dir, "examples", "README.md"), `# ${name} Examples

Add reviewed examples here. Keep inputs and outputs free of secrets.
`, "utf8");
  await fs.writeFile(path.join(dir, "validators", "README.md"), `# ${name} Validators

Add optional local validation notes or scripts here. Review scripts before running them.
`, "utf8");
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

export function renderSkillList(skills: SkillRecord[], root = process.cwd()): string {
  if (skills.length === 0) {
    return "No local skills found.\nCreate one with: soturail skills init <name>\n";
  }
  const lines = [
    "SotuRail skills",
    `skills_count: ${skills.length}`,
    ""
  ];
  for (const skill of skills) {
    lines.push(
      `- ${skill.metadata.id} [${skill.metadata.risk_level}]`,
      `  Name: ${skill.metadata.name}`,
      `  Description: ${skill.metadata.description}`,
      `  Version: ${skill.metadata.version}`,
      `  Targets: ${skill.metadata.targets.join(", ")}`,
      `  Path: ${path.normalize(path.relative(root, skill.dir))}`,
      ""
    );
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
