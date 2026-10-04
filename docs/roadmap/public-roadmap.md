# Public Roadmap

SotuRail v1.6 is a released local-first, agent-native engineering control plane. The public roadmap now focuses on adding evidence-producing capabilities and reducing remaining legacy/heuristic surface without turning SotuRail into another coding agent.

## Current baseline — v1.6

Implemented:

- portable Agent Skills with progressive disclosure;
- Capability Descriptor v2 and capability discovery;
- agent-led semantic routing with lexical fallback explicitly demoted;
- language-neutral machine semantics and preserve-source behavior;
- host-adapter registry and generic fallback;
- structured Semantic Worker candidates;
- Change Contract lifecycle with immutable baseline and current-evidence readiness;
- interactive human/manual attestations;
- workspace-bound evidence, freshness and provenance;
- typed bounded MCP surface;
- CI/security/release provenance, SBOM and canonical release artifacts.

## Near term

Priority work:

- StructuralProvider for objective symbol/impact facts;
- DependencyDocsProvider for version-matched dependency documentation;
- richer Evidence Receipts and re-attestation;
- Context Spine / escalation policy;
- knowledge drift propagation;
- further legacy removal where v1 compatibility permits it;
- benchmark-backed simplification and performance work.

## Later / optional

- rebuildable SQLite/FTS indexes;
- multilingual semantic retrieval if benchmarks justify it;
- optional graph/provider integrations;
- runtime-provider interfaces and controlled orchestration;
- optional Conductor only after stable contracts and approval boundaries.

## Explicit non-goals

SotuRail does not plan to become a mandatory:

- cloud backend;
- LLM/model provider;
- vector database;
- graph database;
- model proxy/router;
- autonomous coding runtime;
- giant MCP marketplace;
- browser automation suite.

For dependency order and implementation status, use [ROADMAP.md](../../ROADMAP.md) and the [implementation tracker](verified-control-plane-implementation-tracker.md).
