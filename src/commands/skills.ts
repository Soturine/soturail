import type { Command } from "commander";
import { createSkill, readSkills, renderSkillList } from "../core/skill-store.js";
import { exportSkills, packSkills } from "../core/skill-exporter.js";
import { formatSkillValidation, validateSkills } from "../core/skill-validator.js";
import { SkillTargetSchema } from "../core/skill-schema.js";
import { routeSkill, suggestSkills } from "../core/skill-routing.js";
import { buildSkill, createSkillTemplate, evaluateSkillsV2, foldInSkill, lintSkillsV2, renderSkillV2Report, writeSkillV2Report } from "../core/skill-rail-v2.js";

export function registerSkillsCommand(program: Command): void {
  const skills = program.command("skills").description("Create, validate, export and pack safe local agent skills.");

  skills
    .command("init")
    .description("Create a new local SotuRail skill.")
    .argument("<name>", "Skill name")
    .action(async (name: string) => {
      const skill = await createSkill(name);
      process.stdout.write(`Skill created: ${skill.metadata.id}\n${skill.dir}\n`);
    });

  skills.command("list").description("List local skills.").action(async () => {
    process.stdout.write(renderSkillList(await readSkills()));
  });

  skills.command("validate").description("Validate local skills for safety and schema correctness.").action(async () => {
    const result = await validateSkills();
    process.stdout.write(formatSkillValidation(result));
    if (!result.ok) process.exitCode = 1;
  });

  skills
    .command("suggest")
    .description("Suggest relevant local skills for a task query.")
    .requiredOption("--query <query>", "Task query")
    .action(async (options: { query: string }) => {
      process.stdout.write(await suggestSkills(options.query));
    });

  skills
    .command("route")
    .description("Pair a task with a skill, context expert, role pack and policy checks.")
    .requiredOption("--task <task>", "Task description")
    .action(async (options: { task: string }) => {
      process.stdout.write(await routeSkill(options.task));
    });

  skills
    .command("export")
    .description("Export reviewed skills for a target agent.")
    .requiredOption("--target <target>", "claude, codex, gemini, cursor, or generic")
    .action(async (options: { target: string }) => {
      const target = SkillTargetSchema.parse(options.target);
      process.stdout.write(await exportSkills(target));
    });

  skills
    .command("pack")
    .description("Pack skills into a JSON or Markdown bundle.")
    .requiredOption("--format <format>", "json or markdown")
    .action(async (options: { format: string }) => {
      if (options.format !== "json" && options.format !== "markdown") {
        throw new Error("Skill pack format must be json or markdown.");
      }
      process.stdout.write(await packSkills(options.format));
    });

  skills.command("template").argument("<domain>", "Skill domain").action(async (domain: string) => {
    process.stdout.write(`Skill template: ${await createSkillTemplate(domain)}\n`);
  });

  skills.command("lint").action(async () => {
    const report = await lintSkillsV2();
    process.stdout.write(renderSkillV2Report(report));
    if (report.status === "failed") process.exitCode = 1;
  });

  skills.command("eval").action(async () => {
    const report = await evaluateSkillsV2();
    process.stdout.write(renderSkillV2Report(report));
    if (report.status === "failed") process.exitCode = 1;
  });

  skills.command("report").action(async () => {
    const result = await writeSkillV2Report();
    process.stdout.write(`Skill report: ${result.report.status}\njson: ${result.json}\nmarkdown: ${result.markdown}\n`);
  });

  skills.command("build").argument("<paths...>", "Local source paths").requiredOption("--name <name>", "Skill name").action(async (paths: string[], options: { name: string }) => {
    process.stdout.write(`Skill built: ${await buildSkill(options.name, paths)}\n`);
  });

  skills.command("fold-in").argument("<skill>", "Skill id").argument("<paths...>", "Additional source paths").action(async (skill: string, paths: string[]) => {
    process.stdout.write(`Skill updated: ${await foldInSkill(skill, paths)}\n`);
  });
}
