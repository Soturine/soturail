# Memory Rail

Memory Rail is the planned SotuRail area for storing, approving, recalling and consolidating local project memory for AI coding agents.

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

## Planned Commands

```bash
soturail memory remember "Decision: keep MCP read-only by default"
soturail memory recall --query "npm release policy"
soturail memory capture --from raw_...
soturail memory consolidate
soturail memory doctor
soturail memory approve <id>
soturail memory reject <id>
soturail memory export --approved-only
```

Existing `memory propose/list/approve` behavior can evolve into this richer flow without breaking current data files.

## Memory Record Shape

A memory record should eventually include:

```txt
id
kind: decision | bug | release | architecture | preference | warning | workflow | research
status: pending | approved | rejected | stale | conflict
summary
source_path
source_line_range
raw_id
offload_id
workflow_id
created_at
updated_at
confidence
importance
tags
privacy_flags
content_hash
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
