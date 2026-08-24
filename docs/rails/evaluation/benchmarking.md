# Benchmark Methodology

SotuRail benchmarks are local, deterministic evidence about a specific build and fixture. They do not support general claims that SotuRail is faster, cheaper, or more accurate than another system.

## Measurement layers

| Layer | Metric | Success condition |
|---|---|---|
| Payload compression | raw/reduced tokens, metadata overhead, net tokens saved, recovery pointer | critical errors, paths, commands, and schema fields survive |
| Task-level savings | files/ranges avoided, context bytes/tokens supplied, discovery steps | equivalent task evidence with less irrelevant material |
| Correctness | fixture assertions and required-fact recall | every mandatory assertion passes; savings cannot compensate for failure |
| Accepted outcome | human or deterministic acceptance verdict | outcome is recorded separately from model output and benchmark score |
| Latency | wall/CPU time per case and percentile where repeated | compared on equivalent hardware, build, fixture, and correctness |
| Cost | provider-reported usage/rates with capture time | estimate is labeled; absent provider metadata remains unavailable |

Knowledge structuring and evidence collection are not pure compression tasks. They are judged on provenance, freshness, fidelity, and correct status classification.

## Reproducibility

A report records SotuRail version, commit when available, Node/OS/architecture, engine, fixture ID/digest, workspace fingerprint, warm-up policy, iteration count, and raw result artifact. Exact timings are not asserted in unit tests; schema, non-negative measures, and correctness are.

```bash
npm run build
soturail bench prepare
soturail bench run --engine ts
soturail bench compare
soturail bench report
```

Canonical output lives in `benchmarks/results/`, `benchmarks/reports/`, and `.soturail/bench/`. The canonical evaluation directory is `evals/`; `eval/` is not a competing artifact root.

## Lightweight performance gates

Measure at least CLI startup, `doctor`, artifact JSON/JSONL read/write, context selection with a hard budget, and repository index/rebuild on a fixed fixture. These measurements diagnose regressions but do not block every development iteration. Longer comparisons belong in manual or scheduled workflows.

Native work follows profile -> hotspot -> TypeScript baseline -> Rust implementation -> equivalence test -> Rust benchmark. The TypeScript fallback remains mandatory, and native code is retained only when measured benefit justifies maintenance cost.

## External comparisons

RTK, LeanCTX, Graphify, CodeGraph, Memtrace, Headroom, and turbovec are benchmark/reference candidates. A comparison is publishable only when inputs, correctness criteria, recovery behavior, version, configuration, and raw results are equivalent and available. Unsupported marketing ratios are excluded.

## Interpretation

The primary rule is:

```text
Token savings without correctness and accepted outcome are not a success.
```

Discovery, provider output, review, deterministic verification, runtime observation, and human acceptance remain separate result fields.
