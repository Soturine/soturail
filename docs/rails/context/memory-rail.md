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

## v0.5.x Commands

```bash
soturail memory remember "Decision: keep MCP read-only by default" --tag architecture --source manual
soturail memory recall "npm release policy" --limit 5
soturail memory capture --from-file docs/reference/commands/release-workflow.md
soturail memory consolidate
soturail memory doctor
soturail memory approve <id>
soturail memory reject <id>
```

Existing `memory propose/list/approve` behavior can evolve into this richer flow without breaking current data files.

The v0.5.x seed writes explicit records to `.soturail/memory/records.jsonl` and consolidated records to `.soturail/memory/consolidated.jsonl`.

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

`memory recall` returns a compact, evidence-based answer with the match reason, score, source, tags, confidence and privacy flag:

```txt
SotuRail memory recall
matches_count: 2

Matches:
- mem_001 [score 8.00]
  Text: Never create GitHub release before npm publish succeeds.
  Reason: exact text match, keyword overlap
  Source: docs/reference/commands/release-workflow.md
  Tags: release
  Confidence/privacy: medium / normal
```

Recall output should explain why records were included or skipped.

## Practical Examples

Project decisions:

```bash
soturail memory remember "Decision: release gates verify the packed .tgz before npm publish." --tag release --tag packaging --source manual
```

Bug history:

```bash
soturail memory remember "Bug history: npm exec once returned stale CLI version after publish; prefer clean tarball install checks." --tag release --tag bug-history --source manual
```

Recurring test failures:

```bash
soturail memory remember "Recurring failure: Windows CI can be slower on packed-package checks; isolate heavy release tests." --tag ci --tag testing --source manual
```

Architecture preferences:

```bash
soturail memory remember "Architecture preference: keep SotuRail local-first and TypeScript-first; native remains optional." --tag architecture --source manual
```

## Approved-Memory Export Guidance

Only approved, non-sensitive memory should be exported to agents or included in context packs.

Safe for export:

- stable architecture decisions;
- release process rules that do not contain credentials;
- recurring bug summaries with source paths or issue IDs;
- testing preferences and workflow constraints.

Keep local:

- secrets, API keys, tokens and auth headers;
- private customer data;
- raw terminal logs;
- speculative notes that have not been reviewed;
- sensitive incident detail that should stay in local evidence.

Before sharing memory with an agent, run:

```bash
soturail memory doctor
soturail memory consolidate
soturail memory recall "task topic" --limit 5
```

`memory doctor` reports total records, consolidated records, likely secret hints and whether approved-memory export needs review.

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

## Relationship With Project Brain

Project Brain can read approved memory summaries during `brain scan` and include only safe memory in agent briefs.

Rules:

- private or pending memory stays local;
- approved memory can become a source hint, not an unchecked fact;
- recurring memory should link to a claim, decision, bug or gap when possible;
- brain exports should prefer source references and concise summaries over long copied notes.

v0.8.1 keeps memory-to-brain conservative: use `soturail brain consolidate --dry-run` before deriving rules from repeated memories, and use `soturail brain stale --repair-plan` when a memory points at evidence that moved or changed.

## Privacy And Redaction

Memory Rail must not make secrets easier to leak.

Rules:

- probable secrets are redacted before suggested memory is shown;
- raw logs are referenced by raw IDs, not copied by default;
- approved memory export excludes sensitive records unless explicitly allowed;
- memory records should store source pointers when possible instead of huge copied blobs.

## Acceptance Criteria

Memory Rail should keep improving until:

- records have stable IDs and status;
- recall has deterministic tests;
- approved-only exports are tested;
- stale/conflict status is represented;
- redaction happens before export;
- context packs can include selected approved memory with reasons;
- MCP resources expose only approved memory by default.
