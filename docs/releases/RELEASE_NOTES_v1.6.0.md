# SotuRail v1.6.0 — Agent-Native Semantic Control Plane (draft)

Status: **draft** — finalized at release qualification. Nothing here is released until the `v1.6.0` tag exists.

```text
AI understands.
SotuRail organizes, constrains and proves.
```

## Highlights

- **Portable Skills.** Eight small `SKILL.md` skills ship in the package, follow the Agent Skills specification and load progressively. Each declares canonical capability bindings; approval, side-effect and evidence requirements are derived from the capabilities, not restated.
- **Self-describing capabilities.** Capability Descriptor v2 projects the unchanged v1 registry plus v2-only capabilities with surfaces, trust/freshness/evidence requirements, provider candidates, availability and localized presentation. MCP `soturail.capabilities` and `soturail.skills.list` let an agent discover everything without CLI knowledge; MCP tools exist only when a capability declares them.
- **Semantic Worker contract.** Agents record claims, impacts, decisions, questions and interpretations as candidates (`soturail.candidates.record`). SotuRail binds them to the workspace and to source digests and rejects self-awarded `verified`/`current`/`approved`/`ready`.
- **Evidence-backed readiness and contract lifecycle.** A contract keeps an immutable baseline while readiness evaluates the current workspace, so the normal create → implement → verify flow can reach `ready`. Foundation, source or scope changes require a recorded revision with lineage. Checks, runtime evidence and objective criteria count only from recorded runs at the current fingerprint; human approval, independent review and manual criteria require interactive human attestation receipts. Caller flags are assertions only.
- **Host adapter registry.** One data record per host; verified skill projections for Claude Code (`.claude/skills`), Codex, Cursor and Gemini CLI (`.agents/skills`); generic fallback for Kimi and other unverified hosts.
- **Language-neutral.** Stable IDs/enums in every locale, original source text preserved byte-for-byte, Unicode paths/identifiers/slugs, and no per-language keyword tables. Keyword routing remains only as a labeled offline fallback.

## Simplification and legacy removal

| Metric | v1.5 | v1.6 |
|---|---:|---:|
| Literal host branches in `src/` | 121 | 7 |
| Copies of the slug algorithm | 10 | 1 |
| Copies of `exists()` | 22 | 1 |
| Dual readers of approved memory | 2 | 0 |
| Dead exports / test-only aliases | 4 | 0 |

Fixed: the workspace fingerprint ignored further edits to an already-modified tracked file (first porcelain entry misparsed), which could keep stale evidence looking current. Also fixed while consolidating: approved memory was duplicated in context packs and stale approvals reappeared through a legacy mirror; exported host docs recommended an unsupported brain export command. Details: [refactor map](../audits/v1.6.0-refactor-map.md), [legacy removal report](../audits/v1.6.0-legacy-removal-report.md).

## Context cost (measured)

Scenario: bundled catalog only, bytes of what an agent must load (UTF-8, `SKILL.md` including frontmatter).

| Scenario | Bytes |
|---|---:|
| Level 1 discovery metadata for all 8 skills (always loaded) | 3,604 |
| Loading every `SKILL.md` and reference eagerly | 20,457 |
| Fix an OAuth regression: L1 + core + change + debug + security | 13,820 |
| Review a pull request: L1 + core + review | 9,438 |
| Release: L1 + core + release | 9,423 |
| MCP capability catalog (all 20 capabilities) | 4,317 |

These measure context loaded, not task success; agent-run selection/outcome evals use `tests/fixtures/v160/skill-selection.json`.

## Compatibility

v1.5 commands, artifacts and MCP clients keep working. See [Migration to v1.6](../getting-started/migration-v1.6.md) for the stricter `contract verify`, the automatic approved-memory migration and deprecations (removal target v2.0.0).

## Known limitations

- `structural.impact` and `dependency.docs` are declared `unavailable`; agents build impact candidates from `repo.index` and reads and cite upstream docs themselves.
- Selection fixtures are scored by agent evaluations; CI checks only that each case is satisfiable and independent of keyword overlap.
- Human attestation relies on an interactive terminal; SotuRail cannot cryptographically prove a human is at that terminal.
- Prompt-injection phrase checks in skill validation are English-only and non-exhaustive.
