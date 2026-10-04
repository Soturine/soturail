import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pathExists, stableSlug } from "../src/core/rail-utils.js";
import { slugifySkillName } from "../src/core/skill-schema.js";

// The historical slug used by ten separate copies before v1.6.
function legacySlug(value: string, fallback: string, maxLength = 64): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, maxLength) || fallback;
}

describe("shared stable slug", () => {
  it("keeps historical output for ASCII input", () => {
    const corpus = ["Demo Skill", "  publish npm release  ", "fix: failing test #42", "A".repeat(90), "---", "", "v1.6.0 notes", "snake_case_name"];
    for (const value of corpus) {
      expect(stableSlug(value, { fallback: "skill" }), value).toBe(legacySlug(value, "skill"));
      expect(stableSlug(value, { fallback: "workflow", maxLength: 48 }), value).toBe(legacySlug(value, "workflow", 48));
    }
  });

  it("folds Latin diacritics into readable ASCII", () => {
    expect(slugifySkillName("Revisão de segurança")).toBe("revisao-de-seguranca");
    expect(stableSlug("Análisis de impacto", { fallback: "x" })).toBe("analisis-de-impacto");
  });

  it("never collapses distinct non-Latin names onto one identifier", () => {
    const review = slugifySkillName("認証レビュー");
    const release = slugifySkillName("リリース手順");
    expect(review).not.toBe(release);
    expect(review).toMatch(/^skill-[a-f0-9]{8}$/);
    expect(slugifySkillName("認証 review")).toMatch(/^review-[a-f0-9]{8}$/);
    expect(stableSlug("Проверка", { fallback: "x" })).not.toBe(stableSlug("Релиз", { fallback: "x" }));
  });

  it("respects length caps including the digest suffix and separator choice", () => {
    expect(stableSlug(`${"a".repeat(80)} 認証`, { fallback: "x", maxLength: 40 }).length).toBeLessThanOrEqual(40);
    expect(stableSlug("Must include README", { fallback: "rule", maxLength: 40, separator: "_" })).toBe("must_include_readme");
  });

  it("checks path existence without throwing", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-slug-"));
    try {
      expect(await pathExists(dir)).toBe(true);
      expect(await pathExists(path.join(dir, "missing", "認証.md"))).toBe(false);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
