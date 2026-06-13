# Harness Lifecycle Rail

Harness Lifecycle Rail is the implemented v1.2.0 local state layer for carrying agent-assisted work across sessions and hosts without turning SotuRail into an autonomous agent runtime.

It organizes five subsystems:

```txt
Instructions
State
Verification
Scope
Session Lifecycle
```

The purpose is to keep coding agents in scope across sessions and prevent premature "done" states.

## Implemented Commands

```bash
soturail harness init
soturail harness audit
soturail harness audit --json
soturail session start "objective"
soturail session end --summary "completed work"
soturail handoff generate
soturail feature add "feature"
soturail feature start <id>
soturail feature done <id> --evidence tests/example.test.ts
soturail feature list
```

`harness init` creates local files without overwriting existing content:

```txt
.soturail/harness/AGENTS.md
.soturail/harness/instructions.md
.soturail/harness/verification.md
.soturail/harness/scope.md
.soturail/harness/lifecycle.md
.soturail/state/feature_list.json
.soturail/state/progress.md
.soturail/state/session-handoff.md
```

Use `--force` only after reviewing the scaffold files that will be replaced.

## Audit Model

`harness audit` checks Instructions, State, Verification, Scope, Session Lifecycle, Host Compatibility, Evidence/Reports and Security Boundaries. It writes:

```txt
.soturail/harness/audit.json
.soturail/harness/audit.md
```

The audit is deterministic and read-only. It does not run commands from `verification.md`.

## Feature And Session State

Feature lists prevent agents from doing many tasks and finishing none. `feature_list.json` has the stable local shape:

```json
{
  "schemaVersion": "soturail.feature-list.v1",
  "active": null,
  "features": []
}
```

Only one feature can be active. Completion evidence is recorded as paths or local references supplied by the user.

`handoff generate` writes a bounded handoff with the current objective, completed work, changed-file names, verification status, blockers and next steps. It does not read private shell history or run verification automatically.

## Progressive Disclosure

Root agent docs should stay short and point to specialized docs.

```txt
Read first: .soturail/harness/AGENTS.md
If editing tests: .soturail/harness/verification.md
If continuing work: .soturail/state/session-handoff.md
If preparing release: docs/release-workflow.md
```

## Planned Extensions

Commands such as `harness benchmark`, `session verify` and a dedicated `session handoff` alias remain proposed. They are not implemented in v1.2.0.

## Boundaries

- SotuRail prepares lifecycle state and evidence; the agent host still reasons and edits.
- No cloud telemetry, mandatory server or LLM API key is required.
- No destructive MCP tool or arbitrary MCP shell execution is added.
- No Claude-only harness, giant root instruction file or acceptance without evidence.
- See [Security Boundaries](security-boundaries.md), [Harness Rail](harness-rail.md), [Conductor Mode](conductor-mode.md) and [Agent Harness Synthesis](agent-harness-synthesis-2026.md).
