import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths, relativeToRoot, writeJson } from "./config.js";
import { compileKnowledge } from "./knowledge-rail.js";
import { createSkill, readSkills } from "./skill-store.js";
import { stableSkillHash, stringifySkillYaml } from "./skill-schema.js";
import { validateSkills } from "./skill-validator.js";

export interface SkillV2Issue {
  skill: string;
  severity: "error" | "warning";
  message: string;
}

export interface SkillV2Report {
  schemaVersion: "soturail.skills.report.v2";
  createdAt: string;
  status: "passed" | "warning" | "failed";
  skills: number;
  issues: SkillV2Issue[];
  nextCommands: string[];
}

export async function createSkillTemplate(domain: string, root = process.cwd()): Promise<string> {
  const skill = await createSkill(domain, root);
  await ensureV2Artifacts(skill.dir, [], domain);
  return skill.dir;
}

export async function buildSkill(name: string, inputs: string[], root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const pack = await compileKnowledge(name, inputs, root);
  const skill = await createSkill(name, root);
  for (const artifact of ["glossary.md", "patterns.md", "cheatsheet.md", "metadata.json", "source-map.json"]) {
    await fs.copyFile(path.join(pack.dir, artifact), path.join(skill.dir, artifact));
  }
  await fs.cp(path.join(pack.dir, "topics"), path.join(skill.dir, "topics"), { recursive: true, force: true });
  const markdown = `${skill.markdown.trimEnd()}\n\n## Source-Backed Topics\n\nRead \`topics/\`, \`glossary.md\`, \`patterns.md\` and \`cheatsheet.md\` progressively. Verify sources using \`source-map.json\`.\n`;
  const { content_hash: _hash, ...withoutHash } = skill.metadata;
  const metadata = { ...withoutHash, content_hash: stableSkillHash(withoutHash, markdown) };
  await fs.writeFile(path.join(skill.dir, "SKILL.md"), markdown, "utf8");
  await fs.writeFile(path.join(skill.dir, "skill.yml"), stringifySkillYaml(metadata), "utf8");
  return skill.dir;
}

export async function foldInSkill(name: string, inputs: string[], root = process.cwd()): Promise<string> {
  const dir = path.join(getWorkspacePaths(root).skillsDir, slug(name));
  const map = await readJson<{ sources?: Array<{ path?: string }> }>(path.join(dir, "source-map.json"));
  return buildSkill(name, [...new Set([...(map?.sources ?? []).map((source) => source.path).filter((item): item is string => Boolean(item)), ...inputs])], root);
}

export async function lintSkillsV2(root = process.cwd()): Promise<SkillV2Report> {
  const base = await validateSkills(root);
  const skills = await readSkills(root);
  const issues: SkillV2Issue[] = base.issues.map((issue) => ({ skill: issue.skill_id, severity: issue.severity, message: issue.message }));
  for (const skill of skills) {
    for (const file of ["metadata.json", "source-map.json"]) {
      if (!await exists(path.join(skill.dir, file))) issues.push({ skill: skill.metadata.id, severity: "warning", message: `Missing Skill Rail 2.0 artifact: ${file}` });
    }
    if (!/## Verification Checklist/i.test(skill.markdown)) issues.push({ skill: skill.metadata.id, severity: "error", message: "Missing verification checklist." });
    if (!/## Safety/i.test(skill.markdown)) issues.push({ skill: skill.metadata.id, severity: "error", message: "Missing safety section." });
  }
  return reportFor(skills.length, issues);
}

export async function evaluateSkillsV2(root = process.cwd()): Promise<SkillV2Report> {
  const report = await lintSkillsV2(root);
  const skills = await readSkills(root);
  for (const skill of skills) {
    if (!skill.metadata.targets.length) report.issues.push({ skill: skill.metadata.id, severity: "error", message: "No supported hosts." });
    if (!skill.metadata.requires_human_approval.includes("remote_write")) report.issues.push({ skill: skill.metadata.id, severity: "warning", message: "Remote write approval is not explicit." });
  }
  return reportFor(skills.length, report.issues);
}

export async function writeSkillV2Report(root = process.cwd()): Promise<{ report: SkillV2Report; json: string; markdown: string }> {
  const report = await evaluateSkillsV2(root);
  const paths = getWorkspacePaths(root);
  const json = path.join(paths.reportsDir, "skills-v2.json");
  const markdown = path.join(paths.reportsDir, "skills-v2.md");
  await writeJson(json, report);
  await fs.writeFile(markdown, renderSkillV2Report(report), "utf8");
  return { report, json, markdown };
}

export function renderSkillV2Report(report: SkillV2Report): string {
  return ["# Skill Rail 2.0 Report", "", `Status: **${report.status}**`, `Skills: ${report.skills}`, "", "## Issues", ...(report.issues.length ? report.issues.map((issue) => `- ${issue.severity.toUpperCase()} ${issue.skill}: ${issue.message}`) : ["- none"]), "", "## Next Commands", ...report.nextCommands.map((command) => `- \`${command}\``), ""].join("\n");
}

async function ensureV2Artifacts(dir: string, sources: string[], domain: string): Promise<void> {
  await fs.mkdir(path.join(dir, "topics"), { recursive: true });
  const artifacts: Array<[string, string]> = [["glossary.md", "# Glossary\n\n- Add reviewed domain terms.\n"], ["patterns.md", "# Patterns\n\n- Add reviewed local patterns.\n"], ["cheatsheet.md", "# Cheatsheet\n\n- Keep commands safe and reviewable.\n"]];
  for (const [name, content] of artifacts) {
    if (!await exists(path.join(dir, name))) await fs.writeFile(path.join(dir, name), content, "utf8");
  }
  await writeJson(path.join(dir, "metadata.json"), { schemaVersion: "soturail.skill-pack.v2", domain, supportedHosts: ["claude", "codex", "gemini", "cursor", "generic"], riskLevel: "low", verificationSteps: ["soturail skills lint", "soturail skills eval"], warnings: ["Remote writes require human approval."] });
  await writeJson(path.join(dir, "source-map.json"), { schemaVersion: "soturail.skill-source-map.v1", sources });
}

function reportFor(skills: number, issues: SkillV2Issue[]): SkillV2Report {
  return {
    schemaVersion: "soturail.skills.report.v2",
    createdAt: new Date().toISOString(),
    status: issues.some((issue) => issue.severity === "error") ? "failed" : issues.length ? "warning" : "passed",
    skills,
    issues,
    nextCommands: ["soturail skills lint", "soturail skills report"]
  };
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "skill";
}

async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(() => true).catch(() => false);
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}
