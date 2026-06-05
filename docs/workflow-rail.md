# Workflow Rail

Workflow Rail is SotuRail's local task state system. It stores auditable workflow artifacts under `.soturail/workflows/` and can optionally plan local Git worktree isolation.

## Commands

v0.7.0 adds phase-oriented Workflow Rail 2.0 commands while keeping the older v0.4 workflow commands:

```bash
soturail workflow setup
soturail workflow plan "Implement feature"
soturail workflow work --note "Implemented the first slice"
soturail workflow review --all
soturail workflow verify
soturail workflow evidence <id>
soturail workflow diagram <id>

soturail workflow new "Implement feature"
soturail workflow list
soturail workflow show <id>
soturail workflow start <id> --worktree --dry-run
soturail workflow status <id>
soturail workflow close <id>
soturail workflow cleanup --closed --dry-run
```

## State Machine

Workflows use explicit states:

- `draft`
- `planned`
- `active`
- `verifying`
- `ready_for_review`
- `closed`
- `blocked`

## Storage

Workflow Rail writes local JSON, YAML and Markdown only:

```txt
.soturail/workflows/
  index.json
  current.json
  templates/
  <id>/
    workflow.yml
    plan.md
    plan.json
    tasks.md
    verification.md
    work.md
    review.md
    review.json
    verify.md
    verify.json
    logs/
```

## Workflow Rail 2.0 Phases

The v0.7.0 loop is:

```txt
setup -> plan -> work -> review -> verify -> evidence
```

`workflow setup` creates the local scaffold and template folder.

`workflow plan "title"` creates a workflow, marks it planned and writes a machine-readable `plan.json` with tasks, acceptance gates, role packs, context routes, linked run workspace if available and evidence path.

`workflow work` marks the active phase and appends a progress note to `work.md`. It links current changed-file counts, raw IDs and harness failures where available.

`workflow review --all` writes deterministic review reports without requiring an LLM:

```txt
security
docs
tests
release
context
agent-readiness
```

`workflow verify` aggregates safe local evidence. It does not publish, release, run destructive commands or invent pass/fail claims for checks that were not recorded.

`workflow evidence <id>` writes a Markdown evidence pack under `.soturail/reports/`.

## Verification And Evidence

Verification connects:

- harness contract status;
- policy queue and decision status;
- evidence completeness;
- Diagram Rail validation status;
- evaluation report status;
- release notes path when package metadata is present.

Evidence packs include:

- workflow metadata and state;
- Project Brain profile and claim/gap/stale counts when available;
- plan, task, review and verify paths;
- run workspace pointers where available;
- command raw IDs and offload IDs;
- changed files and filesystem evidence pointers;
- policy decisions;
- harness failures and contract status;
- diagram validation result;
- evaluation report result;
- release notes path under `docs/releases/`;
- release gates and publish checklist notes.
- latest benchmark report path when available;
- native candidate report path when available;
- baseline snapshot report path when available;
- engine status and TypeScript fallback note.
- unified status, local report, dashboard, observability and read-only MCP report resource paths when available.

SotuRail does not claim build, test, audit, npm pack, publish or GitHub release success unless those results exist as local evidence.

v0.9.0 also lets workflow evidence point to performance readiness:

```bash
soturail bench run --suite brain
soturail native candidates
soturail self baseline --check
soturail workflow evidence <id>
```

Native speedups are not claimed from workflow evidence alone. The evidence pack only records where the local benchmark and candidate reports live.

## Worktrees

`soturail workflow start <id> --worktree --dry-run` prints a local worktree plan. If run without `--dry-run` inside a Git repository, SotuRail may create a local worktree under `.soturail/worktrees/<id>/`.

Safety rules:

- SotuRail does not push.
- SotuRail does not merge.
- SotuRail does not delete user work without explicit confirmation.
- Rollback instructions are printed when worktrees are planned.

## Diagram Integration

Diagram Rail adds visual contracts to Workflow Rail:

```bash
soturail workflow diagram <id>
soturail diagram from-workflow <id>
soturail diagram validate
```

Generated workflow diagrams live under `docs/diagrams/` and have matching `.spec.md` visual contracts. They make state transitions explicit; they do not replace tests or review.

## Future Directions

Future Workflow Rail work can add richer trace/report commands, deeper task generation, issue integration and release-specific templates. The boundary stays the same: SotuRail prepares local context, evidence and safety rails, while the agent host owns the editing runtime.

## Project Brain Integration

v0.8.0 lets Workflow Rail evidence reference Project Brain status. A workflow evidence pack can show the local brain profile path, claim count, gap count and stale-event count.

v0.8.1 adds stronger workflow evidence hints:

- brain suspect/stale count;
- latest brain doctor path when available;
- repair-plan flow for stale claims that affect release or workflow evidence.

Useful flow:

```bash
soturail brain scan
soturail brain stale --repair-plan
soturail brain doctor --repair-plan
soturail workflow verify
soturail workflow evidence <id>
```

This keeps workflow claims tied to source-backed knowledge rather than chat memory.

## v0.10.0 Report Evidence

Workflow evidence can now point to:

```txt
.soturail/status/latest.json
.soturail/reports/latest.json
.soturail/reports/latest.html
.soturail/dashboard/index.html
.soturail/observability/timeline.json
.soturail/mcp/report-resources.json
```

These are still local artifacts. Workflow evidence does not upload telemetry and does not require a dashboard server.

## Related Harness And Multi-Agent Workflow Docs

Workflow Rail is the natural parent for the newer harness/session/task planning docs:

- [`harness-lifecycle-rail.md`](harness-lifecycle-rail.md): instructions, state, verification, scope and session handoff.
- [`multi-agent-workflow-templates.md`](multi-agent-workflow-templates.md): researcher, analyst, writer, verifier and reviewer role-pack templates.
- [`evidence-provenance-rail.md`](evidence-provenance-rail.md): workflow evidence sidecars and verification status.
- [`agent-governance-rail.md`](agent-governance-rail.md): trace, ledger and approval records for long-running workflows.
- [`resilience-rail.md`](resilience-rail.md): retry/fallback/rate-limit policy notes for workflows that depend on external agent/model providers.

These docs should keep SotuRail as the workflow/handoff/evidence layer. They should not turn it into a CrewAI, LangGraph or autonomous agent runtime.
