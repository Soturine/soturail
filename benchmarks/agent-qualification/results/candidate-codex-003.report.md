# Agent qualification report — candidate-codex-003

Hosts/models: codex/null. Valid records: 36; excluded as invalid (host failure): 0. Generated 2026-10-18T19:15:18.533Z.

Scores come only from hidden oracles copied in after the agent exits; the agent never grades itself.

## By arm

| metric | baseline | skills | skills-mcp |
|---|---:|---:|---:|
| runs | 12 | 12 | 12 |
| **functional success** (oracle) | 100% | 100% | 100% |
| regressions (visible suite broke) | 0% | 0% | 0% |
| **agent evidence**: ran a check after last edit | 100% | 100% | 100% |
| **SotuRail evidence current** (runs with contracts) | – | 100% of 8 | 71% of 7 |
| **review/approval pending** | 0% | 25% | 25% |
| **undue technical block** | 0% | 0% | 0% |
| **final readiness claim correct** (review-pending counts as correct) | 100% | 100% | 100% |
|   correct-ready / correct-not-ready / review-pending | 9 / 3 / 0 | 6 / 3 / 3 | 6 / 3 / 3 |
|   false-ready / false-not-ready / no claim | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
|   classification basis | final-message-fallback: 12 | soturail-verdict-codes: 8; final-message-fallback: 4 | final-message-fallback: 5; soturail-verdict-codes: 7 |
| false-verified | 0% | 0% | 0% |
| used SotuRail (skill/CLI/MCP) | – | 100% | 100% |
| expected-skill recall | – | 97% | 97% |
| tool calls (mean) | 5.3 | 13.0 | 24.5 |
| duplicate tool calls (mean) | 0.00 | 0.33 | 0.58 |
| tool errors / recovered (mean) | 1.00 / 1.00 | 1.08 / 0.83 | 1.42 / 2.25 |
| turns (mean) | 0.0 | 0.0 | 0.0 |
| total tokens incl. cache (mean) | 87559 | 225622 | 251516 |
| output tokens (mean) | 1338 | 2276 | 2200 |
| cache-write tokens (mean) | 0 | 0 | 0 |
| cost USD, list price (mean) | – | – | – |
| wall seconds (mean) | 38.0 | 86.7 | 77.1 |
| timeouts | 0 | 0 | 0 |
| permission denials | 0 | 0 | 0 |

## By task

| task | category | baseline pass | skills pass | skills-mcp pass | baseline cost | skills cost | skills-mcp cost | SotuRail use |
|---|---|---:|---:|---:|---:|---:|---:|---|
| t01-bug-js-pagination | bug | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change,soturail-debug; 10 call(s)<br>skills-mcp: soturail-core,soturail-change,soturail-debug; 21 call(s) |
| t02-bug-py-csv-quoting | bug | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change,soturail-debug; 10 call(s)<br>skills-mcp: soturail-core,soturail-change,soturail-debug; 21 call(s) |
| t03-debug-js-config-leak | bug | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-debug,soturail-change,soturail-security; 30 call(s)<br>skills-mcp: soturail-core,soturail-debug,soturail-change,soturail-security; 25 call(s) |
| t04-feature-js-rate-limit | feature | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change; 9 call(s)<br>skills-mcp: soturail-core,soturail-change; 22 call(s) |
| t05-feature-py-cli-json | feature | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change; 6 call(s)<br>skills-mcp: soturail-core,soturail-change; 19 call(s) |
| t06-refactor-js-validation | refactor | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change; 7 call(s)<br>skills-mcp: soturail-core,soturail-change; 20 call(s) |
| t07-review-js-discount | review | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-review; 9 call(s)<br>skills-mcp: soturail-core,soturail-review; 21 call(s) |
| t08-security-js-path-traversal | security | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change,soturail-debug,soturail-security; 7 call(s)<br>skills-mcp: soturail-core,soturail-change,soturail-debug,soturail-security; 26 call(s) |
| t09-security-py-sql-injection | security | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change,soturail-security; 6 call(s)<br>skills-mcp: soturail-core,soturail-change,soturail-security; 26 call(s) |
| t10-requirements-js-shipping | requirements | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change; 7 call(s)<br>skills-mcp: soturail-core,soturail-change; 20 call(s) |
| t11-docs-js-retry | documentation | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-knowledge; 6 call(s)<br>skills-mcp: soturail-core,soturail-knowledge; 17 call(s) |
| t12-release-js-prepare | release | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-release; 8 call(s)<br>skills-mcp: soturail-core,soturail-release; 17 call(s) |

## Failed oracle checks

