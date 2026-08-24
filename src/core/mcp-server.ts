import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { listMcpResources, readMcpResource } from "./mcp-resources.js";
import { callMcpTool, listMcpTools } from "./mcp-tools.js";

export const MCP_PROTOCOL_VERSION = "2026-07-28";

export interface McpManifest {
  name: string;
  version: string;
  protocol: string;
  sdk: string;
  transports: string[];
  resources: Awaited<ReturnType<typeof listMcpResources>>;
  tools: Array<{ name: string; description: string; inputSchema: unknown; annotations: ReturnType<typeof listMcpTools>[number]["annotations"] }>;
}

export async function mcpManifest(version: string): Promise<McpManifest> {
  return {
    name: "soturail",
    version,
    protocol: MCP_PROTOCOL_VERSION,
    sdk: "@modelcontextprotocol/server@2",
    transports: ["stdio"],
    resources: await listMcpResources(),
    tools: listMcpTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: z.toJSONSchema(tool.inputSchema, { target: "draft-2020-12" }),
      annotations: tool.annotations
    }))
  };
}

export async function mcpDoctor(version: string): Promise<string> {
  const manifest = await mcpManifest(version);
  return [
    "SotuRail MCP doctor",
    `version: ${version}`,
    `protocol: ${manifest.protocol}`,
    `sdk: ${manifest.sdk}`,
    `resources: ${manifest.resources.length}`,
    `tools: ${manifest.tools.length}`,
    "transport_stdio: available",
    "legacy_negotiation: available",
    "raw_disclosure_over_mcp: denied",
    "arbitrary_shell_execution: disabled"
  ].join("\n") + "\n";
}

export async function createMcpServer(root = process.cwd(), version = "0.0.0"): Promise<McpServer> {
  const server = new McpServer(
    { name: "soturail", version, description: "Verified local-first engineering control plane" },
    { instructions: "Prefer resources and progressive reads. Raw logs are always redacted over MCP. No arbitrary shell capability is exposed." }
  );

  for (const info of await listMcpResources()) {
    server.registerResource(
      info.name,
      info.uri,
      { description: info.description, mimeType: info.mimeType },
      async (uri) => {
        const resource = await readMcpResource(uri.href, root);
        return { contents: [{ uri: resource.uri, mimeType: resource.mimeType, text: resource.text }] };
      }
    );
  }

  for (const tool of listMcpTools()) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations },
      async (args) => ({ content: [{ type: "text" as const, text: await callMcpTool(tool.name, args as Record<string, unknown>, root) }] })
    );
  }
  return server;
}

export async function mcpSmoke(root = process.cwd(), version = "0.0.0"): Promise<{ ok: boolean; output: string }> {
  const modern = await createMcpServer(root, version);
  const legacy = await handleLegacyMcpMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }, root, version);
  const tools = await handleLegacyMcpMessage({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, root, version);
  const toolNames = Array.isArray(tools?.result?.tools)
    ? tools.result.tools.map((tool: { name?: unknown }) => tool.name).filter((name: unknown): name is string => typeof name === "string")
    : [];
  const schemasTyped = Array.isArray(tools?.result?.tools) && tools.result.tools.every((tool: { inputSchema?: { properties?: unknown } }) => tool.inputSchema?.properties !== undefined);
  const rawBypassExposed = tools?.result?.tools?.some((tool: { inputSchema?: { properties?: Record<string, unknown> } }) => tool.inputSchema?.properties?.allow_raw);
  const ok = Boolean(modern && legacy?.result?.serverInfo?.name === "soturail" && toolNames.length > 0 && schemasTyped && !rawBypassExposed && !toolNames.includes("soturail.run"));
  await modern.close().catch(() => undefined);
  return {
    ok,
    output: [
      "SotuRail MCP smoke",
      `modern_sdk_server: ${modern ? "pass" : "fail"}`,
      `protocol: ${MCP_PROTOCOL_VERSION}`,
      `legacy_initialize: ${legacy?.result?.serverInfo?.name === "soturail" ? "pass" : "fail"}`,
      `typed_tool_schemas: ${schemasTyped ? "pass" : "fail"}`,
      `raw_self_authorization_exposed: ${rawBypassExposed ? "yes" : "no"}`,
      `arbitrary_shell_tool_exposed: ${toolNames.includes("soturail.run") ? "yes" : "no"}`,
      `result: ${ok ? "pass" : "fail"}`
    ].join("\n") + "\n"
  };
}

export async function handleLegacyMcpMessage(message: any, root = process.cwd(), version = "0.0.0"): Promise<any> {
  const id = message?.id ?? null;
  try {
    switch (message?.method) {
      case "initialize":
        return rpcResult(id, {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "soturail", version },
          capabilities: { resources: {}, tools: {} }
        });
      case "resources/list":
        return rpcResult(id, { resources: await listMcpResources() });
      case "resources/read": {
        const uri = message?.params?.uri;
        if (typeof uri !== "string") throw new Error("resources/read requires params.uri");
        const resource = await readMcpResource(uri, root);
        return rpcResult(id, { contents: [{ uri: resource.uri, mimeType: resource.mimeType, text: resource.text }] });
      }
      case "tools/list":
        return rpcResult(id, {
          tools: listMcpTools().map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: z.toJSONSchema(tool.inputSchema, { target: "draft-2020-12" }),
            annotations: tool.annotations
          }))
        });
      case "tools/call": {
        const name = message?.params?.name;
        if (typeof name !== "string") throw new Error("tools/call requires params.name");
        const text = await callMcpTool(name, message?.params?.arguments ?? {}, root);
        return rpcResult(id, { content: [{ type: "text", text }] });
      }
      default:
        return { jsonrpc: "2.0", id, error: { code: -32601, message: `Unsupported MCP method: ${String(message?.method)}` } };
    }
  } catch (error) {
    return { jsonrpc: "2.0", id, error: { code: -32602, message: error instanceof Error ? error.message : String(error) } };
  }
}

/** @deprecated Test-only alias for the pre-v2 compatibility surface. */
export const handleMcpMessage = handleLegacyMcpMessage;

export async function serveMcpStdio(root = process.cwd(), version = "0.0.0"): Promise<void> {
  serveStdio(() => createMcpServer(root, version), {
    legacy: "serve",
    onerror: (error) => process.stderr.write(`SotuRail MCP error: ${error.message}\n`)
  });
}

function rpcResult(id: unknown, result: unknown): unknown {
  return { jsonrpc: "2.0", id, result };
}
