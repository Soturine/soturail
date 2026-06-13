import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const markdownFiles = await listMarkdown(root);
const missing = [];
const indexedDocs = new Set([path.resolve(root, "docs", "README.md")]);

for (const file of markdownFiles) {
  const text = await fs.readFile(file, "utf8");
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const raw = match[1]?.trim() ?? "";
    const target = raw.split("#")[0] ?? "";
    if (!target || /^(https?:|mailto:|data:)/i.test(target)) continue;
    const absolute = path.resolve(path.dirname(file), target);
    if (!await exists(absolute)) {
      missing.push(`${path.relative(root, file)} -> ${target}`);
      continue;
    }
    const stat = await fs.stat(absolute);
    if (stat.isDirectory()) {
      for (const indexed of await listMarkdown(absolute)) indexedDocs.add(path.resolve(indexed));
    } else if (absolute.endsWith(".md")) {
      indexedDocs.add(path.resolve(absolute));
    }
  }
}

const orphanDocs = markdownFiles
  .filter((file) => path.resolve(file).startsWith(path.resolve(root, "docs")))
  .filter((file) => !indexedDocs.has(path.resolve(file)))
  .map((file) => path.relative(root, file));

if (missing.length > 0 || orphanDocs.length > 0) {
  if (missing.length > 0) {
  process.stderr.write(`Broken local Markdown links: ${missing.length}\n${missing.map((item) => `- ${item}`).join("\n")}\n`);
  }
  if (orphanDocs.length > 0) {
    process.stderr.write(`Unindexed documentation files: ${orphanDocs.length}\n${orphanDocs.map((item) => `- ${item}`).join("\n")}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Markdown local links and documentation index: OK (${markdownFiles.length} files)\n`);
}

async function listMarkdown(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if ([".git", ".soturail", "node_modules", "dist"].includes(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await listMarkdown(absolute));
    else if (entry.isFile() && entry.name.endsWith(".md")) result.push(absolute);
  }
  return result;
}

async function exists(file) {
  return fs.access(file).then(() => true).catch(() => false);
}
