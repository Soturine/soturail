# SotuRail Benchmark Report

Generated from deterministic local fixtures. No external RTK/Squeez/NTK comparison numbers are included unless a user runs optional comparison locally.

Categories:
- terminal_compression: 6 case(s)
- agent_response_compression: 3 case(s)
- knowledge_structuring: 1 case(s)
- cache_stability: 1 case(s)
- native_engine: 1 case(s)
- skill_rail: 2 case(s)
- mcp: 2 case(s)
- context_pack: 1 case(s)
- agent_integration: 1 case(s)
- memory_workflow: 1 case(s)

| case_id | category | engine | raw_tokens | reduced_tokens | reduction_percent | runtime_ms | quality | notes |
|---|---|---:|---:|---:|---:|---:|---|---|
| npm-install-noisy | terminal_compression | ts | 4143 | 2364 | 42.94% | 1.509 | pass | Terminal output reducer preserved required signals. |
| vitest-failure-stacktrace | terminal_compression | ts | 1167 | 128 | 89.03% | 1.24 | pass | Terminal output reducer preserved required signals. |
| tsc-error | terminal_compression | ts | 1184 | 569 | 51.94% | 0.322 | pass | Terminal output reducer preserved required signals. |
| git-diff-multiple | terminal_compression | ts | 2006 | 628 | 68.69% | 1.06 | pass | Terminal output reducer preserved required signals. |
| git-status-many | terminal_compression | ts | 958 | 1653 | -72.55% | 0.256 | pass | Terminal output reducer preserved required signals. |
| json-tool-payload | terminal_compression | ts | 2726 | 152 | 94.42% | 1.746 | pass | Terminal output reducer preserved required signals. |
| verbose-ai-answer-concise | agent_response_compression | ts | 760 | 99 | 86.97% | 2.015 | pass | Agent response compression mode: concise. |
| verbose-ai-answer-review | agent_response_compression | ts | 760 | 101 | 86.71% | 0.5 | pass | Agent response compression mode: review. |
| readme-doc-docs | agent_response_compression | ts | 1468 | 66 | 95.5% | 0.225 | pass | Agent response compression mode: docs. |
| rules-extraction-markdown | knowledge_structuring | ts | 67 | 990 | n/a | 5.881 | pass | Knowledge-to-Rules is reusable structuring, not pure compression. |
| cache-stable-prefix | cache_stability | ts | 64843 | 64843 | n/a | 13.265 | pass | Verifies dynamic footer changes do not move stable cache-friendly prefix blocks. |
| native-engine-availability | native_engine | unavailable | 18 | 18 | n/a | 91.772 | pass | Native binary unavailable; TypeScript benchmark remains authoritative. |
| skill-validation | skill_rail | ts | 73 | 14 | n/a | 20.815 | pass | Skill Rail benchmark validates safe schema/export behavior. |
| skill-export-claude | skill_rail | ts | 71 | 46 | n/a | 20.34 | pass | Skill Rail benchmark validates safe schema/export behavior. |
| mcp-resource-list | mcp | ts | 2 | 537 | n/a | 0.054 | pass | MCP benchmark uses local resources without arbitrary shell execution. |
| mcp-resource-read | mcp | ts | 1 | 433 | n/a | 0.334 | pass | MCP benchmark uses local resources without arbitrary shell execution. |
| context-pack-generic | context_pack | ts | 66280 | 66355 | n/a | 58.499 | pass | Context pack benchmark preserves stable-before-dynamic ordering. |
| hook-export-claude | agent_integration | ts | 5 | 14 | n/a | 8.324 | pass | Hook export benchmark creates reviewable local files. |
| memory-approval-workflow | memory_workflow | ts | 9 | 178 | n/a | 70.884 | pass | Memory workflow benchmark proposes, approves and lists local memory. |

Knowledge structuring cases are extraction and validation tasks, not failed compression cases.
Native engine rows never fabricate native speed numbers when the native binary is unavailable.
