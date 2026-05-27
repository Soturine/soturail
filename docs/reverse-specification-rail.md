# Reverse Specification Rail

Reverse Specification Rail derives draft specs, claims and gaps from local source evidence.

It does not use an LLM. It scans source, docs and tests with deterministic heuristics and writes the results into Project Brain.

## Commands

```bash
soturail reverse scan ./src
soturail reverse claims ./src
soturail reverse specs ./src
soturail reverse gaps
soturail reverse export --target agent
```

## Reports

`reverse scan` writes:

```txt
.soturail/brain/reverse-scan.json
.soturail/brain/reverse-scan.md
```

The report summarizes scanned files, detected commands/modules, likely rails, linked tests/docs and gaps.

## Claims

`reverse claims` extracts source-backed claims for:

- CLI commands;
- schema versions;
- release note paths;
- storage folders;
- safety and policy behavior;
- tests validating behavior.

Claims are appended to `.soturail/brain/claims.jsonl` only when their stable ID is not already present.

After a large reverse-claims run, use:

```bash
soturail brain consolidate --dry-run
```

This groups duplicate and near-duplicate claims into a report while preserving the append-only claim history.

## Draft Specs

`reverse specs` writes draft specs under `.soturail/brain/specs/`:

```txt
release.spec.md
workflow.spec.md
agent-runtime.spec.md
brain.spec.md
```

Each spec includes purpose, source claims, required behavior, acceptance criteria, known gaps and validation references.

## Gaps

`reverse gaps` records missing proof, such as verified claims without tests, docs without matching implementation or implementation without docs.

Outputs:

```txt
.soturail/brain/gaps.jsonl
.soturail/brain/gaps.md
```

## Agent Handoff

`reverse export --target agent` writes:

```txt
.soturail/brain/exports/reverse-agent-brief.md
```

Use it as compact context for an agent, then verify against the cited source paths before changing code.
