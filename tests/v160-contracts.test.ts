import { describe, expect, it } from "vitest";
import { CAPABILITY_REGISTRY, capabilityRegistryDigest } from "../src/core/capability-registry.js";
import {
  CAPABILITY_DESCRIPTORS,
  CapabilityDescriptorV2Schema,
  capabilityDescriptorDigest,
  displayCapability,
  getCapabilityDescriptor
} from "../src/core/capability-descriptor.js";
import { candidateId, parseSemanticCandidate, PROTECTED_STATES, SelfPromotionError } from "../src/core/semantic-candidate.js";

// Recorded v1.5 registry digest: the v2 projection must not alter v1 data.
const V15_REGISTRY_DIGEST = "a0a6415db3cfb1a2179f2aee53b14f770adff1548768862c39b9621c38207914";

describe("Capability Descriptor v2", () => {
  it("projects every v1 capability without changing the v1 registry", () => {
    expect(capabilityRegistryDigest()).toBe(V15_REGISTRY_DIGEST);
    for (const v1 of CAPABILITY_REGISTRY) {
      const v2 = getCapabilityDescriptor(v1.id);
      expect(v2, v1.id).toBeDefined();
      expect(v2?.registry).toBe("v1");
      expect(v2?.permissions).toEqual(v1.permissions);
      expect(v2?.sideEffects).toEqual(v1.sideEffects);
      expect(v2?.approvalRequired).toBe(v1.approvalRequired);
      expect(v2?.surfaces.cli?.command ?? null).toBe(v1.cli?.command ?? null);
      expect(v2?.surfaces.mcp?.tool ?? null).toBe(v1.mcp.exposed ? v1.mcp.tool : null);
      expect(v2?.outputs.map((item) => item.artifact)).toEqual(v1.outputs);
      // Single source of truth: the English summary is the v1 description.
      expect(v2?.display.en?.summary).toBe(v1.description);
    }
  });

  it("keeps unique, schema-valid, locale-independent machine identity", () => {
    const ids = CAPABILITY_DESCRIPTORS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(CAPABILITY_DESCRIPTORS.map((item) => item.semanticKey)).size).toBe(ids.length);
    for (const descriptor of CAPABILITY_DESCRIPTORS) {
      expect(() => CapabilityDescriptorV2Schema.parse(descriptor)).not.toThrow();
      expect(descriptor.id).toMatch(/^[\x20-\x7e]+$/);
      expect(descriptor.semanticKey).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(descriptor.localization).toMatchObject({ machineSemantics: "locale-independent", preserveSource: true });
      expect(descriptor.display.en).toBeDefined();
    }
    expect(capabilityDescriptorDigest()).toMatch(/^[a-f0-9]{64}$/);
  });

  it("localizes display text without changing the capability identity", () => {
    const descriptor = getCapabilityDescriptor("structural.impact");
    if (!descriptor) throw new Error("missing structural.impact");
    const en = displayCapability(descriptor, "en-US");
    const pt = displayCapability(descriptor, "pt-BR");
    const ja = displayCapability(descriptor, "ja");
    expect(new Set([en.id, pt.id, ja.id])).toEqual(new Set(["structural.impact"]));
    expect(pt.title).not.toBe(en.title);
    expect(ja.locale).toBe("en");
  });

  it("declares planned capabilities as unavailable instead of shipped", () => {
    for (const descriptor of CAPABILITY_DESCRIPTORS.filter((item) => item.maturity === "planned")) {
      expect(descriptor.availability, descriptor.id).toBe("unavailable");
      expect(descriptor.providers.candidates.every((candidate) => candidate.status === "planned"), descriptor.id).toBe(true);
    }
  });

  it("never lets an agent or provider result default to a trusted state", () => {
    for (const descriptor of CAPABILITY_DESCRIPTORS) {
      expect(PROTECTED_STATES as readonly string[]).not.toContain(descriptor.trust.agentResultState);
    }
    expect(() => CapabilityDescriptorV2Schema.parse({ ...CAPABILITY_DESCRIPTORS[0], trust: { ...CAPABILITY_DESCRIPTORS[0]?.trust, agentResultState: "verified" } })).toThrow();
  });
});

describe("Semantic Worker candidate artifacts", () => {
  const base = {
    schemaVersion: "soturail.semantic.candidate.v1",
    createdAt: "2026-10-04T12:00:00.000Z",
    producer: { kind: "semantic-worker", host: "generic" }
  };

  it("preserves original source text byte-for-byte across languages", () => {
    const statements = [
      "Um pagamento não pode ser processado duas vezes.",
      "El pago debe rechazarse si la tarjeta está vencida.",
      "支払いは二重に処理してはならない。",
      // NFD composed form must not be normalized to NFC.
      "Revisão"
    ];
    for (const statementOriginal of statements) {
      const parsed = parseSemanticCandidate({
        ...base,
        id: candidateId("claim", statementOriginal),
        kind: "claim",
        statementOriginal,
        verificationState: "unverified",
        sourceRefs: [{ path: "docs/要件/pagamentos.md", lines: { start: 4, end: 6 } }],
        translations: [{ locale: "en", text: "derived view", derived: true }]
      });
      expect(parsed.kind === "claim" && parsed.statementOriginal).toBe(statementOriginal);
      expect(parsed.sourceRefs[0]?.path).toBe("docs/要件/pagamentos.md");
    }
  });

  it("rejects self-awarded trusted states with an explicit error", () => {
    for (const state of PROTECTED_STATES) {
      expect(() => parseSemanticCandidate({ ...base, id: candidateId("claim", state), kind: "claim", statementOriginal: "x", verificationState: state })).toThrow(SelfPromotionError);
    }
  });

  it("treats model confidence as metadata and accepts unknown or mixed locale", () => {
    const parsed = parseSemanticCandidate({
      ...base,
      id: candidateId("question", "q"),
      kind: "question",
      questionOriginal: "Qual comportamento é o correto?",
      blocking: true,
      verificationState: "unknown",
      confidence: { level: "high", basis: "model-self-report" },
      locale: { user: "pt-BR", project: "mixed", source: "unknown" }
    });
    expect(parsed.verificationState).toBe("unknown");
    expect(() => parseSemanticCandidate({ ...base, id: candidateId("claim", "c"), kind: "claim", statementOriginal: "c", verificationState: "candidate", confidence: { level: "high", basis: "proof" } })).toThrow();
  });

  it("derives stable IDs from exact content", () => {
    expect(candidateId("claim", "Revisão")).toBe(candidateId("claim", "Revisão"));
    expect(candidateId("claim", "Revisão")).not.toBe(candidateId("claim", "Revisão"));
    expect(candidateId("claim", "a")).toMatch(/^cand_[a-f0-9]{16}$/);
  });
});
