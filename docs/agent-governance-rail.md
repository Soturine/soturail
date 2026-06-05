# Agent Governance And Evolution Rail

Agent Governance And Evolution Rail is a later-stage direction for controlled improvement loops around SotuRail artifacts and agent-facing harnesses.

It absorbs ideas from self-improving harness systems while keeping SotuRail conservative:

```txt
propose -> eval -> approve -> apply
```

No future loop should silently edit projects or bypass human approval.

## Planned Concepts

### Agent Boundary

A future policy can define what an agent may change, read or append:

```yaml
mutable:
  - src/**
  - tests/**
  - docs/**
read_only:
  - package.json
  - package-lock.json
  - .github/**
  - .env*
append_only:
  - .soturail/logs/**
  - .soturail/ledger/**
  - .soturail/reports/**
rules:
  require_tests_before_apply: true
  require_no_context_regression: true
  one_patch_per_run: true
```

### Ledger

Append-only records can explain decisions:

```json
{
  "run_id": "run_2026_06_05_001",
  "agent": "claude-code",
  "action": "proposed_patch",
  "files_touched": ["src/context.ts"],
  "approved": false,
  "tests_passed": true
}
```

### Experiments

```txt
.soturail/experiments/
  candidates/
  results/
  accepted/
  rejected/
```

Candidate changes should be compared through deterministic evals before approval.

## Proposed Commands

```bash
soturail trace start
soturail trace stop
soturail trace list
soturail trace show <id>
soturail ledger list
soturail experiment create "improve context ranking"
soturail experiment run
soturail experiment compare
soturail improve propose
soturail improve eval
soturail improve approve
soturail improve apply
```

## Non-Goals

- no autonomous self-modifying runtime by default;
- no hosted multi-tenant control plane;
- no required Anthropic/OpenAI/Groq provider;
- no destructive MCP tools;
- no applying patches without reviewable diff and approval.
