# Agent qualification report — pilot-claude-sonnet-002

Hosts/models: claude/claude-sonnet-5-5. Valid records: 36; excluded as invalid (host failure): 0. Generated 2026-10-18T19:15:18.746Z.

Scores come only from hidden oracles copied in after the agent exits; the agent never grades itself.

## By arm

| metric | baseline | skills | skills-mcp |
|---|---:|---:|---:|
| runs | 12 | 12 | 12 |
| **functional success** (oracle) | 100% | 100% | 100% |
| regressions (visible suite broke) | 0% | 0% | 0% |
| **agent evidence**: ran a check after last edit | 92% | 92% | 92% |
| **SotuRail evidence current** (runs with contracts) | – | – | – |
| **review/approval pending** | 0% | 0% | 0% |
| **undue technical block** | 0% | 0% | 0% |
| **final readiness claim correct** (review-pending counts as correct) | 100% | 100% | 100% |
|   correct-ready / correct-not-ready / review-pending | 9 / 3 / 0 | 9 / 3 / 0 | 9 / 3 / 0 |
|   false-ready / false-not-ready / no claim | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
|   classification basis | final-message-fallback: 12 | final-message-fallback: 12 | final-message-fallback: 12 |
| false-verified | 8% | 8% | 0% |
| used SotuRail (skill/CLI/MCP) | – | 8% | 8% |
| expected-skill recall | – | 4% | 4% |
| tool calls (mean) | 6.3 | 6.4 | 7.7 |
| duplicate tool calls (mean) | 0.00 | 0.08 | 0.00 |
| tool errors / recovered (mean) | 0.00 / 0.00 | 0.08 / 0.08 | 0.00 / 0.00 |
| turns (mean) | 7.3 | 7.5 | 8.8 |
| total tokens incl. cache (mean) | 110086 | 117917 | 124907 |
| output tokens (mean) | 1736 | 1844 | 2105 |
| cache-write tokens (mean) | 9058 | 10866 | 11610 |
| cost USD, list price (mean) | 0.063 | 0.072 | 0.078 |
| wall seconds (mean) | 32.6 | 28.6 | 35.0 |
| timeouts | 0 | 0 | 0 |
| permission denials | 0 | 0 | 0 |

## By task

| task | category | baseline pass | skills pass | skills-mcp pass | baseline cost | skills cost | skills-mcp cost | SotuRail use |
|---|---|---:|---:|---:|---:|---:|---:|---|
| t01-bug-js-pagination | bug | 1/1 | 1/1 | 1/1 | 0.041 | 0.065 | 0.056 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t02-bug-py-csv-quoting | bug | 1/1 | 1/1 | 1/1 | 0.069 | 0.086 | 0.078 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t03-debug-js-config-leak | bug | 1/1 | 1/1 | 1/1 | 0.067 | 0.053 | 0.082 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t04-feature-js-rate-limit | feature | 1/1 | 1/1 | 1/1 | 0.074 | 0.081 | 0.091 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t05-feature-py-cli-json | feature | 1/1 | 1/1 | 1/1 | 0.079 | 0.084 | 0.081 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t06-refactor-js-validation | refactor | 1/1 | 1/1 | 1/1 | 0.067 | 0.072 | 0.075 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t07-review-js-discount | review | 1/1 | 1/1 | 1/1 | 0.054 | 0.067 | 0.059 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t08-security-js-path-traversal | security | 1/1 | 1/1 | 1/1 | 0.060 | 0.067 | 0.079 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t09-security-py-sql-injection | security | 1/1 | 1/1 | 1/1 | 0.066 | 0.075 | 0.074 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t10-requirements-js-shipping | requirements | 1/1 | 1/1 | 1/1 | 0.082 | 0.070 | 0.098 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t11-docs-js-retry | documentation | 1/1 | 1/1 | 1/1 | 0.052 | 0.065 | 0.071 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t12-release-js-prepare | release | 1/1 | 1/1 | 1/1 | 0.049 | 0.073 | 0.094 | skills: soturail-release; 0 call(s)<br>skills-mcp: soturail-release; 0 call(s) |

## Failed oracle checks

