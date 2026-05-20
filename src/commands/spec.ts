import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { ensureWorkspace, getWorkspacePaths, relativeToRoot, writeFileIfMissing } from "../core/config.js";

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return slug || "feature";
}

async function nextSpecNumber(specsDir: string): Promise<number> {
  try {
    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    const numbers = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => Number(entry.name.match(/^(\d{3})-/)?.[1] ?? 0))
      .filter((value) => Number.isFinite(value));
    return Math.max(0, ...numbers) + 1;
  } catch {
    return 1;
  }
}

function specTemplates(featureIdea: string): Record<string, string> {
  const title = featureIdea.trim();
  return {
    "constitution.md": `# Constitution: ${title}

Status: Draft

## Principles

- Local-first behavior is mandatory.
- Raw evidence must remain recoverable.
- Safety gates must be explicit and reversible.
- Metrics must distinguish estimates from provider-reported facts.
`,
    "spec.md": `# Spec: ${title}

Status: Draft

## User Need

Describe the user-facing problem and the smallest verifiable outcome.

## Functional Requirements

- The implementation must be testable locally.
- The behavior must preserve user data.
- Any compression must point back to raw evidence.

## Acceptance Criteria

- Given the feature is used, then the user can inspect the result.
- Given a failure occurs, then the user receives a recoverable explanation.
`,
    "plan.md": `# Plan: ${title}

## Technical Approach

1. Define boundaries and storage format.
2. Implement the smallest reversible path.
3. Add tests for safety, failure and recovery.
4. Update docs after behavior is verified.
`,
    "tasks.md": `# Tasks: ${title}

- [ ] Confirm scope and non-goals.
- [ ] Add focused tests.
- [ ] Implement behavior.
- [ ] Run build and tests.
- [ ] Document usage and limitations.
`,
    "verification.md": `# Verification: ${title}

## Verification Plan

- Build succeeds locally.
- Tests cover the expected behavior.
- CLI examples are exercised when applicable.
`,
    "context-budget.md": `# Context Budget: ${title}

## Context Budget

- Prefer repo maps and targeted reads.
- Keep raw logs recoverable through soturail expand.
- Place stable spec content before dynamic run output.
`,
    "security-impact.md": `# Security Impact: ${title}

## Security Impact

- Identify destructive command risks.
- Identify secret-bearing raw logs.
- Confirm no automatic remote push is introduced.
`
  };
}

export async function createSpec(featureIdea: string, root = process.cwd()): Promise<{ folder: string; files: string[] }> {
  await ensureWorkspace(root);
  const paths = getWorkspacePaths(root);
  const number = await nextSpecNumber(paths.specsDir);
  const folder = path.resolve(paths.specsDir, `${String(number).padStart(3, "0")}-${slugify(featureIdea)}`);
  await fs.mkdir(folder, { recursive: true });

  const files: string[] = [];
  const templates = specTemplates(featureIdea);
  for (const [fileName, content] of Object.entries(templates)) {
    const filePath = path.resolve(folder, fileName);
    await writeFileIfMissing(filePath, content, undefined, root);
    files.push(relativeToRoot(root, filePath));
  }
  return { folder: relativeToRoot(root, folder), files };
}

export function registerSpecCommand(program: Command): void {
  const spec = program.command("spec").description("Manage Spec-Driven Development artifacts.");
  spec
    .command("new")
    .description("Create a new local SDD spec folder.")
    .argument("<feature idea>", "Feature idea")
    .action(async (featureIdea: string) => {
      const result = await createSpec(featureIdea);
      process.stdout.write(`Created spec folder: ${result.folder}\n${result.files.map((file) => `  + ${file}`).join("\n")}\n`);
    });

  spec.command("status").description("List local spec folders and task progress.").action(async () => {
    process.stdout.write(await specStatus());
  });

  spec.command("validate").description("Validate spec folders for required SDD sections.").argument("[spec-folder]", "Optional spec folder").action(async (folder?: string) => {
    process.stdout.write(await validateSpecs(folder));
  });

  const task = spec.command("task").description("Manage tasks in a spec folder.");
  task.command("add").argument("<spec-folder>", "Spec folder").argument("<text>", "Task text").action(async (folder: string, text: string) => {
    process.stdout.write(await addSpecTask(folder, text));
  });
  task.command("list").argument("<spec-folder>", "Spec folder").action(async (folder: string) => {
    process.stdout.write(await listSpecTasks(folder));
  });
  task.command("done").argument("<spec-folder>", "Spec folder").argument("<index>", "1-based task index").action(async (folder: string, index: string) => {
    process.stdout.write(await markSpecTaskDone(folder, Number(index)));
  });
}

async function specFolders(root = process.cwd()): Promise<string[]> {
  const paths = getWorkspacePaths(root);
  try {
    const entries = await fs.readdir(paths.specsDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => path.resolve(paths.specsDir, entry.name)).sort();
  } catch {
    return [];
  }
}

async function readFileOrEmpty(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8").catch(() => "");
}

export async function specStatus(root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const folders = await specFolders(root);
  if (folders.length === 0) {
    return "No specs found. Run soturail spec new \"feature idea\".\n";
  }
  const lines = ["SotuRail spec status"];
  for (const folder of folders) {
    const tasks = await readFileOrEmpty(path.resolve(folder, "tasks.md"));
    const done = (tasks.match(/^- \[x\]/gim) ?? []).length;
    const total = (tasks.match(/^- \[[ x]\]/gim) ?? []).length;
    lines.push(`${relativeToRoot(root, folder)}: ${done}/${total} tasks done`);
  }
  return `${lines.join("\n")}\n`;
}

export async function validateSpecs(specFolder?: string, root = process.cwd()): Promise<string> {
  await ensureWorkspace(root);
  const folders = specFolder ? [path.resolve(root, specFolder)] : await specFolders(root);
  const checks = [
    { file: "spec.md", label: "problem statement", pattern: /problem|user need/i },
    { file: "spec.md", label: "acceptance criteria", pattern: /acceptance criteria/i },
    { file: "verification.md", label: "verification plan", pattern: /verification plan/i },
    { file: "context-budget.md", label: "context budget", pattern: /context budget/i },
    { file: "security-impact.md", label: "security impact", pattern: /security impact/i }
  ];
  const lines = ["SotuRail spec validate"];
  for (const folder of folders) {
    lines.push(relativeToRoot(root, folder));
    for (const check of checks) {
      const content = await readFileOrEmpty(path.resolve(folder, check.file));
      lines.push(`  ${check.pattern.test(content) ? "OK" : "FAIL"} ${check.label}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

export async function addSpecTask(specFolder: string, text: string, root = process.cwd()): Promise<string> {
  const tasksFile = path.resolve(root, specFolder, "tasks.md");
  await fs.appendFile(tasksFile, `- [ ] ${text}\n`, "utf8");
  return `Added task to ${path.normalize(specFolder).replace(/\\/g, "/")}\n`;
}

export async function listSpecTasks(specFolder: string, root = process.cwd()): Promise<string> {
  const tasks = await readFileOrEmpty(path.resolve(root, specFolder, "tasks.md"));
  const lines = tasks.split(/\r?\n/).filter((line) => /^- \[[ x]\]/i.test(line));
  return lines.length > 0 ? `${lines.map((line, index) => `${index + 1}. ${line}`).join("\n")}\n` : "No tasks found.\n";
}

export async function markSpecTaskDone(specFolder: string, index: number, root = process.cwd()): Promise<string> {
  const tasksFile = path.resolve(root, specFolder, "tasks.md");
  const content = await fs.readFile(tasksFile, "utf8");
  let seen = 0;
  const next = content.split(/\r?\n/).map((line) => {
    if (/^- \[[ x]\]/i.test(line)) {
      seen += 1;
      if (seen === index) {
        return line.replace(/^- \[[ x]\]/i, "- [x]");
      }
    }
    return line;
  }).join("\n");
  await fs.writeFile(tasksFile, next, "utf8");
  return `Marked task ${index} done in ${path.normalize(specFolder).replace(/\\/g, "/")}\n`;
}
