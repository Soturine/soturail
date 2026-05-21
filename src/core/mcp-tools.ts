import { promises as fs } from "node:fs";
import path from "node:path";
import { reduceAgentResponse } from "../compressors/agent-response-reducer.js";
import { expandRawLog } from "../commands/expand.js";
import { readCommand } from "../commands/read.js";
import { checkRules } from "../commands/rules.js";
import { runIndex } from "../commands/index.js";
import { buildContextPack } from "./context-pack.js";
import { MetricsStore } from "./metrics-store.js";
import { readSkills, renderSkillList } from "./skill-store.js";

export interface McpToolInfo {
  name: string;
  description: string;
}

export const mcpTools: McpToolInfo[] = [
  { name: "soturail.index", description: "Run the heuristic repository indexer." },
  { name: "soturail.read", description: "Read a file progressively." },
  { name: "soturail.format", description: "Compress agent response text deterministically." },
  { name: "soturail.rules.check", description: "Run local rule validators." },
  { name: "soturail.skills.list", description: "List local Skill Rail skills." },
  { name: "soturail.context.pack", description: "Build a cache-friendly context pack." },
  { name: "soturail.expand", description: "Expand a raw log with redaction unless allow_raw=true." }
];

export async function callMcpTool(name: string, args: Record<string, unknown> = {}, root = process.cwd()): Promise<string> {
  switch (name) {
    case "soturail.index":
      return runIndex(root);
    case "soturail.read": {
      const file = requiredString(args.file, "file");
      const query = stringArg(args.query);
      return readCommand(file, query ? { query, full: args.full === true } : { full: args.full === true }, root);
    }
    case "soturail.format": {
      const text = typeof args.text === "string"
        ? args.text
        : await fs.readFile(path.resolve(root, requiredString(args.file, "file")), "utf8");
      const mode = stringArg(args.mode) ?? "concise";
      return reduceAgentResponse(text, mode as any).output;
    }
    case "soturail.rules.check":
      return checkRules(root);
    case "soturail.skills.list":
      return renderSkillList(await readSkills(root));
    case "soturail.context.pack": {
      const target = (stringArg(args.target) ?? "generic") as any;
      const pack = await buildContextPack(target, root);
      return `Context pack written: ${path.normalize(path.relative(root, pack.path))}\n`;
    }
    case "soturail.expand": {
      const rawId = requiredString(args.raw_id, "raw_id");
      const allowRaw = args.allow_raw === true;
      const raw = (await expandRawLog(rawId, root)).toString("utf8");
      await new MetricsStore(root).append({ type: "expand", raw_id: rawId, details: { source: "mcp", allow_raw: allowRaw } });
      return allowRaw ? raw : redactSecrets(raw);
    }
    default:
      throw new Error(`Unknown MCP tool: ${name}`);
  }
}

export function listMcpTools(): McpToolInfo[] {
  return mcpTools;
}

function requiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`Missing required argument: ${name}`);
  return value;
}

function stringArg(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function redactSecrets(text: string): string {
  return text
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "sk-[REDACTED]")
    .replace(/AKIA[0-9A-Z]{16}/g, "AKIA[REDACTED]")
    .replace(/(password|api[_-]?key|secret)\s*[:=]\s*["']?[^"'\s]+/gi, "$1=[REDACTED]");
}
