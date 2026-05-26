import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths, relativeToRoot, writeJson } from "./config.js";
import { validateMermaidDiagram, type DiagramValidationReport } from "./diagram-validator.js";
import { readWorkflow } from "./workflow-store.js";

export interface DiagramAuditReport {
  schemaVersion: "soturail.diagram.audit.v1";
  file: string;
  exists: boolean;
  containsMermaid: boolean;
  fenceOk: boolean;
  hasSpec: boolean;
  workflowStateReferenced: boolean;
  validation: DiagramValidationReport;
}

export async function initDiagramRail(root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const docsDir = path.join(root, "docs", "diagrams");
  await fs.mkdir(paths.diagramsDir, { recursive: true });
  await fs.mkdir(docsDir, { recursive: true });
  if (!(await exists(paths.diagramsIndexFile))) {
    await writeJson(paths.diagramsIndexFile, { schemaVersion: "soturail.diagram.index.v1", diagrams: [] });
  }
  await writeFileIfMissing(path.join(docsDir, "README.md"), [
    "# Diagrams",
    "",
    "SotuRail Diagram Rail stores text-based Mermaid diagrams and `.spec.md` visual contracts here.",
    ""
  ].join("\n"));
  return [
    "SotuRail diagram init",
    `diagrams_dir: ${relativeToRoot(root, paths.diagramsDir)}`,
    `docs_diagrams_dir: ${relativeToRoot(root, docsDir)}`,
    `index: ${relativeToRoot(root, paths.diagramsIndexFile)}`,
    "next_commands:",
    "- soturail diagram new <feature>",
    "- soturail diagram validate"
  ].join("\n") + "\n";
}

export async function createDiagram(feature: string, root = process.cwd()): Promise<{ diagramPath: string; specPath: string; output: string }> {
  await initDiagramRail(root);
  const slug = slugify(feature);
  const title = titleCase(feature);
  const docsDir = path.join(root, "docs", "diagrams");
  const diagramPath = path.join(docsDir, `${slug}.md`);
  const specPath = path.join(docsDir, `${slug}.spec.md`);
  await writeFileIfMissing(diagramPath, diagramTemplate(title));
  await writeFileIfMissing(specPath, specTemplate(title, diagramPath, root));
  await refreshDiagramIndex(root);
  return {
    diagramPath,
    specPath,
    output: [
      "SotuRail diagram new",
      `feature: ${title}`,
      `diagram: ${relativeToRoot(root, diagramPath)}`,
      `spec: ${relativeToRoot(root, specPath)}`
    ].join("\n") + "\n"
  };
}

export async function auditDiagram(file: string, root = process.cwd()): Promise<{ report: DiagramAuditReport; output: string }> {
  const filePath = path.resolve(root, file);
  const existsFile = await exists(filePath);
  const raw = existsFile ? await fs.readFile(filePath, "utf8") : "";
  const specPath = matchingSpecPath(filePath);
  const report: DiagramAuditReport = {
    schemaVersion: "soturail.diagram.audit.v1",
    file: relativeToRoot(root, filePath),
    exists: existsFile,
    containsMermaid: /```mermaid/i.test(raw),
    fenceOk: countMatches(raw, /```/g) % 2 === 0,
    hasSpec: await exists(specPath),
    workflowStateReferenced: /\b(draft|planned|active|verifying|ready_for_review|closed|blocked)\b/i.test(raw),
    validation: validateMermaidDiagram(raw)
  };
  return { report, output: renderAudit(report) };
}

export async function validateDiagrams(root = process.cwd()): Promise<{ reports: DiagramAuditReport[]; path: string; output: string }> {
  await initDiagramRail(root);
  const docsDir = path.join(root, "docs", "diagrams");
  const entries = await listMarkdownFiles(docsDir);
  const reports = [];
  for (const entry of entries.filter((file) => !file.endsWith(".spec.md") && path.basename(file) !== "README.md")) {
    reports.push((await auditDiagram(entry, root)).report);
  }
  const outputPath = path.join(getWorkspacePaths(root).diagramsDir, "validation.json");
  await writeJson(outputPath, { schemaVersion: "soturail.diagram.validation-run.v1", reports });
  return {
    reports,
    path: outputPath,
    output: [
      "SotuRail diagram validate",
      `diagrams_count: ${reports.length}`,
      `valid_count: ${reports.filter((report) => report.validation.valid && report.fenceOk && report.containsMermaid).length}`,
      `report: ${relativeToRoot(root, outputPath)}`,
      "",
      ...reports.map((report) => `- ${report.file}: ${report.validation.valid && report.fenceOk && report.containsMermaid ? "valid" : "warn"}`)
    ].join("\n") + "\n"
  };
}

export async function diagramFromWorkflow(id: string, root = process.cwd()): Promise<{ diagramPath: string; specPath: string; output: string }> {
  await initDiagramRail(root);
  const workflow = await readWorkflow(id, root);
  const slug = slugify(workflow.id);
  const title = `Workflow ${workflow.title}`;
  const docsDir = path.join(root, "docs", "diagrams");
  const diagramPath = path.join(docsDir, `${slug}.md`);
  const specPath = path.join(docsDir, `${slug}.spec.md`);
  const diagram = [
    `# ${title}`,
    "",
    "```mermaid",
    "stateDiagram-v2",
    "  [*] --> draft",
    "  draft --> planned",
    "  planned --> active",
    "  active --> verifying",
    "  verifying --> ready_for_review",
    "  ready_for_review --> closed",
    "  verifying --> blocked",
    `  ${workflow.state} --> ${workflow.state}`,
    "```",
    "",
    `workflow_id: ${workflow.id}`,
    `current_state: ${workflow.state}`,
    ""
  ].join("\n");
  await fs.writeFile(diagramPath, diagram, "utf8");
  await writeFileIfMissing(specPath, specTemplate(title, diagramPath, root));
  await refreshDiagramIndex(root);
  return {
    diagramPath,
    specPath,
    output: [
      "SotuRail diagram from-workflow",
      `workflow_id: ${workflow.id}`,
      `diagram: ${relativeToRoot(root, diagramPath)}`,
      `spec: ${relativeToRoot(root, specPath)}`
    ].join("\n") + "\n"
  };
}

function renderAudit(report: DiagramAuditReport): string {
  return [
    "SotuRail diagram audit",
    `file: ${report.file}`,
    `exists: ${report.exists}`,
    `contains_mermaid: ${report.containsMermaid}`,
    `fence_ok: ${report.fenceOk}`,
    `matching_spec: ${report.hasSpec}`,
    `workflow_state_referenced: ${report.workflowStateReferenced}`,
    `valid: ${report.validation.valid}`,
    "",
    ...(report.validation.findings.length > 0 ? report.validation.findings.map((finding) => `- ${finding.severity}: ${finding.message}`) : ["No validation findings."])
  ].join("\n") + "\n";
}

async function refreshDiagramIndex(root: string): Promise<void> {
  const docsDir = path.join(root, "docs", "diagrams");
  const diagrams = (await listMarkdownFiles(docsDir)).filter((file) => !file.endsWith(".spec.md"));
  await writeJson(getWorkspacePaths(root).diagramsIndexFile, { schemaVersion: "soturail.diagram.index.v1", diagrams });
}

async function listMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(dir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function diagramTemplate(title: string): string {
  return [
    `# Diagram: ${title}`,
    "",
    "```mermaid",
    "stateDiagram-v2",
    "  [*] --> Draft",
    "  Draft --> Planned",
    "  Planned --> Active",
    "  Active --> Verifying",
    "  Verifying --> ReadyForReview",
    "  ReadyForReview --> Closed",
    "  Verifying --> Blocked",
    "```",
    ""
  ].join("\n");
}

function specTemplate(title: string, diagramPath: string, root: string): string {
  return [
    `# Visual Contract: ${title}`,
    "",
    "## Required nodes",
    "",
    "- Draft",
    "- Planned",
    "- Active",
    "- Verifying",
    "- ReadyForReview",
    "- Closed",
    "- Blocked",
    "",
    "## Required transitions",
    "",
    "- Draft -> Planned",
    "- Planned -> Active",
    "- Active -> Verifying",
    "- Verifying -> ReadyForReview",
    "- ReadyForReview -> Closed",
    "",
    "## Evidence links",
    "",
    `- Diagram: ${relativeToRoot(root, diagramPath)}`,
    "- Workflow evidence: run `soturail workflow evidence <id>` when available.",
    "",
    "## Validation checklist",
    "",
    "- [ ] Mermaid block is present.",
    "- [ ] Verification transition is present.",
    "- [ ] Tests and evidence are linked before release.",
    "",
    "## Known gaps",
    "",
    "- Add feature-specific states and acceptance evidence.",
    ""
  ].join("\n");
}

function matchingSpecPath(filePath: string): string {
  return filePath.endsWith(".spec.md") ? filePath : filePath.replace(/\.md$/i, ".spec.md");
}

function countMatches(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

async function writeFileIfMissing(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  if (!(await exists(filePath))) await fs.writeFile(filePath, content, "utf8");
}

async function exists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "diagram";
}

function titleCase(input: string): string {
  return input.trim().replace(/\s+/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()) || "Diagram";
}
