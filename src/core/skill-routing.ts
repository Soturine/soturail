import path from "node:path";
import { routeContext } from "./context-intelligence.js";
import { readSkills } from "./skill-store.js";
import { keywordScore } from "./rail-utils.js";

export async function suggestSkills(query: string, root = process.cwd()): Promise<string> {
  const skills = await readSkills(root);
  if (skills.length === 0) return "No local skills found.\nCreate one with: soturail skills init <name>\n";
  const ranked = skills
    .map((skill) => {
      const score = keywordScore(query, `${skill.metadata.name} ${skill.metadata.description} ${skill.markdown}`);
      return { skill, score: score.score, reason: score.reason };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
  if (ranked.length === 0) return "No skill matched the task strongly enough.\n";
  return [
    "SotuRail skills suggest",
    `query: ${query}`,
    `matches_count: ${ranked.length}`,
    "",
    ...ranked.flatMap((item) => [
      `- ${item.skill.metadata.id} [${item.skill.metadata.risk_level}]`,
      `  Reason: ${item.reason}`,
      `  Description: ${item.skill.metadata.description}`,
      `  Path: ${path.normalize(path.relative(root, item.skill.dir))}`,
      ""
    ])
  ].join("\n").trimEnd() + "\n";
}

export async function routeSkill(task: string, root = process.cwd()): Promise<string> {
  const route = routeContext(task);
  const suggestions = await suggestSkills(task, root);
  const policyChecks = route.expert === "release"
    ? "npm publish, GitHub release, raw log expansion"
    : route.expert === "security"
      ? "secret-like content, raw log expansion, MCP exposure change"
      : "destructive shell command, global config write";
  return [
    "SotuRail skills route",
    `task: ${task}`,
    `context_expert: ${route.expert}`,
    `role_pack: ${route.role}`,
    `policy_checks: ${policyChecks}`,
    "",
    suggestions
  ].join("\n");
}
