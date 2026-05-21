import type { Command } from "commander";
import { createSkill, readSkills, renderSkillList } from "../core/skill-store.js";
import { exportSkills, packSkills } from "../core/skill-exporter.js";
import { formatSkillValidation, validateSkills } from "../core/skill-validator.js";
import { SkillTargetSchema } from "../core/skill-schema.js";

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
}
