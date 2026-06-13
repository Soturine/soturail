# Agent And Harness Synthesis 2026

This document merges the latest external-repository review into one SotuRail planning note. It distinguishes agent runtimes from harness/context infrastructure so SotuRail can absorb useful ecosystem patterns without losing its product boundary. It is not a dependency list and it is not a claim that SotuRail vendors, wraps or outperforms those projects.

SotuRail remains:

```txt
Local-first Context OS for AI coding agents.
It prepares context, memory, policies, skills, workflows, evidence, reports and host exports.
It is not the model, not the coding agent, not a proxy, not a cloud gateway and not a trading/finance agent.
```

## Classification

```txt
Agent = objective + model + tools + state/memory + decision/execution loop.
Non-agent = skill, toolkit, toolset, compressor, router, runtime helper, context, prompt, rule or adapter.
```

Hermes Agent is a self-improving agent runtime with a model, tools, memory, execution loop, skills, routines, subagents and multiple interfaces.

Odysseus is broader: a self-hosted AI workspace combining an agent runtime, chat UI, local services, model management, memory, skills, research and personal workspace features.

SotuRail is different:

```txt
Hermes = self-improving personal agent runtime
Odysseus = workspace + runtime + agent + UI + local services
SotuRail = local-first context/harness OS for preparing and governing agents
```

Toolkits, compressors and routers should not be described as agents unless they own a model-plus-tool execution loop.

## Projects Reviewed In This Wave

| Project or product | Useful pattern | SotuRail direction |
| --- | --- | --- |
| Hermes Agent | self-improving runtime, trajectory compression, routines and role packs | context optimization, bounded sessions and safe tool profiles |
| Odysseus | workspace, runtime, UI and local-service integration | local workspace organization without a required server |
| `ijmf/qa-ai-agent` | agent QA with tests, datasets, observability and CI | Agent QA Rail, golden checks, deterministic evals |
| `duckdogersxd/Orquestrando-Agents-CrewAI` | multi-agent roles, fallback, retry and throttling lessons | role-pack templates and Resilience Rail docs |
| `CaioTakedaIA/agentesdeIA` | validate -> fix -> revalidate -> analyze pipeline with visible events | pipeline recorder, evidence per stage and dashboard timeline |
| `OpenTracy/OpenTracy` | propose -> eval -> approve -> apply loop, traces, ledger, candidates | Agent Governance / Evolution Rail |
| `walkinglabs/learn-harness-engineering` | instructions, state, verification, scope and session lifecycle | Harness Lifecycle Rail and feature/session handoff commands |
| `affaan-m/ECC` | install profiles, doctor/repair/uninstall, skills/rules/hooks, multi-host packaging | install state, harness audit, skills/rules profiles and host exports |
| `companion-inc/feynman` | provenance sidecars, verified/unverified/blocked/inferred status, file-based handoff | Evidence and Provenance Rail |
| `virgiliojr94/book-to-skill` | document/book -> skill, on-demand chapters, glossary, patterns and cheatsheet | Knowledge Rail and skill build/fold-in |
| Tasklet.ai | limited public information; reusable small tasks as a concept | Tasklet Rail as local task templates only |
| 9Router | multi-host routing metaphor, token/context optimization, local dashboard | Host Router Rail for context exports; no proxy/MITM |

## Patterns To Absorb

- Context and trajectory compression with recoverable evidence.
- Session search and bounded handoffs.
- Toolset profiles and role packs.
- Tasklet/workflow templates.
- Host Fit Doctor and compatibility notes.
- Dashboard cards for Context Packs, Memory, Reports, Evidence, Workflows, Skills, Tasklets and Handoffs.
- Local-first privacy and explicit security boundaries.
- Doctor/audit/repair/uninstall paths for generated artifacts.
- Provenance, evidence and verification status for reports.

## Patterns To Avoid

- Mandatory web servers or hosted workspaces.
- Model serving and GPU management.
- Central shell execution or destructive MCP tools.
- Provider-specific dependencies and hidden external services.
- Unreviewed autonomous edit loops.
- Proxy, MITM, billing, unlimited-free or cloud telemetry claims.
- Interception of IDE traffic, browser sessions, cookies or provider credentials.

## Rail Map

| New or expanded rail | Main purpose | Inspired by |
| --- | --- | --- |
| Agent QA Rail | datasets, golden checks, regression reports and optional judges | `qa-ai-agent` |
| Resilience Rail | rate-limit, retry, fallback and provider-risk policy docs | CrewAI/LiteLLM-style repo, 9Router concept |
| Pipeline Recorder | record agent-stage events and evidence packs | `agentesdeIA` |
| Agent Governance Rail | trace, ledger, candidates, approval gate and improve loop | OpenTracy |
| Harness Lifecycle Rail | init, audit, feature list, session start/end and handoff | learn-harness-engineering, Hermes, Odysseus |
| Install/Profile Rail | profile-based install state, doctor, repair and uninstall | ECC |
| Evidence/Provenance Rail | provenance sidecars and verification status | Feynman |
| Knowledge Rail | document ingestion into on-demand skills | book-to-skill |
| Host Router Rail | one context source exported to many hosts with fallback formats | 9Router metaphor |
| Tasklet Rail | small reusable local task templates | Tasklet concept |

## SotuRail Direction

v1.2.0 implements Harness Lifecycle Rail for local state, audits, feature tracking, sessions and handoffs. The optional [Conductor Mode](conductor-mode.md) remains proposed future work behind approval gates.

```txt
v1.1.1  Host Compatibility Polish, docs synthesis, golden export checks
v1.2.0  Harness Lifecycle Rail plus staged Spec, Design and Diagram work
v1.3.0  Knowledge, Evidence and Evaluation Rail
v1.4.0  Skill Rail 2.0, Knowledge-to-Skill and Tasklet Packs
v1.5.0  Governance, Cost, Resilience and Host Router Rail
v1.6.0  Agent Governance / Evolution Rail
```

The exact future command names are not frozen. Related: [Ecosystem Influences](ecosystem-influences.md), [External Projects Audit](external-projects-audit.md), [Harness Lifecycle Rail](harness-lifecycle-rail.md), [Security Boundaries](security-boundaries.md).
