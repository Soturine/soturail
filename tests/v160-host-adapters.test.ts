import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { listAgentProfiles } from "../src/core/agent-registry.js";
import { decorateForHost, getHostAdapter, HOST_ADAPTERS, hostAdapterIds, hostSetupCommand } from "../src/core/host-adapters.js";
import { exportPortableSkills } from "../src/core/skill-exporter.js";
import { loadSkillCatalog, parseSkillMarkdown, PROJECTION_MARKER } from "../src/core/skill-model.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })));
});

async function tempRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-hosts-"));
  temporaryDirectories.push(dir);
  return dir;
}

describe("host adapter registry", () => {
  it("has exactly one adapter per known host profile", () => {
    expect(hostAdapterIds().sort()).toEqual(listAgentProfiles().map((profile) => profile.id).sort());
    expect(new Set(hostAdapterIds()).size).toBe(HOST_ADAPTERS.length);
  });

  it("resolves unknown hosts, including unverified ones such as Kimi, to the generic adapter", () => {
    for (const id of ["kimi", "some-future-agent", ""]) {
      const adapter = getHostAdapter(id);
      expect(adapter.id).toBe("generic");
      expect(adapter.skills.verification).toBe("generic-fallback");
    }
  });

  it("claims native skill loading only with a dated primary source", () => {
    for (const adapter of HOST_ADAPTERS) {
      if (adapter.skills.verification === "verified-docs") {
        expect(adapter.skills.source, adapter.id).toMatch(/^https:\/\//);
        expect(adapter.skills.verifiedOn, adapter.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(adapter.skills.projectDir, adapter.id).toBeTruthy();
      } else {
        expect(adapter.skills.limitations.length, adapter.id).toBeGreaterThan(0);
      }
    }
    expect(getHostAdapter("claude").skills.projectDir).toBe(".claude/skills");
    expect(getHostAdapter("codex").skills.projectDir).toBe(".agents/skills");
    expect(getHostAdapter("gemini-legacy").skills.verification).toBe("generic-fallback");
  });

  it("keeps brain targets valid for every host", () => {
    const supported = ["claude", "codex", "gemini", "cursor", "generic"];
    for (const adapter of HOST_ADAPTERS) expect(supported, adapter.id).toContain(adapter.brainTarget);
    expect(getHostAdapter("antigravity").brainTarget).toBe("generic");
  });

  it("renders host decoration and setup commands from data", () => {
    expect(decorateForHost(getHostAdapter("claude"), "body", "soturail_report")).toBe("<soturail_report>\nbody\n</soturail_report>\n");
    expect(decorateForHost(getHostAdapter("cursor"), "body", "x")).toContain("## Cursor Notes");
    expect(decorateForHost(getHostAdapter("kiro"), "body", "x")).toBe("body");
    expect(hostSetupCommand(getHostAdapter("gemini-legacy"))).toBe("soturail agents export --agent gemini-legacy");
    expect(hostSetupCommand(getHostAdapter("codex"))).toBe("soturail agents install --agent codex --dry-run");
  });
});

describe("host skill projection", () => {
  it("installs into each verified host directory and never shadows the canonical skill", async () => {
    const root = await tempRoot();
    const claude = await exportPortableSkills(root, { host: "claude", install: true });
    expect(claude.outDir).toBe(".claude/skills");
    expect(claude.host.verification).toBe("verified-docs");
    const installed = await fs.readFile(path.join(root, ".claude", "skills", "soturail-core", "SKILL.md"), "utf8");
    expect(parseSkillMarkdown(installed).frontmatter?.name).toBe("soturail-core");
    expect(JSON.parse(await fs.readFile(path.join(root, ".claude", "skills", "soturail-core", PROJECTION_MARKER), "utf8")).host).toBe("claude");
    const codex = await exportPortableSkills(root, { host: "codex", install: true });
    expect(codex.outDir).toBe(".agents/skills");
    // Projections in .agents/skills are recognized and not loaded as separate project skills.
    const catalog = await loadSkillCatalog(root);
    expect(catalog.skills.filter((skill) => skill.source === "project")).toEqual([]);
    expect(catalog.issues.filter((issue) => issue.code === "name_shadowed")).toEqual([]);
  });

  it("refuses to replace a user-authored skill directory it does not manage", async () => {
    const root = await tempRoot();
    const userDir = path.join(root, ".claude", "skills", "soturail-core");
    await fs.mkdir(userDir, { recursive: true });
    await fs.writeFile(path.join(userDir, "SKILL.md"), "---\nname: soturail-core\ndescription: my own\n---\nmine\n");
    const result = await exportPortableSkills(root, { host: "claude", install: true });
    expect(result.skipped).toContainEqual({ name: "soturail-core", reason: "unmanaged_existing_dir" });
    expect(await fs.readFile(path.join(userDir, "SKILL.md"), "utf8")).toContain("mine");
  });

  it("labels unknown hosts as generic fallback in the export result", async () => {
    const root = await tempRoot();
    const result = await exportPortableSkills(root, { host: "kimi" });
    expect(result.host).toMatchObject({ id: "generic", requested: "kimi", verification: "generic-fallback" });
    expect(result.outDir).toBe(".soturail/exports/skills/portable/generic");
  });
});
