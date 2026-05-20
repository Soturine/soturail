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
- compression ratio;
- command count;
- expansion count;
- manual omission/failure count when present;
- estimated cache stability score;
- real provider cache hits only if imported metadata exists.
- response compression reduction and preservation counts;
- rules ingestion and validation counts;
- benchmark fixture measurements.

## Token Estimation

v0.1.0 uses:

```text
Math.ceil(text.length / 4)
```

This is deterministic and useful for local comparisons. It is not a provider tokenizer.
