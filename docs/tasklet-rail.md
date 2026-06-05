# Tasklet Rail

Tasklet Rail is a proposed small-task template layer. The Tasklet.ai public site did not expose enough technical detail during review, so SotuRail only absorbs the generic idea of reusable tiny tasks.

## Definition

A tasklet is a small local operating procedure for one common agent task.

Examples:

```txt
review-code
update-docs
generate-tests
prepare-release
fix-typescript-error
generate-handoff
```

## Proposed Commands

```bash
soturail tasklet create "review-pr"
soturail tasklet run "generate-handoff"
soturail tasklet list
soturail tasklet export --target claude
```

## Tasklet Shape

```yaml
id: review-pr
purpose: Review changed files and produce evidence-backed feedback.
inputs:
  - git diff
  - tests report
allowedRead:
  - src/**
  - tests/**
allowedWrite:
  - .soturail/reports/**
verification:
  - npm test
handoff:
  - report.md
  - provenance.md
```

## Relationship To Skills

```txt
Skill = reusable domain operating procedure.
Tasklet = small runnable task template that may use skills, rules and context packs.
Workflow = multi-step lifecycle with evidence and verification.
```

## Non-Goals

- no cloud task runner by default;
- no external queue required;
- no hidden execution;
- no destructive action without policy approval.
