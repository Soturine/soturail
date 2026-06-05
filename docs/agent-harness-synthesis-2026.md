# 2026 Agent Harness Synthesis

This document merges the latest external-repo review into one SotuRail planning note. It is not a dependency list and it is not a claim that SotuRail vendors, wraps or outperforms those projects.

SotuRail remains:

```txt
Local-first Context OS for AI coding agents.
It prepares context, memory, policies, skills, workflows, evidence, reports and host exports.
It is not the model, not the coding agent, not a proxy, not a cloud gateway and not a trading/finance agent.
```

## Projects Reviewed In This Wave

| Project or product | Useful pattern | SotuRail direction |
| --- | --- | --- |
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

## Consolidated Product Rules

SotuRail should absorb durable patterns without copying risky product shapes:

- keep tests/evals offline and deterministic by default;
- keep provider calls, LLM-as-judge and network checks optional;
- keep generated outputs local, versionable and removable;
- prefer file-based handoff over giant prompts;
- record provenance, evidence and verification status for reports;
- route context by role, host and task instead of dumping everything;
- treat skills as small operating procedures, not always-loaded wikis;
- treat MCP as a capability boundary, not as a destructive shell surface;
- provide doctor/audit/repair/uninstall paths for generated artifacts;
- never intercept IDE traffic, browser sessions, cookies or provider credentials;
- avoid proxy, billing, unlimited-free, cloud telemetry or autonomous-editing claims.

## Rail Map

| New or expanded rail | Main purpose | Inspired by |
| --- | --- | --- |
| Agent QA Rail | datasets, golden checks, regression reports and optional judges | `qa-ai-agent` |
| Resilience Rail | rate-limit, retry, fallback and provider-risk policy docs | CrewAI/LiteLLM-style repo, 9Router concept |
| Pipeline Recorder | record agent-stage events and evidence packs | `agentesdeIA` |
| Agent Governance Rail | trace, ledger, candidates, approval gate and improve loop | OpenTracy |
| Harness Lifecycle Rail | init, audit, feature list, session start/end and handoff | learn-harness-engineering |
| Install/Profile Rail | profile-based install state, doctor, repair and uninstall | ECC |
| Evidence/Provenance Rail | provenance sidecars and verification status | Feynman |
| Knowledge Rail | document ingestion into on-demand skills | book-to-skill |
| Host Router Rail | one context source exported to many hosts with fallback formats | 9Router metaphor |
| Tasklet Rail | small reusable local task templates | Tasklet concept |

## Suggested Version Placement

```txt
v1.1.1  Host Compatibility Polish, docs synthesis, golden export checks
v1.2.0  Spec, Design, Diagram and Harness Lifecycle Rail
v1.3.0  Knowledge, Evidence and Evaluation Rail
v1.4.0  Skill Rail 2.0, Knowledge-to-Skill and Tasklet Packs
v1.5.0  Governance, Cost, Resilience and Host Router Rail
v1.6.0  Agent Governance / Evolution Rail
```

The exact command names are not frozen. The docs name future rails before implementation so the project can grow deliberately instead of accumulating ad-hoc commands.
