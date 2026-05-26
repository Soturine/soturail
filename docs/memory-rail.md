# Memory Rail

Memory Rail is the SotuRail area for storing, recalling, capturing and consolidating local project memory for AI coding agents.

It is inspired by agent-memory systems, but SotuRail should remain local-first, auditable and conservative.

## Product Boundary

Memory Rail should help agents remember project decisions without turning SotuRail into the agent runtime.

```txt
The agent reasons.
SotuRail stores approved local memory, provenance and recovery evidence.
```

Default principles:

- local JSONL/default storage first;
- no required database or cloud embeddings;
- approved memory only for exports/MCP by default;
- redaction before storage and before export;
- explicit source metadata;
- stale/conflict detection;
- human review for sensitive or long-term records.

## v0.5.0 Seed Commands

```bash
soturail memory remember "Decision: keep MCP read-only by default" --tag architecture --source manual
soturail memory recall "npm release policy" --limit 5
soturail memory capture --from-file docs/release-workflow.md
soturail memory consolidate
soturail memory doctor
soturail memory approve <id>
soturail memory reject <id>
```

Existing `memory propose/list/approve` behavior can evolve into this richer flow without breaking current data files.

The v0.5.0 seed writes explicit records to `.soturail/memory/records.jsonl` and consolidated records to `.soturail/memory/consolidated.jsonl`.

## Memory Record Shape

A v0.5.0 memory record includes:

```txt
id
schemaVersion
createdAt
text
source
confidence
tags
privacy
gitCommit
optional file path/hash
```

## Recall Output

`memory recall` should return a compact, evidence-based answer:

```txt
query: npm release policy
records_found: 3
included:
- mem_001 [approved] Never create GitHub release before npm publish succeeds.
  source: docs/release-workflow.md
  reason: exact release policy match
omitted:
- mem_004 [stale] old v0.3 publish workaround
```

Recall output should explain why records were included or skipped.

## Relationship With Context Intelligence

Memory Rail feeds Context Intelligence.

Future context selection should combine:

- repo map;
- docs;
- rules;
- specs;
- approved memory;
- workflow state;
- raw/offload evidence;
- recent failures.

Memory should not be dumped wholesale into every prompt. It should be selected by query, role, task and policy.

## Relationship With Harness Failure Ledger

Repeated agent mistakes should become memory only after review.

Example flow:

```txt
agent failure -> harness note -> candidate memory/rule -> approval -> recall in future workflows
```

A repeated Windows npm publish issue might become:

```txt
kind: release
summary: Always verify packed CLI by installing the .tgz in a clean temp project before npm publish.
status: approved
```

## Privacy And Redaction

Memory Rail must not make secrets easier to leak.

Rules:

- probable secrets are redacted before suggested memory is shown;
- raw logs are referenced by raw IDs, not copied by default;
- approved memory export excludes sensitive records unless explicitly allowed;
- memory records should store source pointers when possible instead of huge copied blobs.

## Acceptance Criteria

Memory Rail should not be promoted until:

- records have stable IDs and status;
- recall has deterministic tests;
- approved-only exports are tested;
- stale/conflict status is represented;
- redaction happens before export;
- context packs can include selected approved memory with reasons;
- MCP resources expose only approved memory by default.
