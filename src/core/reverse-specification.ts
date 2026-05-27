import { promises as fs } from "node:fs";
import path from "node:path";
import { appendJsonl, ensureWorkspace, getWorkspacePaths, readJsonl, relativeToRoot, writeJson } from "./config.js";
import type { BrainClaimKind, BrainClaimRecord, BrainGapRecord } from "./project-brain.js";
import { initBrain } from "./project-brain.js";
import { makeRailId, sha256Text, summarizeText } from "./rail-utils.js";

export interface ReverseScanReport {
  schemaVersion: "soturail.reverse.scan.v1";
  createdAt: string;
  roots: string[];
  filesScanned: number;
  commandsDetected: string[];
  modulesDetected: string[];
  likelyRails: string[];
  testsLinked: string[];
  docsLinked: string[];
  gaps: string[];
}

export async function reverseScan(target: string, root = process.cwd()): Promise<{ report: ReverseScanReport; output: string }> {
  await initBrain(root);
  const files = await listTargetFiles(target, root);
  const texts = await Promise.all(files.map(async (file) => ({ file, text: await fs.readFile(path.resolve(root, file), "utf8").catch(() => "") })));
  const commandsDetected = [...new Set(texts.flatMap(({ text }) => [...text.matchAll(/\.command\(["']([^"']+)["']\)/g)].map((match) => match[1] ?? "")).filter(Boolean))].sort();
  const modulesDetected = files.filter((file) => /src[\\/]core[\\/]/.test(file)).map((file) => path.basename(file).replace(/\.ts$/, "")).sort();
  const likelyRails = detectLikelyRails(texts.map((item) => `${item.file}\n${item.text}`).join("\n"));
  const testsLinked = await listTargetFiles("tests", root).catch(() => []);
  const docsLinked = await listTargetFiles("docs", root).catch(() => []);
  const gaps = [
    ...(commandsDetected.length === 0 ? ["No CLI command registrations found in scan target."] : []),
    ...(testsLinked.length === 0 ? ["No tests linked from repository."] : []),
    ...(docsLinked.length === 0 ? ["No docs linked from repository."] : [])
  ];
  const report: ReverseScanReport = {
    schemaVersion: "soturail.reverse.scan.v1",
    createdAt: new Date().toISOString(),
    roots: [target],
    filesScanned: files.length,
    commandsDetected,
    modulesDetected,
    likelyRails,
    testsLinked: testsLinked.slice(0, 50),
    docsLinked: docsLinked.slice(0, 50),
    gaps
  };
  const paths = getWorkspacePaths(root);
  await writeJson(paths.brainReverseScanJson, report);
  await fs.writeFile(paths.brainReverseScanMd, renderReverseScan(report), "utf8");
  return {
    report,
    output: [
      "SotuRail reverse scan",
      `target: ${target}`,
      `files_scanned: ${report.filesScanned}`,
      `commands_detected: ${report.commandsDetected.length}`,
      `modules_detected: ${report.modulesDetected.length}`,
      `json: ${relativeToRoot(root, paths.brainReverseScanJson)}`,
      `markdown: ${relativeToRoot(root, paths.brainReverseScanMd)}`
    ].join("\n") + "\n"
  };
}

export async function reverseClaims(target: string, root = process.cwd()): Promise<{ claims: BrainClaimRecord[]; output: string }> {
  await initBrain(root);
  const files = await listTargetFiles(target, root);
  const now = new Date().toISOString();
  const claims: BrainClaimRecord[] = [];
  for (const file of files) {
    const text = await fs.readFile(path.resolve(root, file), "utf8").catch(() => "");
    for (const command of [...text.matchAll(/\.command\(["']([^"']+)["']\)/g)].map((match) => match[1] ?? "").filter(Boolean)) {
      claims.push(await makeClaim(root, `CLI command '${command}' is implemented.`, "command", file, ["reverse", "command", command], now));
    }
    for (const schema of [...text.matchAll(/soturail\.[a-z0-9.-]+\.v\d+/gi)].map((match) => match[0] ?? "").filter(Boolean)) {
      claims.push(await makeClaim(root, `Schema '${schema}' is referenced.`, "architecture", file, ["reverse", "schema"], now));
    }
    if (/docs[\\/]releases|RELEASE_NOTES_v/.test(text)) {
      claims.push(await makeClaim(root, "Release note paths are handled by this source.", "release", file, ["reverse", "release"], now));
    }
    if (/arbitrary shell|secret|redact|policy|approval/i.test(text)) {
      claims.push(await makeClaim(root, "This source contains safety or policy behavior.", "security", file, ["reverse", "policy"], now));
    }
    if (/\.soturail[\\/][\w/-]+/.test(text)) {
      claims.push(await makeClaim(root, "This source writes or reads local .soturail storage.", "architecture", file, ["reverse", "storage"], now));
    }
  }
  const paths = getWorkspacePaths(root);
  const added = await appendRecordsIfNew(paths.brainClaimsFile, claims);
  return {
    claims,
    output: [
      "SotuRail reverse claims",
      `target: ${target}`,
      `claims_found: ${claims.length}`,
      `claims_added: ${added}`,
      `jsonl: ${relativeToRoot(root, paths.brainClaimsFile)}`
    ].join("\n") + "\n"
  };
}

export async function reverseSpecs(target: string, root = process.cwd()): Promise<{ paths: string[]; output: string }> {
  await initBrain(root);
  await reverseClaims(target, root);
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const specs = [
    ["release.spec.md", "Release", ["release", "version", "publish"]],
    ["workflow.spec.md", "Workflow", ["workflow", "evidence", "harness"]],
    ["agent-runtime.spec.md", "Agent Runtime", ["agent", "mcp", "prompt-only"]],
    ["brain.spec.md", "Project Brain", ["brain", "claim", "reverse"]]
  ] as const;
  const written: string[] = [];
  await fs.mkdir(paths.brainSpecsDir, { recursive: true });
  for (const [file, title, keywords] of specs) {
    const relevant = claims.filter((claim) => keywords.some((keyword) => `${claim.claim} ${claim.tags.join(" ")}`.toLowerCase().includes(keyword)));
    const specPath = path.join(paths.brainSpecsDir, file);
    await fs.writeFile(specPath, renderSpec(title, relevant), "utf8");
    written.push(specPath);
  }
  return {
    paths: written,
    output: [
      "SotuRail reverse specs",
      `target: ${target}`,
      `specs_written: ${written.length}`,
      ...written.map((filePath) => `- ${relativeToRoot(root, filePath)}`)
    ].join("\n") + "\n"
  };
}

export async function reverseGaps(root = process.cwd()): Promise<{ gaps: BrainGapRecord[]; markdownPath: string; output: string }> {
  await initBrain(root);
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const now = new Date().toISOString();
  const gaps: BrainGapRecord[] = [];
  for (const claim of claims.filter((item) => item.status === "verified" && item.validatedBy.length === 0).slice(0, 20)) {
    gaps.push({
      schemaVersion: "soturail.brain.gap.v1",
      id: makeRailId("gap", `claim-without-test:${claim.id}`),
      gap: `Claim lacks deterministic validation reference: ${claim.claim}`,
      severity: "medium",
      needsHumanValidation: true,
      sourcePath: claim.sourcePath,
      status: "open",
      createdAt: now
    });
  }
  if (!(await exists(path.join(root, "docs", "project-brain.md")))) {
    gaps.push({
      schemaVersion: "soturail.brain.gap.v1",
      id: makeRailId("gap", "project-brain-doc-missing"),
      gap: "Project Brain docs are missing.",
      severity: "high",
      needsHumanValidation: true,
      sourcePath: "docs/project-brain.md",
      status: "open",
      createdAt: now
    });
  }
  if (!(await exists(path.join(root, "src", "commands", "diagram.ts"))) && await exists(path.join(root, "docs", "diagram-rail.md"))) {
    gaps.push({
      schemaVersion: "soturail.brain.gap.v1",
      id: makeRailId("gap", "diagram-doc-without-command"),
      gap: "Diagram docs exist but diagram command was not found.",
      severity: "medium",
      needsHumanValidation: true,
      sourcePath: "docs/diagram-rail.md",
      status: "open",
      createdAt: now
    });
  }
  const added = await appendRecordsIfNew(paths.brainGapsFile, gaps);
  const markdownPath = path.join(paths.brainDir, "gaps.md");
  await fs.writeFile(markdownPath, [
    "# Reverse Specification Gaps",
    "",
    ...gaps.map((gap) => `- [${gap.severity}] ${gap.gap} (source: ${gap.sourcePath})`),
    ""
  ].join("\n"), "utf8");
  return {
    gaps,
    markdownPath,
    output: [
      "SotuRail reverse gaps",
      `gaps_found: ${gaps.length}`,
      `gaps_added: ${added}`,
      `jsonl: ${relativeToRoot(root, paths.brainGapsFile)}`,
      `markdown: ${relativeToRoot(root, markdownPath)}`
    ].join("\n") + "\n"
  };
}

export async function reverseExport(target = "agent", root = process.cwd()): Promise<{ path: string; output: string }> {
  if (target !== "agent") throw new Error(`Unknown reverse export target "${target}". Supported: agent.`);
  await initBrain(root);
  const paths = getWorkspacePaths(root);
  const claims = await readJsonl<BrainClaimRecord>(paths.brainClaimsFile);
  const gaps = await readJsonl<BrainGapRecord>(paths.brainGapsFile);
  const specs = await listTargetFiles(path.relative(root, paths.brainSpecsDir), root).catch(() => []);
  const outputPath = path.join(paths.brainExportsDir, "reverse-agent-brief.md");
  await fs.writeFile(outputPath, [
    "# Reverse Specification Agent Brief",
    "",
    "Use this as compact local context. It is deterministic, source-backed and does not rely on an LLM.",
    "",
    "## Source Claims",
    "",
    ...claims.slice(0, 20).map((claim) => `- ${claim.id}: ${claim.claim} (${claim.sourcePath})`),
    "",
    "## Draft Specs",
    "",
    ...(specs.length > 0 ? specs.map((spec) => `- ${spec}`) : ["- none generated yet; run `soturail reverse specs ./src`."]),
    "",
    "## Open Gaps",
    "",
    ...nonEmpty(gaps.filter((gap) => gap.status === "open").slice(0, 20).map((gap) => `- [${gap.severity}] ${gap.gap}`), "- none recorded"),
    "",
    "## Next Safe Commands",
    "",
    "- soturail brain doctor",
    "- soturail rules from-brain",
    "- soturail eval run --suite brain",
    ""
  ].join("\n"), "utf8");
  return {
    path: outputPath,
    output: [
      "SotuRail reverse export",
      `target: ${target}`,
      `path: ${relativeToRoot(root, outputPath)}`
    ].join("\n") + "\n"
  };
}

async function makeClaim(root: string, claim: string, kind: BrainClaimKind, sourcePath: string, tags: string[], now: string): Promise<BrainClaimRecord> {
  const absolute = path.resolve(root, sourcePath);
  const raw = await fs.readFile(absolute, "utf8").catch(() => "");
  const lines = raw.split(/\r?\n/);
  const firstWord = claim.split(/\s+/)[0] ?? "";
  const index = lines.findIndex((line) => line.toLowerCase().includes(firstWord.toLowerCase()));
  const startLine = index >= 0 ? index + 1 : 1;
  const endLine = Math.min(lines.length || 1, startLine + 2);
  const rangeText = raw ? lines.slice(startLine - 1, endLine).join("\n") : "";
  return {
    schemaVersion: "soturail.brain.claim.v1",
    id: makeRailId("claim", `${claim}:${sourcePath}`),
    claim,
    kind,
    status: raw ? "verified" : "unverified",
    confidence: raw ? "medium" : "low",
    sourcePath,
    sourceCommit: "reverse-scan",
    sourceRange: { startLine, endLine },
    fileHash: raw ? `sha256-${sha256Text(raw)}` : "sha256-missing",
    rangeHash: rangeText ? `sha256-${sha256Text(rangeText)}` : "sha256-missing",
    validatedBy: sourcePath.startsWith("tests/") ? [sourcePath] : [],
    relatedWorkflowIds: [],
    relatedEvidenceIds: [],
    tags,
    createdAt: now,
    updatedAt: now
  };
}

async function listTargetFiles(target: string, root: string): Promise<string[]> {
  const resolved = path.resolve(root, target);
  const stat = await fs.stat(resolved).catch(() => null);
  if (!stat) return [];
  const output: string[] = [];
  async function visit(current: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (["node_modules", ".git", "dist", ".soturail", "coverage"].includes(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile() && /\.(ts|tsx|js|mjs|cjs|md|json|yml|yaml)$/.test(entry.name)) {
        output.push(relativeToRoot(root, absolute).replace(/\\/g, "/"));
      }
    }
  }
  if (stat.isDirectory()) await visit(resolved);
  if (stat.isFile()) output.push(relativeToRoot(root, resolved).replace(/\\/g, "/"));
  return output.sort((a, b) => a.localeCompare(b));
}

function detectLikelyRails(text: string): string[] {
  const rails = [
    ["memory", /memory/i],
    ["context", /context/i],
    ["workflow", /workflow/i],
    ["harness", /harness/i],
    ["diagram", /diagram|Mermaid/i],
    ["evaluation", /evaluation|eval/i],
    ["agents", /agent/i],
    ["rules", /rules?/i],
    ["brain", /brain/i]
  ] as const;
  return rails.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

function renderReverseScan(report: ReverseScanReport): string {
  return [
    "# SotuRail Reverse Scan",
    "",
    `createdAt: ${report.createdAt}`,
    `files_scanned: ${report.filesScanned}`,
    "",
    "## Commands",
    "",
    ...(report.commandsDetected.length > 0 ? report.commandsDetected.map((command) => `- ${command}`) : ["- none"]),
    "",
    "## Modules",
    "",
    ...(report.modulesDetected.length > 0 ? report.modulesDetected.map((module) => `- ${module}`) : ["- none"]),
    "",
    "## Likely Rails",
    "",
    ...(report.likelyRails.length > 0 ? report.likelyRails.map((rail) => `- ${rail}`) : ["- none"]),
    "",
    "## Gaps",
    "",
    ...(report.gaps.length > 0 ? report.gaps.map((gap) => `- ${gap}`) : ["- none"]),
    ""
  ].join("\n");
}

function nonEmpty(values: string[], fallback: string): string[] {
  return values.length > 0 ? values : [fallback];
}

function renderSpec(title: string, claims: BrainClaimRecord[]): string {
  return [
    `# ${title} Reverse Spec`,
    "",
    "## Purpose",
    "",
    `Describe the verified local behavior for ${title.toLowerCase()} rail surfaces.`,
    "",
    "## Source Claims",
    "",
    ...(claims.length > 0 ? claims.slice(0, 20).map((claim) => `- ${claim.id}: ${claim.claim} (source: ${claim.sourcePath})`) : ["- No source claims yet."]),
    "",
    "## Required Behavior",
    "",
    ...(claims.length > 0 ? claims.slice(0, 10).map((claim) => `- Preserve: ${summarizeText(claim.claim, 160)}`) : ["- Add claims with `soturail reverse claims ./src`."]),
    "",
    "## Acceptance Criteria",
    "",
    "- Source claims have source paths.",
    "- Gaps are explicit.",
    "- Validation references are linked when available.",
    "",
    "## Known Gaps",
    "",
    "- Human review required before treating this draft spec as policy.",
    "",
    "## Validation References",
    "",
    ...(claims.flatMap((claim) => claim.validatedBy).length > 0 ? [...new Set(claims.flatMap((claim) => claim.validatedBy))].map((item) => `- ${item}`) : ["- none yet"]),
    ""
  ].join("\n");
}

async function appendRecordsIfNew<T extends { id: string }>(filePath: string, records: T[]): Promise<number> {
  const existing = new Set((await readJsonl<T>(filePath)).map((record) => record.id));
  let added = 0;
  for (const record of records) {
    if (existing.has(record.id)) continue;
    await appendJsonl(filePath, record);
    existing.add(record.id);
    added += 1;
  }
  return added;
}

async function exists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}
