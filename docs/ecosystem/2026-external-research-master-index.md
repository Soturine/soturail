# 2026 External Research Master Index

This is the cumulative navigation index for external projects, standards and patterns that influenced SotuRail architecture and roadmap.

It is **not** a claim that SotuRail vendors, embeds, depends on or outperforms every item listed here. Detailed historical notes remain in [External Projects Audit](external-projects-audit.md), [Ecosystem Influences](ecosystem-influences.md), [Comparisons](comparisons.md), and [Agent And Harness Synthesis](agent-harness-synthesis-2026.md).

## Classification

A reference may appear in more than one class.

- **SKILL / PROCEDURE** — teaches an agent how to work.
- **RUNTIME / AGENT** — executes the reasoning/editing loop.
- **PROVIDER / ENGINE** — supplies one replaceable capability.
- **SERVICE / MCP** — external capability/documentation/integration surface.
- **STANDARD** — interchange or control contract.
- **APP / VERTICAL** — product reference whose narrow patterns may be useful.
- **BENCHMARK / RESEARCH** — comparison or architecture reference.
- **DO-NOT-CORE** — may interoperate later but should not define the core.

## Core decision

```text
Skill    -> teaches procedure
Provider -> supplies capability
Runtime  -> executes agent work
Standard -> defines interchange/control
Benchmark-> measures behavior
SotuRail -> exposes canonical capabilities, trust state, provenance,
            freshness, evidence, policy and readiness across those surfaces
```

v1.6 adds a crucial refinement:

```text
AI / Semantic Worker -> understands natural language and project meaning
SotuRail trust core   -> constrains and proves objective states
```

## Skills / operating procedures

| Reference | Pattern absorbed | SotuRail decision |
| --- | --- | --- |
| Ponytail | change economy, reuse, minimal sufficient intervention | skill/procedure influence; evaluate behavior, not LOC alone |
| Hallmark | focused design skill structure | skill packaging/eval reference |
| Matt Pocock grilling / clarification | ask decisions, discover facts, maintain frontier | Decision Graph / clarification procedure |
| reverse-skill | skill routing, regression cases, tool index, scope/evidence | Skill Router/eval influence |
| ECC | skills + agents + hooks + commands, cross-host packaging | capability/skill security and progressive loading influence |
| HyperFrames | skill/workflow routing and focused loading | capability budget / skill routing influence |
| book-to-skill | document -> structured skill/reference packs | Knowledge -> Skill pipeline |
| Caveman-style prompting/compression | compact instructions / linguistic compression | benchmark/reference only; correctness must survive |
| Three Man Team | role-scoped workflow/handoff procedure | Artifact Handoffs / role context influence |

## Runtime / agent / harness references

| Reference | Pattern absorbed | SotuRail decision |
| --- | --- | --- |
| Claude / Claude Code | agent runtime + Skills/MCP/instructions | host adapter / semantic worker |
| OpenAI Codex | coding agent + Skills/tool use | host adapter / semantic worker |
| Cursor | coding agent + Agent Skills/rules | host adapter / semantic worker |
| Gemini CLI / compatible hosts | agent runtime/instruction surface | host adapter where verified |
| Kimi-compatible/generic agents | semantic worker concept | generic portable fallback until native support verified |
| MiMoCode | coding harness/runtime | RuntimeProvider/reference, not core clone |
| AgentScope | agent framework | future RuntimeProvider candidate |
| Orca | ADE/multi-agent/worktree/candidate evaluation | runtime/provider reference |
| Pi | agent/runtime host | runtime provider/reference |
| OpenCode | open-source coding-agent host | Host Compatibility reference |
| Deep Agents | subagents/filesystem/memory/HITL/skills | role packs, offload, handoff patterns |
| Hermes Agent | agent runtime, skills, routines, compression | context/role patterns; no runtime cloning |
| Odysseus | workspace/runtime/UI/local services | dashboard/host-fit inspiration; no required server |

## Providers / engines

| Reference | Capability | SotuRail decision |
| --- | --- | --- |
| Graphify | code graph / relationships | StructuralProvider candidate + benchmark |
| CodeGraph | structural code intelligence | StructuralProvider candidate + benchmark |
| codebase-memory-mcp | MCP + structural/code-memory engine | high-priority StructuralProvider candidate |
| code-review-graph | impact/review graph | specialized StructuralProvider candidate |
| Memtrace | temporal structural memory / co-change | temporal provider/reference |
| code-graph-rag | graph/RAG/runtime tracing | provider/reference; too heavy for mandatory core |
| Headroom | context transform/compression | ContextTransformProvider candidate |
| turbovec | vector retrieval | VectorIndexProvider candidate after benchmark |
| Nango | API/OAuth integration broker | IntegrationBrokerProvider candidate |
| Serena | LSP/symbol intelligence | structural/LSP reference/provider possibility |
| Tree-sitter | syntax parsing | deterministic program-structure reference |

## Services / MCP / registries

| Reference | Pattern | SotuRail decision |
| --- | --- | --- |
| Context7 / official docs | version-matched dependency documentation | DependencyDocsProvider |
| Microsoft AGT MCP Security Gateway | governed MCP/tool interception | governance/provider reference |
| TensorBlock MCP catalog | capability discovery | RegistryProvider research; discovery != trust |
| Glama / punkpeye MCP catalog | MCP discovery/ecosystem | RegistryProvider research; discovery != trust |
| Composio | tools/providers integration ecosystem | compatibility/manifests, not marketplace cloning |
| MCP Host Universal | general MCP host boundary | keep SotuRail capability surface narrow and governed |

## Standards / interchange

| Reference | Pattern | SotuRail decision |
| --- | --- | --- |
| MCP | tools/resources/prompts boundary | implemented typed adapter |
| Agent Skills / SKILL.md | portable procedures with progressive disclosure | v1.6 primary agent-facing workflow surface |
| OKF | knowledge interchange | future import/export standard |
| Microsoft ACS | authority/control specification | GovernanceProvider / Authority Gate reference |
| Agent Governance Toolkit (AGT) | agent governance controls | optional provider after verified upstream contract |

## Context / retrieval / benchmark references

| Reference | Pattern | SotuRail decision |
| --- | --- | --- |
| RTK | CLI output reduction | benchmark; payload savings != task savings |
| LeanCTX | local context engineering, recovery, budgets | benchmark + architecture reference |
| Repomix | repo packaging/token budget | benchmark/reference |
| Aider | repo-map relevance | retrieval reference |
| Sourcegraph/Cody | hybrid search/code intelligence | retrieval reference |
| Graphify / CodeGraph / Memtrace | structural retrieval | benchmark + provider candidates |
| Headroom | transform/compression | benchmark + provider candidate |
| SQLite/FTS5 | local lexical index | optional rebuildable cache/index |
| Secretlint | secret scanning | security reference |

## Governance / workflow / evidence references

| Reference | Pattern | SotuRail decision |
| --- | --- | --- |
| Raven Stack | runtime test evidence over model self-judgment | Verification Engine influence |
| Agentic Inbox | explicit approval before external side effects | side-effect lifecycle influence |
| TradingAgents | decision -> outcome feedback | Outcome Ledger influence |
| Flowsint | enrichment + provenance | EnrichmentProvider pattern |
| spec-driven workflows | intent/spec -> implementation -> verification | Change Contract influence |
| API AI Crafter | plan-first, declared file sets, typed outputs | structured planning influence |
| claude-mega-brain | structured durable knowledge | Context Spine / knowledge reference |
| QuantMind | ingest once -> structure -> query repeatedly | knowledge/retrieval reference |
| Agent-Reach | capability health/fallback/doctor | provider health/reference |
| Feynman-style provenance | sidecars / verification status | evidence/provenance influence |
| OpenTracy | propose/eval/approve/apply, trace/ledger | governance/evolution influence |
| qa-ai-agent | tests/datasets/traces/CI | Agent QA influence |

## Media / document / product references

| Reference | Pattern | SotuRail decision |
| --- | --- | --- |
| mcp-youtube-transcriber | transcript ingest | optional MediaKnowledgeProvider |
| claude-video | video/context extraction | optional media provider/reference |
| LibreChat | agent/chat UI | future Run/Governance Console UX reference |
| OfficeCLI | office artifact automation | possible future ArtifactExporter, not core |
| MoneyPrinterTurbo | media pipeline | reference only / not core |
| VoxCPM | audio/media capability | reference only / optional provider |
| Fincept | vertical financial product | domain reference only; no core/vendor coupling |
| Flowsint | OSINT graph/enrichment | optional enrichment pattern |

## Do not incorporate as core

| Reference | Reason |
| --- | --- |
| Desktop Commander MCP | broad/unrestricted capability surface |
| OmniRoute / 9Router-style provider routing | SotuRail should not become model traffic proxy/gateway |
| Pake | packaging concern outside core |
| RxDB | unnecessary default complexity versus local canonical artifacts |
| large MCP catalogs | discovery ecosystem, not trust/runtime core |
| full browser automation frameworks | different product boundary |
| full media pipelines | different product boundary |
| MoneyPrinterTurbo / VoxCPM | media vertical/runtime weight |
| Fincept | vertical domain scope |
| OfficeCLI | artifact automation beyond current core |

## Research-only / radar

- awesome-agentic-ai;
- awesome-llm-apps;
- other curated lists used only to discover candidates.

A curated list is never evidence that a project is suitable for integration.

## v1.6 architectural consequence

The cumulative research no longer implies that SotuRail should implement one parser/engine per idea.

Instead:

```text
portable Skill
     |
canonical capability
     |
+----+--------------------------+
|                               |
native proof/fact tool       optional provider
|                               |
+--------------+----------------+
               |
        Semantic Worker
               |
        candidate artifact
               |
SotuRail provenance/evidence/readiness
```

This keeps SotuRail usable by many agents, projects, stacks and human languages without replacing those agents with an ever-growing hardcoded semantic engine.

## Traceability

For current architectural decisions see:

- [Provider Architecture](../architecture/provider-architecture.md)
- [Agent-Native Semantic Architecture](../architecture/agent-native-semantic-architecture.md)
- [Verified Control Plane Tracker](../roadmap/verified-control-plane-implementation-tracker.md)
- [Roadmap](../../ROADMAP.md)
