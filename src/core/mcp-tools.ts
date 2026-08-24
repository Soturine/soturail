import { promises as fs } from "node:fs";
import { z } from "zod";
import { reduceAgentResponse } from "../compressors/agent-response-reducer.js";
import { expandRawLog } from "../commands/expand.js";
import { readCommand } from "../commands/read.js";
import { checkRules } from "../commands/rules.js";
import { runIndex } from "../commands/index.js";
import { buildContextPack } from "./context-pack.js";
import { MetricsStore } from "./metrics-store.js";
import { redactText } from "./report-redaction.js";
import { readSkills, renderSkillList } from "./skill-store.js";
import { WorkspaceGuard } from "./workspace-guard.js";
import { getCapabilityDefinition } from "./capability-registry.js";

const EmptyInput = z.strictObject({});
const ReadInput = z.strictObject({
  file: z.string().min(1).describe("Project-relative file path"),
  query: z.string().min(1).optional().describe("Terms used for progressive block selection"),
  full: z.boolean().optional().describe("Return the full file instead of selected blocks")
});
const FormatInput = z.strictObject({
  text: z.string().optional().describe("Text to compress"),
  file: z.string().min(1).optional().describe("Project-relative file to compress when text is omitted"),
  mode: z.enum(["normal", "concise", "ultra", "review", "commit", "debug", "docs"]).optional()
});
const ContextPackInput = z.strictObject({
  target: z.enum(["generic", "claude", "codex", "cursor", "gemini"]).optional()
});
const ExpandInput = z.strictObject({
  raw_id: z.string().regex(/^[a-f0-9]{8}$/i).describe("Raw log identifier from soturail run")
});

export interface McpToolInfo {
  name: string;
  capabilityId: string;
  description: string;
  inputSchema: z.ZodObject;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
}

export const mcpTools: McpToolInfo[] = [
  tool("repo.index", "soturail.index", EmptyInput, hints(false, false, true)),
  tool("project.read", "soturail.read", ReadInput, hints(true, false, true)),
  { capabilityId: "project.read", name: "soturail.format", description: "Compress text or a guarded project file deterministically.", inputSchema: FormatInput, annotations: hints(true, false, true) },
  { capabilityId: "project.read", name: "soturail.rules.check", description: "Run deterministic local rule validators.", inputSchema: EmptyInput, annotations: hints(true, false, true) },
  { capabilityId: "project.read", name: "soturail.skills.list", description: "List local Skill Rail skills without executing them.", inputSchema: EmptyInput, annotations: hints(true, false, true) },
  tool("context.pack", "soturail.context.pack", ContextPackInput, hints(false, false, true)),
  tool("raw.inspect.redacted", "soturail.expand", ExpandInput, hints(true, false, true))
];

export async function callMcpTool(name: string, args: Record<string, unknown> = {}, root = process.cwd()): Promise<string> {
  switch (name) {
    case "soturail.index":
      EmptyInput.parse(args);
      return runIndex(root);
    case "soturail.read": {
      const parsed = ReadInput.parse(args);
      const options = parsed.query === undefined ? { full: parsed.full === true } : { query: parsed.query, full: parsed.full === true };
      return readCommand(parsed.file, options, root);
    }
    case "soturail.format": {
      const parsed = FormatInput.parse(args);
      if (parsed.text === undefined && parsed.file === undefined) throw new Error("soturail.format requires text or file.");
      const text = parsed.text ?? await fs.readFile(await new WorkspaceGuard(root).assertAllowedRead(parsed.file ?? ""), "utf8");
      return reduceAgentResponse(text, parsed.mode ?? "concise").output;
    }
    case "soturail.rules.check":
      EmptyInput.parse(args);
      return checkRules(root);
    case "soturail.skills.list":
      EmptyInput.parse(args);
      return renderSkillList(await readSkills(root), root);
    case "soturail.context.pack": {
      const parsed = ContextPackInput.parse(args);
      const pack = await buildContextPack(parsed.target ?? "generic", root);
      return `Context pack written: ${pack.path}\n`;
    }
    case "soturail.expand": {
      const parsed = ExpandInput.parse(args);
      const raw = (await expandRawLog(parsed.raw_id, root)).toString("utf8");
      const redacted = redactText(raw);
      await new MetricsStore(root).append({
        type: "expand",
        raw_id: parsed.raw_id,
        details: { source: "mcp", disclosure: "redacted-only", redaction_count: redacted.redactions.reduce((sum, item) => sum + item.count, 0) }
      });
      return redacted.text;
    }
    default:
      throw new Error(`Unknown MCP tool: ${name}`);
  }
}

export function listMcpTools(): McpToolInfo[] {
  return mcpTools;
}

function hints(readOnlyHint: boolean, destructiveHint: boolean, idempotentHint: boolean): McpToolInfo["annotations"] {
  return { readOnlyHint, destructiveHint, idempotentHint, openWorldHint: false };
}

function tool(capabilityId: string, name: string, inputSchema: z.ZodObject, annotations: McpToolInfo["annotations"]): McpToolInfo {
  const definition = getCapabilityDefinition(capabilityId);
  if (!definition) throw new Error(`MCP capability is missing from registry: ${capabilityId}`);
  return { capabilityId, name, description: definition.description, inputSchema, annotations };
}
