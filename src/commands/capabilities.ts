import type { Command } from "commander";
import { CAPABILITY_REGISTRY, capabilityRegistryDigest, inspectToolCapabilities } from "../core/capability-registry.js";

export function registerCapabilitiesCommand(program: Command): void {
  const capabilities = program.command("capabilities").description("Inspect the canonical capability and tool registry.");
  capabilities.command("list").option("--json", "Print JSON").action(async (options: { json?: boolean }) => {
    if (options.json) process.stdout.write(`${JSON.stringify({ registryDigest: capabilityRegistryDigest(), capabilities: CAPABILITY_REGISTRY }, null, 2)}\n`);
    else process.stdout.write(["SotuRail capabilities", `registry_digest: ${capabilityRegistryDigest()}`, ...CAPABILITY_REGISTRY.map((item) => `- ${item.id} [${item.maturity}] cli=${item.cli?.command ?? "none"} mcp=${item.mcp.exposed ? item.mcp.tool : "no"}`), ""].join("\n"));
  });
  capabilities.command("tools").option("--json", "Print JSON").action(async (options: { json?: boolean }) => {
    const tools = await inspectToolCapabilities();
    if (options.json) process.stdout.write(`${JSON.stringify(tools, null, 2)}\n`);
    else process.stdout.write(["SotuRail capability tools", ...tools.map((item) => `- ${item.tool} version=${item.version} ready=${item.ready} path=${item.path} provider=${item.provider} verification=${item.verification} risk=${item.risk}`), ""].join("\n"));
  });
}
