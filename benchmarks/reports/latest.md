# SotuRail Benchmark Report

Generated from deterministic local fixtures. No external RTK/Squeez comparison numbers are included unless a user runs optional comparison locally.

| Fixture | Category | Engine | Raw tokens | Reduced tokens | compression_ratio_percent | wall_time_ms | Quality |
|---|---|---:|---:|---:|---:|---:|---|
| noisy-git-diff.txt | terminal | ts | 1994 | 608 | 69.51% | 2.099 | pass |
| noisy-test-output.txt | terminal | ts | 1625 | 159 | 90.22% | 0.992 | pass |
| noisy-json.json | terminal | ts | 2039 | 2143 | -5.1% | 0.791 | pass |
| noisy-log.txt | terminal | ts | 2197 | 446 | 79.7% | 1.528 | pass |
| verbose-ai-answer-concise | response | ts | 694 | 99 | 85.73% | 1.19 | pass |
| verbose-ai-answer-review | response | ts | 694 | 101 | 85.45% | 0.566 | pass |
| verbose-ai-answer-debug | response | ts | 694 | 130 | 81.27% | 0.6 | pass |
| verbose-ai-answer-commit | response | ts | 694 | 77 | 88.9% | 0.206 | pass |
| verbose-ai-answer-docs | response | ts | 694 | 73 | 89.48% | 0.226 | pass |
| rules-doc-extraction | rules | ts | 67 | 990 | -1377.61% | 4.744 | pass |

Includes terminal reducers, agent response compression and Knowledge-to-Rules cases.
