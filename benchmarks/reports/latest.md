# SotuRail Benchmark Report

Generated from deterministic local fixtures. No external RTK/Squeez comparison numbers are included unless a user runs optional comparison locally.

| Fixture | Category | Engine | Raw tokens | Reduced tokens | compression_ratio_percent | wall_time_ms | Quality |
|---|---|---:|---:|---:|---:|---:|---|
| noisy-git-diff.txt | terminal | ts | 1994 | 608 | 69.51% | 1.517 | pass |
| noisy-test-output.txt | terminal | ts | 1625 | 159 | 90.22% | 1.381 | pass |
| noisy-json.json | terminal | ts | 2039 | 2143 | -5.1% | 0.641 | pass |
| noisy-log.txt | terminal | ts | 2197 | 446 | 79.7% | 0.913 | pass |
| verbose-ai-answer-concise | response | ts | 694 | 99 | 85.73% | 1.016 | pass |
| verbose-ai-answer-review | response | ts | 694 | 101 | 85.45% | 0.445 | pass |
| verbose-ai-answer-debug | response | ts | 694 | 130 | 81.27% | 0.515 | pass |
| verbose-ai-answer-commit | response | ts | 694 | 77 | 88.9% | 0.158 | pass |
| verbose-ai-answer-docs | response | ts | 694 | 73 | 89.48% | 0.173 | pass |
| rules-doc-extraction | rules | ts | 67 | 990 | -1377.61% | 4.4 | pass |

Includes terminal reducers, agent response compression and Knowledge-to-Rules cases.
