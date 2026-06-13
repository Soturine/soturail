# External Projects Audit For Future SotuRail Rails

This audit records external projects and patterns reviewed for the post-v0.10.1 roadmap. It is not a claim that SotuRail depends on, vendors, wraps or outperforms any of them.

SotuRail's product position remains:

```txt
SotuRail is the local Context OS layer for AI coding agents.
It prepares context, specs, memory, evidence, policies, reports and safe handoff artifacts.
It is not the model, not the agent brain, not a heavy gateway and not a clone of any host.
```

## Audit Summary

| Project | Confidence | Primary pattern | SotuRail action |
| --- | --- | --- | --- |
| `google-labs-code/design.md` | High | Agent-readable design tokens and rules | Add future Design Rail: `design init/lint/diff/export` |
| `anomalyco/opencode` | High | Open-source coding-agent host | Add Host Compatibility Rail and OpenCode exports |
| `henriquesantanati/openclaude` | Medium | Claude-compatible host/wrapper pattern | Treat as generic/Claude-compatible host, not core dependency |
| `henriquesantanati/mermaid` | Medium | Mermaid/diagram workflow tooling | Strengthen Diagram Rail render/diff/validate paths |
| `langchain-ai/deepagents` | High | Agent harness with subagents, filesystem, memory and HITL | Export role packs and evidence for Deep Agents-style harnesses without becoming one |
| `JulioCRFilho/mermaid-diagram-driven-development` | Medium | Spec/diagram-driven development structure | Add Spec Rail and improve `.spec.md` workflow contracts |
| `darkhucx/claude-code-harness` | Medium | Harness/acceptance discipline | Strengthen Harness Rail acceptance contracts and evidence gates |
| `henrysssilveira/MCP-Host-Universal` | Medium | Universal MCP host pattern | Keep SotuRail on read-only resources/manifests/policy, not a mutable host |
| `Lum1104/Understand-Anything` | High | Code/document knowledge graph and guided understanding | Add Knowledge Graph Rail after v1.0 stabilization |
| `renanrdev/dumps` | Medium | CLI-first redacted paste/evidence sharing | Add redacted local evidence bundles, no hosting by default |
| `murillo-romeu/sonar-totvs` | High | Domain-specific AI skill/report | Add Skill Rail 2.0 domain skill templates and safety gates |
| `Acauhi99/opencode-agent-system` | Medium | OpenCode agent system patterns | Add OpenCode host export and role/skill packaging |
| `ComposioHQ/composio` | High | Tool/provider integration layer | Stay compatible through manifests and reports, do not become a tool marketplace |
| Hermes Agent | High | Self-improving personal agent runtime with tools, skills, routines, subagents and trajectory compression | Absorb context optimization and role-pack patterns while keeping SotuRail a harness |
| Odysseus | High | Self-hosted AI workspace combining runtime, UI, local services, memory and tools | Absorb dashboard/host-fit/report patterns without adding a required server or model manager |

## What SotuRail Should Absorb

### Hermes And Odysseus Classification

Hermes is an agent runtime. Odysseus is a workspace plus runtime and local-service stack. SotuRail remains the local-first harness/context OS that prepares and governs artifacts for those kinds of hosts.

Useful patterns include trajectory compression, session search, toolset profiles, role packs, local dashboard cards, visual evidence and explicit privacy boundaries. Model serving, mandatory web UI, central shell access and bundled personal productivity services remain outside SotuRail scope.

See [Agent And Harness Synthesis 2026](agent-harness-synthesis-2026.md) and [Security Boundaries](../security/security-boundaries.md).

### 1. Host compatibility without becoming a host

OpenCode, Claude-compatible hosts, Antigravity-style hosts, Codex, Cursor and Deep Agents-style harnesses all need different context formats, rules, reports and safety guidance.

SotuRail should provide:

- host capability matrix;
- host-aware report exports;
- role packs and context packs per host;
- conservative prompt-only fallback;
- safe MCP resource manifests;
- clear policy warnings for tools, hooks and config writes.

### 2. Specs and design before implementation

`design.md` and MDDD-style workflows show that agents need durable specs, design tokens, tasks and visual contracts before code changes.

SotuRail should provide:

- `spec init/check/plan`;
- local `DESIGN.md` support;
- design token lint/diff/export;
- Mermaid render/diff validation;
- `.spec.md` files as reviewable contracts.

### 3. Knowledge graph after Project Brain

Understand-Anything-style tools show the value of code/docs/decision graphs. SotuRail already has Project Brain and Reverse Specification Rail; the next step is connecting records into a local graph.

SotuRail should provide:

- graph build/explain/impact/tour;
- graph dashboard as a local artifact;
- stale edge detection;
- agent-readable project tours.

### 4. Skills must be domain-aware and safe

Sonar/TOTVS-style skills show how valuable narrow domain skills can be. They also show why SotuRail must keep evidence, severity, confidence and review boundaries explicit.

SotuRail should provide:

- domain skill templates;
- skill lint/eval/report;
- role-aware skill exports;
- explicit human approval requirements;
- defensive-only security skill boundaries.

### 5. Governance and cost matter more as agents become dynamic

Dynamic workflows, subagents and long-horizon agents can burn tokens, time and external tool calls quickly. SotuRail should not manage provider billing, but it can show local risk signals before handoff.

SotuRail should provide:

- context budget reports;
- dynamic workflow warnings;
- MCP exposure risk summaries;
- repeated instruction/large context detection;
- safe next commands to prune/offload/role-pack before running an agent.

## Security Note

Some referenced posts and screenshots involved security, pentest or mobile analysis contexts. SotuRail may support authorized defensive review as a reporting and governance layer, but it must not ship bypass, exploit, evasion, credential theft, malware or unauthorized access instructions.

For security-oriented workflows, SotuRail should emphasize:

- authorization and scope;
- evidence redaction;
- policy gates;
- non-operational findings summaries;
- safe remediation guidance;
- human approval before risky actions.

## Roadmap Mapping

| Roadmap stage | External pattern absorbed |
| --- | --- |
| v1.0.0 Stable Context OS | v0.10.1 readiness, JSON contracts, stable docs |
| v1.1.0 Host Compatibility Rail | OpenCode, Deep Agents, MCP Host Universal, OpenCode agent systems |
| v1.2.0 Spec, Design And Diagram Rail | design.md, MDDD, Mermaid workflows |
| v1.3.0 Knowledge Graph Rail | Understand-Anything and Project Brain evolution |
| v1.4.0 Skill Rail 2.0 | Sonar/TOTVS-style domain skill, Deep Agents skills, host exports |
| v1.5.0 Governance And Cost Rail | dynamic workflows, long-horizon agents, context/token budget risks |

## 2026 Harness/Eval/Provenance Review Addendum

This addendum records the later review wave that directly affects post-v1 docs and roadmap planning.

| Project/Product | Confidence | Primary pattern | SotuRail action |
| --- | --- | --- | --- |
| `ijmf/qa-ai-agent` | High | Agent QA through tests, datasets, traces and CI | Add Agent QA Rail, eval datasets, golden exports and optional judge policy |
| `duckdogersxd/Orquestrando-Agents-CrewAI` | Medium | Multi-agent role workflow plus fallback/rate-limit lessons | Add multi-agent workflow templates and Resilience Rail notes |
| `CaioTakedaIA/agentesdeIA` | Medium | Validate/fix/revalidate/analyze pipeline with visible logs | Add pipeline recorder concept and dashboard timeline ideas |
| `OpenTracy/OpenTracy` | High | Propose/eval/approve/apply loop, trace, ledger and candidates | Add Agent Governance/Evolution Rail after governance foundations |
| `walkinglabs/learn-harness-engineering` | High | Instructions, state, verification, scope, lifecycle | Add Harness Lifecycle Rail docs and feature/session handoff planning |
| `affaan-m/ECC` | High | Cross-host harness system with skills/rules/doctor/repair/install state | Add install profiles, audit score, skills/rules profiles and host export polish |
| `companion-inc/feynman` | High | Provenance sidecars and verification statuses | Add Evidence/Provenance Rail |
| `virgiliojr94/book-to-skill` | High | Document-to-skill with on-demand chapters/glossary/patterns | Add Knowledge Rail and skill build/fold-in planning |
| Tasklet.ai | Low | Public information was limited; small reusable task concept only | Add Tasklet Rail as local templates, not a vendor integration |
| 9Router | Medium | Router metaphor, multi-host compatibility, token/context savings | Add Host Router Rail for context exports; explicitly avoid proxy/MITM behavior |

The safe SotuRail interpretation is to generate local artifacts for external agents, not to become a model router, hosted agent platform, provider gateway or automation system that edits without approval.
