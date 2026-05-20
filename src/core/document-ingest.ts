import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type IngestType = "rules" | "requirements" | "docs" | "course";

export interface DocumentSection {
  title: string;
  content: string;
  start_line: number;
}

export interface IngestedDocument {
  source_file: string;
  type: IngestType;
  text: string;
  content_hash: string;
  sections: DocumentSection[];
}

export function isIngestType(value: string): value is IngestType {
  return ["rules", "requirements", "docs", "course"].includes(value);
}

export async function ingestDocument(file: string, type: IngestType, root = process.cwd()): Promise<IngestedDocument> {
  const absolute = path.resolve(root, file);
  const extension = path.extname(file).toLowerCase();
  if (extension === ".pdf") {
    throw new Error("PDF extraction is experimental in v0.2.0 and not enabled without a safe text extractor.");
  }
  const raw = await fs.readFile(absolute, "utf8");
  const text = extension === ".json" ? JSON.stringify(JSON.parse(raw), null, 2) : raw;
  const sourceFile = path.normalize(path.relative(root, absolute)).replace(/\\/g, "/");
  return {
    source_file: sourceFile,
    type,
    text,
    content_hash: createHash("sha256").update(text).digest("hex"),
    sections: splitSections(text)
  };
}

function splitSections(text: string): DocumentSection[] {
  const lines = text.split(/\r?\n/);
  const sections: DocumentSection[] = [];
  let current: DocumentSection = { title: "Document", content: "", start_line: 1 };
  lines.forEach((line, index) => {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      if (current.content.trim().length > 0 || sections.length === 0) {
        sections.push(current);
      }
      current = { title: heading[2]?.trim() ?? "Untitled", content: "", start_line: index + 1 };
    } else {
      current.content += `${line}\n`;
    }
  });
  if (current.content.trim().length > 0) {
    sections.push(current);
  }
  return sections.filter((section) => section.content.trim().length > 0);
}
