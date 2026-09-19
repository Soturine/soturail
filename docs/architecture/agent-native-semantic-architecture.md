# Agent-Native Semantic Architecture

Status: **planned for v1.6**. The v1.5 deterministic control-plane contracts remain the current stable implementation.

## Decision

SotuRail evolves from a CLI/MCP-first local control plane into a **self-describing engineering control plane that agents can understand and use as Skills**.

The core rule is:

```text
AI understands.
SotuRail organizes, constrains and proves.
```

A second rule prevents the opposite failure mode:

```text
Do not hardcode intelligence that the agent can perform better.
Do not delegate truth that deterministic systems can prove better.
```

This is not a move away from verification. It is a separation between **semantic work** and **proof**.

## Why this change

Natural-language meaning varies by:

- human language;
- project vocabulary;
- stack and framework;
- domain/business rules;
- repository conventions;
- architecture;
- agent host;
- task context.

A growing set of keyword maps, English regexes, stack-specific rule parsers and hardcoded semantic classifiers will become brittle and incomplete.

SotuRail should instead let the active AI agent interpret intent, requirements, ambiguity and project meaning, while using SotuRail capabilities for bounded access, structured outputs, evidence and verification.

## Responsibility split

| Layer | Owns |
| --- | --- |
| AI agent / Semantic Worker | intent understanding, semantic classification, ambiguity detection, questions, synthesis, candidate impact/claims/decisions, capability selection |
| SotuRail trust core | capability contracts, schemas, WorkspaceGuard, provenance, freshness, policy, budgets, evidence states, readiness and authority gates |
| Deterministic tools | Git/filesystem facts, hashes, schemas, exit codes, test/CI results, package metadata, exact structured parsing |
| Structural/dependency providers | optional code graph, LSP/AST facts, dependency documentation, retrieval or transformation |
| Host adapter | projects canonical capabilities/skills into the format a verified host can consume |
| Human | approvals, unresolved product decisions, risk acceptance and final authority where required |

The AI may infer. It may not self-award `verified`, `current`, `approved` or `ready`.

## Multi-surface capability model

A SotuRail feature should have one canonical capability identity and may be exposed through several surfaces:

```text
                  Capability Registry
                         |
             Canonical Capability Descriptor
                         |
        +----------------+----------------+
        |                |                |
      Skill             MCP              CLI
        |                |                |
        +---------- SDK / artifacts ------+
                         |
                    Agent / human
```

A surface is a projection, not a second implementation.

Example:

```text
structural.impact
  -> Skill teaches when/why to use it
  -> MCP exposes a typed tool when appropriate
  -> CLI supports humans/CI/debug
  -> provider supplies structural facts
  -> Semantic Worker interprets facts in task context
  -> SotuRail records provenance/freshness/evidence
```

## Agent Skills as the primary agent-facing workflow surface

Current Agent Skills conventions use a directory with `SKILL.md`, concise discovery metadata and optional scripts/references/assets. Hosts load skills progressively: lightweight metadata first, full instructions only when selected, and supporting resources on demand.

SotuRail should align with that model rather than invent a private skill runtime.

Canonical SotuRail skill concepts:

```text
soturail-core
soturail-change
soturail-debug
soturail-review
soturail-security
soturail-research
soturail-knowledge
soturail-release
```

Start small. A large catalog is a context and routing liability.

### Progressive disclosure

Level 1 — discovery:

- skill name;
- concise description;
- when to use / when not to use;
- optional path/scope metadata where the host supports it.

Level 2 — `SKILL.md`:

- workflow;
- required inputs;
- capability names;
- safety constraints;
- expected structured outputs;
- verification/completion rules.

Level 3 — on-demand resources:

- references;
- schemas;
- examples;
- scripts;
- templates;
- provider-specific notes.

The Core Skill should teach only the common loop:

```text
discover -> select -> act -> verify
```

It must not paste the entire SotuRail manual into every agent context.

## Capability Descriptor v2

The canonical descriptor should be machine-stable and language-neutral. Illustrative shape:

```yaml
id: structural.impact
schemaVersion: soturail.capability.v2

purpose:
  semanticKey: structural_impact

inputs:
  target:
    type: symbol-or-path

outputs:
  artifact: soturail.impact.v1

surfaces:
  skill: true
  mcp: true
  cli: true

providers:
  class: StructuralProvider
  optional:
    - native-lite
    - codebase-memory
    - code-review-graph
    - graphify

permissions:
  filesystemRead: workspace
  filesystemWrite: none
  network: optional

trust:
  provenanceRequired: true
  freshnessRequired: true
  agentResultState: candidate

localization:
  machineSemantics: locale-independent
  preserveSource: true
```

Human descriptions may be localized. IDs, enums and schemas must not change with locale.

## Semantic Worker contract

The active coding agent is the Semantic Worker. It can be Claude, Codex, Cursor, Gemini, Kimi-compatible/generic or another capable host.

SotuRail provides:

- user task;
- available capabilities;
- current workspace/run identity;
- active contracts;
- policy constraints;
- evidence requirements;
- output schemas;
- selected context or references.

The Semantic Worker may:

- interpret requirements;
- identify concepts;
- classify candidate rules;
- detect ambiguity;
- ask questions;
- select capabilities;
- combine provider results;
- propose impact;
- summarize evidence;
- produce candidate claims/decisions.

It must return structured candidates, for example:

```json
{
  "kind": "candidate_claim",
  "statementOriginal": "Um pagamento não pode ser processado duas vezes.",
  "sourceRefs": ["docs/payments.md#L42-L48"],
  "confidence": "high",
  "verificationState": "unverified"
}
```

SotuRail then applies source, freshness, schema and evidence rules before any stronger state is possible.

## Language-neutral semantics

Core semantics must never depend on English words.

Bad authority:

```text
if text contains "failed" => failed
if text contains "business rule" => business_rule
```

Preferred order:

```text
structured machine signal
-> protocol/schema result
-> exit/status/error code
-> exact tool parser
-> semantic worker interpretation
-> textual heuristic only as bounded fallback
```

### Language model

When known, artifacts may record:

```yaml
locale:
  user: pt-BR
  project: mixed
  source: pt-BR
  output: pt-BR
```

Unknown locale must remain valid.

Rules:

- preserve original source text;
- translations are derived views, never replacement evidence;
- preserve exact code identifiers, paths and commands;
- protocols use stable IDs/enums, not translated values;
- Unicode paths and mixed-language repositories are first-class;
- semantic providers declare language limitations/capabilities;
- no mandatory LLM translation step in deterministic critical paths.

## Skill selection and routing

The primary v1.6 routing mechanism is the agent itself:

1. host receives concise available-skill metadata;
2. agent selects the relevant skill(s) from the task;
3. selected skill references canonical SotuRail capabilities;
4. capabilities resolve to native or optional providers;
5. outputs return as structured artifacts;
6. proof/evidence gates remain SotuRail-owned.

The v1.5 keyword-based `skills suggest/route` implementation can remain as:

- offline fallback;
- debugging aid;
- compatibility behavior;
- benchmark baseline.

It must not be treated as language-neutral semantic authority.

## CLI role after v1.6

CLI remains supported and important for:

- humans;
- CI;
- administration;
- diagnostics;
- scripting;
- deterministic fallback;
- recovery.

For AI agents, the preferred surfaces become:

```text
Skill + MCP + structured artifacts + capability discovery
```

An agent should not need to memorize dozens of CLI commands before it can use SotuRail correctly.

## Providers remain implementation details

A Skill consumes capabilities, not vendors.

```text
soturail-change
      |
      +-- dependency.docs -> DependencyDocsProvider -> Context7/official docs/other
      +-- structural.impact -> StructuralProvider -> native/CBM/CRG/Graphify
      +-- evidence.verify -> SotuRail trust core
```

Changing a provider must not require rewriting the Skill workflow.

## Current v1.5 debt this architecture addresses

The current implementation is useful but exposes several constraints that must be treated as migration targets, not permanent architecture:

- `skill-routing.ts` ranks natural-language tasks using keyword scoring;
- routing policy strings are tied to a fixed set of expert names;
- `SkillTargetSchema` hardcodes a small host list;
- safety pattern lists include English command/text examples;
- `skill.yml` and generated exports predate the now-broader cross-agent `SKILL.md` conventions;
- capability descriptions are human English strings rather than locale-independent semantic descriptors;
- agent hosts can receive exported material without a single canonical capability-to-skill binding contract.

Do not delete safety behavior merely because it is heuristic. Replace or demote it with explicit tests and compatible migration.

## Compatibility with current Agent Skills practice

Design references reviewed for this architecture:

- OpenAI Skills documentation: https://openai.com/academy/skills/
- OpenAI developer Skills documentation: https://developers.openai.com/docs/build-skills
- Anthropic Agent Skills architecture: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Cursor Agent Skills documentation: https://cursor.com/docs/skills

The portable contract should depend only on verified common structure. Host-specific directories, optional metadata or invocation syntax belong in adapters.

## Non-goals

v1.6 does not require:

- SotuRail to host a model;
- SotuRail to become a full coding agent;
- a parser for every framework/domain/language;
- mandatory embeddings or vector DB;
- a mandatory graph engine;
- a private skill format that agents cannot read;
- automatic trust in model output;
- claiming native support for an agent host without fixtures.

## Evaluation

The new surface is successful only if agents use it correctly on real tasks.

Evaluate:

- correct skill selection;
- correct capability selection;
- required facts recalled;
- unsupported assumptions avoided;
- evidence/readiness discipline preserved;
- multilingual task handling;
- mixed-language project handling;
- context/token overhead;
- tool-call count;
- turns to accepted outcome;
- wall time;
- failure/recovery behavior.

A shorter prompt is not a success if correctness falls.

Related: [Verified Control Plane](verified-control-plane.md), [Provider Architecture](provider-architecture.md), [Context Architecture](context-architecture.md), [Skill Rail](../rails/skills/skill-rail.md), and [v1.6 Master Prompt](../roadmap/v1.6.0-agent-native-semantic-control-plane-master-prompt.md).
