# SotuRail Benchmark Report

Generated from deterministic local fixtures. No external RTK/Squeez/NTK comparison numbers are included unless a user runs optional comparison locally.

Categories:
- terminal_reducer: 17 case(s)
- agent_response_compression: 3 case(s)
- knowledge_structuring: 1 case(s)
- cache_stability: 1 case(s)
- native_engine: 1 case(s)
- skill_rail: 2 case(s)
- mcp: 3 case(s)
- context_pack: 1 case(s)
- agent_integration: 2 case(s)
- workflow_rail: 1 case(s)
- memory_workflow: 1 case(s)

| case_id | category | engine | raw_tokens | reduced_tokens | dedupe_tokens_saved | metadata_overhead_tokens | net_tokens_saved | reduction_percent | runtime_ms | quality | notes |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| npm_install_noisy | terminal_reducer | ts | 4143 | 3434 | 0 | 12 | 697 | 17.11% | 2.439 | pass | Terminal output reducer preserved required signals. |
| npm_test_success | terminal_reducer | ts | 1628 | 85 | 0 | 12 | 1531 | 94.78% | 1.335 | pass | Terminal output reducer preserved required signals. |
| vitest_failure | terminal_reducer | ts | 1167 | 123 | 0 | 12 | 1032 | 89.46% | 0.426 | pass | Terminal output reducer preserved required signals. |
| tsc_error | terminal_reducer | ts | 1184 | 1463 | 0 | 10 | -289 | -23.56% | 0.316 | pass | Terminal output reducer preserved required signals. |
| git_diff_large | terminal_reducer | ts | 2006 | 626 | 0 | 12 | 1368 | 68.79% | 0.99 | pass | Terminal output reducer preserved required signals. |
| git_status_many_files | terminal_reducer | ts | 958 | 1654 | 0 | 13 | -709 | -72.65% | 0.255 | pass | Terminal output reducer preserved required signals. |
| json_tool_payload | terminal_reducer | ts | 2726 | 152 | 0 | 12 | 2562 | 94.42% | 1.741 | pass | Terminal output reducer preserved required signals. |
| docker_logs_noisy | terminal_reducer | ts | 1870 | 707 | 0 | 12 | 1151 | 62.19% | 0.522 | pass | Terminal output reducer preserved required signals. |
| eslint_failure | terminal_reducer | ts | 49 | 174 | 0 | 12 | -137 | -255.1% | 0.444 | pass | Terminal output reducer preserved required signals. |
| vite_build_success | terminal_reducer | ts | 968 | 1225 | 0 | 13 | -270 | -26.55% | 0.271 | pass | Terminal output reducer preserved required signals. |
| next_build_warning | terminal_reducer | ts | 44 | 135 | 0 | 13 | -104 | -206.82% | 0.054 | pass | Terminal output reducer preserved required signals. |
| java_stacktrace | terminal_reducer | ts | 1097 | 2489 | 0 | 12 | -1404 | -126.89% | 0.386 | pass | Terminal output reducer preserved required signals. |
| maven_failure | terminal_reducer | ts | 81 | 239 | 0 | 11 | -169 | -195.06% | 0.1 | pass | Terminal output reducer preserved required signals. |
| gradle_failure | terminal_reducer | ts | 42 | 140 | 0 | 12 | -110 | -233.33% | 0.047 | pass | Terminal output reducer preserved required signals. |
| tiny_output_overhead | terminal_reducer | ts | 1 | 23 | 0 | 13 | -35 | -2200% | 0.6 | pass | Terminal output reducer preserved required signals. |
| dedupe_repeated_output | terminal_reducer | ts | 109 | 78 | 46 | 6 | 71 | 28.44% | 4.245 | pass | Block-level dedupe reused repeated safe output while preserving risky lines. |
| similar_output_dedupe | terminal_reducer | ts | 240 | 38 | 232 | 6 | 428 | 84.17% | 3.025 | pass | Experimental conservative similar-output dedupe normalized timestamps and temp paths. |
| verbose-ai-answer-concise | agent_response_compression | ts | 760 | 99 | 0 | 0 | 661 | 86.97% | 1.142 | pass | Agent response compression mode: concise. |
| verbose-ai-answer-review | agent_response_compression | ts | 760 | 101 | 0 | 0 | 659 | 86.71% | 0.483 | pass | Agent response compression mode: review. |
| readme-doc-docs | agent_response_compression | ts | 1468 | 66 | 0 | 0 | 1402 | 95.5% | 0.209 | pass | Agent response compression mode: docs. |
| rules-extraction-markdown | knowledge_structuring | ts | 67 | 990 | 0 | 0 | -923 | n/a | 3.465 | pass | Knowledge-to-Rules is reusable structuring, not pure compression. |
| cache-stable-prefix | cache_stability | ts | 84454 | 84454 | 0 | 0 | 0 | n/a | 13.243 | pass | Verifies dynamic footer changes do not move stable cache-friendly prefix blocks. |
| native-engine-availability | native_engine | unavailable | 18 | 18 | 0 | 0 | 0 | n/a | 93.292 | pass | Native binary unavailable; TypeScript benchmark remains authoritative. |
| skill-validation | skill_rail | ts | 395 | 14 | 0 | 0 | 381 | n/a | 24.795 | pass | Skill Rail benchmark validates safe schema/export behavior. |
| skill-export-claude | skill_rail | ts | 391 | 57 | 0 | 0 | 334 | n/a | 25.107 | pass | Skill Rail benchmark validates safe schema/export behavior. |
| mcp-resource-list | mcp | ts | 2 | 537 | 0 | 0 | -535 | n/a | 0.066 | pass | MCP benchmark uses local resources without arbitrary shell execution. |
| mcp-resource-read | mcp | ts | 1 | 672 | 0 | 0 | -671 | n/a | 0.553 | pass | MCP benchmark uses local resources without arbitrary shell execution. |
| mcp-smoke | mcp | ts | 2 | 35 | 0 | 0 | -33 | n/a | 1.745 | pass | MCP benchmark uses local resources without arbitrary shell execution. |
| context-pack-generic | context_pack | ts | 84993 | 85069 | 0 | 0 | -76 | n/a | 64.591 | pass | Context pack benchmark preserves stable-before-dynamic ordering. |
| hook-export-claude | agent_integration | ts | 5 | 14 | 0 | 0 | -9 | n/a | 8.293 | pass | Hook export benchmark creates reviewable local files. |
| agent-export-all | agent_integration | ts | 5 | 200 | 0 | 0 | -195 | n/a | 398.533 | pass | Agent integration benchmark exports all reviewed prompt/context artifacts. |
| workflow-rail-dry-run | workflow_rail | ts | 6 | 131 | 0 | 0 | -125 | n/a | 66.211 | pass | Workflow Rail benchmark creates local task state and plans worktree isolation without pushing or merging. |
| memory-approval-workflow | memory_workflow | ts | 9 | 430 | 0 | 0 | -421 | n/a | 108.144 | pass | Memory workflow benchmark proposes, approves and lists local memory. |

Knowledge structuring cases are extraction and validation tasks, not failed compression cases.
Native engine rows never fabricate native speed numbers when the native binary is unavailable.
