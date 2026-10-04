import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getCapabilityDescriptor } from "../src/core/capability-descriptor.js";
import { normalizeWords } from "../src/core/rail-utils.js";
import { loadSkillCatalog, skillLevel1, skillRequirements, type SkillModel } from "../src/core/skill-model.js";

interface SelectionCase {
  id: string;
  locale: string;
  task: string;
  expectSkills: string[];
  requireCapabilities: string[];
}

const CATALOG = ["soturail-core", "soturail-change", "soturail-debug", "soturail-review", "soturail-security", "soturail-research", "soturail-knowledge", "soturail-release"];

let root = "";
let skills: SkillModel[] = [];
let cases: SelectionCase[] = [];

beforeAll(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-catalog-"));
  const catalog = await loadSkillCatalog(root);
  expect(catalog.issues.filter((issue) => issue.severity === "error")).toEqual([]);
  skills = catalog.skills;
  cases = JSON.parse(await fs.readFile(path.join(import.meta.dirname, "fixtures", "v160", "skill-selection.json"), "utf8")).cases;
});

afterAll(async () => {
  await fs.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

describe("task skill catalog", () => {
  it("ships exactly the small initial catalog", () => {
    expect(skills.filter((skill) => skill.source === "bundled").map((skill) => skill.name).sort()).toEqual([...CATALOG].sort());
  });

  it("binds every task skill to known capabilities and keeps discovery metadata small", () => {
    let level1Bytes = 0;
    for (const skill of skills) {
      expect(skill.uses.length, skill.name).toBeGreaterThan(0);
      for (const id of skill.uses) expect(getCapabilityDescriptor(id), `${skill.name} -> ${id}`).toBeDefined();
      expect(skill.description, skill.name).toMatch(/Not (for|needed|a substitute)/);
      level1Bytes += Buffer.byteLength(JSON.stringify(skillLevel1(skill)), "utf8");
    }
    // ~100 tokens per skill in the always-loaded catalog.
    expect(level1Bytes / skills.length).toBeLessThan(600);
    expect(level1Bytes).toBeLessThan(4800);
  });

  it("does not restate capability trust facts inside skills", () => {
    const release = skills.find((skill) => skill.name === "soturail-release");
    if (!release) throw new Error("missing release skill");
    const requirements = skillRequirements(release);
    expect(requirements.approvalRequired).toContain("command.run");
    for (const skill of skills) expect(Object.keys(skill.frontmatter.metadata).sort()).toEqual(["soturail-schema", "soturail-uses"]);
  });

  it("makes every selection fixture satisfiable by the catalog", () => {
    expect(cases.length).toBeGreaterThanOrEqual(8);
    for (const item of cases) {
      const selected = item.expectSkills.map((name) => skills.find((skill) => skill.name === name));
      expect(selected.every(Boolean), item.id).toBe(true);
      if (item.expectSkills.length) expect(item.expectSkills, item.id).toContain("soturail-core");
      const capabilities = new Set(selected.flatMap((skill) => skill?.uses ?? []));
      for (const id of item.requireCapabilities) expect(capabilities.has(id), `${item.id} needs ${id}`).toBe(true);
    }
  });

  it("covers multilingual and non-trigger cases without depending on keyword overlap", () => {
    const locales = new Set(cases.map((item) => item.locale));
    for (const locale of ["pt-BR", "en", "es", "ja", "mixed"]) expect(locales.has(locale), locale).toBe(true);
    expect(cases.some((item) => item.expectSkills.length === 0)).toBe(true);
    // The Japanese case has no lexical tokens at all for the legacy router; it must still be satisfiable.
    const ja = cases.find((item) => item.locale === "ja");
    expect(ja && normalizeWords(ja.task)).toEqual([]);
    expect(ja?.expectSkills).toContain("soturail-release");
  });
});
