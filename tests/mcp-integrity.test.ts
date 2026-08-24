import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { appendJsonl, ensureWorkspace, getWorkspacePaths } from "../src/core/config.js";
import { callMcpTool } from "../src/core/mcp-tools.js";
import { createMcpServer, handleLegacyMcpMessage, mcpManifest, mcpSmoke } from "../src/core/mcp-server.js";
import { rawDoctor, rawSensitivity } from "../src/core/raw-lifecycle.js";
import type { RawRunRecord } from "../src/core/raw-store.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("modern MCP surface", () => {
  it("uses the official 2026 SDK path with typed schemas and legacy negotiation", async () => {
    const root = await temporaryProject();
    const manifest = await mcpManifest("1.5.0");
    const server = await createMcpServer(root, "1.5.0");
    const legacy = await handleLegacyMcpMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }, root, "1.5.0");

    expect(manifest.protocol).toBe("2026-07-28");
    expect(manifest.sdk).toBe("@modelcontextprotocol/server@2");
    expect(manifest.tools.every((tool) => Boolean((tool.inputSchema as { properties?: unknown }).properties))).toBe(true);
    expect(JSON.stringify(manifest.tools)).not.toContain("allow_raw");
    expect(legacy.result.protocolVersion).toBe("2024-11-05");
    expect(server).toBeDefined();
    await server.close().catch(() => undefined);
    await expect(mcpSmoke(root, "1.5.0")).resolves.toMatchObject({ ok: true });
  });

  it("rejects caller raw self-authorization and only returns redacted content", async () => {
    const root = await temporaryProject();
    const record = await rawFixture(root, "GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz123456\n");

    await expect(callMcpTool("soturail.expand", { raw_id: record.raw_id, allow_raw: true }, root)).rejects.toThrow();
    const redacted = await callMcpTool("soturail.expand", { raw_id: record.raw_id }, root);
    expect(redacted).toContain("[REDACTED]");
    expect(redacted).not.toContain("ghp_abcdefghijklmnopqrstuvwxyz123456");
  });

  it("keeps raw paths bound to the canonical raw directory", async () => {
    const root = await temporaryProject();
    const record = await rawFixture(root, "safe log\n");
    const doctor = await rawDoctor(root);
    const sensitivity = await rawSensitivity(record.raw_id, root);

    expect(doctor).toEqual({ ok: true, findings: [], records: 1 });
    expect(sensitivity).toMatchObject({ rawId: record.raw_id, sensitivity: "normal", containsProbableSecrets: false });
  });
});

async function temporaryProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "soturail-mcp-"));
  temporaryDirectories.push(root);
  await fs.writeFile(path.join(root, "README.md"), "# Fixture\n", "utf8");
  await ensureWorkspace(root);
  return root;
}

async function rawFixture(root: string, content: string): Promise<RawRunRecord> {
  const paths = getWorkspacePaths(root);
  const rawId = "a1b2c3d4";
  const dir = path.join(paths.rawDir, "2026-08-23");
  const file = path.join(dir, `${rawId}.log`);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, content, "utf8");
  const record: RawRunRecord = {
    raw_id: rawId,
    path: path.relative(root, file),
    command: "fixture",
    exit_code: 0,
    created_at: "2026-08-23T00:00:00.000Z",
    compressor: "fixture",
    raw_tokens_estimated: 1,
    compressed_tokens_estimated: 1,
    sensitivity: content.includes("ghp_") ? "sensitive" : "normal",
    redaction_version: "soturail-redaction.v1",
    contains_probable_secrets: content.includes("ghp_"),
    workspace_fingerprint: "fixture",
    retention_policy: "fixture"
  };
  await appendJsonl(paths.rawIndex, record);
  return record;
}
