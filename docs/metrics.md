# Metrics

SotuRail metrics are local, append-only and transparent.

## Sources

- `.soturail/raw/index.jsonl`
- `.soturail/metrics/events.jsonl`
- `.soturail/cache/blocks.jsonl`
- `.soturail/dedupe/index.jsonl`
- benchmark JSON reports under `benchmarks/results/`

Future sources may include:

- `.soturail/memory/*.jsonl`
- `.soturail/workflows/<id>/workflow.yml`
- `.soturail/workflows/<id>/evidence.*`
- `.soturail/policy/queue.jsonl`
- `.soturail/diagrams/`
- `.soturail/traces/`
- `.soturail/fs/`

## Reported Values

Current reported values include:

- estimated raw tokens;
- estimated compressed tokens;
- estimated reduced payload tokens;
- terminal reducer estimated tokens saved;
- dedupe estimated tokens saved;
- metadata overhead tokens;
- net estimated tokens saved;
- dedupe blocks reused;
- dedupe recent window;
- compression ratio;
- command count;
- expansion count;
- manual omission/failure count when present;
- estimated cache stability score;
- real provider cache hits only if imported metadata exists;
- response compression reduction and preservation counts;
- rules ingestion and validation counts;
- benchmark fixture measurements;
- agent export, MCP smoke and Workflow Rail benchmark measurements.

Small command outputs can be larger after SotuRail adds raw recovery metadata. When that happens, `compression_effective` is `false` and the CLI prints the small-output warning instead of hiding the overhead.

## Planned Quality Metrics

The v0.5.2 Evaluation Suite should add metrics that measure quality, not only size.

Planned metrics:

```txt
context_quality_score
role_pack_quality_score
payload_format_quality_score
evidence_completeness_score
policy_approval_count
policy_rejection_count
diagram_validation_result
memory_recall_precision
memory_recall_conflict_count
agent_docs_hygiene_score
filesystem_evidence_count
harness_failure_recurrence_count
```

## Planned Context Metrics

Context Intelligence should report:

- selected source count;
- omitted source count;
- selected token estimate;
- omitted token estimate;
- inclusion reasons count;
- source path preservation;
- line-range preservation;
- raw/offload recovery pointer preservation;
- expected evidence found/missing.

Example future output:

```txt
context_quality_score: 0.92
selected_sources: 8
omitted_sources: 31
critical_paths_preserved: true
critical_errors_preserved: true
recovery_pointers_preserved: true
```

## Planned Memory Metrics

Memory Rail should report:

- pending memory count;
- approved memory count;
- rejected memory count;
- stale memory count;
- conflict memory count;
- recall result count;
- recall precision estimate from fixtures;
- sensitive memory redaction count;
- memory records included in context packs.

## Planned Policy Metrics

Policy Rail should report:

- active rule count;
- queued approval count;
- approved risky action count;
- rejected risky action count;
- blocked command count;
- raw expansion opt-in count;
- MCP exposure risk count;
- agent host config write count;
- release evidence requirement pass/fail.

## Planned Diagram Metrics

Diagram Rail should report:

- diagrams discovered;
- diagrams generated;
- diagrams validated;
- invalid diagrams;
- unreachable states found;
- release flows missing verification;
- policy flows missing approve/reject state;
- workflow diagrams attached to evidence packs.

## Planned Structured Payload Metrics

Structured Payload Rail should report:

- format used: Markdown, JSON, tagged, TOON/table, Mermaid;
- token estimate by format;
- metadata overhead by format;
- duplicate JSON key warnings;
- invalid JSON warnings;
- probable secret warnings;
- critical fact preservation;
- recommended target format.

## Planned Evidence Metrics

Evidence Pack should report:

- build status present;
- test status present;
- audit status present;
- pack/package verification status present;
- changed files present;
- raw IDs present;
- offload IDs present;
- policy decisions present;
- release notes path present;
- benchmark report path present;
- filesystem snapshot present;
- evidence completeness score.

## Token Estimation

SotuRail uses:

```text
Math.ceil(text.length / 4)
```

This is deterministic and useful for local comparisons. It is not a provider tokenizer.

## Provider Metrics

SotuRail must not invent provider-side metrics.

It may display real provider cache hits, latency or token usage only when imported metadata exists and the source is clearly labeled.
