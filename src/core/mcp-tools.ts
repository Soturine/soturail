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
import { describeSkill, skillCatalogSummary } from "./skill-model.js";
import { WorkspaceGuard } from "./workspace-guard.js";
import { getCapabilityDefinition } from "./capability-registry.js";
import { capabilityCatalog, describeCapability, getCapabilityDescriptor } from "./capability-descriptor.js";

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
const LocaleInput = z.string().regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/).optional().describe("Presentation locale (BCP 47); machine IDs never change");
const CapabilitiesInput = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/).optional().describe("Capability ID to describe; omit to list all"),
  locale: LocaleInput
});
const SkillsInput = z.strictObject({
  name: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(64).optional().describe("Skill name to load (level 2); omit to list discovery metadata"),
  resource: z.string().min(1).max(256).optional().describe("Skill-relative references/, scripts/ or assets/ file to load (level 3); requires name")
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
  tool("skill.discover", "soturail.skills.list", SkillsInput, hints(true, false, true)),
  tool("capability.discover", "soturail.capabilities", CapabilitiesInput, hints(true, false, true)),
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
    case "soturail.skills.list": {
      const parsed = SkillsInput.parse(args);
      if (parsed.resource !== undefined && parsed.name === undefined) throw new Error("soturail.skills.list resource requires name.");
      const result = parsed.name === undefined ? await skillCatalogSummary(root) : await describeSkill(parsed.name, root, parsed.resource);
      return redactText(`${JSON.stringify(result, null, 2)}\n`).text;
    }
    case "soturail.capabilities": {
      const parsed = CapabilitiesInput.parse(args);
      const result = parsed.id === undefined ? capabilityCatalog(parsed.locale) : describeCapability(parsed.id, parsed.locale);
      return `${JSON.stringify(result, null, 2)}\n`;
    }
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

// The canonical descriptor owns the MCP surface: a tool exists only when its
// capability declares exactly this tool name. Description text is never restated.
function tool(capabilityId: string, name: string, inputSchema: z.ZodObject, annotations: McpToolInfo["annotations"]): McpToolInfo {
  const descriptor = getCapabilityDescriptor(capabilityId);
  if (!descriptor) throw new Error(`MCP capability is missing from registry: ${capabilityId}`);
  if (descriptor.surfaces.mcp?.tool !== name) throw new Error(`Capability ${capabilityId} does not declare MCP tool ${name}.`);
  if (descriptor.registry === "v1" && !getCapabilityDefinition(capabilityId)) throw new Error(`v1 capability missing: ${capabilityId}`);
  const summary = descriptor.display.en?.summary ?? capabilityId;
  return { capabilityId, name, description: summary, inputSchema, annotations };
}
