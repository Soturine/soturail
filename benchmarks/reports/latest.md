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
| npm-install-noisy | terminal_compression | ts | 4143 | 2364 | 42.94% | 1.399 | pass | Terminal output reducer preserved required signals. |
| vitest-failure-stacktrace | terminal_compression | ts | 1167 | 128 | 89.03% | 0.82 | pass | Terminal output reducer preserved required signals. |
| tsc-error | terminal_compression | ts | 1184 | 569 | 51.94% | 0.185 | pass | Terminal output reducer preserved required signals. |
| git-diff-multiple | terminal_compression | ts | 2006 | 628 | 68.69% | 1.223 | pass | Terminal output reducer preserved required signals. |
| git-status-many | terminal_compression | ts | 958 | 1653 | -72.55% | 0.135 | pass | Terminal output reducer preserved required signals. |
| json-tool-payload | terminal_compression | ts | 2726 | 152 | 94.42% | 1.67 | pass | Terminal output reducer preserved required signals. |
| verbose-ai-answer-concise | agent_response_compression | ts | 760 | 99 | 86.97% | 1.177 | pass | Agent response compression mode: concise. |
| verbose-ai-answer-review | agent_response_compression | ts | 760 | 101 | 86.71% | 0.526 | pass | Agent response compression mode: review. |
| readme-doc-docs | agent_response_compression | ts | 1468 | 66 | 95.5% | 0.207 | pass | Agent response compression mode: docs. |
| rules-extraction-markdown | knowledge_structuring | ts | 67 | 990 | n/a | 4.057 | pass | Knowledge-to-Rules is reusable structuring, not pure compression. |
| cache-stable-prefix | cache_stability | ts | 67198 | 67198 | n/a | 12.206 | pass | Verifies dynamic footer changes do not move stable cache-friendly prefix blocks. |
| native-engine-availability | native_engine | unavailable | 18 | 18 | n/a | 86.953 | pass | Native binary unavailable; TypeScript benchmark remains authoritative. |
| skill-validation | skill_rail | ts | 395 | 14 | n/a | 22.472 | pass | Skill Rail benchmark validates safe schema/export behavior. |
| skill-export-claude | skill_rail | ts | 391 | 57 | n/a | 25.892 | pass | Skill Rail benchmark validates safe schema/export behavior. |
| mcp-resource-list | mcp | ts | 2 | 537 | n/a | 0.068 | pass | MCP benchmark uses local resources without arbitrary shell execution. |
| mcp-resource-read | mcp | ts | 1 | 512 | n/a | 0.402 | pass | MCP benchmark uses local resources without arbitrary shell execution. |
| context-pack-generic | context_pack | ts | 68276 | 68352 | n/a | 61.527 | pass | Context pack benchmark preserves stable-before-dynamic ordering. |
| hook-export-claude | agent_integration | ts | 5 | 14 | n/a | 7.69 | pass | Hook export benchmark creates reviewable local files. |
| memory-approval-workflow | memory_workflow | ts | 9 | 262 | n/a | 67.019 | pass | Memory workflow benchmark proposes, approves and lists local memory. |

Knowledge structuring cases are extraction and validation tasks, not failed compression cases.
Native engine rows never fabricate native speed numbers when the native binary is unavailable.
