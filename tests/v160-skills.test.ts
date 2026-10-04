import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { exportPortableSkills } from "../src/core/skill-exporter.js";
import {
  bundledSkillsDir,
  loadSkillCatalog,
  parseSkillMarkdown,
  readSkillResource,
  skillLevel1,
  skillRequirements,
  validateSkillModel
} from "../src/core/skill-model.js";
import { createSkill } from "../src/core/skill-store.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })));
});

async function tempRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-skills-"));
  temporaryDirectories.push(dir);
  return dir;
}

const sha = (text: string) => createHash("sha256").update(text).digest("hex");

describe("portable Skill model", () => {
  it("ships a spec-conformant soturail-core skill bound to known capabilities", async () => {
    const root = await tempRoot();
    const { skills, issues } = await loadSkillCatalog(root);
    const core = skills.find((skill) => skill.name === "soturail-core");
    expect(core?.source).toBe("bundled");
    expect(issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(core && validateSkillModel(core)).toEqual([]);
    expect(core?.uses).toEqual(expect.arrayContaining(["capability.discover", "project.read", "evidence.verify"]));
    expect(path.basename(core?.dir ?? "")).toBe("soturail-core");
  });

  it("keeps discovery metadata small and the selected skill within the progressive-disclosure budget", async () => {
    const { skills } = await loadSkillCatalog(await tempRoot());
    const core = skills.find((skill) => skill.name === "soturail-core");
    if (!core) throw new Error("missing core skill");
    const level1 = Buffer.byteLength(JSON.stringify(skillLevel1(core)), "utf8");
    const level2 = Buffer.byteLength(await fs.readFile(path.join(core.dir, "SKILL.md"), "utf8"), "utf8");
    expect(level1).toBeLessThan(600);
    // Agent Skills guidance: < 5000 tokens and < 500 lines for the activated body.
    expect(level2 / 4).toBeLessThan(5000);
    expect(core.body.split("\n").length).toBeLessThan(500);
    // Level 3 references are not part of level 2.
    expect(core.resources).toEqual(["references/candidate-artifacts.md", "references/trust-states.md"]);
    expect(core.body).not.toContain("| `verified` | SotuRail only |");
  });

  it("derives approval and side-effect requirements from capability descriptors", async () => {
    const { skills } = await loadSkillCatalog(await tempRoot());
    const core = skills.find((skill) => skill.name === "soturail-core");
    if (!core) throw new Error("missing core skill");
    const requirements = skillRequirements(core);
    expect(requirements.unavailable).toEqual([]);
    expect(requirements.evidenceRequired).toEqual(expect.arrayContaining(["evidence.verify", "governance.evaluate"]));
  });

  it("parses the frontmatter subset strictly", () => {
    const parsed = parseSkillMarkdown("---\nname: demo\ndescription: \"Uses: colons\"\nmetadata:\n  soturail-uses: project.read repo.index\n---\n\n# Body\n");
    expect(parsed.errors).toEqual([]);
    expect(parsed.frontmatter?.description).toBe("Uses: colons");
    expect(parsed.frontmatter?.metadata["soturail-uses"]).toBe("project.read repo.index");
    expect(parseSkillMarkdown("# no frontmatter").frontmatter).toBeNull();
    expect(parseSkillMarkdown("---\nname: x\n- list item\n---\n").errors.length).toBe(1);
  });

  it("rejects invalid names, unknown capabilities and resources outside the skill", async () => {
    const root = await tempRoot();
    const dir = path.join(root, ".agents", "skills", "bad-skill");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "SKILL.md"), "---\nname: Bad--Skill\ndescription: x\nmetadata:\n  soturail-uses: not.a-capability\n---\nbody\n");
    const { issues, skills } = await loadSkillCatalog(root);
    const codes = issues.filter((issue) => issue.skill === "Bad--Skill").map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining(["name_invalid", "name_dir_mismatch", "capability_unknown"]));
    const core = skills.find((skill) => skill.name === "soturail-core");
    if (!core) throw new Error("missing core skill");
    await expect(readSkillResource(core, "../soturail-core/SKILL.md")).rejects.toThrow();
    await expect(readSkillResource(core, "references/trust-states.md")).resolves.toContain("SotuRail only");
  });
});

describe("generic portable export", () => {
  it("projects bundled and v1.5 skills into Agent Skills directories without rewriting sources", async () => {
    const root = await tempRoot();
    const legacy = await createSkill("Revisão de segurança", root);
    const before = sha(await fs.readFile(path.join(legacy.dir, "SKILL.md"), "utf8")) + sha(await fs.readFile(path.join(legacy.dir, "skill.yml"), "utf8"));
    const result = await exportPortableSkills(root);
    const names = result.skills.map((skill) => skill.name);
    expect(names).toEqual(expect.arrayContaining(["soturail-core", "revisao-de-seguranca"]));
    expect(result.skipped).toEqual([]);
    const exported = await fs.readFile(path.join(root, result.outDir, "revisao-de-seguranca", "SKILL.md"), "utf8");
    const parsed = parseSkillMarkdown(exported);
    expect(parsed.frontmatter?.name).toBe("revisao-de-seguranca");
    expect(parsed.frontmatter?.metadata["soturail-source"]).toBe("legacy-pack");
    expect(await fs.readFile(path.join(root, result.outDir, "soturail-core", "references", "trust-states.md"), "utf8")).toContain("verified");
    const after = sha(await fs.readFile(path.join(legacy.dir, "SKILL.md"), "utf8")) + sha(await fs.readFile(path.join(legacy.dir, "skill.yml"), "utf8"));
    expect(after).toBe(before);
    const manifest = JSON.parse(await fs.readFile(path.join(root, result.outDir, "soturail-export.json"), "utf8"));
    expect(manifest.layout).toBe("agent-skills");
  });

  it("refuses secret-like skills and output outside the project", async () => {
    const root = await tempRoot();
    const dir = path.join(root, ".agents", "skills", "leaky");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "SKILL.md"), `---\nname: leaky\ndescription: leaks\n---\nUse token ghp_${"a".repeat(36)} here.\n`);
    const result = await exportPortableSkills(root);
    expect(result.skipped.find((item) => item.name === "leaky")?.reason).toMatch(/^secret_like_content/);
    await expect(exportPortableSkills(root, { outDir: "../outside" })).rejects.toThrow(/escapes/);
  });

  it("resolves the bundled skills directory from source and build layouts", () => {
    expect(bundledSkillsDir().endsWith(`${path.sep}skills`)).toBe(true);
  });
});
