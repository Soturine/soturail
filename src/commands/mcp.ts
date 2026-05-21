import type { Command } from "commander";
import { mcpDoctor, mcpManifest, serveMcpStdio } from "../core/mcp-server.js";
import { SOTURAIL_VERSION } from "../core/version.js";

export function registerMcpCommand(program: Command): void {
  const mcp = program.command("mcp").description("Expose local SotuRail context through an MCP-compatible stdio server.");

  mcp.command("doctor").description("Check local MCP server capabilities.").action(async () => {
    process.stdout.write(await mcpDoctor(SOTURAIL_VERSION));
  });

  mcp.command("manifest").description("Print MCP resources and tools manifest.").action(async () => {
    process.stdout.write(`${JSON.stringify(await mcpManifest(SOTURAIL_VERSION), null, 2)}\n`);
  });

  mcp
    .command("serve")
    .description("Serve JSON-RPC 2.0 style MCP messages over stdio.")
    .option("--transport <transport>", "stdio", "stdio")
    .action(async (options: { transport: string }) => {
      if (options.transport !== "stdio") throw new Error("Only --transport stdio is supported in v0.3.0.");
      await serveMcpStdio(process.cwd(), SOTURAIL_VERSION);
    });
}
