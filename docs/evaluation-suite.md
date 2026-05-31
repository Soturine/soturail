# Evaluation Suite

SotuRail v0.6.1 adds a local evaluation suite for context quality. It is deterministic, offline and host-independent: no paid APIs, no real agent hosts, no GitHub access and no network calls are required.

```bash
soturail eval list
soturail eval run
soturail eval run --suite brain
soturail eval report
```

Reports are written to:

```txt
.soturail/eval/latest.json
.soturail/eval/latest.md
```

## What It Checks

The suite uses small fixtures that verify whether critical evidence survives selection, compression and handoff:

| Group | What is checked |
| --- | --- |
| Memory recall | Architecture, recurring bug, release and policy memories rank above unrelated notes. |
| Context selection | Expected file, command, error string and rule are preserved. |
| Reducers | npm, Vitest, tsc, Java, Maven, Docker, git, ESLint and Vite/Next outputs keep important diagnostics. |
| Context router | Security, release, docs, code, workflow, memory and research queries route deterministically. |
| Role packs | Planner, executor, reviewer, release-manager and researcher packs include purpose and omissions. |
| Agent docs hygiene | Short root docs pass and oversized root docs warn. |
| Offload/restore | Recovery pointer, source path and critical failure line survive. |
| Format quality | Markdown, JSON, tagged blocks and compact/table suggestions keep evidence visible. |
| Strict JSON | Invalid JSON, duplicate keys, probable secrets and huge arrays are detected. |
| Evidence packs | Workflow/run evidence includes raw IDs, policy decisions, changed files and harness contract notes. |
| Harness scenarios | Repeated failures become candidate rules, docs, memory or workflow checks. |
| Diagram validation | Invalid Mermaid and missing verification transitions are reported clearly. |
| Project Brain | Verified claims, stale detection, brain-derived rules, brain briefs, reverse specs and gap detection. |

## Evaluation Dimensions

The suite separates compression from quality. Useful report fields include:

- raw token estimate;
- reduced token estimate;
- metadata overhead;
- net token savings;
- quality pass/fail;
- critical lines preserved;
- path preservation;
- command preservation;
- error/warning preservation;
- source path or recovery pointer preservation;
- policy decision preservation.

## Fixture Details

### Terminal Reducer Quality

Fixtures cover npm, Vitest, TypeScript, Java, Maven, Docker, git diff/status, ESLint and Vite/Next-style output.

Checks:

- root error preserved;
- file path preserved;
- line/column preserved when present;
- command preserved;
- raw recovery hint remains available.

### Context Selection Quality

Fixtures ask task-like queries and expect the right source set.

Examples:

```txt
query: validateRefund ERR_REFUND_WINDOW npm test Rule R08
expected: src/refund-policy.ts

query: review release policy
expected: release and policy context
```

Checks:

- expected docs or files included;
- unrelated docs mostly omitted;
- reasons are present;
- source paths are present.

### Memory Recall Quality

Fixtures include architecture decisions, repeated bugs, release policies, policy notes and unrelated memories.

Checks:

- expected record ranks first;
- match reason is present;
- source/tag metadata stays visible;
- unrelated notes do not win over exact project facts.

### Role-Pack Quality

Fixtures cover planner, executor, reviewer, release-manager and researcher packs.

Checks:

- planner receives roadmap/specs/constraints;
- executor receives task/files/tests;
- reviewer receives diffs/tests/rules/security notes;
- release-manager receives version/changelog/audit/pack/npm/GitHub state;
- researcher receives ecosystem notes and comparison caveats;
- unrelated risky context is omitted by default.

### Structured Payload Quality

Formats compared:

- Markdown;
- JSON;
- XML-like tagged context;
- compact/table-like output;
- Mermaid where visual context applies.

Checks:

- critical facts preserved;
- schema or syntax valid where applicable;
- duplicate JSON keys detected;
- token estimate reported;
- recommended target format explained.

### Diagram Validation Quality

Fixtures cover invalid Mermaid and workflow diagrams missing verification transitions. The current validator is intentionally light; full Diagram Rail commands are future work.

Checks:

- invalid diagrams fail clearly;
- warnings name missing verification/start states where possible;
- diagrams are not treated as replacements for tests.

### Evidence Pack Completeness

Fixtures cover workflow evidence, command raw IDs, policy approval evidence, filesystem evidence and harness contract notes.

Checks:

- raw IDs present;
- changed files present;
- policy decisions present;
- harness contract path/status visible;
- missing evidence is reported honestly.

### Harness Scenario Quality

Fixtures cover repeated agent mistakes, stale instruction files, unsafe command requests and skipped verification.

Checks:

- failure becomes candidate memory/rule/doc/workflow check;
- prevention suggestion is concrete;
- evidence is linked where available.

## How To Read The Report

The JSON report uses `schemaVersion: "soturail.eval.v1"` and includes each case, result, evidence pointers and summary counts. The Markdown report is meant for humans and release notes.

Warnings are separate from failures. A passing suite means the local fixture set preserved its required evidence. It is not a claim that SotuRail is better than another project.

## Quality Rule

```txt
Token savings without quality preservation is not a success.
```

SotuRail should only make performance or quality claims when the repository includes reproducible local evidence for the exact claim. The suite is designed to make regressions visible, not to produce marketing numbers.

## What Is Not Tested

- Real agent model behavior.
- Provider APIs.
- Network retrieval.
- GitHub Actions availability.
- Real production repositories.
- Native/Rust speedups.

Those can be tested separately, but the default evaluation suite must stay cheap enough for regular local development.

## Brain Suite

v0.8.0 adds a focused Project Brain suite:

```bash
soturail eval run --suite brain
```

It validates that:

- verified claims include source paths and hashes;
- stale evidence detection reports source drift;
- rules derived from brain records link back to claims or decisions;
- agent briefs include verified rules, gaps, safe commands and source references;
- reverse specs include source claims;
- gaps are generated for missing proof;
- brain recall explains match reason, status, confidence and source.

v0.8.1 expands the brain suite with quality fixtures for:

- claim deduplication and consolidation reports;
- stale repair guidance;
- agent brief safety;
- source-range relocation;
- brain-derived rule link integrity;
- doctor actionability;
- export section limits.

These cases check fields and behavior, not exact timing or fragile prose.

## Benchmark-Gated Performance

v0.9.0 keeps evaluation and benchmarking separate:

```bash
soturail eval run --suite brain
soturail bench run --suite brain
```

Evaluation checks whether evidence survives. Benchmark Rail 2.0 records local timing and operation metadata. SotuRail does not claim native speedups unless a benchmark report proves them, and native unavailability is not an evaluation failure.

## v0.10.0 Report Use

The local report rail reads the latest eval report from `.soturail/eval/latest.json` and includes pass/fail/warning counts in status, dashboard, GitHub summary and agent-readable reports.

If no eval report exists, the report rail suggests:

```bash
soturail eval run --suite brain
```

## Acceptance Criteria

Evaluation Suite changes should not be promoted until:

- fixtures are deterministic;
- no external API is required;
- failures are readable;
- token savings and quality are separated;
- benchmark reports are refreshed only when intentionally requested;
- public claims match reproducible local results.
