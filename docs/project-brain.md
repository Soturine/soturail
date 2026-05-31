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
soturail brain consolidate --dry-run
soturail brain profile
soturail brain recall "release notes"
soturail brain stale --repair-plan
soturail brain doctor --repair-plan
soturail brain doctor --json
soturail brain export --agent codex --limit 10
```

`brain scan` detects package metadata, CLI version, docs folders, release note paths, rails, commands, tests, workflow/harness/diagram/eval status and supported agent hosts.

`brain recall` uses deterministic scoring: exact phrases, keyword overlap, tags, record type, status, confidence and recency.

`brain consolidate --dry-run` reads `claims.jsonl`, groups duplicate or near-duplicate claims, chooses canonical claims conservatively and writes:

```txt
.soturail/brain/consolidated-claims.jsonl
.soturail/brain/consolidation-report.json
.soturail/brain/consolidation-report.md
```

It preserves append-only history. It does not delete or rewrite original claim records.

`brain stale` recomputes `fileHash` and `rangeHash`. If the file changed but the range did not, it warns. If the source range changed, v0.8.1 tries to relocate similar evidence in the same file using normalized whitespace and token overlap. A high-confidence match records a `relocated` stale event; a medium-confidence match records a suspect relocation candidate. If the source file is missing, it records a stale event.

`brain stale --repair-plan` writes safe guidance to:

```txt
.soturail/brain/stale-repair-plan.json
.soturail/brain/stale-repair-plan.md
```

Repair plans never edit code, docs or claims. They name the record, source path, affected range, candidate new range, related validations and suggested commands for a human review.

`brain doctor --repair-plan` checks JSONL validity, profile/index/freshness files, duplicate groups, stale/suspect records, open gaps, rules without sources, agent exports and integration status. It prints next commands for scan, consolidate, stale repair, export, rules and brain evaluation.

`brain export` writes agent-safe briefs to `.soturail/brain/exports/<agent>.md`. Generic exports also write `.soturail/brain/exports/agent-brief.md`.

v0.8.1 briefs are bounded by default and separate:

- verified rules and claims;
- active decisions;
- known gaps;
- recurring bugs and harness patterns;
- suspect claims;
- stale claims;
- safe commands and critical commands;
- recovery pointers;
- source references.

Stale claims are not placed in the verified section.

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

## Troubleshooting

### Problem: brain stale reports many suspect claims

Run:

```bash
soturail brain stale --repair-plan
soturail reverse claims ./src
soturail brain consolidate --dry-run
```

Then inspect `.soturail/brain/stale-repair-plan.md`. A suspect claim means the evidence changed enough to require review; it does not mean SotuRail fixed or rejected the claim.

### Problem: agent brief is too long

Run:

```bash
soturail brain export --agent codex --limit 10
```

Use `--include-suspect` only when the agent explicitly needs warning context.

### Problem: rules from brain are too weak

Check:

- claims must be verified before they can become active rules;
- stale or suspect sources are excluded from active rules by default;
- rules must link to `sourceClaimIds` or `sourceDecisionIds`;
- test-backed claims produce stronger enforcement than unvalidated facts.

## v0.9.0 Benchmark Seeds

v0.9.0 adds lightweight timing/reporting around Project Brain-related operations through Benchmark Rail 2.0:

```bash
soturail bench run --suite brain
soturail native candidates
```

Candidate categories include:

```txt
brain-scan
brain-stale
brain-consolidate
reverse-claims
format-compare
json-validate
reducer-large-log
workflow-evidence
```

TypeScript fallback must always work. Rust/native acceleration remains optional and should not be required for npm install.

Project Brain performance evidence lives under `.soturail/bench/` and can be referenced by release and workflow evidence. Timing values are not public speed claims by themselves.

## v0.10.0 Report Integration

Unified status and local reports include Project Brain claim counts, suspect/stale counts and doctor status when available.

Useful commands:

```bash
soturail brain doctor --repair-plan
soturail status --agent
soturail report agent --agent codex
```

Agent-readable reports separate brain warnings from verified facts and point back to `.soturail/brain/` evidence paths.

## Limitations

- No LLM extraction.
- No embeddings.
- No network calls.
- No cloud sync.
- No full static analyzer.
- No automatic repair of code, docs or claims.
- No claim should be treated as true without source evidence and freshness checks.
