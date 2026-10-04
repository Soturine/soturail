# SotuRail

[![npm](https://img.shields.io/npm/v/soturail)](https://www.npmjs.com/package/soturail)
[![CI](https://github.com/Soturine/soturail/actions/workflows/ci.yml/badge.svg)](https://github.com/Soturine/soturail/actions/workflows/ci.yml)
[![Security](https://github.com/Soturine/soturail/actions/workflows/security.yml/badge.svg)](https://github.com/Soturine/soturail/actions/workflows/security.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

**SotuRail is a local-first, agent-native engineering control plane for AI-assisted software development.**

It sits beside coding agents such as Claude Code, Codex, Cursor and Gemini CLI. The agent handles semantic work — understanding the task, project vocabulary, requirements and ambiguity — while SotuRail keeps the engineering state inspectable and verifiable: capabilities, workspace identity, contracts, provenance, freshness, evidence, policy and readiness.

```text
AI understands.
SotuRail organizes, constrains and proves.
```

SotuRail is **not another coding agent**, a model gateway, a cloud backend or an autonomous shell runtime. It is the engineering rail around the agent.

## What problem does it solve?

AI coding agents can reason well, but an agent saying _“tests passed”_, _“this evidence is current”_ or _“the change is ready”_ should not automatically make that true.

SotuRail separates semantic reasoning from verifiable engineering state:

```text
User request
   ↓
AI agent / Semantic Worker
   ↓
portable Skill
   ↓
capability discovery
   ↓
native facts / providers / project sources
   ↓
candidate artifacts
   ↓
provenance + freshness + policy + evidence
   ↓
readiness
```

The agent may infer, explain and propose. SotuRail decides whether the relevant evidence is current and whether the change is actually ready to advance.

## Typical use cases

SotuRail is useful when you want an AI coding agent to work with more discipline across a real repository, for example:

- implement a feature without losing track of scope and acceptance criteria;
- debug a regression and retain reproducible evidence;
- review a change against recorded checks rather than model confidence;
- keep project knowledge source-backed and freshness-aware;
- expose a small, self-describing capability surface to an agent through MCP;
- reuse the same engineering workflow across Claude Code, Codex, Cursor, Gemini CLI and generic Agent Skills hosts;
- preserve a clear boundary between AI-generated candidates and verified facts;
- prepare releases with explicit human approval and reproducible artifacts.

## Install

SotuRail v1.6 requires **Node.js 22 or newer**.

Install globally:

```bash
npm install -g soturail
soturail --version
```

Or run it without a global install:

```bash
npx soturail@latest --help
```

The portable implementation is TypeScript/Node.js. Rust is optional and used only where benchmarked native acceleration is justified.

## 5-minute quickstart

### 1. Initialize SotuRail in a project

From the repository root:

```bash
soturail init
soturail doctor
soturail index
```

Runtime state is kept locally under:

```text
.soturail/
```

SotuRail does not require a hosted workspace, account or mandatory cloud service for its normal local workflow.

### 2. Install the portable Skills for your agent

Claude Code:

```bash
soturail skills export --target claude --layout portable --install
```

Codex:

```bash
soturail skills export --target codex --layout portable --install
```

Cursor:

```bash
soturail skills export --target cursor --layout portable --install
```

Gemini CLI:

```bash
soturail skills export --target gemini --layout portable --install
```

Unknown or unverified host:

```bash
soturail skills export --target generic --layout portable --install
```

Verified v1.6 project projections:

| Host | Skill directory |
|---|---|
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` |
| Cursor | `.agents/skills/` |
| Gemini CLI | `.agents/skills/` |
| Other / unverified hosts | generic portable projection |

### 3. Talk to the agent normally

You do **not** need to translate your work into SotuRail CLI commands.

Examples:

```text
"Corrija a regressão de login e verifique o que pode ser afetado."

"Review this change and only call it ready if the required evidence is current."

"Analise esses requisitos e separe fatos, hipóteses e perguntas em aberto."

"Prepare a release, mas não publique nada sem minha aprovação."
```

The agent can discover the relevant SotuRail Skills and capabilities instead of memorizing the whole CLI.

### 4. Inspect discovery manually when needed

For humans, CI or debugging:

```bash
soturail skills discover
soturail capabilities list
soturail capabilities describe context.select
```

MCP-capable agents can use the typed discovery surface:

```text
soturail.skills.list
soturail.capabilities
```

## Core concepts

### Skills

Skills are portable operating procedures for agents. They explain **when and how** to use SotuRail capabilities without duplicating the implementation.

SotuRail v1.6 ships eight bundled Skills:

| Skill | Purpose |
|---|---|
| `soturail-core` | Base discover → select → act → verify workflow |
| `soturail-change` | Controlled software changes |
| `soturail-debug` | Reproduce, diagnose and fix failures |
| `soturail-review` | Review changes against contracts and evidence |
| `soturail-security` | Security-sensitive engineering work |
| `soturail-research` | Research with provenance and source separation |
| `soturail-knowledge` | Source-backed project knowledge |
| `soturail-release` | Release qualification and irreversible-action boundaries |

They use progressive disclosure:

```text
Level 1: name + description
          ↓
agent decides relevance

Level 2: selected SKILL.md
          ↓
workflow + capability bindings

Level 3: references / scripts / assets
          ↓
loaded only when required
```

### Capabilities

Capabilities are stable, self-describing contracts. They describe what SotuRail can do independently of a specific host UI.

A capability can describe:

- stable machine ID;
- purpose;
- typed inputs and outputs;
- Skill / MCP / CLI surfaces;
- required permissions;
- side effects;
- evidence/freshness requirements;
- provider class and availability;
- fallback behavior;
- trust rules.

Examples:

```text
context.select
evidence.verify
contract.verify
semantic.candidate.record
structural.impact
dependency.docs
```

A declared capability can also be explicitly `unavailable`. SotuRail prefers an honest unavailable state over pretending that an integration exists.

### Semantic Worker

The active coding agent acts as the **Semantic Worker**.

The agent is responsible for contextual meaning:

- understanding natural-language intent;
- interpreting requirements;
- recognizing project/domain vocabulary;
- identifying ambiguity;
- selecting relevant Skills/capabilities;
- combining source/provider results;
- proposing claims, impacts, decisions and questions.

SotuRail records semantic output as **candidate artifacts**. A model-generated candidate does not become a verified fact just because the model is confident.

### Evidence and trust

SotuRail owns objective trust transitions.

```text
AI interpretation
      ↓
candidate / assertion
      ↓
source + workspace binding
      ↓
recorded evidence / human attestation
      ↓
freshness + policy
      ↓
readiness
```

Protected states such as `verified`, `current`, `approved` and `ready` cannot be self-awarded by a Semantic Worker.

### Change Contracts

A Change Contract records the engineering intent of a change:

- title and intent;
- scope;
- risk;
- acceptance criteria;
- required checks;
- evidence requirements;
- relevant sources.

Example:

```bash
soturail contract create docs-refresh \
  --title "Refresh docs" \
  --intent "Keep project documentation current" \
  --criterion "docs check passes" \
  --check "npm run docs:check" \
  --criterion-check "npm run docs:check"
```

After making the change, run the required check through SotuRail:

```bash
soturail run -- npm run docs:check
soturail contract verify .soturail/contracts/docs-refresh.json
```

The contract creation fingerprint remains immutable provenance. Readiness is evaluated against **current** recorded evidence, so normal implementation work does not make the contract permanently stale.

If the contract foundation changes — for example its scope, declared sources or contract content — create a recorded revision instead of silently rewriting history.

### Human attestations

Caller flags do not grant trust by themselves.

Assertions such as:

```text
--check-passed
--criterion-passed
--runtime-evidence
--independent-review
--human-approved
```

do not satisfy readiness without corroboration.

Objective requirements use current recorded executions. Human/manual decisions use explicit interactive attestation receipts tied to the contract revision and current workspace.

## Architecture

The public mental model is intentionally small:

```text
                         ┌──────────────────────┐
User / developer ───────▶│ AI agent             │
                         │ Semantic Worker       │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Portable Skills      │
                         │ progressive loading  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Capability Registry  │
                         │ self-describing API  │
                         └───────┬───────┬──────┘
                                 │       │
                     ┌───────────┘       └────────────┐
                     ▼                                ▼
           ┌──────────────────┐             ┌──────────────────┐
           │ Native facts     │             │ Optional         │
           │ Git / FS / tests │             │ providers        │
           │ schemas / hashes │             │ docs / structure │
           └─────────┬────────┘             └─────────┬────────┘
                     └──────────────┬──────────────────┘
                                    ▼
                         ┌──────────────────────┐
                         │ Structured artifacts │
                         │ candidates / runs    │
                         │ contracts / evidence │
                         └──────────┬───────────┘
                                    ▼
                         ┌──────────────────────┐
                         │ SotuRail trust core  │
                         │ provenance           │
                         │ freshness            │
                         │ policy               │
                         │ authority/readiness  │
                         └──────────────────────┘
```

A useful rule of thumb:

| Concern | Owner |
|---|---|
| Meaning, intent, ambiguity, semantic interpretation | AI agent |
| Procedure | Skill |
| Stable operation contract | Capability |
| Specialized optional implementation | Provider |
| Git/filesystem/hash/schema/test facts | deterministic tools |
| Provenance/freshness/evidence/readiness | SotuRail |
| Product decisions and explicit approval | Human |

## Main feature areas

| Area | What SotuRail provides |
|---|---|
| **Agent Skills** | portable Skills, progressive disclosure, task-oriented procedures |
| **Capability discovery** | self-describing capability catalog across MCP/CLI/Skills |
| **Context** | progressive repo reading, bounded context artifacts, explicit degradation |
| **Change Contracts** | scope, criteria, risk, evidence requirements and revision lineage |
| **Evidence** | recorded command executions tied to the current workspace |
| **Workspace integrity** | guarded paths, fingerprints, source/workspace binding |
| **Artifacts** | canonical registry/store/envelopes, lineage and freshness |
| **Governance** | capability metadata, Authority Gate, Readiness Gate, capability epochs |
| **Execution integrity** | exact-digest Execution Envelope |
| **Knowledge** | source-backed local knowledge and stale-state handling |
| **MCP** | official SDK, typed bounded tools/resources, capability discovery |
| **Host adapters** | canonical host facts plus portable projections |
| **Evaluation** | deterministic fixtures, regressions and benchmark infrastructure |
| **Release engineering** | release checks, package verification, SBOM/checksums/provenance workflow |

## MCP

SotuRail includes a local MCP server over stdio using the official TypeScript SDK.

Start it manually:

```bash
soturail mcp serve --transport stdio
```

Useful diagnostics:

```bash
soturail mcp doctor
soturail mcp manifest
soturail mcp smoke
soturail mcp exposure
```

Important agent-discovery tools:

```text
soturail.skills.list
soturail.capabilities
soturail.candidates.record
```

Security defaults:

- no arbitrary shell execution through MCP;
- no `soturail.run` MCP tool by default;
- raw-log expansion remains redacted for MCP callers;
- tool exposure must come from a capability descriptor;
- recording a semantic candidate never verifies it.

## Natural-language and multilingual behavior

SotuRail's core machine semantics do not depend on English keyword matching.

The same capability IDs can be used when:

- the user writes in Portuguese;
- source code uses English identifiers;
- requirements are in Spanish;
- documentation is mixed-language;
- paths contain accents, emoji or Japanese characters;
- provider output uses another language.

Original source text is preserved. Translation/localization is a derived presentation and never replaces the original source as evidence.

The legacy lexical router remains only as a labeled `heuristic-fallback`, not the primary semantic authority.

## CLI: useful, but not the agent UX

v1.6 is **agent-first, not CLI-less**.

The CLI is primarily useful for:

- humans;
- CI;
- deterministic automation;
- diagnostics;
- administration;
- recovery;
- release workflows;
- hosts without a richer Skill/MCP surface.

A few common commands:

```bash
# repository/context
soturail init
soturail index
soturail read README.md --query "architecture"

# discovery
soturail skills discover
soturail capabilities list

# diagnostics
soturail doctor
soturail mcp smoke
soturail self architecture --check

# evidence
soturail run -- npm test
soturail evidence report

# release qualification
soturail release check
```

See [v1.6 command reference](docs/reference/commands/v1.6-commands.md) for the current additions and the stable command docs for the wider CLI surface.

## Example workflows

### Feature work

```text
User:
"Adicione OAuth e verifique os riscos de segurança."

Agent:
1. loads soturail-core + soturail-change + soturail-security
2. discovers available capabilities
3. inspects project context and sources
4. records unresolved assumptions as candidates
5. creates/uses a Change Contract
6. implements the change
7. runs required checks
8. SotuRail evaluates current evidence/readiness
```

If a future capability such as `dependency.docs` is unavailable, that state is visible instead of silently replaced with fabricated certainty.

### Debugging

```text
User:
"O login começou a falhar depois dessa mudança."

Agent:
1. loads soturail-debug
2. reproduces the failure
3. records evidence
4. proposes candidate causes
5. edits the code
6. reruns the relevant checks
7. only current evidence may satisfy readiness
```

### Review

```text
User:
"Revise esse PR e veja se pode avançar."

Agent:
1. loads soturail-review
2. reads contract/scope/evidence
3. compares the change with current evidence
4. separates observations from assumptions
5. reports blockers
6. readiness remains a SotuRail decision, not model confidence
```

## Local project state

SotuRail stores generated runtime state under `.soturail/`.

Typical categories include:

```text
.soturail/
├─ artifacts / indexes / context
├─ contracts
├─ evidence / runs
├─ knowledge / memory
├─ policy / governance
├─ reports / evaluations
└─ host / MCP projections
```

Exact internal paths are resolved by the canonical artifact/workspace registry. Do not build integrations by guessing private paths when a public command, artifact or capability exists.

## Scope and non-goals

SotuRail intentionally does **not** try to become:

- another Claude/Codex-style coding agent;
- a mandatory model provider;
- a general LLM proxy/router;
- a hosted developer workspace;
- an OS/container sandbox;
- a secret manager;
- a mandatory vector database;
- a mandatory graph database;
- a giant MCP marketplace;
- a framework-specific semantic-rule engine;
- an autonomous publish/deploy loop.

The architecture favors replaceable providers and optional integrations over mandatory infrastructure.

## Current provider status

The capability model can declare external/provider-backed capabilities before an implementation is installed.

In v1.6:

- `structural.impact` is declared **unavailable** until a StructuralProvider is implemented;
- `dependency.docs` is declared **unavailable** until a DependencyDocsProvider is implemented.

This is intentional: capability discovery should expose the real state of the system.

## Security model

SotuRail is a **guardrail, not a sandbox**.

Implemented boundaries include:

- `WorkspaceGuard` for caller-controlled filesystem paths;
- canonical artifact storage and lineage;
- workspace/source fingerprints;
- explicit stale-state handling;
- Authority and Readiness as separate gates;
- exact-digest Execution Envelopes;
- redacted raw-log behavior;
- bounded MCP exposure;
- interactive human attestation for manual approval/review;
- dependency audit, CodeQL, SBOM and release provenance in the project release process.

SotuRail still depends on the host, operating system and external services for actual process isolation, credential security and external-side-effect enforcement.

See the [Threat Model](docs/security/threat-model.md).

## Compatibility and legacy

v1.6 keeps the v1.5 public compatibility surface where a minor release cannot safely remove it.

Examples:

- older Skill packs can still be adapted/migrated;
- flat Skill export is deprecated in favor of portable Skill directories;
- `gemini-legacy` remains a compatibility alias with a v2.0 removal target;
- legacy MCP negotiation remains where required by the published compatibility contract.

Historical docs and release notes remain in the repository as history; they are not the recommended v1.6 workflow.

## Known limitations

Current limitations are documented instead of hidden:

- StructuralProvider and DependencyDocsProvider are not implemented yet;
- deterministic CI fixtures prove the bundled Skill catalog can satisfy the tested scenarios, but agent-real selection scoring remains a separate evaluation;
- human attestation can verify an interactive approval flow but cannot cryptographically prove a specific physical human was at the keyboard;
- prompt-injection phrase scanning is currently English-focused and non-exhaustive;
- SotuRail does not prove behavior in an external production system unless that observation is captured as evidence.

## Documentation

Recommended entry points:

- [Quickstart](docs/getting-started/quickstart.md)
- [Usage](docs/getting-started/usage.md)
- [First Real Workflow](docs/getting-started/first-real-workflow.md)
- [v1.6 Commands](docs/reference/commands/v1.6-commands.md)
- [Agent-Native Semantic Architecture](docs/architecture/agent-native-semantic-architecture.md)
- [Verified Control Plane](docs/architecture/verified-control-plane.md)
- [Contracts and Verification](docs/architecture/contracts-and-verification.md)
- [Provider Architecture](docs/architecture/provider-architecture.md)
- [Skills](docs/rails/skills/skill-rail.md)
- [MCP](docs/rails/hosts/mcp.md)
- [Threat Model](docs/security/threat-model.md)
- [Roadmap](ROADMAP.md)
- [v1.6 Release Notes](docs/releases/RELEASE_NOTES_v1.6.0.md)
- [Português](docs/pt-BR/)

For release-by-release history, use [CHANGELOG.md](CHANGELOG.md) and [release notes](docs/releases/).

## Development

```bash
npm ci
npm run build
npm run typecheck
npm test
npm run docs:check
npm audit
node dist/cli.js mcp smoke
node dist/cli.js self architecture --check
npm run release:check
```

Optional native validation:

```bash
cargo test --manifest-path native/soturail-native/Cargo.toml
```

## Project direction

Post-v1.6 work focuses on adding **evidence-producing capabilities**, not duplicating semantic reasoning that the agent already performs well.

Near-term directions include:

- StructuralProvider / impact analysis;
- DependencyDocsProvider;
- richer Evidence Receipts and re-attestation;
- Context Spine / escalation;
- knowledge drift propagation;
- optional local indexes/providers when benchmarks justify them.

See [ROADMAP.md](ROADMAP.md).

## License

Apache-2.0. See [LICENSE](LICENSE).
