import { createHash } from "node:crypto";
import { z } from "zod";

// Semantic Worker contract: the active AI agent (or a semantic provider, or a
// labeled heuristic) may produce structured candidates. It can never assign a
// trusted state; promotion belongs to SotuRail evidence rules.

export const SEMANTIC_CANDIDATE_SCHEMA = "soturail.semantic.candidate.v1" as const;

/** States a producer may assign to its own output. */
export const PRODUCER_STATES = ["candidate", "inferred", "assumed", "unknown", "unverified"] as const;
/** States only SotuRail evidence/authority transitions may assign. */
export const PROTECTED_STATES = ["verified", "current", "approved", "ready"] as const;

export type ProducerState = (typeof PRODUCER_STATES)[number];
export type ProtectedState = (typeof PROTECTED_STATES)[number];

export const ProducerStateSchema = z.enum(PRODUCER_STATES);

export const CandidateKindSchema = z.enum(["claim", "impact", "decision", "question", "interpretation"]);
export type CandidateKind = z.infer<typeof CandidateKindSchema>;

// BCP 47-like tag, or explicit mixed/unknown. Unknown locale is always valid.
const LocaleValueSchema = z.union([z.literal("mixed"), z.literal("unknown"), z.string().regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/)]);

export const LocaleInfoSchema = z.strictObject({
  user: LocaleValueSchema.optional(),
  project: LocaleValueSchema.optional(),
  source: LocaleValueSchema.optional(),
  output: LocaleValueSchema.optional()
});

export const SourceRefSchema = z.strictObject({
  // Exact workspace-relative path; Unicode is first-class and never normalized.
  path: z.string().min(1).refine((value) => !value.includes("\0"), "path must not contain NUL"),
  lines: z.strictObject({ start: z.number().int().positive(), end: z.number().int().positive() }).optional(),
  symbol: z.string().min(1).optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional()
});

export const ProducerSchema = z.strictObject({
  kind: z.enum(["semantic-worker", "provider", "heuristic"]),
  host: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  skill: z.string().min(1).optional(),
  capability: z.string().min(1).optional()
});

// Model confidence is metadata, never proof.
export const ConfidenceSchema = z.strictObject({
  level: z.enum(["low", "medium", "high"]),
  basis: z.enum(["model-self-report", "heuristic", "provider"])
});

// A translation is a derived view; the original statement stays the evidence.
export const DerivedTranslationSchema = z.strictObject({
  locale: LocaleValueSchema,
  text: z.string().min(1),
  derived: z.literal(true)
});

const baseShape = {
  schemaVersion: z.literal(SEMANTIC_CANDIDATE_SCHEMA),
  id: z.string().regex(/^cand_[a-f0-9]{16}$/),
  createdAt: z.string().datetime(),
  producer: ProducerSchema,
  verificationState: ProducerStateSchema,
  confidence: ConfidenceSchema.optional(),
  locale: LocaleInfoSchema.optional(),
  sourceRefs: z.array(SourceRefSchema).default([]),
  workspace: z.strictObject({ fingerprint: z.string().min(1), runId: z.string().min(1).optional() }).optional(),
  dependsOn: z.array(z.string().min(1)).default([]),
  // Concise engineering rationale only; chain-of-thought is not stored.
  rationale: z.string().max(2000).optional()
};

const ClaimSchema = z.strictObject({
  ...baseShape,
  kind: z.literal("claim"),
  statementOriginal: z.string().min(1),
  claimType: z.string().regex(/^[a-z][a-z0-9_]*$/).default("general"),
  translations: z.array(DerivedTranslationSchema).default([])
});

const ImpactSchema = z.strictObject({
  ...baseShape,
  kind: z.literal("impact"),
  target: SourceRefSchema,
  affected: z.array(z.strictObject({ ref: SourceRefSchema, relation: z.string().regex(/^[a-z][a-z0-9_]*$/) })).default([]),
  summaryOriginal: z.string().min(1).optional()
});

const DecisionSchema = z.strictObject({
  ...baseShape,
  kind: z.literal("decision"),
  questionOriginal: z.string().min(1),
  options: z.array(z.string().min(1)).min(1),
  proposed: z.string().min(1).optional(),
  requiresHuman: z.boolean()
});

const QuestionSchema = z.strictObject({
  ...baseShape,
  kind: z.literal("question"),
  questionOriginal: z.string().min(1),
  blocking: z.boolean(),
  options: z.array(z.string().min(1)).default([])
});

const InterpretationSchema = z.strictObject({
  ...baseShape,
  kind: z.literal("interpretation"),
  subjectRef: SourceRefSchema.optional(),
  summaryOriginal: z.string().min(1),
  conflictsWith: z.array(z.string().min(1)).default([])
});

export const SemanticCandidateSchema = z.discriminatedUnion("kind", [ClaimSchema, ImpactSchema, DecisionSchema, QuestionSchema, InterpretationSchema]);
export type SemanticCandidate = z.infer<typeof SemanticCandidateSchema>;
export type SemanticCandidateInput = z.input<typeof SemanticCandidateSchema>;

export class SelfPromotionError extends Error {
  constructor(public readonly attemptedState: string) {
    super(`Producer output cannot assign trusted state "${attemptedState}"; promotion requires SotuRail evidence.`);
    this.name = "SelfPromotionError";
  }
}

export function isProtectedState(value: unknown): value is ProtectedState {
  return typeof value === "string" && (PROTECTED_STATES as readonly string[]).includes(value);
}

/**
 * Validate producer output. Self-awarded trusted states fail with an explicit
 * SelfPromotionError rather than a generic schema error.
 */
export function parseSemanticCandidate(input: unknown): SemanticCandidate {
  if (input && typeof input === "object" && isProtectedState((input as { verificationState?: unknown }).verificationState)) {
    throw new SelfPromotionError(String((input as { verificationState: unknown }).verificationState));
  }
  return SemanticCandidateSchema.parse(input);
}

/** Stable ID from producer-independent content; text is hashed exactly, without normalization. */
export function candidateId(kind: CandidateKind, content: string, sourceRefs: Array<{ path: string }> = []): string {
  const digest = createHash("sha256").update(JSON.stringify({ kind, content, refs: sourceRefs.map((ref) => ref.path) })).digest("hex");
  return `cand_${digest.slice(0, 16)}`;
}
