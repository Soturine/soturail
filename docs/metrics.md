# Metrics

SotuRail metrics are local, append-only and transparent.

## Sources

- `.soturail/raw/index.jsonl`
- `.soturail/metrics/events.jsonl`
- `.soturail/cache/blocks.jsonl`
- `.soturail/dedupe/index.jsonl`
- benchmark JSON reports under `benchmarks/results/`

## Reported Values

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
- real provider cache hits only if imported metadata exists.
- response compression reduction and preservation counts;
- rules ingestion and validation counts;
- benchmark fixture measurements;
- agent export, MCP smoke and Workflow Rail benchmark measurements.

Small command outputs can be larger after SotuRail adds raw recovery metadata. When that happens, `compression_effective` is `false` and the CLI prints the small-output warning instead of hiding the overhead.

## Token Estimation

v0.1.0 uses:

```text
Math.ceil(text.length / 4)
```

This is deterministic and useful for local comparisons. It is not a provider tokenizer.
