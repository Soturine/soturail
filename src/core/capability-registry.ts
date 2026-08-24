import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type CapabilityMaturity = "experimental" | "stable" | "deprecated";
export type SideEffectScope = "none" | "local-state" | "workspace" | "external";

export interface CapabilityDefinition {
  id: string;
  description: string;
  maturity: CapabilityMaturity;
  since: string;
  cli: { command: string } | null;
  mcp: { exposed: boolean; tool?: string };
  permissions: {
    filesystemRead: "none" | "project" | "workspace";
    filesystemWrite: "none" | "soturail-state" | "project";
    shell: "none" | "restricted";
    network: "none" | "optional";
  };
  sideEffects: { scope: SideEffectScope; reversible: boolean; consequence: "low" | "medium" | "high" };
  approvalRequired: boolean;
  outputs: string[];
  docs: string[];
}

export const CAPABILITY_REGISTRY: readonly CapabilityDefinition[] = [
  capability("repo.index", "Build a deterministic local repository map.", "index", "soturail.index", "soturail.repo-map.v1", "local-state"),
  capability("project.read", "Read non-sensitive project files through WorkspaceGuard.", "read <file>", "soturail.read", "text/plain", "none"),
  capability("context.pack", "Build a fingerprinted context artifact within a hard budget.", "context build", "soturail.context.pack", "soturail.context-artifact.v1", "local-state"),
  capability("evidence.collect", "Collect workspace-bound local evidence without executing checks.", "evidence collect", null, "soturail.evidence.provenance.v1", "local-state"),
  capability("raw.inspect.redacted", "Inspect raw logs with mandatory redaction.", "raw inspect <id> --redacted", "soturail.expand", "text/plain", "none"),
  capability("command.run", "Execute a user-supplied command through the restricted runner.", "run <command...>", null, "soturail.run.v1", "workspace", true, "high"),
  capability("governance.evaluate", "Evaluate authority and readiness gates deterministically.", "governance evaluate", null, "soturail.governance.verdict.v1", "none"),
  capability("contract.verify", "Verify change-contract fidelity, freshness and evidence requirements.", "contract verify <file>", null, "soturail.change-contract.verification.v1", "none")
] as const;

export function getCapabilityDefinition(id: string): CapabilityDefinition | undefined {
  return CAPABILITY_REGISTRY.find((item) => item.id === id);
}

export function capabilityRegistryDigest(): string {
  return createHash("sha256").update(JSON.stringify(CAPABILITY_REGISTRY)).digest("hex");
}

export interface CapabilityEpoch {
  schemaVersion: "soturail.capability-epoch.v1";
  id: string;
  phase: "plan" | "implement" | "review" | "release";
  registryDigest: string;
  capabilityIds: string[];
  createdAt: string;
}

export function createCapabilityEpoch(phase: CapabilityEpoch["phase"]): CapabilityEpoch {
  const registryDigest = capabilityRegistryDigest();
  return {
    schemaVersion: "soturail.capability-epoch.v1",
    id: `epoch-${phase}-${registryDigest.slice(0, 12)}`,
    phase,
    registryDigest,
    capabilityIds: CAPABILITY_REGISTRY.map((item) => item.id),
    createdAt: new Date().toISOString()
  };
}

export async function inspectToolCapabilities(): Promise<Array<{ tool: string; version: string; ready: boolean; path: string; provider: string; verification: string; risk: string }>> {
  return Promise.all([
    inspectTool("node", ["--version"], "native-runtime", "low"),
    inspectTool("npm", ["--version"], "native-package-manager", "medium"),
    inspectTool("git", ["--version"], "native-vcs", "medium"),
    inspectTool("cargo", ["--version"], "optional-native", "medium")
  ]);
}

async function inspectTool(tool: string, args: string[], provider: string, risk: string): Promise<{ tool: string; version: string; ready: boolean; path: string; provider: string; verification: string; risk: string }> {
  try {
    const [{ stdout }, { stdout: resolved }] = await Promise.all([
      execFileAsync(tool, args, { timeout: 5000, windowsHide: true, encoding: "utf8" }),
      execFileAsync(process.platform === "win32" ? "where" : "which", [tool], { timeout: 5000, windowsHide: true, encoding: "utf8" })
    ]);
    return { tool, version: stdout.trim(), ready: true, path: resolved.split(/\r?\n/)[0] ?? "UNKNOWN", provider, verification: "executed-version-probe", risk };
  } catch {
    return { tool, version: "UNAVAILABLE", ready: false, path: "UNAVAILABLE", provider, verification: "probe-failed", risk };
  }
}

function capability(
  id: string,
  description: string,
  command: string,
  mcpTool: string | null,
  output: string,
  sideEffect: SideEffectScope,
  approvalRequired = false,
  consequence: "low" | "medium" | "high" = "low"
): CapabilityDefinition {
  return {
    id,
    description,
    maturity: "stable",
    since: "1.5.0",
    cli: { command },
    mcp: mcpTool ? { exposed: true, tool: mcpTool } : { exposed: false },
    permissions: {
      filesystemRead: sideEffect === "none" ? "project" : "workspace",
      filesystemWrite: sideEffect === "none" ? "none" : sideEffect === "workspace" ? "project" : "soturail-state",
      shell: id === "command.run" ? "restricted" : "none",
      network: "none"
    },
    sideEffects: { scope: sideEffect, reversible: sideEffect !== "external", consequence },
    approvalRequired,
    outputs: [output],
    docs: ["docs/architecture/verified-control-plane.md"]
  };
}
