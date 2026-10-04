# SotuRail

[![npm](https://img.shields.io/npm/v/soturail)](https://www.npmjs.com/package/soturail)
[![CI](https://github.com/Soturine/soturail/actions/workflows/ci.yml/badge.svg)](https://github.com/Soturine/soturail/actions/workflows/ci.yml)
[![Security](https://github.com/Soturine/soturail/actions/workflows/security.yml/badge.svg)](https://github.com/Soturine/soturail/actions/workflows/security.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

**SotuRail is a local-first, agent-native engineering control plane for AI-assisted software development.**

It gives coding agents a small, portable Skill surface plus self-describing capabilities, then keeps the important engineering states grounded in workspace facts, provenance, freshness, recorded evidence, policy and readiness.

```text
AI understands.
SotuRail organizes, constrains and proves.
```

SotuRail is **not another coding agent**, model gateway or autonomous runtime. Claude Code, Codex, Cursor, Gemini CLI and other capable agents remain the semantic/execution workers. SotuRail gives them reusable engineering procedures and a verifiable control plane.

## Why SotuRail

Coding agents are good at understanding natural language, project context and ambiguous software tasks. They are much less trustworthy when they self-assert that a check passed, evidence is current, a human approved something, or a change is safe to advance.

SotuRail separates those responsibilities:

| Layer | Responsibility |
|---|---|
| **AI agent / Semantic Worker** | Understand intent, requirements, project/domain meaning, ambiguity and candidate impact |
| **Skills** | Teach reusable procedures and which capabilities to compose |
| **Capabilities** | Stable, self-describing contracts exposed through Skill/MCP/CLI surfaces |
| **Native tools / providers** | Supply objective facts or optional specialized capabilities |
| **SotuRail trust core** | Workspace integrity, provenance, freshness, evidence, policy, authority and readiness |
| **Human** | Product decisions, risk acceptance and explicit approval where required |

The agent may infer. It cannot promote its own output to `verified`, `current`, `approved` or `ready`.

## Install

Requires Node.js 22 or newer.

```bash
npm install -g soturail
soturail --version
```

Or run it without a global install:

```bash
npx soturail --help
```

TypeScript/Node.js is the portable implementation. The Rust crate remains optional and benchmark-gated.

## Agent-first quickstart

The preferred v1.6 experience is **not** making an agent memorize the CLI.

Project SotuRail's portable Skills into the host:

```bash
# Claude Code -> .claude/skills/
soturail skills export --target claude --layout portable --install

# Codex / Cursor / Gemini CLI -> .agents/skills/
soturail skills export --target codex --layout portable --install
soturail skills export --target cursor --layout portable --install
soturail skills export --target gemini --layout portable --install

# Unknown/unverified hosts -> portable generic projection
soturail skills export --target generic --layout portable --install
```

Then talk to the coding agent normally:

```text
"Corrija a regressão de login e verifique o impacto."

"Review this pull request against the recorded evidence."

"Analise os requisitos e registre o que ainda é apenas hipótese."

"Prepare a release, mas não publique nada sem minha aprovação."
```

The agent can discover SotuRail through the Skills and, when MCP is available, through the self-describing capability surface.

## What ships in v1.6

SotuRail v1.6 ships eight portable Skills with progressive disclosure:

| Skill | Purpose |
|---|---|
| `soturail-core` | Common discover → select → act → verify loop |
| `soturail-change` | Implement controlled software changes |
| `soturail-debug` | Reproduce and fix failures |
| `soturail-review` | Review changes against contracts and evidence |
| `soturail-security` | Apply security-sensitive engineering discipline |
| `soturail-research` | Research with provenance and source separation |
| `soturail-knowledge` | Build and maintain source-backed project knowledge |
| `soturail-release` | Qualify releases and preserve irreversible-action boundaries |

Skills are procedures, not duplicated engines. They bind to canonical capabilities and load only what is needed.

## Progressive disclosure

SotuRail avoids eagerly dumping the whole manual into the agent context.

```text
Level 1
name + concise description
        ↓
agent decides relevance

Level 2
selected SKILL.md
        ↓
workflow + capabilities + constraints

Level 3
references / schemas / scripts / assets
        ↓
loaded only when needed
```

The bundled Level-1 catalog is much smaller than eagerly loading every Skill and reference. See the [v1.6 release notes](docs/releases/RELEASE_NOTES_v1.6.0.md) for measured context sizes.

## Self-describing capabilities

Capability Descriptor v2 is the canonical description layer for agent-facing capabilities.

A capability can declare:

- purpose and stable machine ID;
- inputs and output artifact schema;
- Skill / MCP / CLI surfaces;
- permissions and side effects;
- evidence and freshness requirements;
- provider class and availability;
- fallback behavior;
- language/localization metadata;
- allowed trust state for agent/provider output.

This lets the same capability project across multiple surfaces without maintaining a separate truth in every CLI command, MCP tool, Skill and host exporter.

Examples:

```text
context.select
evidence.verify
contract.verify
semantic.candidate.record
structural.impact       # declared unavailable until a provider exists
dependency.docs         # declared unavailable until a provider exists
```

## Semantic Worker model

The active coding agent is the **Semantic Worker**.

It can:

- understand natural-language intent;
- interpret requirements and project vocabulary;
- detect ambiguity and conflicts;
- select relevant Skills/capabilities;
- combine project/provider results;
- propose claims, impacts, decisions and questions.

SotuRail stores those as structured **candidate artifacts**.

```text
AI interpretation
      ↓
candidate claim / impact / decision / question
      ↓
source + workspace binding
      ↓
evidence / freshness / policy
      ↓
verified, stale, blocked, unknown...
```

Model confidence is metadata, not proof.

## Language-neutral by design

SotuRail v1.6 does not use English keyword matching as semantic authority.

The same machine capability IDs apply whether:

- the user asks in Portuguese;
- the code is in English;
- requirements are in Spanish;
- docs are mixed-language;
- paths contain accents or Japanese characters;
- a provider returns content in another language.

Original source text is preserved. Translations are derived views. Paths, symbols, commands, hashes and protocol IDs are never silently translated.

The old lexical/keyword router remains only as a labeled `heuristic-fallback` for compatibility/offline use.

## Evidence-backed Change Contracts

A Change Contract records the engineering intent, acceptance criteria, checks, risk and evidence requirements for a change.

v1.6 separates the **creation baseline** from the **workspace being verified**:

```text
contract created at baseline A
        ↓
implementation changes workspace to B
        ↓
checks run and are recorded at B
        ↓
readiness evaluates current evidence at B
```

The baseline remains immutable provenance; normal implementation does not make the contract permanently stale.

A new revision is required when the contract foundation changes, such as declared sources, scope or contract content. Revisions preserve lineage and supersede older revisions instead of rewriting history.

Caller flags do not grant trust:

- `--check-passed`
- `--criterion-passed`
- `--runtime-evidence`
- `--independent-review`
- `--human-approved`

are assertions only. Required checks and objective criteria need current recorded executions. Human approval, independent review and manual criteria use interactive attestation receipts.

## Trust model

The v1.5 verified-control-plane foundation remains underneath the v1.6 agent-native surface:

| Area | Implemented foundation |
|---|---|
| Workspace integrity | WorkspaceGuard, path/symlink containment |
| Artifact integrity | Artifact Registry, Store, Envelope, lineage |
| Freshness | WorkspaceFingerprint and source/workspace binding |
| Governance | Capability Registry/Epochs, NativeMinimal provider |
| Gates | Authority + Readiness remain distinct |
| Execution | Exact-digest Execution Envelope |
| Context | Hard budgets and explicit truncation/degradation |
| Evidence | Recorded runs and current-workspace verification |
| Release | CI, security, SBOM, checksums and provenance |

SotuRail is a **guardrail, not a sandbox**. OS permissions, credentials, provider security and host authorization remain external enforcement boundaries.

## MCP

The MCP server uses the official SDK and exposes a bounded, typed, capability-mapped surface.

Important v1.6 discovery endpoints include:

```text
soturail.capabilities
soturail.skills.list
```

Agents can discover Skills/capabilities without first learning the CLI.

SotuRail does not expose arbitrary shell through MCP and does not allow caller-controlled raw-log authorization.

## CLI still matters

v1.6 is agent-first, not CLI-less.

The CLI remains the primary surface for:

- humans;
- CI;
- deterministic automation;
- diagnostics;
- administration;
- recovery;
- release workflows.

A manual workflow can still look like:

```bash
soturail index
soturail read README.md --query "product boundary"

soturail contract create docs-refresh \
  --title "Refresh docs" \
  --intent "Keep contracts current" \
  --criterion "docs check passes" \
  --check "npm run docs:check" \
  --criterion-check "npm run docs:check"

# make the change, then record objective evidence
soturail run -- npm run docs:check
soturail contract verify .soturail/contracts/docs-refresh.json
```

Generated runtime state stays under `.soturail/`.

## Host compatibility

Verified portable Skill projections in v1.6:

| Host | Projection |
|---|---|
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` |
| Cursor | `.agents/skills/` |
| Gemini CLI | `.agents/skills/` |
| Other / unverified hosts | generic portable Agent Skills fallback |

Host facts live behind a host-adapter registry instead of being scattered through the core.

## What changed from v1.5

v1.6 is both a feature release and a simplification pass.

| Metric | v1.5 | v1.6 |
|---|---:|---:|
| Literal host branches in `src/` | 121 | 7 |
| Copies of the slug algorithm | 10 | 1 |
| Copies of `exists()` | 22 | 1 |
| Dual readers of approved memory | 2 | 0 |
| Dead exports / test-only aliases | 4 | 0 |

Other important changes:

- portable Agent Skills became the primary agent workflow surface;
- agent semantic selection replaced keyword routing as the intended primary path;
- Capability Descriptor v2 made the capability layer self-describing;
- candidate artifacts separate AI interpretation from verified facts;
- contract readiness now requires recorded current evidence;
- contract baseline and verification freshness are separate;
- human/manual attestations are explicit receipts;
- host-specific branches were consolidated behind adapters;
- approved-memory legacy reads were migrated/deduplicated;
- multilingual/Unicode fixtures became part of v1.6 qualification.

## Known limitations

The project deliberately does **not** pretend unfinished integrations exist.

- `structural.impact` is declared `unavailable` until a StructuralProvider is implemented.
- `dependency.docs` is declared `unavailable` until a DependencyDocsProvider is implemented.
- Agent-real skill-selection scoring is separate from deterministic CI satisfiability fixtures.
- Human attestation relies on an interactive terminal; SotuRail cannot cryptographically prove a human is physically present.
- Skill prompt-injection phrase checks are currently English-focused and non-exhaustive.
- SotuRail is not an OS sandbox or credential broker.

See the [roadmap](ROADMAP.md) for the provider and verification work that follows v1.6.

## Documentation

Start here:

- [Quickstart](docs/getting-started/quickstart.md)
- [v1.6 commands](docs/reference/commands/v1.6-commands.md)
- [Migration to v1.6](docs/getting-started/migration-v1.6.md)
- [v1.6 release notes](docs/releases/RELEASE_NOTES_v1.6.0.md)
- [Agent-Native Semantic Architecture](docs/architecture/agent-native-semantic-architecture.md)
- [Verified Control Plane](docs/architecture/verified-control-plane.md)
- [Contracts and Verification](docs/architecture/contracts-and-verification.md)
- [Provider Architecture](docs/architecture/provider-architecture.md)
- [Skill Rail](docs/rails/skills/skill-rail.md)
- [Threat Model](docs/security/threat-model.md)
- [Implementation Tracker](docs/roadmap/verified-control-plane-implementation-tracker.md)
- [Roadmap](ROADMAP.md)

Historical command/migration documents remain available under `docs/reference/` and `docs/getting-started/`.

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
cargo test --manifest-path native/soturail-native/Cargo.toml
npm run release:check
```

Release tags also produce canonical release artifacts, CycloneDX SBOM, checksums and provenance attestations.

## Project direction

Near-term work after v1.6 focuses on capabilities that add evidence instead of duplicating agent reasoning:

- StructuralProvider / impact analysis;
- DependencyDocsProvider;
- Evidence Receipts and richer re-attestation;
- Context Spine and escalation;
- optional local indexes/providers where benchmarks justify them.

SotuRail intentionally avoids making mandatory:

- a cloud backend;
- a model provider;
- a vector database;
- a graph database;
- a general autonomous coding runtime;
- a huge MCP catalog;
- language/framework-specific semantic-rule engines.

## License

Apache-2.0. See [LICENSE](LICENSE).
