import { listMcpResources } from "./mcp-resources.js";
import { listMcpTools } from "./mcp-tools.js";

export interface McpExposureReport {
  schemaVersion: "soturail.mcp.exposure.v1";
  createdAt: string;
  tools: Array<{ name: string; risk: "low" | "medium" | "high"; note: string }>;
  resources: Array<{ uri: string; risk: "low" | "medium" | "high"; note: string }>;
  prompts: string[];
  roots: string[];
  arbitraryShellExecutionExposed: boolean;
  policyNotes: string[];
}

export async function mcpExposureReport(): Promise<McpExposureReport> {
  const tools = listMcpTools().map((tool) => ({
    name: tool.name,
    risk: tool.name === "soturail.run" ? "high" as const : "low" as const,
    note: tool.name === "soturail.run" ? "Arbitrary shell execution would be unsafe by default." : "Read-oriented or local summary tool."
  }));
  const resources = (await listMcpResources()).map((resource) => ({
    uri: resource.uri,
    risk: resource.uri.includes("raw") ? "medium" as const : "low" as const,
    note: resource.uri.includes("raw") ? "Raw-like resources must stay redacted unless explicitly restored." : "Read-only local context resource."
  }));
  return {
    schemaVersion: "soturail.mcp.exposure.v1",
    createdAt: new Date().toISOString(),
    tools,
    resources,
    prompts: [],
    roots: [],
    arbitraryShellExecutionExposed: tools.some((tool) => tool.name === "soturail.run"),
    policyNotes: [
      "MCP does not expose arbitrary shell execution by default.",
      "Raw expansion remains CLI-controlled and redacted by default.",
      "Memory and context exposure should prefer approved/redacted records."
    ]
  };
}

export function renderMcpExposure(report: McpExposureReport): string {
  return [
    "SotuRail MCP exposure",
    `tools_count: ${report.tools.length}`,
    `resources_count: ${report.resources.length}`,
    `prompts_count: ${report.prompts.length}`,
    `roots_count: ${report.roots.length}`,
    `arbitrary_shell_execution_exposed: ${report.arbitraryShellExecutionExposed ? "yes" : "no"}`,
    "",
    "Tools:",
    ...report.tools.map((tool) => `- ${tool.name} [${tool.risk}] ${tool.note}`),
    "",
    "Resources:",
    ...report.resources.map((resource) => `- ${resource.uri} [${resource.risk}] ${resource.note}`),
    "",
    "Policy notes:",
    ...report.policyNotes.map((note) => `- ${note}`)
  ].join("\n") + "\n";
}
