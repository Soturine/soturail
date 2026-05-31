# SotuRail Benchmark Rail 2 Report

SotuRail does not claim native speedups unless a local benchmark report proves them.
Native acceleration is optional. TypeScript remains the portable baseline.

schemaVersion: soturail.bench.v1
id: bench_mpu2mowi
suite: brain
version: 0.9.0
createdAt: 2026-05-31T17:46:11.730Z
platform: win32/x64
node: v24.11.1
nativeAvailable: false
engine: typescript
passed: 5
failed: 0
warnings: 3
totalDurationMs: 363.909

| case | category | operation | durationMs | recordsRead | recordsWritten | filesScanned | engine | status | warnings |
|---|---|---|---:|---:|---:|---:|---|---|---|
| brain-scan-small | brain-scan | brain scan | 102.524 | 0 | 23 | 8 | typescript | passed | none |
| brain-stale-small | brain-stale | brain stale | 122.405 | 46 | 14 | 1 | typescript | warning | claim_20260531174611_c76931a6: fileHash changed but rangeHash is unchanged; claim_20260531174611_83bbe6a7: fileHash changed but rangeHash is unchanged |
| brain-consolidate-small | brain-consolidate | brain consolidate | 106.711 | 70 | 13 | 0 | typescript | passed | none |
| reverse-claims-small | reverse-claims | reverse claims | 25.207 | 5 | 5 | 6 | typescript | passed | none |
| jsonl-read-write-small | jsonl-read-write | jsonl read write | 6.634 | 12 | 12 | 1 | typescript | passed | none |
| range-hash-small | range-hash | range hash | 0.428 | 20 | 20 | 1 | typescript | passed | none |

## Report Paths

- latest_json: .soturail\bench\latest.json
- latest_markdown: .soturail\bench\latest.md
- versioned_json: benchmarks\reports\bench-v0.9.0.json
- versioned_markdown: benchmarks\reports\bench-v0.9.0.md
