import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { CAPABILITY_DESCRIPTORS, capabilityCatalog } from "../src/core/capability-descriptor.js";
import { listCandidates, recordCandidate } from "../src/core/candidate-store.js";
import { scanRepository } from "../src/core/file-scanner.js";
import { loadConfig } from "../src/core/config.js";
import { normalizeWords } from "../src/core/rail-utils.js";
import { readCommand } from "../src/commands/read.js";
import { createWorkspaceFingerprint } from "../src/core/workspace-fingerprint.js";
import { WorkspaceGuard } from "../src/core/workspace-guard.js";

const exec = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })));
});

async function project(name = "proj"): Promise<string> {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-i18n-"));
  temporaryDirectories.push(parent);
  const root = path.join(parent, name);
  await fs.mkdir(root, { recursive: true });
  await exec("git", ["init", "-q"], { cwd: root });
  await fs.writeFile(path.join(root, ".gitignore"), ".soturail/\n");
  return root;
}

const producer = { kind: "semantic-worker", host: "generic" };

describe("Fixture A — Portuguese task, English code", () => {
  it("keeps exact English identifiers and paths while the task stays Portuguese", async () => {
    const root = await project();
    await fs.mkdir(path.join(root, "src", "auth"), { recursive: true });
    await fs.writeFile(path.join(root, "src", "auth", "session.ts"), "export function refreshToken(sessionId: string) { return sessionId; }\n");
    const stored = await recordCandidate({
      kind: "impact",
      target: { path: "src/auth/session.ts", symbol: "refreshToken" },
      affected: [{ ref: { path: "src/auth/session.ts", symbol: "refreshToken" }, relation: "calls" }],
      summaryOriginal: "Corrigir a autenticação afeta refreshToken e as rotas que o chamam.",
      locale: { user: "pt-BR", project: "en" },
      producer,
      verificationState: "inferred"
    }, root);
    expect(stored.candidate.kind === "impact" && stored.candidate.target).toEqual({ path: "src/auth/session.ts", symbol: "refreshToken" });
    expect(stored.candidate.kind === "impact" && stored.candidate.summaryOriginal).toBe("Corrigir a autenticação afeta refreshToken e as rotas que o chamam.");
    // The lexical fallback no longer mangles accents (no keyword table involved).
    expect(normalizeWords("Corrija a autenticação")).toEqual(["corrija", "autenticação"]);
    expect(normalizeWords("fix: failing test #42")).toEqual(["fix:", "failing", "test"]);
  });
});

describe("Fixture B — Spanish requirement, English code", () => {
  it("keeps the original Spanish rule, a stable artifact type and unverified state", async () => {
    const root = await project();
    await fs.mkdir(path.join(root, "docs", "requisitos"), { recursive: true });
    const rule = "El pago debe rechazarse si la tarjeta está vencida.";
    await fs.writeFile(path.join(root, "docs", "requisitos", "pagos.md"), `# Pagos\n\n${rule}\n`);
    const stored = await recordCandidate({
      kind: "claim",
      claimType: "business_rule",
      statementOriginal: rule,
      sourceRefs: [{ path: "docs/requisitos/pagos.md", lines: { start: 3, end: 3 } }],
      translations: [{ locale: "en", text: "Payment must be rejected when the card is expired.", derived: true }],
      locale: { user: "pt-BR", source: "es" },
      producer,
      verificationState: "unverified"
    }, root);
    expect(stored.candidate).toMatchObject({ schemaVersion: "soturail.semantic.candidate.v1", kind: "claim", claimType: "business_rule", verificationState: "unverified", statementOriginal: rule });
    expect(stored.candidate.sourceRefs[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("Fixture C — Japanese and Unicode paths", () => {
  it("keeps WorkspaceGuard, fingerprints, scanning and reads correct for Japanese paths", async () => {
    const root = await project("プロジェクト");
    const relative = "docs/要件/認証仕様.md";
    await fs.mkdir(path.join(root, "docs", "要件"), { recursive: true });
    const text = "# 認証\n\nセッションは30分で失効する。\n";
    await fs.writeFile(path.join(root, ...relative.split("/")), text);
    await fs.writeFile(path.join(root, "認証.ts"), "export function 認証する(ユーザー: string) { return ユーザー; }\nexport const café = 1;\n");
    const guard = new WorkspaceGuard(root);
    expect(await fs.readFile(await guard.assertAllowedRead(relative), "utf8")).toBe(text);
    await expect(guard.assertAllowedRead("../outside.md")).rejects.toThrow(/escapes/);
    const before = await createWorkspaceFingerprint(root);
    expect(before.fingerprint).toBe((await createWorkspaceFingerprint(root)).fingerprint);
    const repo = await scanRepository(root, await loadConfig(root));
    const scanned = repo.files.find((file) => file.path === "認証.ts");
    expect(scanned?.symbols.map((symbol) => symbol.name)).toEqual(["認証する", "café"]);
    expect(repo.files.map((file) => file.path)).toContain(relative);
    expect(await readCommand(relative, { full: true }, root)).toContain("セッションは30分で失効する。");
    const stored = await recordCandidate({ kind: "claim", statementOriginal: "セッションは30分で失効する。", sourceRefs: [{ path: relative }], locale: { source: "ja" }, producer, verificationState: "candidate" }, root);
    expect(stored.candidate.sourceRefs[0]?.path).toBe(relative);
    expect((await listCandidates(root))[0]?.sources).toEqual([{ path: relative, state: "current" }]);
  });
});

describe("Fixture D — mixed Portuguese/English docs that conflict", () => {
  it("surfaces the conflict; neither language wins; source freshness decides", async () => {
    const root = await project();
    await fs.mkdir(path.join(root, "docs"), { recursive: true });
    await fs.writeFile(path.join(root, "README.md"), "# API\n\nO limite é 100 requisições por minuto.\n");
    await fs.writeFile(path.join(root, "docs", "api.md"), "# API\n\nThe limit is 50 requests per minute.\n");
    const pt = await recordCandidate({ kind: "claim", statementOriginal: "O limite é 100 requisições por minuto.", sourceRefs: [{ path: "README.md", lines: { start: 3, end: 3 } }], locale: { source: "pt-BR" }, producer, verificationState: "candidate" }, root);
    const en = await recordCandidate({ kind: "claim", statementOriginal: "The limit is 50 requests per minute.", sourceRefs: [{ path: "docs/api.md", lines: { start: 3, end: 3 } }], locale: { source: "en" }, producer, verificationState: "candidate" }, root);
    const conflict = await recordCandidate({
      kind: "interpretation",
      summaryOriginal: "README (pt-BR) e docs/api.md (en) divergem sobre o limite.",
      conflictsWith: [pt.candidate.id, en.candidate.id],
      locale: { project: "mixed" },
      producer,
      verificationState: "unknown"
    }, root);
    const views = await listCandidates(root);
    expect(views.map((view) => view.candidate.verificationState).sort()).toEqual(["candidate", "candidate", "unknown"]);
    expect(conflict.candidate.kind === "interpretation" && conflict.candidate.conflictsWith).toEqual([pt.candidate.id, en.candidate.id]);
    // Updating one source changes that source's provenance state, independent of its language.
    await fs.writeFile(path.join(root, "docs", "api.md"), "# API\n\nThe limit is 100 requests per minute.\n");
    const after = await listCandidates(root, { kind: "claim" });
    const byPath = Object.fromEntries(after.flatMap((view) => view.sources.map((source) => [source.path, source.state])));
    expect(byPath).toEqual({ "README.md": "current", "docs/api.md": "changed" });
  });
});

describe("language-neutral machine identity", () => {
  it("never localizes capability IDs, enums or surfaces", () => {
    const en = capabilityCatalog("en");
    const pt = capabilityCatalog("pt-BR");
    expect(pt.capabilities.map((item) => [item.id, item.maturity, item.availability, item.mcp, item.cli])).toEqual(en.capabilities.map((item) => [item.id, item.maturity, item.availability, item.mcp, item.cli]));
    for (const descriptor of CAPABILITY_DESCRIPTORS) expect(descriptor.id).toMatch(/^[a-z0-9.-]+$/);
  });

  it("has no per-language keyword tables in the semantic surfaces", async () => {
    const sources = await Promise.all(["src/core/skill-routing.ts", "src/core/skill-model.ts", "src/core/capability-descriptor.ts", "src/core/candidate-store.ts", "src/core/semantic-candidate.ts"].map((file) => fs.readFile(file, "utf8")));
    for (const text of sources) expect(text).not.toMatch(/\b(?:pt|es|ja|en)Keywords\b|synonyms?\s*[:=]/i);
  });
});
