# Skill Rail

Skill Rail packages SotuRail operating procedures for AI agents. v1.6 changes the design goal from "export a prompt file for a host" to **make SotuRail discoverable and usable by agents through portable Skills backed by canonical capabilities**.

Current v1.5 commands remain supported:

```bash
soturail skills init demo-skill
soturail skills list
soturail skills validate
soturail skills suggest --query "publish npm release"
soturail skills route --task "fix failing test"
soturail skills export --target claude
soturail skills export --target codex
soturail skills export --target gemini
soturail skills export --target cursor
soturail skills export --target generic
soturail skills pack --format json
soturail skills pack --format markdown
```

## v1.6 direction

The preferred agent workflow becomes:

```text
task in natural language
        |
agent discovers SotuRail skill metadata
        |
agent loads only relevant SKILL.md
        |
skill references canonical capabilities
        |
agent chooses/uses capabilities
        |
structured candidate artifacts
        |
SotuRail evidence/freshness/readiness
```

The CLI is not removed. It remains a human/CI/debug/fallback surface.

## Portable skill model

SotuRail should align with the common Agent Skills model:

```text
<skill>/
  SKILL.md
  references/     optional
  scripts/        optional
  assets/         optional
  ...SotuRail sidecars when needed
```

`SKILL.md` contains concise discovery metadata plus the workflow. SotuRail-specific metadata should remain compatible sidecar state rather than forcing agents to understand a private skill format.

Host adapters may project the same canonical skill into host-specific directories or metadata. Generic fallback remains mandatory when host-native behavior has not been verified.

## Progressive disclosure

A skill catalog should not flood the prompt.

1. **Discovery** — name + concise description (+ scope/path metadata when supported).
2. **Selected skill** — full `SKILL.md`.
3. **On demand** — references, schemas, examples, scripts and assets.

The Core Skill should teach only:

```text
discover -> select -> act -> verify
```

Detailed domain procedures belong in task skills.

## Initial SotuRail skills

Keep the core catalog small:

- `soturail-core`;
- `soturail-change`;
- `soturail-debug`;
- `soturail-review`;
- `soturail-security`;
- `soturail-research`;
- `soturail-knowledge`;
- `soturail-release`.

More skills require measured need and eval coverage.

## Capability binding

A Skill teaches **when and how** to use a capability. It does not duplicate the capability implementation.

Example:

```text
soturail-change
  uses:
    context.select
    dependency.docs
    structural.impact
    contract.verify
    evidence.verify
```

Those capability IDs remain stable even if providers change.

## Routing

v1.5 `skills suggest/route` uses local keyword scoring. It is useful as an offline fallback and benchmark baseline, but it is not language-neutral semantic authority.

v1.6 primary routing:

1. surface compact skill metadata to the host;
2. let the capable agent choose relevant skills from task semantics;
3. load selected skills progressively;
4. require structured outputs and SotuRail evidence rules;
5. record which skills/capabilities were used for evaluation.

Do not replace one large keyword router with dozens of stack/language-specific routers.

## Language-neutral behavior

Skill machine identity is locale-independent.

A Portuguese, Japanese, Spanish or mixed-language task must be able to select the same canonical capability IDs as an English task.

Rules:

- descriptions may be localized;
- source text is preserved;
- code symbols/paths/commands are never translated silently;
- enums/status IDs remain stable;
- translations are derived views;
- Unicode paths are valid;
- semantic agent output remains `candidate` until proven.

## Safety

Skills may instruct agents, but they do not grant authority.

Keep explicit approval/policy requirements for:

- destructive commands;
- dependency installation;
- external writes;
- npm publish / release creation;
- global configuration writes;
- raw-log disclosure;
- MCP exposure changes;
- secret/credential access.

SotuRail must not assume the host obeyed an exported instruction. Runtime evidence and side-effect verification remain separate.

## Evaluation

Skill evals should test:

- correct trigger/selection;
- correct non-trigger behavior;
- capability choice;
- required evidence;
- multilingual tasks;
- mixed-language projects;
- unsupported assumptions;
- context overhead;
- task correctness;
- recovery from unavailable providers.

See [Skill Rail 2.0](skill-rail-2.md) for the current pack format and [Agent-Native Semantic Architecture](../../architecture/agent-native-semantic-architecture.md) for the v1.6 target.

## Implementation status (v1.6 in progress)

| Piece | Status | Where |
|---|---|---|
| Portable Skill model (`SKILL.md` frontmatter per the Agent Skills specification) | implemented | `src/core/skill-model.ts` |
| Bundled `soturail-core` skill with on-demand `references/` | implemented | `skills/soturail-core/` (shipped in the npm package) |
| Capability bindings (`metadata.soturail-uses`) validated against Capability Descriptor v2 | implemented | `validateSkillModel`, `skillRequirements` |
| v1.5 packs adapted into the same model (no rewrite) | implemented | `loadSkillCatalog` source `legacy-pack` |
| Generic portable export | implemented | `soturail skills export --target generic --layout portable` |
| Task skills: change, debug, review, security, research, knowledge, release | implemented | `skills/soturail-*/` |
| Selection/composition eval fixtures (pt-BR, en, es, ja, mixed, non-trigger) | implemented (data + satisfiability tests) | `tests/fixtures/v160/skill-selection.json` |
| Discovery surfaces, host projections, agent-led routing | planned | later v1.6 checkpoints |

Selection fixtures are scored by agent evaluations; deterministic tests only prove each case is satisfiable by the shipped catalog and does not depend on keyword overlap. Portable skills use the same safety scan as v1.5 packs (`scanSkillText`).

Approval, side-effect and evidence requirements are **derived** from the capabilities a skill uses; a skill does not restate them. Project skills placed in `.agents/skills/<name>/SKILL.md` are loaded into the same catalog.

`--layout flat` (the v1.5 single-file export) remains for compatibility and is scheduled for deprecation once host projections land.
