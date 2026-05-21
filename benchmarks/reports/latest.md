# SotuRail Benchmark Report

Generated from deterministic local fixtures. No external RTK/Squeez/NTK comparison numbers are included unless a user runs optional comparison locally.

Categories:
- terminal_compression: 6 case(s)
- agent_response_compression: 3 case(s)
- knowledge_structuring: 1 case(s)
- cache_stability: 1 case(s)
- native_engine: 1 case(s)

| case_id | category | engine | raw_tokens | reduced_tokens | reduction_percent | runtime_ms | quality | notes |
|---|---|---:|---:|---:|---:|---:|---|---|
| npm-install-noisy | terminal_compression | ts | 4143 | 2364 | 42.94% | 1.372 | pass | Terminal output reducer preserved required signals. |
| vitest-failure-stacktrace | terminal_compression | ts | 1167 | 128 | 89.03% | 1.123 | pass | Terminal output reducer preserved required signals. |
| tsc-error | terminal_compression | ts | 1184 | 569 | 51.94% | 0.205 | pass | Terminal output reducer preserved required signals. |
| git-diff-multiple | terminal_compression | ts | 2006 | 628 | 68.69% | 1.028 | pass | Terminal output reducer preserved required signals. |
| git-status-many | terminal_compression | ts | 958 | 1653 | -72.55% | 0.133 | pass | Terminal output reducer preserved required signals. |
| json-tool-payload | terminal_compression | ts | 2726 | 152 | 94.42% | 2.156 | pass | Terminal output reducer preserved required signals. |
| verbose-ai-answer-concise | agent_response_compression | ts | 760 | 99 | 86.97% | 1.013 | pass | Agent response compression mode: concise. |
| verbose-ai-answer-review | agent_response_compression | ts | 760 | 101 | 86.71% | 0.457 | pass | Agent response compression mode: review. |
| readme-doc-docs | agent_response_compression | ts | 1468 | 66 | 95.5% | 0.191 | pass | Agent response compression mode: docs. |
| rules-extraction-markdown | knowledge_structuring | ts | 67 | 990 | n/a | 5.089 | pass | Knowledge-to-Rules is reusable structuring, not pure compression. |
| cache-stable-prefix | cache_stability | ts | 47413 | 47413 | n/a | 12.311 | pass | Verifies dynamic footer changes do not move stable cache-friendly prefix blocks. |
| native-engine-availability | native_engine | unavailable | 18 | 18 | n/a | 102.546 | pass | Native binary unavailable; TypeScript benchmark remains authoritative. |

Knowledge structuring cases are extraction and validation tasks, not failed compression cases.
Native engine rows never fabricate native speed numbers when the native binary is unavailable.
