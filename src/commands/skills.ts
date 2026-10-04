import type { Command } from "commander";
import { createSkill, readSkills, renderSkillList } from "../core/skill-store.js";
import { describeSkill, skillCatalogSummary } from "../core/skill-model.js";
import { exportPortableSkills, exportSkills, migrateLegacySkill, packSkills } from "../core/skill-exporter.js";
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

  skills.command("discover").description("List bundled, project and v1.5 skills with discovery metadata (level 1).").option("--json", "Print JSON").action(async (options: { json?: boolean }) => {
    const catalog = await skillCatalogSummary();
    if (options.json) process.stdout.write(`${JSON.stringify(catalog, null, 2)}\n`);
    else process.stdout.write(["SotuRail skills", ...catalog.skills.map((item) => `- ${item.name} [${item.source}]: ${item.description}`), ...catalog.issues.map((item) => `! ${item.severity} ${item.skill} ${item.code}: ${item.message}`), ""].join("\n"));
    if (catalog.issues.some((item) => item.severity === "error")) process.exitCode = 1;
  });

  skills.command("describe").description("Load one skill (level 2) or one of its resources (level 3).").argument("<name>", "Skill name").option("--resource <path>", "references/, scripts/ or assets/ file").option("--json", "Print JSON").action(async (name: string, options: { resource?: string; json?: boolean }) => {
    const result = await describeSkill(name, process.cwd(), options.resource);
    if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    else if (result.level === 3) process.stdout.write(result.content);
    else process.stdout.write([`${result.name} [${result.source}]`, `uses: ${result.uses.join(" ")}`, `approval_required: ${result.requirements.approvalRequired.join(" ") || "none"}`, `unavailable: ${result.requirements.unavailable.join(" ") || "none"}`, `resources: ${result.resources.join(" ") || "none"}`, "", result.instructions, ""].join("\n"));
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
    .requiredOption("--target <target>", "host adapter id (claude, codex, cursor, gemini, generic, ...); unknown hosts use generic")
    .option("--layout <layout>", "flat (v1.5 files, deprecated) or portable (Agent Skills directories)", "flat")
    .option("--install", "With --layout portable: write into the host's native project skills directory")
    .option("--out <dir>", "Project-relative output directory for --layout portable")
    .option("--json", "Print JSON for --layout portable")
    .action(async (options: { target: string; layout: string; install?: boolean; out?: string; json?: boolean }) => {
      if (options.layout === "portable") {
        const result = await exportPortableSkills(process.cwd(), { host: options.target, install: options.install === true, ...(options.out ? { outDir: options.out } : {}) });
        if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        else process.stdout.write([
          `Exported ${result.skills.length} portable skill(s) for ${result.host.id} (${result.host.verification}) to ${result.outDir}`,
          ...result.host.limitations.map((item) => `note: ${item}`),
          ...result.skills.map((item) => `- ${item.name} (${item.source}, ${item.files.length} files)`),
          ...result.skipped.map((item) => `- skipped ${item.name}: ${item.reason}`),
          ""
        ].join("\n"));
        if (result.skipped.length) process.exitCode = 1;
        return;
      }
      if (options.layout !== "flat") throw new Error("Skill export layout must be flat or portable.");
      process.stderr.write("Deprecated: --layout flat writes v1.5 single-file exports; use --layout portable. Removal target: v2.0.\n");
      process.stdout.write(await exportSkills(SkillTargetSchema.parse(options.target)));
    });

  skills.command("migrate").description("Copy a v1.5 skill pack into a portable .agents/skills/<name>/ skill without modifying the pack.").argument("<name>", "v1.5 skill id").option("--json", "Print JSON").action(async (name: string, options: { json?: boolean }) => {
    const result = await migrateLegacySkill(name);
    if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    else process.stdout.write([`Migrated ${result.name} -> ${result.target}`, ...result.files.map((file) => `- ${file}`), "The v1.5 pack is unchanged and now reported as legacy_superseded; remove it after review.", ""].join("\n"));
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
