import type { Command } from "commander";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, getWorkspacePaths, relativeToRoot } from "../core/config.js";
import { mcpConfig } from "../core/agent-exporter.js";
import { mcpExposureReport, renderMcpExposure } from "../core/mcp-exposure.js";
import { mcpDoctor, mcpManifest, mcpSmoke, serveMcpStdio } from "../core/mcp-server.js";
import { SOTURAIL_VERSION } from "../core/version.js";

export function registerMcpCommand(program: Command): void {
  const mcp = program.command("mcp").description("Expose local SotuRail context through an MCP-compatible stdio server.");

  mcp.command("doctor").description("Check local MCP server capabilities.").action(async () => {
    process.stdout.write(await mcpDoctor(SOTURAIL_VERSION));
  });

  mcp.command("manifest").description("Print MCP resources and tools manifest.").action(async () => {
    process.stdout.write(`${JSON.stringify(await mcpManifest(SOTURAIL_VERSION), null, 2)}\n`);
  });

  mcp.command("exposure").description("Report MCP tools/resources/prompts and risk notes.").option("--json", "Print machine-readable JSON").action(async (options: { json?: boolean }) => {
    const report = await mcpExposureReport();
    process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : renderMcpExposure(report));
  });

  mcp
    .command("config")
    .description("Export a safe MCP host configuration snippet.")
    .requiredOption("--agent <agent>", "claude, cursor, or generic")
    .action(async (options: { agent: string }) => {
      if (!["claude", "cursor", "generic"].includes(options.agent)) {
        throw new Error("MCP config supports --agent claude, cursor, or generic.");
      }
      await ensureWorkspace();
      const paths = getWorkspacePaths();
      const dir = path.join(paths.mcpExportsDir, options.agent);
      const filePath = path.join(dir, "mcp-config.json");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, `${JSON.stringify(mcpConfig(options.agent as "claude" | "cursor" | "generic"), null, 2)}\n`, "utf8");
      process.stdout.write(`MCP config written: ${relativeToRoot(process.cwd(), filePath)}\n`);
      process.stdout.write("Review this snippet before adding it to a host application.\n");
    });

  mcp.command("smoke").description("Run a non-hanging local JSON-RPC smoke test.").action(async () => {
    const result = await mcpSmoke(process.cwd(), SOTURAIL_VERSION);
    process.stdout.write(result.output);
    if (!result.ok) process.exitCode = 1;
  });

  mcp
    .command("serve")
    .description("Serve JSON-RPC 2.0 style MCP messages over stdio.")
    .option("--transport <transport>", "stdio", "stdio")
    .action(async (options: { transport: string }) => {
      if (options.transport !== "stdio") throw new Error("Only --transport stdio is currently supported.");
      await serveMcpStdio(process.cwd(), SOTURAIL_VERSION);
    });
}
