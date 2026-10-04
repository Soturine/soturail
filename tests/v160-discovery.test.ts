import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CAPABILITY_DESCRIPTORS } from "../src/core/capability-descriptor.js";
import { handleLegacyMcpMessage } from "../src/core/mcp-server.js";
import { callMcpTool, listMcpTools } from "../src/core/mcp-tools.js";

let root = "";

beforeAll(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-discovery-"));
});

afterAll(async () => {
  await fs.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

describe("self-describing agent surface", () => {
  it("derives every MCP tool from a capability that declares it", () => {
    for (const tool of listMcpTools()) {
      const descriptor = CAPABILITY_DESCRIPTORS.find((item) => item.id === tool.capabilityId);
      expect(descriptor, tool.name).toBeDefined();
    }
    for (const descriptor of CAPABILITY_DESCRIPTORS.filter((item) => item.surfaces.mcp)) {
      expect(listMcpTools().some((tool) => tool.name === descriptor.surfaces.mcp?.tool), descriptor.id).toBe(true);
    }
    const discovery = listMcpTools().filter((tool) => ["soturail.capabilities", "soturail.skills.list"].includes(tool.name));
    expect(discovery.every((tool) => tool.annotations.readOnlyHint && !tool.annotations.destructiveHint)).toBe(true);
  });

  it("lists and describes capabilities with localized presentation and stable IDs", async () => {
    const catalog = JSON.parse(await callMcpTool("soturail.capabilities", { locale: "pt-BR" }, root));
    expect(catalog.schemaVersion).toBe("soturail.capability.catalog.v1");
    expect(catalog.capabilities.find((item: { id: string }) => item.id === "structural.impact")).toMatchObject({ availability: "unavailable", title: "Impacto estrutural" });
    const described = JSON.parse(await callMcpTool("soturail.capabilities", { id: "command.run" }, root));
    expect(described).toMatchObject({ id: "command.run", approvalRequired: true, trust: { agentResultState: "unverified" } });
    await expect(callMcpTool("soturail.capabilities", { id: "no.such" }, root)).rejects.toThrow(/Unknown capability/);
    // Bounded: the catalog is small enough to load at session start.
    expect(Buffer.byteLength(JSON.stringify(catalog), "utf8")).toBeLessThan(12_000);
  });

  it("serves skills progressively and keeps level 3 inside the skill", async () => {
    const level1 = JSON.parse(await callMcpTool("soturail.skills.list", {}, root));
    expect(level1.skills.map((item: { name: string }) => item.name)).toContain("soturail-core");
    expect(JSON.stringify(level1)).not.toContain("## Workflow");
    const level2 = JSON.parse(await callMcpTool("soturail.skills.list", { name: "soturail-change" }, root));
    expect(level2).toMatchObject({ level: 2, name: "soturail-change" });
    expect(level2.instructions).toContain("## Workflow");
    expect(level2.requirements.unavailable).toEqual(expect.arrayContaining(["structural.impact", "dependency.docs"]));
    const level3 = JSON.parse(await callMcpTool("soturail.skills.list", { name: "soturail-core", resource: "references/trust-states.md" }, root));
    expect(level3.content).toContain("SotuRail only");
    await expect(callMcpTool("soturail.skills.list", { name: "soturail-core", resource: "../soturail-change/SKILL.md" }, root)).rejects.toThrow();
    await expect(callMcpTool("soturail.skills.list", { resource: "references/trust-states.md" }, root)).rejects.toThrow(/requires name/);
  });

  it("exposes the discovery tools through legacy negotiation with typed schemas and no shell", async () => {
    const tools = await handleLegacyMcpMessage({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }, root);
    const names = tools.result.tools.map((tool: { name: string }) => tool.name);
    expect(names).toEqual(expect.arrayContaining(["soturail.capabilities", "soturail.skills.list"]));
    expect(names).not.toContain("soturail.run");
    const capabilities = tools.result.tools.find((tool: { name: string }) => tool.name === "soturail.capabilities");
    expect(capabilities.inputSchema.additionalProperties).toBe(false);
  });
});
