import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { listCandidates, recordCandidate } from "../src/core/candidate-store.js";
import { routeContext, selectContext } from "../src/core/context-intelligence.js";
import { callMcpTool } from "../src/core/mcp-tools.js";
import { SelfPromotionError } from "../src/core/semantic-candidate.js";
import { rankSkillsLexically, ROUTING_AUTHORITY, routeSkill, suggestSkills } from "../src/core/skill-routing.js";

const exec = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })));
});

async function gitProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-routing-"));
  temporaryDirectories.push(dir);
  await exec("git", ["init", "-q"], { cwd: dir });
  await fs.writeFile(path.join(dir, ".gitignore"), ".soturail/\n");
  await fs.writeFile(path.join(dir, "auth.ts"), "export function refreshToken() {}\n");
  return dir;
}

const claim = (overrides: Record<string, unknown> = {}) => ({
  kind: "claim",
  statementOriginal: "A sessão expira após 30 minutos.",
  sourceRefs: [{ path: "auth.ts", lines: { start: 1, end: 1 } }],
  producer: { kind: "semantic-worker", host: "claude", skill: "soturail-change" },
  verificationState: "unverified",
  ...overrides
});

describe("keyword routing is a labeled fallback", () => {
  it("labels every lexical routing output as heuristic", async () => {
    const root = await gitProject();
    expect(ROUTING_AUTHORITY).toBe("heuristic-fallback");
    expect(await suggestSkills("publish a release", root)).toContain("selection_authority: heuristic-fallback");
    const routed = await routeSkill("publish a release", root);
    expect(routed).toContain("selection_authority: heuristic-fallback");
    expect(routed).toContain("approval_required_capabilities: command.run");
    expect(routeContext("prepare npm release")).toMatchObject({ expert: "release", authority: "heuristic-fallback" });
  });

  it("does not pretend to understand non-English tasks", async () => {
    const root = await gitProject();
    // No per-language keyword tables: the lexical ranker finds nothing, and says so.
    expect(await rankSkillsLexically("次のバージョンをリリースしてください", root)).toEqual([]);
    expect(await suggestSkills("次のバージョンをリリースしてください", root)).toContain("Let the agent choose");
  });

  it("lets the agent declare expert and role, overriding the fallback", async () => {
    const root = await gitProject();
    const fallback = await selectContext("Corrija a autenticação", 5, root);
    expect(fallback.routing.authority).toBe("heuristic-fallback");
    const declared = await selectContext("Corrija a autenticação", 5, root, { expert: "security", role: "reviewer" });
    expect(declared).toMatchObject({ expert: "security", role: "reviewer", routing: { authority: "agent-declared" } });
  });
});

describe("structured candidate flow", () => {
  it("records candidates bound to the workspace and never verified", async () => {
    const root = await gitProject();
    const stored = await recordCandidate(claim({ confidence: { level: "high", basis: "model-self-report" } }), root);
    expect(stored.candidate.verificationState).toBe("unverified");
    expect(stored.candidate.workspace?.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.candidate.kind === "claim" && stored.candidate.statementOriginal).toBe("A sessão expira após 30 minutos.");
    // Producer-supplied ids, times and bindings are replaced by SotuRail.
    const spoofed = await recordCandidate(claim({ id: "cand_0000000000000000", createdAt: "2000-01-01T00:00:00.000Z", workspace: { fingerprint: "fake" } }), root);
    expect(spoofed.candidate.id).toBe(stored.candidate.id);
    expect(spoofed.candidate.workspace?.fingerprint).not.toBe("fake");
    expect((await listCandidates(root))[0]?.freshness).toBe("current");
  });

  it("rejects self-promotion, secrets and tampered stored files", async () => {
    const root = await gitProject();
    for (const state of ["verified", "approved", "ready", "current"]) {
      await expect(recordCandidate(claim({ verificationState: state }), root)).rejects.toThrow(SelfPromotionError);
    }
    await expect(recordCandidate(claim({ statementOriginal: `token ghp_${"a".repeat(36)}` }), root)).rejects.toThrow(/secret-like/);
    const stored = await recordCandidate(claim(), root);
    const file = path.join(root, stored.path);
    const raw = JSON.parse(await fs.readFile(file, "utf8"));
    raw.candidate.verificationState = "verified";
    await fs.writeFile(file, JSON.stringify(raw));
    await expect(listCandidates(root)).rejects.toThrow(SelfPromotionError);
  });

  it("marks candidates stale when the workspace changes", async () => {
    const root = await gitProject();
    await recordCandidate(claim(), root);
    await fs.writeFile(path.join(root, "auth.ts"), "export function refreshToken() { return 1; }\n");
    expect((await listCandidates(root))[0]?.freshness).toBe("stale");
  });

  it("records through MCP without granting trust", async () => {
    const root = await gitProject();
    const result = JSON.parse(await callMcpTool("soturail.candidates.record", { candidate: claim() }, root));
    expect(result).toMatchObject({ verificationState: "unverified" });
    await expect(callMcpTool("soturail.candidates.record", { candidate: claim({ verificationState: "verified" }) }, root)).rejects.toThrow(SelfPromotionError);
  });
});
