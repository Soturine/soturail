# Benchmarking

SotuRail benchmarks use deterministic local fixtures. They are intended to make reducer, context, memory, workflow, policy and evidence behavior measurable without claiming external superiority.

```bash
npm run build
soturail bench prepare
soturail bench run --engine ts
soturail bench list
soturail bench run --suite brain
soturail bench compare
soturail bench report
```

Outputs:

- `benchmarks/results/latest.json`
- `benchmarks/reports/latest.md`
- `.soturail/bench/latest.json`
- `.soturail/bench/latest.md`
- versioned reports such as `benchmarks/reports/bench-v0.10.0.json`
- versioned reports such as `benchmarks/reports/bench-v0.10.0.md`

The suite currently groups results as:

- terminal reducer compression;
- agent response compression;
- knowledge structuring;
- cache stability;
- native engine availability/performance when available;
- skill rail validation/export;
- MCP resource listing/reading/smoke;
- context pack generation;
- agent hook and agent integration export;
- Workflow Rail dry-run state;
- memory approval workflow.

Terminal reducer cases include npm install noise, npm test success, Vitest failures, TypeScript diagnostics, git diff/status noise, Docker logs, ESLint failures, Vite/Next build output, Java stack traces, Maven/Gradle failures, JSON/tool payload output, tiny-output overhead and dedupe fixtures.

Each reducer and integration case reports:

- `raw_tokens`;
- `reduced_tokens`;
- `dedupe_tokens_saved`;
- `metadata_overhead_tokens`;
- `net_tokens_saved`;
- `quality_passed`;
- preserved errors, paths and commands.

Knowledge-to-Rules is not judged as pure compression. It creates reusable structured rules, citations and validator metadata.

Native comparison:

```bash
soturail bench run --engine native
soturail bench compare-engines
```

Optional RTK or Squeez comparisons are only run when the user already has those tools on PATH.

## Benchmark Rail 2.0

v0.9.0 adds Benchmark Rail 2.0 alongside the historical reducer benchmark report. The new rail is built around small, local, deterministic smoke fixtures:

```bash
soturail bench list
soturail bench run
soturail bench run --suite brain
soturail bench run --suite reducers
soturail bench run --suite filesystem
soturail bench run --suite release
soturail bench compare
soturail bench report
```

Benchmark categories:

```txt
brain-scan
brain-stale
brain-consolidate
reverse-claims
reducer-large-log
jsonl-read-write
range-hash
file-scan
workflow-evidence
format-compare
json-validate
release-preflight
```

The report schema is `soturail.bench.v1` and includes environment, engine, case duration, records read/written, files scanned, warnings and summary counts. Tests assert report shape and non-negative timings, not exact performance numbers.

## Native Candidate Planning

v0.9.0 turns native planning into explicit candidate reports. Future optimization must be benchmark-gated and keep TypeScript fallback mandatory.

```bash
soturail native candidates
soturail native status
soturail native doctor
soturail native compare
```

Candidate categories:

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

Candidate native hot paths may include large JSONL scans, rangeHash computation, source-range relocation and duplicate claim clustering. Agent brief rendering and release preflight are not native candidates until local evidence proves a bottleneck.

See [native-performance-policy.md](native-performance-policy.md).

## Evaluation Suite

v0.6.1 adds a local Evaluation Suite alongside the benchmark commands.

```bash
soturail eval list
soturail eval run
soturail eval report
```

Outputs:

- `.soturail/eval/latest.json`
- `.soturail/eval/latest.md`

The goal is to prove that SotuRail preserves the evidence needed for an agent or human to complete a task.

The key rule:

```txt
Token savings without quality preservation is not a success.
```

Evaluation measures both:

- how much context was reduced;
- whether the critical facts survived.

See [evaluation-suite.md](evaluation-suite.md).

## Fixture Groups

### Context Selection Quality

Fixtures test queries such as:

```txt
fix npm publish on Windows
add MCP read-only resource
review release workflow safety
summarize failed Vitest output
```

Checks:

- expected source docs are included;
- unrelated docs are omitted;
- file paths are preserved;
- line ranges are preserved when available;
- inclusion reasons are present;
- raw/offload recovery pointers are present when content was summarized.

### Memory Recall Quality

Fixtures test:

- approved memories;
- pending memories;
- rejected memories;
- stale memories;
- conflicting memories;
- sensitive memories;
- release-policy memories;
- recurring-bug memories.

Checks:

- approved records can be recalled;
- rejected records are not exported by default;
- stale/conflict status is visible;
- probable secrets are redacted;
- recall output includes source and reason.

### Role-Pack Quality

Fixtures test:

- planner context pack;
- executor context pack;
- reviewer context pack;
- release-manager context pack;
- researcher context pack.

Checks:

- planner receives roadmap/specs/constraints;
- executor receives task/files/tests;
- reviewer receives diffs/tests/rules/security notes;
- release-manager receives version/changelog/audit/pack/npm/GitHub state;
- researcher receives ecosystem notes and comparison caveats;
- unrelated context is not included by default.

### Structured Payload Quality

Formats to compare:

- Markdown;
- JSON;
- XML-like tagged context;
- TOON/table-like compact output;
- Mermaid where visual context applies.

Checks:

- critical facts are preserved;
- schemas or syntax are valid where applicable;
- duplicate JSON keys are detected;
- token estimate is reported;
- recommended target format is explained.

### Diagram Validation Quality

Fixtures test:

- valid Mermaid workflow;
- invalid Mermaid syntax;
- unreachable state;
- missing start/end;
- release flow without tests/audit/pack evidence;
- policy flow without approve/reject state.

Checks:

- invalid diagrams fail clearly;
- missing states/transitions are named;
- diagrams are not treated as replacement tests.

### Evidence Pack Completeness

Fixtures test:

- workflow evidence;
- release evidence;
- failed command evidence;
- policy approval evidence;
- offloaded raw output evidence;
- filesystem evidence.

Checks:

- build/test/audit/pack status present where expected;
- raw IDs present;
- offload IDs present where summaries were used;
- changed files present;
- policy decisions present;
- release notes path present for release workflows;
- missing evidence is reported honestly.

### Harness Scenario Quality

Fixtures test:

- repeated agent mistake;
- stale root agent docs;
- unsafe command request;
- missing release verification;
- Windows/npm cache false positive;
- context routed to the wrong expert.

Checks:

- failure becomes candidate memory/rule/doc/workflow check;
- repeated failures are grouped;
- prevention suggestion is concrete;
- evidence is linked.

## Report Fields

Benchmark and evaluation reports should include:

```txt
suite
fixture_count
passed
failed
raw_tokens
reduced_tokens
metadata_overhead
net_tokens_saved
quality_passed
critical_facts_preserved
recovery_paths_preserved
context_quality_score
role_pack_quality_score
payload_format_quality_score
evidence_completeness_score
policy_approval_count
diagram_validation_result
memory_recall_precision
platform
node_version
engine
native_fallback_status
```

## Public Claim Rule

SotuRail should only make performance or quality claims when the repository includes reproducible local benchmark evidence for the exact claim.

Do not say:

```txt
SotuRail is better than X.
```

Say:

```txt
On this fixture set, SotuRail reduced estimated payload tokens by N while preserving the expected diagnostic lines.
```

## v0.10.0 Report Integration

`soturail status --json`, `soturail report build`, `soturail dashboard build` and `soturail report github-summary` include the latest benchmark report path and summary counts when `.soturail/bench/latest.json` exists.

Missing benchmark evidence becomes a warning and a safe next command, not a report-generation failure.
