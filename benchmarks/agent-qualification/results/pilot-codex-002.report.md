# Agent qualification report — pilot-codex-002

Hosts/models: codex/null. Records: 36. Generated 2026-10-18T07:12:11.157Z.

Scores come only from hidden oracles copied in after the agent exits; the agent never grades itself.

## By arm

| metric | baseline | skills | skills-mcp |
|---|---:|---:|---:|
| runs | 12 | 12 | 12 |
| task success (oracle) | 92% | 100% | 100% |
| regressions (visible suite broke) | 0% | 0% | 0% |
| final STATUS correct | 100% | 58% | 58% |
| false-ready | 0% | 0% | 0% |
| false-verified | 8% | 17% | 8% |
| false-not-ready (correct work reported not ready) | 0% | 42% | 42% |
|   reasons | – | soturail-stale-evidence: 5 | soturail-stale-evidence: 5 |
| ran a check after last edit | 100% | 83% | 92% |
| used SotuRail (skill/CLI/MCP) | – | 100% | 100% |
| expected-skill recall | – | 97% | 97% |
| tool calls (mean) | 5.5 | 11.3 | 23.8 |
| duplicate tool calls (mean) | 0.00 | 0.00 | 1.17 |
| tool errors / recovered (mean) | 1.25 / 1.25 | 1.92 / 1.08 | 1.67 / 2.25 |
| turns (mean) | 0.0 | 0.0 | 0.0 |
| total tokens incl. cache (mean) | 94461 | 240616 | 290536 |
| output tokens (mean) | 1467 | 2223 | 2466 |
| cache-write tokens (mean) | 0 | 0 | 0 |
| cost USD, list price (mean) | – | – | – |
| wall seconds (mean) | 44.2 | 110.1 | 102.2 |
| timeouts | 0 | 0 | 0 |
| permission denials | 0 | 0 | 0 |

## By task

| task | category | baseline pass | skills pass | skills-mcp pass | baseline cost | skills cost | skills-mcp cost | SotuRail use |
|---|---|---:|---:|---:|---:|---:|---:|---|
| t01-bug-js-pagination | bug | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change,soturail-debug; 9 call(s)<br>skills-mcp: soturail-core,soturail-change,soturail-debug; 22 call(s) |
| t02-bug-py-csv-quoting | bug | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change,soturail-debug; 8 call(s)<br>skills-mcp: soturail-core,soturail-change,soturail-debug; 22 call(s) |
| t03-debug-js-config-leak | bug | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-debug,soturail-change,soturail-security; 14 call(s)<br>skills-mcp: soturail-core,soturail-debug,soturail-change,soturail-security; 30 call(s) |
| t04-feature-js-rate-limit | feature | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change; 7 call(s)<br>skills-mcp: soturail-core,soturail-change; 18 call(s) |
| t05-feature-py-cli-json | feature | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change; 9 call(s)<br>skills-mcp: soturail-core,soturail-change; 15 call(s) |
| t06-refactor-js-validation | refactor | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change; 8 call(s)<br>skills-mcp: soturail-core,soturail-change; 23 call(s) |
| t07-review-js-discount | review | 0/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-review; 10 call(s)<br>skills-mcp: soturail-core,soturail-review; 24 call(s) |
| t08-security-js-path-traversal | security | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change,soturail-debug,soturail-security; 7 call(s)<br>skills-mcp: soturail-core,soturail-change,soturail-debug,soturail-security; 9 call(s) |
| t09-security-py-sql-injection | security | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change,soturail-security; 8 call(s)<br>skills-mcp: soturail-core,soturail-change,soturail-security; 23 call(s) |
| t10-requirements-js-shipping | requirements | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-change; 7 call(s)<br>skills-mcp: soturail-core,soturail-change; 18 call(s) |
| t11-docs-js-retry | documentation | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-knowledge; 7 call(s)<br>skills-mcp: soturail-core,soturail-knowledge; 26 call(s) |
| t12-release-js-prepare | release | 1/1 | 1/1 | 1/1 | – | – | – | skills: soturail-core,soturail-release; 9 call(s)<br>skills-mcp: soturail-core,soturail-release; 15 call(s) |

## Failed oracle checks

- t07-review-js-discount / baseline: review.json is a JSON array; finds bulk-threshold-off-by-one; finds unawaited-save
