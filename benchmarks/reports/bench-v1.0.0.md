# SotuRail Benchmark Rail 2 Report

SotuRail does not claim native speedups unless a local benchmark report proves them.
Native acceleration is optional. TypeScript remains the portable baseline.

schemaVersion: soturail.bench.v1
id: bench_mpukxrve
suite: brain
version: 1.0.0
createdAt: 2026-06-01T02:18:41.882Z
platform: win32/x64
node: v24.11.1
nativeAvailable: false
engine: typescript
passed: 5
failed: 0
warnings: 3
totalDurationMs: 444.463

| case | category | operation | durationMs | recordsRead | recordsWritten | filesScanned | engine | status | warnings |
|---|---|---|---:|---:|---:|---:|---|---|---|
| brain-scan-small | brain-scan | brain scan | 131.405 | 0 | 23 | 8 | typescript | passed | none |
| brain-stale-small | brain-stale | brain stale | 166.887 | 46 | 14 | 1 | typescript | warning | claim_20260601021841_304f131d: fileHash changed but rangeHash is unchanged; claim_20260601021841_41c098d9: fileHash changed but rangeHash is unchanged |
| brain-consolidate-small | brain-consolidate | brain consolidate | 109.263 | 70 | 13 | 0 | typescript | passed | none |
| reverse-claims-small | reverse-claims | reverse claims | 28.39 | 5 | 5 | 6 | typescript | passed | none |
| jsonl-read-write-small | jsonl-read-write | jsonl read write | 8.13 | 12 | 12 | 1 | typescript | passed | none |
| range-hash-small | range-hash | range hash | 0.388 | 20 | 20 | 1 | typescript | passed | none |

## Report Paths

- latest_json: .soturail\bench\latest.json
- latest_markdown: .soturail\bench\latest.md
- versioned_json: benchmarks\reports\bench-v1.0.0.json
- versioned_markdown: benchmarks\reports\bench-v1.0.0.md
