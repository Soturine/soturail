import { createHash } from "node:crypto";
import { z } from "zod";
import { CAPABILITY_REGISTRY, type CapabilityDefinition } from "./capability-registry.js";
import { PRODUCER_STATES, type ProducerState } from "./semantic-candidate.js";

// Capability Descriptor v2 is a projection over the v1 registry plus additive
// v2-only capabilities. The v1 registry and its digest stay untouched so
// recorded capability epochs remain comparable.

export const CAPABILITY_DESCRIPTOR_SCHEMA = "soturail.capability.v2" as const;

export const CapabilityIdSchema = z.string().regex(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/);
export const SemanticKeySchema = z.string().regex(/^[a-z][a-z0-9_]*$/);
export const LocaleTagSchema = z.string().regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/);

export const CapabilityMaturityV2Schema = z.enum(["stable", "experimental", "planned", "deprecated"]);
export const CapabilityAvailabilitySchema = z.enum(["available", "degraded", "unavailable"]);
export const ProviderClassSchema = z.enum([
  "native-trust-core",
  "native-fact",
  "native-heuristic",
  "structural",
  "dependency-docs",
  "context-transform",
  "semantic-worker",
  "governance"
]);
export const FallbackSchema = z.enum(["none", "native-heuristic", "semantic-worker", "human"]);

const DisplayTextSchema = z.strictObject({ title: z.string().min(1), summary: z.string().min(1) });

export const CapabilityDescriptorV2Schema = z.strictObject({
  schemaVersion: z.literal(CAPABILITY_DESCRIPTOR_SCHEMA),
  id: CapabilityIdSchema,
  semanticKey: SemanticKeySchema,
  maturity: CapabilityMaturityV2Schema,
  availability: CapabilityAvailabilitySchema,
  since: z.string().min(1),
  registry: z.enum(["v1", "v2-extension"]),
  display: z.record(LocaleTagSchema, DisplayTextSchema).refine((value) => "en" in value, "display.en is required as the source description"),
  inputs: z.array(z.strictObject({ name: z.string().regex(/^[a-z][a-zA-Z0-9_]*$/), type: z.string().min(1), required: z.boolean() })),
  outputs: z.array(z.strictObject({ artifact: z.string().min(1) })).min(1),
  surfaces: z.strictObject({
    skill: z.boolean(),
    mcp: z.strictObject({ tool: z.string().min(1) }).nullable(),
    cli: z.strictObject({ command: z.string().min(1) }).nullable(),
    artifact: z.string().min(1).nullable()
  }),
  permissions: z.strictObject({
    filesystemRead: z.enum(["none", "project", "workspace"]),
    filesystemWrite: z.enum(["none", "soturail-state", "project"]),
    shell: z.enum(["none", "restricted"]),
    network: z.enum(["none", "optional"])
  }),
  sideEffects: z.strictObject({
    scope: z.enum(["none", "local-state", "workspace", "external"]),
    reversible: z.boolean(),
    consequence: z.enum(["low", "medium", "high"])
  }),
  approvalRequired: z.boolean(),
  trust: z.strictObject({
    provenanceRequired: z.boolean(),
    freshnessRequired: z.boolean(),
    evidenceRequired: z.boolean(),
    producesObservedFacts: z.boolean(),
    agentResultState: z.enum(PRODUCER_STATES)
  }),
  providers: z.strictObject({
    class: ProviderClassSchema,
    candidates: z.array(z.strictObject({ id: z.string().min(1), kind: z.enum(["native", "optional"]), status: z.enum(["implemented", "planned"]) })),
    fallback: FallbackSchema
  }),
  localization: z.strictObject({
    machineSemantics: z.literal("locale-independent"),
    preserveSource: z.literal(true),
    sourceLanguages: z.literal("any"),
    limitations: z.array(z.string()).default([])
  }),
  docs: z.array(z.string().min(1))
});

export type CapabilityDescriptorV2 = z.infer<typeof CapabilityDescriptorV2Schema>;

type DisplayMap = Record<string, { title: string; summary?: string }>;

// For v1 capabilities the English summary is taken from the v1 registry
// description, so overlays only add titles and translations.
interface Overlay {
  semanticKey: string;
  display: DisplayMap;
  inputs?: CapabilityDescriptorV2["inputs"];
  skill?: boolean;
  artifact?: string | null;
  trust?: Partial<CapabilityDescriptorV2["trust"]>;
  providers?: CapabilityDescriptorV2["providers"];
  availability?: CapabilityDescriptorV2["availability"];
  limitations?: string[];
}

const nativeCore = (id: string): CapabilityDescriptorV2["providers"] => ({ class: "native-trust-core", candidates: [{ id, kind: "native", status: "implemented" }], fallback: "none" });
const nativeFact = (id: string): CapabilityDescriptorV2["providers"] => ({ class: "native-fact", candidates: [{ id, kind: "native", status: "implemented" }], fallback: "none" });

// v2 metadata for capabilities that already exist in the v1 registry.
const V1_OVERLAYS: Record<string, Overlay> = {
  "repo.index": {
    semanticKey: "repository_index",
    display: { en: { title: "Repository index" }, "pt-BR": { title: "Índice do repositório", summary: "Gera um mapa local e determinístico do repositório." } },
    providers: nativeFact("native-repo-map"),
    limitations: ["Symbol extraction is a heuristic line scanner, not a full parser."]
  },
  "project.read": {
    semanticKey: "project_read",
    display: { en: { title: "Guarded project read" }, "pt-BR": { title: "Leitura protegida do projeto", summary: "Lê arquivos não sensíveis do projeto através do WorkspaceGuard." } },
    inputs: [{ name: "file", type: "workspace-path", required: true }, { name: "query", type: "text", required: false }],
    providers: nativeFact("workspace-guard-read"),
    limitations: ["Query-based block selection ranks with a local lexical heuristic; request the full file when relevance matters."]
  },
  "context.pack": {
    semanticKey: "context_pack",
    display: { en: { title: "Budgeted context pack" }, "pt-BR": { title: "Pacote de contexto com orçamento", summary: "Gera um artefato de contexto com fingerprint e orçamento rígido." } },
    artifact: "soturail.context-artifact.v1",
    trust: { freshnessRequired: true },
    providers: nativeCore("context-artifact")
  },
  "evidence.collect": {
    semanticKey: "evidence_collect",
    display: { en: { title: "Evidence collection" }, "pt-BR": { title: "Coleta de evidências", summary: "Coleta evidências locais vinculadas ao workspace sem executar verificações." } },
    artifact: "soturail.evidence.provenance.v1",
    trust: { freshnessRequired: true, producesObservedFacts: true },
    providers: nativeCore("evidence-provenance")
  },
  "raw.inspect.redacted": {
    semanticKey: "raw_inspect_redacted",
    display: { en: { title: "Redacted raw log inspection" }, "pt-BR": { title: "Inspeção de log bruto redigido", summary: "Inspeciona logs brutos com redação obrigatória." } },
    inputs: [{ name: "rawId", type: "raw-id", required: true }],
    providers: nativeCore("raw-store")
  },
  "command.run": {
    semanticKey: "command_run",
    display: { en: { title: "Restricted command run" }, "pt-BR": { title: "Execução restrita de comando", summary: "Executa um comando fornecido pelo usuário através do runner restrito." } },
    inputs: [{ name: "command", type: "argv", required: true }],
    trust: { producesObservedFacts: true },
    providers: nativeCore("restricted-runner"),
    limitations: ["Command safety patterns are a guardrail, not a sandbox."]
  },
  "governance.evaluate": {
    semanticKey: "governance_evaluate",
    display: { en: { title: "Authority and readiness gate" }, "pt-BR": { title: "Gate de autoridade e prontidão", summary: "Avalia de forma determinística os gates de autoridade e prontidão." } },
    trust: { freshnessRequired: true, evidenceRequired: true },
    providers: { class: "governance", candidates: [{ id: "native-minimal", kind: "native", status: "implemented" }, { id: "agt-acs", kind: "optional", status: "planned" }], fallback: "none" }
  },
  "contract.verify": {
    semanticKey: "contract_verify",
    display: { en: { title: "Change contract verification" }, "pt-BR": { title: "Verificação de contrato de mudança", summary: "Verifica fidelidade, frescor e requisitos de evidência do contrato de mudança." } },
    inputs: [{ name: "contract", type: "workspace-path", required: true }],
    trust: { freshnessRequired: true, evidenceRequired: true },
    providers: nativeCore("change-contract")
  }
};

interface Extension extends Overlay {
  id: string;
  maturity: CapabilityDescriptorV2["maturity"];
  cli: string | null;
  mcpTool?: string;
  output: string;
  read: CapabilityDescriptorV2["permissions"]["filesystemRead"];
  write: CapabilityDescriptorV2["permissions"]["filesystemWrite"];
  network?: CapabilityDescriptorV2["permissions"]["network"];
  scope: CapabilityDescriptorV2["sideEffects"]["scope"];
  approvalRequired?: boolean;
  consequence?: CapabilityDescriptorV2["sideEffects"]["consequence"];
}

const plannedProvider = (cls: CapabilityDescriptorV2["providers"]["class"], ids: string[], fallback: CapabilityDescriptorV2["providers"]["fallback"]): CapabilityDescriptorV2["providers"] => ({
  class: cls,
  candidates: ids.map((id) => ({ id, kind: "optional" as const, status: "planned" as const })),
  fallback
});

// v2-only capabilities referenced by portable Skills. Planned entries are
// declared honestly as unavailable instead of pretending to exist.
const V2_EXTENSIONS: Extension[] = [
  {
    id: "capability.discover", maturity: "experimental", cli: "capabilities describe <id>", mcpTool: "soturail.capabilities", output: "soturail.capability.v2", read: "none", write: "none", scope: "none", semanticKey: "capability_discover",
    display: { en: { title: "Capability discovery", summary: "List and describe canonical SotuRail capabilities, trust rules and provider availability." }, "pt-BR": { title: "Descoberta de capabilities", summary: "Lista e descreve capabilities canônicas, regras de confiança e disponibilidade de providers." } },
    providers: nativeFact("capability-descriptor")
  },
  {
    id: "skill.discover", maturity: "experimental", cli: "skills describe <name>", mcpTool: "soturail.skills.list", output: "soturail.skill.catalog.v1", read: "workspace", write: "none", scope: "none", semanticKey: "skill_discover",
    display: { en: { title: "Skill discovery", summary: "List available Skills with concise discovery metadata." }, "pt-BR": { title: "Descoberta de Skills", summary: "Lista as Skills disponíveis com metadados concisos de descoberta." } },
    providers: nativeFact("skill-catalog")
  },
  {
    id: "skill.validate", maturity: "stable", cli: "skills validate", output: "soturail.skills.report.v2", read: "workspace", write: "none", scope: "none", semanticKey: "skill_validate",
    display: { en: { title: "Skill safety validation", summary: "Validate local Skills for schema, hash, destructive-command and secret patterns." }, "pt-BR": { title: "Validação de segurança de Skills", summary: "Valida Skills locais quanto a schema, hash, comandos destrutivos e segredos." } },
    providers: nativeFact("skill-validator"),
    limitations: ["Prompt-injection phrase checks are non-exhaustive."]
  },
  {
    id: "context.select", maturity: "experimental", cli: "context select --query <text>", output: "soturail.context.selection.v1", read: "workspace", write: "soturail-state", scope: "local-state", semanticKey: "context_select",
    display: { en: { title: "Context selection", summary: "Select candidate files and memory for a task within a budget." }, "pt-BR": { title: "Seleção de contexto", summary: "Seleciona arquivos e memória candidatos para uma tarefa dentro de um orçamento." } },
    inputs: [{ name: "query", type: "text", required: true }],
    trust: { agentResultState: "candidate" },
    providers: { class: "native-heuristic", candidates: [{ id: "lexical-ranker", kind: "native", status: "implemented" }], fallback: "semantic-worker" },
    availability: "degraded",
    limitations: ["Native ranking is lexical; the Semantic Worker should choose context from task meaning."]
  },
  {
    id: "evidence.verify", maturity: "stable", cli: "evidence verify", output: "soturail.evidence.provenance.v1", read: "workspace", write: "soturail-state", scope: "local-state", semanticKey: "evidence_verify",
    display: { en: { title: "Evidence verification", summary: "Re-check recorded evidence against the current workspace fingerprint." }, "pt-BR": { title: "Verificação de evidências", summary: "Reavalia evidências registradas contra o fingerprint atual do workspace." } },
    trust: { freshnessRequired: true, evidenceRequired: true, producesObservedFacts: true },
    providers: nativeCore("evidence-provenance")
  },
  {
    id: "contract.create", maturity: "stable", cli: "contract create <id>", output: "soturail.change-contract.v1", read: "workspace", write: "soturail-state", scope: "local-state", semanticKey: "contract_create",
    display: { en: { title: "Change contract", summary: "Declare scope, risk, required checks and acceptance criteria for a change." }, "pt-BR": { title: "Contrato de mudança", summary: "Declara escopo, risco, verificações exigidas e critérios de aceite de uma mudança." } },
    trust: { freshnessRequired: true },
    providers: nativeCore("change-contract")
  },
  {
    id: "knowledge.compile", maturity: "stable", cli: "knowledge compile <name> <paths...>", output: "soturail.knowledge.pack.v1", read: "workspace", write: "soturail-state", scope: "local-state", semanticKey: "knowledge_compile",
    display: { en: { title: "Knowledge compilation", summary: "Compile local sources into a source-mapped knowledge pack." }, "pt-BR": { title: "Compilação de conhecimento", summary: "Compila fontes locais em um pacote de conhecimento com mapa de fontes." } },
    trust: { freshnessRequired: true },
    providers: nativeFact("knowledge-rail"),
    limitations: ["Glossary/pattern extraction is structural; meaning is interpreted by the Semantic Worker."]
  },
  {
    id: "knowledge.verify", maturity: "stable", cli: "knowledge verify", output: "soturail.knowledge.verify.v1", read: "workspace", write: "none", scope: "none", semanticKey: "knowledge_verify",
    display: { en: { title: "Knowledge freshness check", summary: "Check compiled knowledge against current source hashes." }, "pt-BR": { title: "Verificação de frescor do conhecimento", summary: "Confere o conhecimento compilado contra os hashes atuais das fontes." } },
    trust: { freshnessRequired: true, producesObservedFacts: true },
    providers: nativeCore("knowledge-rail")
  },
  {
    id: "release.preflight", maturity: "stable", cli: "release check", output: "soturail.release.preflight.v1", read: "workspace", write: "soturail-state", scope: "local-state", semanticKey: "release_preflight",
    display: { en: { title: "Release preflight", summary: "Check version, changelog, package and provenance prerequisites before a release." }, "pt-BR": { title: "Pré-verificação de release", summary: "Verifica versão, changelog, pacote e proveniência antes de um release." } },
    trust: { freshnessRequired: true, evidenceRequired: true, producesObservedFacts: true },
    providers: nativeCore("release-preflight")
  },
  {
    id: "dependency.docs", maturity: "planned", cli: null, output: "soturail.dependency-docs.v1", read: "project", write: "none", network: "optional", scope: "none", semanticKey: "dependency_docs",
    display: { en: { title: "Version-matched dependency docs", summary: "Fetch documentation that matches the locked dependency version." }, "pt-BR": { title: "Docs de dependência por versão", summary: "Obtém documentação compatível com a versão travada da dependência." } },
    providers: plannedProvider("dependency-docs", ["context7", "official-docs"], "semantic-worker"),
    availability: "unavailable",
    limitations: ["No provider is integrated yet; the agent must cite the upstream source and version it used."]
  },
  {
    id: "structural.impact", maturity: "planned", cli: null, output: "soturail.impact.v1", read: "workspace", write: "none", scope: "none", semanticKey: "structural_impact",
    display: { en: { title: "Structural impact", summary: "Report symbols, files and tests structurally affected by a change." }, "pt-BR": { title: "Impacto estrutural", summary: "Relata símbolos, arquivos e testes afetados estruturalmente por uma mudança." } },
    inputs: [{ name: "target", type: "symbol-or-path", required: true }],
    trust: { freshnessRequired: true },
    providers: plannedProvider("structural", ["native-lite", "codebase-memory", "code-review-graph", "graphify"], "semantic-worker"),
    availability: "unavailable",
    limitations: ["Until a StructuralProvider exists, impact is a Semantic Worker candidate built from repo.index and project.read."]
  },
  {
    id: "semantic.candidate.record", maturity: "planned", cli: null, output: "soturail.semantic.candidate.v1", read: "none", write: "soturail-state", scope: "local-state", semanticKey: "semantic_candidate_record",
    display: { en: { title: "Record semantic candidate", summary: "Record a structured Semantic Worker claim, impact, decision, question or interpretation." }, "pt-BR": { title: "Registrar candidato semântico", summary: "Registra afirmação, impacto, decisão, pergunta ou interpretação estruturada do agente." } },
    providers: { class: "semantic-worker", candidates: [], fallback: "none" },
    availability: "unavailable"
  }
];

const DEFAULT_TRUST: CapabilityDescriptorV2["trust"] = {
  provenanceRequired: true,
  freshnessRequired: false,
  evidenceRequired: false,
  producesObservedFacts: false,
  agentResultState: "unverified" satisfies ProducerState
};

function resolveDisplay(display: DisplayMap, sourceSummary: string | null): CapabilityDescriptorV2["display"] {
  const en = display.en;
  const summary = sourceSummary ?? en?.summary;
  if (!en || !summary) throw new Error("Capability display requires an English title and source summary.");
  const resolved: CapabilityDescriptorV2["display"] = { en: { title: en.title, summary } };
  for (const [locale, text] of Object.entries(display)) {
    if (locale !== "en") resolved[locale] = { title: text.title, summary: text.summary ?? summary };
  }
  return resolved;
}

function fromV1(definition: CapabilityDefinition): CapabilityDescriptorV2 {
  const overlay = V1_OVERLAYS[definition.id];
  if (!overlay) throw new Error(`Capability ${definition.id} has no v2 overlay.`);
  return {
    schemaVersion: CAPABILITY_DESCRIPTOR_SCHEMA,
    id: definition.id,
    semanticKey: overlay.semanticKey,
    maturity: definition.maturity,
    availability: overlay.availability ?? "available",
    since: definition.since,
    registry: "v1",
    display: resolveDisplay(overlay.display, definition.description),
    inputs: overlay.inputs ?? [],
    outputs: definition.outputs.map((artifact) => ({ artifact })),
    surfaces: {
      skill: overlay.skill ?? true,
      mcp: definition.mcp.exposed && definition.mcp.tool ? { tool: definition.mcp.tool } : null,
      cli: definition.cli ? { command: definition.cli.command } : null,
      artifact: overlay.artifact ?? null
    },
    permissions: { ...definition.permissions },
    sideEffects: { ...definition.sideEffects },
    approvalRequired: definition.approvalRequired,
    trust: { ...DEFAULT_TRUST, ...overlay.trust },
    providers: overlay.providers ?? nativeFact(definition.id),
    localization: { machineSemantics: "locale-independent", preserveSource: true, sourceLanguages: "any", limitations: overlay.limitations ?? [] },
    docs: [...definition.docs]
  };
}

function fromExtension(extension: Extension): CapabilityDescriptorV2 {
  return {
    schemaVersion: CAPABILITY_DESCRIPTOR_SCHEMA,
    id: extension.id,
    semanticKey: extension.semanticKey,
    maturity: extension.maturity,
    availability: extension.availability ?? (extension.maturity === "planned" ? "unavailable" : "available"),
    since: "1.6.0",
    registry: "v2-extension",
    display: resolveDisplay(extension.display, null),
    inputs: extension.inputs ?? [],
    outputs: [{ artifact: extension.output }],
    surfaces: {
      skill: extension.skill ?? true,
      mcp: extension.mcpTool ? { tool: extension.mcpTool } : null,
      cli: extension.cli ? { command: extension.cli } : null,
      artifact: extension.artifact ?? null
    },
    permissions: { filesystemRead: extension.read, filesystemWrite: extension.write, shell: "none", network: extension.network ?? "none" },
    sideEffects: { scope: extension.scope, reversible: extension.scope !== "external", consequence: extension.consequence ?? "low" },
    approvalRequired: extension.approvalRequired ?? false,
    trust: { ...DEFAULT_TRUST, ...extension.trust },
    providers: extension.providers ?? nativeFact(extension.id),
    localization: { machineSemantics: "locale-independent", preserveSource: true, sourceLanguages: "any", limitations: extension.limitations ?? [] },
    docs: ["docs/architecture/agent-native-semantic-architecture.md"]
  };
}

export const CAPABILITY_DESCRIPTORS: readonly CapabilityDescriptorV2[] = Object.freeze(
  [...CAPABILITY_REGISTRY.map(fromV1), ...V2_EXTENSIONS.map(fromExtension)].map((descriptor) => CapabilityDescriptorV2Schema.parse(descriptor))
);

export function listCapabilityDescriptors(): readonly CapabilityDescriptorV2[] {
  return CAPABILITY_DESCRIPTORS;
}

export function getCapabilityDescriptor(id: string): CapabilityDescriptorV2 | undefined {
  return CAPABILITY_DESCRIPTORS.find((item) => item.id === id);
}

export function capabilityDescriptorDigest(): string {
  return createHash("sha256").update(JSON.stringify(CAPABILITY_DESCRIPTORS)).digest("hex");
}

/**
 * Human-facing text for a locale. Falls back to the source description and
 * never changes machine identity.
 */
export function displayCapability(descriptor: CapabilityDescriptorV2, locale = "en"): { id: string; locale: string; title: string; summary: string } {
  const exact = descriptor.display[locale];
  const language = locale.split("-")[0] ?? locale;
  const byLanguage = Object.entries(descriptor.display).find(([tag]) => tag.split("-")[0] === language)?.[1];
  const resolved = exact ? locale : byLanguage ? Object.keys(descriptor.display).find((tag) => tag.split("-")[0] === language) ?? "en" : "en";
  const text = exact ?? byLanguage ?? descriptor.display.en;
  if (!text) throw new Error(`Capability ${descriptor.id} has no source display text.`);
  return { id: descriptor.id, locale: resolved, title: text.title, summary: text.summary };
}

export interface CapabilitySummary {
  id: string;
  title: string;
  maturity: CapabilityDescriptorV2["maturity"];
  availability: CapabilityDescriptorV2["availability"];
  mcp: string | null;
  cli: string | null;
  approvalRequired: boolean;
  sideEffects: CapabilityDescriptorV2["sideEffects"]["scope"];
}

/** Bounded catalog projection for agents: enough to choose, not the full manual. */
export function capabilityCatalog(locale = "en"): { schemaVersion: "soturail.capability.catalog.v1"; descriptorDigest: string; locale: string; capabilities: CapabilitySummary[] } {
  return {
    schemaVersion: "soturail.capability.catalog.v1",
    descriptorDigest: capabilityDescriptorDigest(),
    locale,
    capabilities: CAPABILITY_DESCRIPTORS.map((descriptor) => ({
      id: descriptor.id,
      title: displayCapability(descriptor, locale).title,
      maturity: descriptor.maturity,
      availability: descriptor.availability,
      mcp: descriptor.surfaces.mcp?.tool ?? null,
      cli: descriptor.surfaces.cli ? `soturail ${descriptor.surfaces.cli.command}` : null,
      approvalRequired: descriptor.approvalRequired,
      sideEffects: descriptor.sideEffects.scope
    }))
  };
}

export function describeCapability(id: string, locale = "en"): CapabilityDescriptorV2 & { presentation: ReturnType<typeof displayCapability> } {
  const descriptor = getCapabilityDescriptor(id);
  if (!descriptor) throw new Error(`Unknown capability: ${id}. List capabilities with soturail.capabilities or "soturail capabilities list".`);
  return { ...descriptor, presentation: displayCapability(descriptor, locale) };
}
