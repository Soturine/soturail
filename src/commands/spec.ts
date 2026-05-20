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
}
