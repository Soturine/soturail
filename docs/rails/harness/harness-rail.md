# Harness Rail

Harness Rail makes agent-assisted development more disciplined, auditable and repeatable. It absorbs setup/plan/work/review/release patterns without becoming a Claude-only plugin or autonomous runtime.

## Product Boundary

```txt
SotuRail prepares context, policy, evidence and reports.
The agent still plans, edits, reasons and executes through its own host.
```

Harness Rail focuses on workflow discipline, policy decisions, review evidence, release evidence, failure learning and local handoffs.

## Commands

```bash
soturail harness note "agent said done before tests passed"
soturail harness init
soturail harness audit
soturail session start "objective"
soturail handoff generate
soturail feature list
soturail harness list
soturail harness explain <id>
soturail harness doctor
soturail harness contract init
soturail harness contract check
soturail workflow evidence <id>
```

`harness contract check` validates the local contract. It does not run build, typecheck or test commands by default.

## v1.2.0 Harness Lifecycle

Harness Lifecycle Rail adds safe project-local state for instructions, scope, verification, sessions, handoffs and features. `harness init` preserves existing files by default, and `harness audit` scores lifecycle readiness without executing verification commands.

See [Harness Lifecycle Rail](harness-lifecycle-rail.md) and [Security Boundaries](../../security/security-boundaries.md).

## v0.7.0 Workflow Connection

Harness Rail now connects to Workflow Rail 2.0:

- `harness doctor` reports the active workflow when one exists.
- It reports whether the default harness contract is present.
- It reports the failure count and latest workflow verification status.
- It suggests a prevention action from the latest failure.
- `workflow verify` reads harness contract status.
- `workflow evidence <id>` includes harness failures and contract references.

## Harness Failure Ledger

Repeated agent mistakes should become useful local knowledge instead of disappearing into chat history.

A failure record tracks:

- workflow id when available;
- what failed;
- suspected root cause when supplied;
- evidence path or raw id when supplied;
- prevention candidate.

Prevention candidates include:

```txt
rule
doc
memory
workflow check
diagram/spec update
```

Use `diagram/spec update` when a repeated failure points to a missing visual contract, unclear state transition or stale `.spec.md` file.

## Project Brain Integration

v0.8.0 allows harness notes to become Project Brain bug records or rule candidates during `brain scan`.

Use this flow for repeated agent mistakes:

```bash
soturail harness note "agent skipped release verification" --prevention "workflow check"
soturail brain scan
soturail rules from-brain
```

Harness notes remain local evidence. Brain-derived rules still need review before being treated as policy gates.

v0.8.1 adds repair and consolidation guidance to this loop:

```bash
soturail brain consolidate --dry-run
soturail brain stale --repair-plan
soturail rules doctor
```

If the same harness failure appears multiple times, consolidate duplicate claims first, then derive rules only from verified and fresh sources.

## Review Perspectives

Workflow review reports are deterministic sections rather than vague feedback. v0.7.0 uses:

- **security**: secrets, unsafe permissions, dangerous commands, raw-log risk;
- **docs**: README, focused docs and release notes;
- **tests**: build/typecheck/test evidence and missing checks;
- **release**: version, changelog, release notes and publish gates;
- **context**: selected context, offload recovery and role packs;
- **agent-readiness**: short root docs, policy notes, MCP exposure and handoff readiness.

## Release Evidence

Release evidence should include:

- package version;
- CLI version;
- changelog entry;
- release notes path under `docs/releases/`;
- npm tarball check guidance;
- GitHub tag recommendation;
- npm publish checklist;
- CI status note;
- evaluation report path;
- workflow verification result.

Harness Rail does not publish automatically. Publishing stays an explicit release action.

## Guardrail Relationship

Harness Rail connects to Policy Rail. Risky actions should be explainable and reviewable before they happen.

Examples:

```txt
R01 deny sudo
R02 deny writing .env or secrets
R03 ask before rm -rf
R04 deny git push --force
R05 ask before npm publish
R06 deny --no-verify unless explicitly approved
R07 warn before direct push to main/master
R08 require evidence before release
```

## Acceptance Criteria

Harness Rail is successful only if it makes SotuRail more predictable without making it heavy:

- commands remain local-first;
- risky actions remain dry-run or approval-first;
- evidence is stored locally and recoverable;
- tests cover clean workflow fixtures;
- reports distinguish token savings from quality preservation;
- no arbitrary shell execution is exposed through MCP by default.

## Harness Lifecycle Expansion

Future harness lifecycle work is tracked in [`harness-lifecycle-rail.md`](harness-lifecycle-rail.md).

The expansion adds five explicit subsystems:

```txt
Instructions
State
Verification
Scope
Session Lifecycle
```

The goal is to make `harness init`, `harness audit`, `session start/end`, feature lists and handoff files first-class local artifacts without becoming a Claude-only plugin or autonomous runtime.
