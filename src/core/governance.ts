import { createHash } from "node:crypto";
import { CAPABILITY_REGISTRY, capabilityRegistryDigest, getCapabilityDefinition } from "./capability-registry.js";

export type GovernanceVerdictValue = "allow" | "deny" | "unavailable";

export interface GovernanceSnapshot {
  actor: { id: string; type: "human" | "agent" | "automation" };
  capability: string;
  workspaceFingerprint: string;
  approval: "approved" | "rejected" | "not-required" | "missing";
  payloadDigest: string;
}

export interface GovernanceVerdict {
  schemaVersion: "soturail.governance.verdict.v1";
  provider: string;
  point: string;
  verdict: GovernanceVerdictValue;
  reasons: string[];
  policyDigest: string;
  evaluatedAt: string;
}

export interface ProviderHealth {
  provider: string;
  status: "ready" | "degraded" | "unavailable";
  details: string[];
}

export interface ValidationResult {
  valid: boolean;
  findings: string[];
}

export interface GovernanceProvider {
  readonly id: string;
  evaluate(point: string, snapshot: GovernanceSnapshot): Promise<GovernanceVerdict>;
  validate(): Promise<ValidationResult>;
  health(): Promise<ProviderHealth>;
  capabilities(): Promise<string[]>;
}

export class NativeMinimalGovernanceProvider implements GovernanceProvider {
  readonly id = "native-minimal";

  async evaluate(point: string, snapshot: GovernanceSnapshot): Promise<GovernanceVerdict> {
    const capability = getCapabilityDefinition(snapshot.capability);
    const reasons: string[] = [];
    if (!capability) reasons.push(`Unknown capability: ${snapshot.capability}`);
    if (!snapshot.actor.id) reasons.push("Actor identity is required.");
    if (!/^[a-f0-9]{64}$/i.test(snapshot.payloadDigest)) reasons.push("Payload digest must be SHA-256.");
    if (!snapshot.workspaceFingerprint) reasons.push("Workspace fingerprint is required.");
    if (capability?.approvalRequired && snapshot.approval !== "approved") reasons.push("Explicit approval is required for this capability.");
    if (snapshot.approval === "rejected") reasons.push("Approval was explicitly rejected.");
    return verdict(this.id, point, reasons.length === 0 ? "allow" : "deny", reasons.length ? reasons : ["Native deterministic authority policy passed."]);
  }

  async validate(): Promise<ValidationResult> {
    const duplicateIds = capabilitiesWithDuplicates();
    return { valid: duplicateIds.length === 0, findings: duplicateIds.map((id) => `Duplicate capability id: ${id}`) };
  }

  async health(): Promise<ProviderHealth> {
    return { provider: this.id, status: "ready", details: ["offline", "deterministic", "no mandatory external dependency"] };
  }

  async capabilities(): Promise<string[]> {
    return ["authority.evaluate", "approval.enforce", "capability.validate"];
  }
}

export class AgtAcsGovernanceProvider implements GovernanceProvider {
  readonly id = "agt-acs";

  async evaluate(point: string): Promise<GovernanceVerdict> {
    return verdict(this.id, point, "unavailable", ["AGT/ACS adapter boundary is present, but no verified upstream runtime is configured."]);
  }

  async validate(): Promise<ValidationResult> {
    return { valid: false, findings: ["AGT/ACS upstream API, license and deployment configuration must be verified before activation."] };
  }

  async health(): Promise<ProviderHealth> {
    return { provider: this.id, status: "unavailable", details: ["optional provider", "no mandatory Microsoft dependency", "fail closed"] };
  }

  async capabilities(): Promise<string[]> {
    return [];
  }
}

function verdict(provider: string, point: string, value: GovernanceVerdictValue, reasons: string[]): GovernanceVerdict {
  return {
    schemaVersion: "soturail.governance.verdict.v1",
    provider,
    point,
    verdict: value,
    reasons,
    policyDigest: createHash("sha256").update(`${provider}:${capabilityRegistryDigest()}`).digest("hex"),
    evaluatedAt: new Date().toISOString()
  };
}

function capabilitiesWithDuplicates(): string[] {
  const ids = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of CAPABILITY_REGISTRY.map((item) => item.id)) {
    if (ids.has(id)) duplicates.add(id);
    ids.add(id);
  }
  return [...duplicates];
}
