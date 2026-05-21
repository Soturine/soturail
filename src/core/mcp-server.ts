import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { listMcpResources, readMcpResource } from "./mcp-resources.js";
import { callMcpTool, listMcpTools } from "./mcp-tools.js";

export interface McpManifest {
  name: string;
  version: string;
  protocol: string;
  transports: string[];
  resources: Awaited<ReturnType<typeof listMcpResources>>;
  tools: ReturnType<typeof listMcpTools>;
}

export async function mcpManifest(version: string): Promise<McpManifest> {
  return {
    name: "soturail",
    version,
    protocol: "json-rpc-2.0-mcp-compatible-stdio",
    transports: ["stdio"],
    resources: await listMcpResources(),
    tools: listMcpTools()
  };
}

export async function mcpDoctor(version: string): Promise<string> {
  const manifest = await mcpManifest(version);
  return [
    "SotuRail MCP doctor",
    `version: ${version}`,
    `resources: ${manifest.resources.length}`,
    `tools: ${manifest.tools.length}`,
    "transport_stdio: available",
    "arbitrary_shell_execution: disabled"
  ].join("\n") + "\n";
}

export async function handleMcpMessage(message: any, root = process.cwd(), version = "0.0.0"): Promise<any> {
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
        return rpcResult(id, { tools: listMcpTools().map((tool) => ({ name: tool.name, description: tool.description, inputSchema: { type: "object" } })) });
      case "tools/call": {
        const name = message?.params?.name;
        if (typeof name !== "string") throw new Error("tools/call requires params.name");
        const text = await callMcpTool(name, message?.params?.arguments ?? {}, root);
        return rpcResult(id, { content: [{ type: "text", text }] });
      }
      default:
        throw new Error(`Unsupported MCP method: ${String(message?.method)}`);
    }
  } catch (error) {
    return { jsonrpc: "2.0", id, error: { code: -32000, message: error instanceof Error ? error.message : String(error) } };
  }
}

export async function serveMcpStdio(root = process.cwd(), version = "0.0.0"): Promise<void> {
  const rl = readline.createInterface({ input });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let message: any;
    try {
      message = JSON.parse(line);
    } catch {
      output.write(`${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } })}\n`);
      continue;
    }
    output.write(`${JSON.stringify(await handleMcpMessage(message, root, version))}\n`);
  }
}

function rpcResult(id: unknown, result: unknown): unknown {
  return { jsonrpc: "2.0", id, result };
}
