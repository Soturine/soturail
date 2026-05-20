import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";

export interface ReadOptions {
  query?: string;
  full?: boolean;
}

interface Range {
  start: number;
  end: number;
}

function prefixLine(lineNumber: number, content: string): string {
  return `[Line ${lineNumber}]: ${content}`;
}

function mergeRanges(ranges: Range[], maxLine: number): Range[] {
  const normalized = ranges
    .map((range) => ({
      start: Math.max(1, Math.min(maxLine, range.start)),
      end: Math.max(1, Math.min(maxLine, range.end))
    }))
    .filter((range) => range.start <= range.end)
    .sort((left, right) => left.start - right.start);

  const merged: Range[] = [];
  for (const range of normalized) {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end + 1) {
      merged.push({ ...range });
    } else {
      last.end = Math.max(last.end, range.end);
    }
  }
  return merged;
}

function queryMatches(lines: string[], query: string): Range[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) {
    return [];
  }
  const terms = trimmed.split(/\s+/).filter((term) => term.length > 2);
  const needles = terms.length > 0 ? terms : [trimmed];
  return lines.flatMap((line, index) => {
    const lower = line.toLowerCase();
    if (needles.some((term) => lower.includes(term))) {
      const lineNumber = index + 1;
      return [{ start: lineNumber - 5, end: lineNumber + 5 }];
    }
    return [];
  });
}

export function formatProgressiveRead(filePath: string, content: string, options: ReadOptions = {}): string {
  const lines = content.split(/\r?\n/);
  const shouldPrintFull = options.full === true || lines.length <= 150;
  if (shouldPrintFull) {
    return `${lines.map((line, index) => prefixLine(index + 1, line)).join("\n")}\n`;
  }

  const ranges = mergeRanges(
    [
      { start: 1, end: 15 },
      ...queryMatches(lines, options.query ?? ""),
      { start: Math.max(1, lines.length - 9), end: lines.length }
    ],
    lines.length
  );

  const output: string[] = [];
  let previousEnd = 0;
  for (const range of ranges) {
    if (range.start > previousEnd + 1) {
      output.push(
        `[Collapsed lines ${previousEnd + 1}-${range.start - 1}. Re-expand with: soturail read ${filePath} --full]`
      );
    }
    for (let lineNumber = range.start; lineNumber <= range.end; lineNumber += 1) {
      output.push(prefixLine(lineNumber, lines[lineNumber - 1] ?? ""));
    }
    previousEnd = range.end;
  }

  if (previousEnd < lines.length) {
    output.push(`[Collapsed lines ${previousEnd + 1}-${lines.length}. Re-expand with: soturail read ${filePath} --full]`);
  }

  output.push("", `Full file escape hatch: soturail read ${filePath} --full`);
  return `${output.join("\n")}\n`;
}

export async function readCommand(file: string, options: ReadOptions, root = process.cwd()): Promise<string> {
  const absolute = path.resolve(root, file);
  const content = await fs.readFile(absolute, "utf8");
  return formatProgressiveRead(file, content, options);
}

export function registerReadCommand(program: Command): void {
  program
    .command("read")
    .description("Read a file progressively with line prefixes.")
    .argument("<file>", "File to read")
    .option("-q, --query <query>", "Goal/query used to select relevant blocks")
    .option("--full", "Print the full file")
    .action(async (file: string, options: ReadOptions) => {
      const output = await readCommand(file, options);
      process.stdout.write(output);
    });
}
