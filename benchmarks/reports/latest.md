# SotuRail Benchmark Report

Generated from deterministic local fixtures. No external RTK/Squeez comparison numbers are included unless a user runs optional comparison locally.

Categories:
- terminal_compression: 3 case(s)
- json_tool_payload_compression: 1 case(s)
- agent_response_compression: 5 case(s)
- knowledge_structuring: 1 case(s)

| Fixture | Category | Engine | Raw tokens | Reduced/structured tokens | compression_ratio_percent | wall_time_ms | Quality |
|---|---|---:|---:|---:|---:|---:|---|
| noisy-git-diff.txt | terminal_compression | ts | 1994 | 608 | 69.51% | 1.552 | pass |
| noisy-test-output.txt | terminal_compression | ts | 1625 | 159 | 90.22% | 1.006 | pass |
| noisy-log.txt | terminal_compression | ts | 2197 | 446 | 79.7% | 1.115 | pass |
| noisy-json.json | json_tool_payload_compression | ts | 2039 | 148 | 92.74% | 2.485 | pass |
| verbose-ai-answer-concise | agent_response_compression | ts | 694 | 99 | 85.73% | 1.236 | pass |
| verbose-ai-answer-review | agent_response_compression | ts | 694 | 101 | 85.45% | 0.445 | pass |
| verbose-ai-answer-debug | agent_response_compression | ts | 694 | 130 | 81.27% | 0.508 | pass |
| verbose-ai-answer-commit | agent_response_compression | ts | 694 | 77 | 88.9% | 0.163 | pass |
| verbose-ai-answer-docs | agent_response_compression | ts | 694 | 73 | 89.48% | 0.22 | pass |
| rules-doc-extraction | knowledge_structuring | ts | 67 | 990 | n/a | 4.65 | pass |

Includes terminal compression, agent response compression, JSON/tool payload compression, knowledge structuring and native performance readiness cases.

Knowledge-to-Rules is reported as reusable structuring, not pure compression.
