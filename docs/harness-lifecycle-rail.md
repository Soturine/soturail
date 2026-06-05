# Harness Lifecycle Rail

Harness Lifecycle Rail expands Harness Rail around five subsystems:

```txt
Instructions
State
Verification
Scope
Session Lifecycle
```

The purpose is to keep coding agents in scope across sessions and prevent premature "done" states.

## Proposed Commands

```bash
soturail harness init
soturail harness audit
soturail harness benchmark
soturail session start
soturail session verify
soturail session handoff
soturail session end
soturail feature add "Improve Codex export"
soturail feature start "Improve Codex export"
soturail feature done "Improve Codex export" --evidence test-report
```

## Generated Files

```txt
.soturail/harness/
  AGENTS.md
  instructions.md
  verification.md
  scope.md
  lifecycle.md
.soturail/state/
  feature_list.json
  progress.md
  session-handoff.md
.soturail/evidence/
  test-results.json
```

## Feature List

Feature lists prevent agents from doing ten tasks and finishing none.

```json
{
  "active": "codex-adapter",
  "features": [
    {
      "id": "codex-adapter",
      "status": "in_progress",
      "definition_of_done": [
        "Export is generated",
        "JSON artifacts parse",
        "Docs are updated",
        "Golden checks pass"
      ],
      "evidence": []
    }
  ]
}
```

## Progressive Disclosure

Root agent docs should stay short and point to specialized docs.

```txt
Read first: .soturail/harness/AGENTS.md
If editing tests: .soturail/harness/verification.md
If continuing work: .soturail/state/session-handoff.md
If preparing release: docs/release-workflow.md
```

## Non-Goals

- no Claude-only harness;
- no mandatory shell execution;
- no giant root instruction file;
- no acceptance without evidence.
