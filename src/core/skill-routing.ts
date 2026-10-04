import path from "node:path";
import { routeContext } from "./context-intelligence.js";
import { keywordScore } from "./rail-utils.js";
import { loadSkillCatalog, skillRequirements, type SkillModel } from "./skill-model.js";

// Offline, lexical skill suggestion. This is a labeled fallback, diagnostic and
// benchmark baseline — never the semantic authority. A capable agent selects
// skills from their name/description metadata in any language; this ranker only
// sees shared tokens and returns nothing useful for most non-English tasks.

export const ROUTING_AUTHORITY = "heuristic-fallback" as const;
const FALLBACK_NOTE = "Lexical fallback only. Agent selection from skill metadata is primary; results are candidates, never evidence.";

export interface SkillSuggestion {
  skill: SkillModel;
  score: number;
  reason: string;
}

export async function rankSkillsLexically(query: string, root = process.cwd()): Promise<SkillSuggestion[]> {
  const { skills } = await loadSkillCatalog(root);
  return skills
    .map((skill) => ({ skill, ...keywordScore(query, `${skill.name} ${skill.description}`) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.skill.name.localeCompare(right.skill.name))
    .slice(0, 5);
}

export async function suggestSkills(query: string, root = process.cwd()): Promise<string> {
  const ranked = await rankSkillsLexically(query, root);
  const header = ["SotuRail skills suggest", `selection_authority: ${ROUTING_AUTHORITY}`, `note: ${FALLBACK_NOTE}`, `query: ${query}`];
  if (ranked.length === 0) return [...header, "matches_count: 0", "No lexical match. Let the agent choose from `soturail skills discover` metadata.", ""].join("\n");
  return [
    ...header,
    `matches_count: ${ranked.length}`,
    "",
    ...ranked.flatMap((item) => [
      `- ${item.skill.name} [${item.skill.source}]`,
      `  Reason: ${item.reason}`,
      `  Description: ${item.skill.description}`,
      `  Path: ${path.normalize(path.relative(root, item.skill.dir))}`,
      ""
    ])
  ].join("\n").trimEnd() + "\n";
}

export async function routeSkill(task: string, root = process.cwd()): Promise<string> {
  const route = routeContext(task);
  const ranked = await rankSkillsLexically(task, root);
  // Approval checks come from the capabilities the suggested skills use, not from a keyword category.
  const approvals = [...new Set(ranked.flatMap((item) => skillRequirements(item.skill).approvalRequired))];
  const sideEffects = [...new Set(ranked.flatMap((item) => skillRequirements(item.skill).sideEffects))];
  return [
    "SotuRail skills route",
    `selection_authority: ${ROUTING_AUTHORITY}`,
    `task: ${task}`,
    `context_expert: ${route.expert} (${route.reason})`,
    `role_pack: ${route.role}`,
    `approval_required_capabilities: ${approvals.join(", ") || "none"}`,
    `side_effects: ${sideEffects.join(", ") || "none"}`,
    "",
    await suggestSkills(task, root)
  ].join("\n");
}
