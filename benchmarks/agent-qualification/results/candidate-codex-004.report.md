# Agent qualification report — candidate-codex-004

Hosts/models: codex/null. Valid records: 24; excluded as invalid (host failure): 12 (You’ve hit your usage limit). Generated 2026-10-18T19:15:18.637Z.

Scores come only from hidden oracles copied in after the agent exits; the agent never grades itself.

## By arm

| metric | baseline | skills | skills-mcp |
|---|---:|---:|---:|
| runs | 8 | 8 | 8 |
| **functional success** (oracle) | 100% | 100% | 100% |
| regressions (visible suite broke) | 0% | 0% | 0% |
| **agent evidence**: ran a check after last edit | 100% | 100% | 100% |
| **SotuRail evidence current** (runs with contracts) | – | 100% of 4 | 100% of 3 |
| **review/approval pending** | 0% | 13% | 13% |
| **undue technical block** | 0% | 0% | 0% |
| **final readiness claim correct** (review-pending counts as correct) | 100% | 100% | 100% |
|   correct-ready / correct-not-ready / review-pending | 7 / 1 / 0 | 6 / 1 / 1 | 6 / 1 / 1 |
|   false-ready / false-not-ready / no claim | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
|   classification basis | final-message-fallback: 8 | final-message-fallback: 4; soturail-verdict-codes: 4 | final-message-fallback: 5; soturail-verdict-codes: 3 |
| false-verified | 0% | 0% | 0% |
| used SotuRail (skill/CLI/MCP) | – | 100% | 100% |
| expected-skill recall | – | 100% | 100% |
| tool calls (mean) | 5.5 | 12.1 | 16.5 |
| duplicate tool calls (mean) | 0.00 | 0.38 | 0.50 |
| tool errors / recovered (mean) | 1.00 / 1.00 | 1.63 / 1.38 | 1.25 / 1.50 |
| turns (mean) | 0.0 | 0.0 | 0.0 |
| total tokens incl. cache (mean) | 92058 | 204073 | 214210 |
| output tokens (mean) | 1403 | 2234 | 2013 |
| cache-write tokens (mean) | 0 | 0 | 0 |
| cost USD, list price (mean) | – | – | – |
| wall seconds (mean) | 42.5 | 82.1 | 70.3 |
| timeouts | 0 | 0 | 0 |
| permission denials | 0 | 0 | 0 |

## By task

| task | category | baseline pass | skills pass | skills-mcp pass | baseline cost | skills cost | skills-mcp cost | SotuRail use |
|---|---|---:|---:|---:|---:|---:|---:|---|
| t01-bug-js-pagination | bug | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change,soturail-debug; 4 call(s)<br>skills-mcp: soturail-core,soturail-change,soturail-debug; 15 call(s) |
| t02-bug-py-csv-quoting | bug | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change,soturail-debug; 3 call(s)<br>skills-mcp: soturail-core,soturail-change,soturail-debug; 9 call(s) |
| t03-debug-js-config-leak | bug | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-debug,soturail-change,soturail-security; 14 call(s)<br>skills-mcp: soturail-core,soturail-debug,soturail-change,soturail-security; 22 call(s) |
| t04-feature-js-rate-limit | feature | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change; 6 call(s)<br>skills-mcp: soturail-core,soturail-change; 14 call(s) |
| t05-feature-py-cli-json | feature | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change; 6 call(s)<br>skills-mcp: soturail-core,soturail-change; 9 call(s) |
| t06-refactor-js-validation | refactor | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change; 4 call(s)<br>skills-mcp: soturail-core,soturail-change; 11 call(s) |
| t07-review-js-discount | review | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-review; 12 call(s)<br>skills-mcp: soturail-core,soturail-review; 8 call(s) |
| t08-security-js-path-traversal | security | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change,soturail-debug,soturail-security; 9 call(s)<br>skills-mcp: soturail-core,soturail-change,soturail-security; 18 call(s) |

## Failed oracle checks

