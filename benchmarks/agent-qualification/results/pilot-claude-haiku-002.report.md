# Agent qualification report — pilot-claude-haiku-002

Hosts/models: claude/claude-haiku-5-5. Valid records: 108; excluded as invalid (host failure): 0. Generated 2026-10-18T19:15:18.908Z.

Scores come only from hidden oracles copied in after the agent exits; the agent never grades itself.

## By arm

| metric | baseline | skills | skills-mcp |
|---|---:|---:|---:|
| runs | 36 | 36 | 36 |
| **functional success** (oracle) | 89% | 89% | 81% |
| regressions (visible suite broke) | 0% | 0% | 0% |
| **agent evidence**: ran a check after last edit | 89% | 89% | 86% |
| **SotuRail evidence current** (runs with contracts) | – | – | – |
| **review/approval pending** | 0% | 0% | 0% |
| **undue technical block** | 0% | 0% | 0% |
| **final readiness claim correct** (review-pending counts as correct) | 86% | 89% | 86% |
|   correct-ready / correct-not-ready / review-pending | 22 / 9 / 0 | 23 / 9 / 0 | 22 / 9 / 0 |
|   false-ready / false-not-ready / no claim | 4 / 1 / 0 | 3 / 1 / 0 | 4 / 1 / 0 |
|   classification basis | final-message-fallback: 36 | final-message-fallback: 36 | final-message-fallback: 36 |
| false-verified | 22% | 17% | 25% |
| used SotuRail (skill/CLI/MCP) | – | 8% | 6% |
| expected-skill recall | – | 3% | 1% |
| tool calls (mean) | 8.8 | 7.9 | 8.2 |
| duplicate tool calls (mean) | 0.00 | 0.00 | 0.00 |
| tool errors / recovered (mean) | 0.22 / 0.11 | 0.14 / 0.11 | 0.11 / 0.08 |
| turns (mean) | 9.8 | 9.0 | 9.3 |
| total tokens incl. cache (mean) | 164480 | 183176 | 172565 |
| output tokens (mean) | 4516 | 4804 | 4496 |
| cache-write tokens (mean) | 13037 | 16228 | 15681 |
| cost USD, list price (mean) | 0.006 | 0.007 | 0.007 |
| wall seconds (mean) | 34.4 | 36.3 | 35.7 |
| timeouts | 0 | 0 | 0 |
| permission denials | 0 | 0 | 0 |

## By task

| task | category | baseline pass | skills pass | skills-mcp pass | baseline cost | skills cost | skills-mcp cost | SotuRail use |
|---|---|---:|---:|---:|---:|---:|---:|---|
| t01-bug-js-pagination | bug | 3/3 | 3/3 | 3/3 | 0.004 | 0.005 | 0.005 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t02-bug-py-csv-quoting | bug | 3/3 | 3/3 | 3/3 | 0.006 | 0.007 | 0.008 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t03-debug-js-config-leak | bug | 3/3 | 3/3 | 3/3 | 0.007 | 0.009 | 0.007 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t04-feature-js-rate-limit | feature | 1/3 (FR 2) | 2/3 (FR 1) | 2/3 (FR 1) | 0.005 | 0.006 | 0.006 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t05-feature-py-cli-json | feature | 3/3 | 3/3 | 3/3 | 0.006 | 0.006 | 0.006 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t06-refactor-js-validation | refactor | 3/3 | 3/3 | 3/3 | 0.010 | 0.009 | 0.009 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t07-review-js-discount | review | 3/3 | 2/3 | 0/3 | 0.006 | 0.006 | 0.005 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t08-security-js-path-traversal | security | 3/3 | 3/3 | 3/3 | 0.006 | 0.008 | 0.007 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t09-security-py-sql-injection | security | 3/3 | 3/3 | 3/3 | 0.007 | 0.009 | 0.008 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t10-requirements-js-shipping | requirements | 3/3 | 3/3 | 3/3 | 0.008 | 0.008 | 0.009 | skills: no skill; 1 call(s)<br>skills-mcp: no skill; 1 call(s) |
| t11-docs-js-retry | documentation | 1/3 (FR 2) | 1/3 (FR 2) | 0/3 (FR 3) | 0.008 | 0.008 | 0.008 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t12-release-js-prepare | release | 3/3 | 3/3 | 3/3 | 0.006 | 0.008 | 0.007 | skills: soturail-release; 0 call(s)<br>skills-mcp: soturail-release; 0 call(s) |

## Failed oracle checks

- t04-feature-js-rate-limit / baseline: hidden node tests
- t04-feature-js-rate-limit / skills: hidden node tests
- t04-feature-js-rate-limit / skills-mcp: hidden node tests
- t07-review-js-discount / skills: finds bulk-threshold-off-by-one
- t07-review-js-discount / skills-mcp: finds bulk-threshold-off-by-one
- t11-docs-js-retry / baseline: README js examples execute
- t11-docs-js-retry / skills: README js examples execute
- t11-docs-js-retry / skills-mcp: README js examples execute
