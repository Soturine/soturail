# Metrics

SotuRail metrics are local, append-only and transparent.

## Sources

- `.soturail/raw/index.jsonl`
- `.soturail/metrics/events.jsonl`
- `.soturail/cache/blocks.jsonl`

## Reported Values

- estimated raw tokens;
- estimated compressed tokens;
- compression ratio;
- command count;
- expansion count;
- manual omission/failure count when present;
- estimated cache stability score;
- real provider cache hits only if imported metadata exists.

## Token Estimation

v0.1.0 uses:

```text
Math.ceil(text.length / 4)
```

This is deterministic and useful for local comparisons. It is not a provider tokenizer.
