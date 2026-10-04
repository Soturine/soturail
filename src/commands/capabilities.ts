import type { Command } from "commander";
import { CAPABILITY_REGISTRY, capabilityRegistryDigest, inspectToolCapabilities } from "../core/capability-registry.js";
import { capabilityCatalog, describeCapability } from "../core/capability-descriptor.js";

export function registerCapabilitiesCommand(program: Command): void {
  const capabilities = program.command("capabilities").description("Inspect the canonical capability and tool registry.");
  capabilities.command("list").option("--json", "Print JSON").option("--locale <locale>", "Presentation locale for titles", "en").action(async (options: { json?: boolean; locale: string }) => {
    const catalog = capabilityCatalog(options.locale);
    // v1 fields are kept unchanged; the v2 catalog is additive.
    if (options.json) process.stdout.write(`${JSON.stringify({ registryDigest: capabilityRegistryDigest(), capabilities: CAPABILITY_REGISTRY, catalog }, null, 2)}\n`);
    else process.stdout.write(["SotuRail capabilities", `registry_digest: ${capabilityRegistryDigest()}`, `descriptor_digest: ${catalog.descriptorDigest}`, ...catalog.capabilities.map((item) => `- ${item.id} [${item.maturity}, ${item.availability}] ${item.title} cli=${item.cli ?? "none"} mcp=${item.mcp ?? "no"}`), ""].join("\n"));
  });
  capabilities.command("describe").argument("<id>", "Capability ID").option("--json", "Print JSON").option("--locale <locale>", "Presentation locale", "en").action(async (id: string, options: { json?: boolean; locale: string }) => {
    const descriptor = describeCapability(id, options.locale);
    if (options.json) {
      process.stdout.write(`${JSON.stringify(descriptor, null, 2)}\n`);
      return;
    }
    process.stdout.write([
      `${descriptor.id} — ${descriptor.presentation.title}`,
      descriptor.presentation.summary,
      `maturity: ${descriptor.maturity}`,
      `availability: ${descriptor.availability}`,
      `surfaces: skill=${descriptor.surfaces.skill} mcp=${descriptor.surfaces.mcp?.tool ?? "none"} cli=${descriptor.surfaces.cli?.command ?? "none"}`,
      `side_effects: ${descriptor.sideEffects.scope} approval_required=${descriptor.approvalRequired}`,
      `trust: provenance=${descriptor.trust.provenanceRequired} freshness=${descriptor.trust.freshnessRequired} evidence=${descriptor.trust.evidenceRequired} agent_result_state=${descriptor.trust.agentResultState}`,
      `providers: ${descriptor.providers.class} [${descriptor.providers.candidates.map((item) => `${item.id}:${item.status}`).join(", ") || "none"}] fallback=${descriptor.providers.fallback}`,
      ...descriptor.localization.limitations.map((item) => `limitation: ${item}`),
      ""
    ].join("\n"));
  });
  capabilities.command("tools").option("--json", "Print JSON").action(async (options: { json?: boolean }) => {
    const tools = await inspectToolCapabilities();
    if (options.json) process.stdout.write(`${JSON.stringify(tools, null, 2)}\n`);
    else process.stdout.write(["SotuRail capability tools", ...tools.map((item) => `- ${item.tool} version=${item.version} ready=${item.ready} path=${item.path} provider=${item.provider} verification=${item.verification} risk=${item.risk}`), ""].join("\n"));
  });
}
