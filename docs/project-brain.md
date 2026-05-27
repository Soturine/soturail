# Project Brain

Project Brain is SotuRail's verified local knowledge layer. It turns local evidence into auditable claims, decisions, bugs, gaps, rules and stale-evidence events.

It is not a vector database, cloud memory service, LLM crawler or autonomous code reviewer. It is deterministic, local-first and evidence-backed.

## Storage

Project Brain uses three storage shapes:

```txt
.soturail/brain/
  claims.jsonl
  decisions.jsonl
  bugs.jsonl
  gaps.jsonl
  rules.jsonl
  stale-events.jsonl
  project-profile.json
  architecture.json
  brain-index.json
  freshness.json
  doctor.json
  exports/
```

JSONL files are the append-friendly history for records. JSON files are materialized views for current state. Markdown files under `exports/` are reviewed handoff payloads for humans and agents.

## Record Types

Every persisted record has:

- `schemaVersion`;
- stable `id`;
- `createdAt`;
- source or evidence where possible.

Claims include `sourcePath`, `sourceCommit`, `sourceRange`, `fileHash`, `rangeHash`, `status` and `confidence`.

Decisions describe active or superseded project choices.

Gaps describe facts SotuRail cannot prove yet.

Rules describe operational instructions derived from verified claims or active decisions.

Stale events record evidence drift when a source file, source range or validation reference changes.

## Commands

```bash
soturail brain init
soturail brain scan
soturail brain profile
soturail brain recall "release notes"
soturail brain stale
soturail brain doctor
soturail brain export --agent codex
```

`brain scan` detects package metadata, CLI version, docs folders, release note paths, rails, commands, tests, workflow/harness/diagram/eval status and supported agent hosts.

`brain recall` uses deterministic scoring: exact phrases, keyword overlap, tags, record type, status, confidence and recency.

`brain stale` recomputes `fileHash` and `rangeHash`. If the file changed but the range did not, it warns. If the range changed, it records a suspect event. If the source file is missing, it records a stale event.

`brain export` writes agent-safe briefs to `.soturail/brain/exports/<agent>.md`. Generic exports also write `.soturail/brain/exports/agent-brief.md`.

## Agent-Safe Export

Brain exports include:

- project identity;
- verified claims;
- active rules;
- active decisions;
- known gaps;
- recurring bugs and harness notes;
- safe commands;
- release and workflow notes;
- stale/suspect warnings;
- source references.

Exports do not include private memory unless it is explicitly approved. Generated briefs must be reviewed before agent handoff.

## Limitations

- No LLM extraction.
- No embeddings.
- No network calls.
- No cloud sync.
- No full static analyzer.
- No claim should be treated as true without source evidence and freshness checks.
