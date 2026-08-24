import { createHash } from "node:crypto";
import { z } from "zod";
import { CAPABILITY_REGISTRY, capabilityRegistryDigest, createCapabilityEpoch } from "./capability-registry.js";
import { mcpManifest } from "./mcp-server.js";
import { createWorkspaceFingerprint } from "./workspace-fingerprint.js";
import { SOTURAIL_VERSION } from "./version.js";

const UnknownState = z.enum(["UNKNOWN", "UNAVAILABLE", "NOT_REPORTED"]);

export const RunManifestSchema = z.object({
  schemaVersion: z.literal("soturail.run-manifest.v1"),
  run: z.object({ id: z.string().min(1), createdAt: z.string().datetime() }),
  workspace: z.object({ fingerprint: z.string().min(1), head: z.string().min(1), branch: z.string().min(1), dirty: z.boolean() }),
  host: z.object({ type: z.string().min(1), version: z.union([z.string().min(1), UnknownState]) }),
  models: z.object({ implementer: UnknownState, reviewer: UnknownState }),
  contract: z.object({ id: z.union([z.string().min(1), UnknownState]), digest: z.union([z.string().min(1), UnknownState]) }),
  governance: z.object({ provider: z.string().min(1), mode: z.string().min(1), policyDigest: z.string().min(1) }),
  capabilityEpoch: z.object({ id: z.string().min(1), phase: z.string().min(1), registryDigest: z.string().min(1) }),
  capabilities: z.array(z.object({ id: z.string().min(1), maturity: z.string().min(1) })),
  skills: z.array(z.object({ id: z.string().min(1), digest: z.string().min(1) })),
  mcp: z.array(z.object({ id: z.string().min(1), protocol: z.string().min(1), toolSchemasDigest: z.string().min(1) })),
  contextArtifacts: z.array(z.object({ digest: z.string().min(1) })),
  unknowns: z.array(z.string())
});

export type RunManifest = z.infer<typeof RunManifestSchema>;

export async function createRunManifest(input: { runId: string; hostType: string; skills: string[]; contextPack: string | null }, root = process.cwd()): Promise<RunManifest> {
  const workspace = await createWorkspaceFingerprint(root);
  const mcp = await mcpManifest(SOTURAIL_VERSION);
  const epoch = createCapabilityEpoch("implement");
  return RunManifestSchema.parse({
    schemaVersion: "soturail.run-manifest.v1",
    run: { id: input.runId, createdAt: new Date().toISOString() },
    workspace: { fingerprint: workspace.fingerprint, head: workspace.head, branch: workspace.branch, dirty: workspace.dirty },
    host: { type: input.hostType, version: "NOT_REPORTED" },
    models: { implementer: "NOT_REPORTED", reviewer: "NOT_REPORTED" },
    contract: { id: "UNKNOWN", digest: "UNKNOWN" },
    governance: { provider: "native-minimal", mode: "offline", policyDigest: capabilityRegistryDigest() },
    capabilityEpoch: { id: epoch.id, phase: epoch.phase, registryDigest: epoch.registryDigest },
    capabilities: CAPABILITY_REGISTRY.map((item) => ({ id: item.id, maturity: item.maturity })),
    skills: input.skills.map((id) => ({ id, digest: createHash("sha256").update(id).digest("hex") })),
    mcp: [{ id: "soturail", protocol: mcp.protocol, toolSchemasDigest: createHash("sha256").update(JSON.stringify(mcp.tools)).digest("hex") }],
    contextArtifacts: input.contextPack ? [{ digest: createHash("sha256").update(input.contextPack).digest("hex") }] : [],
    unknowns: ["host.version", "models.implementer", "models.reviewer", "contract.id", "contract.digest"]
  });
}
