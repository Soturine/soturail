# SotuRail Benchmark Rail 2 Report

SotuRail does not claim native speedups unless a local benchmark report proves them.
Native acceleration is optional. TypeScript remains the portable baseline.

schemaVersion: soturail.bench.v1
id: bench_mpuwh14z
suite: brain
version: 1.0.1
createdAt: 2026-06-01T07:41:36.131Z
platform: win32/x64
node: v24.11.1
nativeAvailable: false
engine: typescript
passed: 5
failed: 0
warnings: 3
totalDurationMs: 354.4

| case | category | operation | durationMs | recordsRead | recordsWritten | filesScanned | engine | status | warnings |
|---|---|---|---:|---:|---:|---:|---|---|---|
| brain-scan-small | brain-scan | brain scan | 101.474 | 0 | 23 | 8 | typescript | passed | none |
| brain-stale-small | brain-stale | brain stale | 117.491 | 46 | 14 | 1 | typescript | warning | claim_20260601074135_cdfd649d: fileHash changed but rangeHash is unchanged; claim_20260601074135_a349a0c9: fileHash changed but rangeHash is unchanged |
| brain-consolidate-small | brain-consolidate | brain consolidate | 103.022 | 70 | 13 | 0 | typescript | passed | none |
| reverse-claims-small | reverse-claims | reverse claims | 24.588 | 5 | 5 | 6 | typescript | passed | none |
| jsonl-read-write-small | jsonl-read-write | jsonl read write | 7.388 | 12 | 12 | 1 | typescript | passed | none |
| range-hash-small | range-hash | range hash | 0.437 | 20 | 20 | 1 | typescript | passed | none |

## Report Paths

- latest_json: .soturail\bench\latest.json
- latest_markdown: .soturail\bench\latest.md
- versioned_json: benchmarks\reports\bench-v1.0.1.json
- versioned_markdown: benchmarks\reports\bench-v1.0.1.md
