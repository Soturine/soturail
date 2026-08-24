import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { createCapabilityEpoch, type CapabilityEpoch } from "./capability-registry.js";
import type { ChangeContract } from "./change-contract.js";
import { changeContractDigest } from "./change-contract.js";
import type { GovernanceVerdict } from "./governance.js";

export const ExecutionEnvelopeSchema = z.object({
  schemaVersion: z.literal("soturail.execution-envelope.v1"),
  id: z.string().min(1),
  runId: z.string().min(1),
  phase: z.enum(["plan", "implement", "review", "release"]),
  actor: z.object({ id: z.string().min(1), type: z.enum(["human", "agent", "automation"]) }),
  action: z.object({ capability: z.string().min(1), payloadDigest: z.string().regex(/^[a-f0-9]{64}$/i) }),
  workspaceFingerprint: z.string().min(1),
  contract: z.object({ id: z.string().min(1), digest: z.string().regex(/^[a-f0-9]{64}$/i) }),
  governance: z.object({ verdict: z.enum(["allow", "deny", "unavailable"]), policyDigest: z.string().min(1) }),
  capabilityEpoch: z.string().min(1),
  issuedAt: z.string().datetime()
});

export type ExecutionEnvelope = z.infer<typeof ExecutionEnvelopeSchema>;

export function digestPayload(payload: unknown): string {
  return createHash("sha256").update(canonicalJson(payload)).digest("hex");
}

export function createExecutionEnvelope(input: {
  runId: string;
  phase: CapabilityEpoch["phase"];
  actor: ExecutionEnvelope["actor"];
  capability: string;
  payload: unknown;
  workspaceFingerprint: string;
  contract: ChangeContract;
  governance: GovernanceVerdict;
  epoch?: CapabilityEpoch;
}): ExecutionEnvelope {
  const epoch = input.epoch ?? createCapabilityEpoch(input.phase);
  return ExecutionEnvelopeSchema.parse({
    schemaVersion: "soturail.execution-envelope.v1",
    id: `act-${randomUUID()}`,
    runId: input.runId,
    phase: input.phase,
    actor: input.actor,
    action: { capability: input.capability, payloadDigest: digestPayload(input.payload) },
    workspaceFingerprint: input.workspaceFingerprint,
    contract: { id: input.contract.id, digest: changeContractDigest(input.contract) },
    governance: { verdict: input.governance.verdict, policyDigest: input.governance.policyDigest },
    capabilityEpoch: epoch.id,
    issuedAt: new Date().toISOString()
  });
}

export function verifyExecutionEnvelope(envelope: ExecutionEnvelope, executedPayload: unknown): { valid: boolean; status: "ATTESTED" | "NOT_ATTESTED"; reason: string } {
  if (envelope.governance.verdict !== "allow") return { valid: false, status: "NOT_ATTESTED", reason: `Governance verdict is ${envelope.governance.verdict}.` };
  const executedDigest = digestPayload(executedPayload);
  if (executedDigest !== envelope.action.payloadDigest) return { valid: false, status: "NOT_ATTESTED", reason: "Evaluated payload digest does not match executed payload digest." };
  return { valid: true, status: "ATTESTED", reason: "Governance allowed the exact executed payload digest." };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
