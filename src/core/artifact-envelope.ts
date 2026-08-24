import { createHash } from "node:crypto";
import { z } from "zod";
import { createWorkspaceFingerprint, type WorkspaceFingerprint } from "./workspace-fingerprint.js";

export const ArtifactFreshnessSchema = z.enum(["current", "stale", "unknown"]);
export const ArtifactStatusSchema = z.enum(["draft", "unverified", "verified", "blocked", "invalid"]);

export const ArtifactEnvelopeSchema = z.object({
  schemaVersion: z.literal("soturail.artifact-envelope.v1"),
  artifactType: z.string().min(1),
  artifactId: z.string().min(1),
  producer: z.string().min(1),
  producerVersion: z.string().min(1),
  createdAt: z.string().datetime(),
  sourceFingerprint: z.string().min(1),
  workspaceFingerprint: z.string().min(1),
  status: ArtifactStatusSchema,
  freshness: ArtifactFreshnessSchema,
  provenance: z.object({ kind: z.string().min(1), trust: z.enum(["trusted", "untrusted", "unknown"]) }),
  dependencies: z.array(z.string()),
  supersedes: z.string().optional(),
  payload: z.unknown()
});

export type ArtifactEnvelope = z.infer<typeof ArtifactEnvelopeSchema>;

export interface CreateArtifactEnvelopeOptions {
  artifactType: string;
  artifactId: string;
  producer: string;
  producerVersion: string;
  payload: unknown;
  root?: string;
  workspace?: WorkspaceFingerprint;
  status?: z.infer<typeof ArtifactStatusSchema>;
  provenance?: ArtifactEnvelope["provenance"];
  dependencies?: string[];
  supersedes?: string;
}

export async function createArtifactEnvelope(options: CreateArtifactEnvelopeOptions): Promise<ArtifactEnvelope> {
  const workspace = options.workspace ?? await createWorkspaceFingerprint(options.root);
  const envelope: ArtifactEnvelope = {
    schemaVersion: "soturail.artifact-envelope.v1",
    artifactType: options.artifactType,
    artifactId: options.artifactId,
    producer: options.producer,
    producerVersion: options.producerVersion,
    createdAt: new Date().toISOString(),
    sourceFingerprint: createHash("sha256").update(JSON.stringify(options.payload)).digest("hex"),
    workspaceFingerprint: workspace.fingerprint,
    status: options.status ?? "unverified",
    freshness: "current",
    provenance: options.provenance ?? { kind: "local-deterministic", trust: "trusted" },
    dependencies: options.dependencies ?? [],
    payload: options.payload
  };
  if (options.supersedes) envelope.supersedes = options.supersedes;
  return ArtifactEnvelopeSchema.parse(envelope);
}

export function assessArtifactFreshness(envelope: ArtifactEnvelope, workspaceFingerprint: string): ArtifactEnvelope["freshness"] {
  return envelope.workspaceFingerprint === workspaceFingerprint ? "current" : "stale";
}
