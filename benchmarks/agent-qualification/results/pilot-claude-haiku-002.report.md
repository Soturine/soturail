# Agent qualification report — pilot-claude-haiku-002

Hosts/models: claude/claude-haiku-5-5. Records: 36. Generated 2026-10-18T07:30:30.129Z.

Scores come only from hidden oracles copied in after the agent exits; the agent never grades itself.

## By arm

| metric | baseline | skills | skills-mcp |
|---|---:|---:|---:|
| runs | 12 | 12 | 12 |
| task success (oracle) | 83% | 100% | 83% |
| regressions (visible suite broke) | 0% | 0% | 0% |
| final STATUS correct | 83% | 100% | 92% |
| false-ready | 17% | 0% | 8% |
| false-verified | 25% | 17% | 25% |
| false-not-ready (correct work reported not ready) | 0% | 0% | 0% |
|   reasons | – | – | – |
| ran a check after last edit | 92% | 83% | 83% |
| used SotuRail (skill/CLI/MCP) | – | 8% | 0% |
| expected-skill recall | – | 4% | 0% |
| tool calls (mean) | 8.5 | 8.6 | 8.1 |
| duplicate tool calls (mean) | 0.00 | 0.00 | 0.00 |
| tool errors / recovered (mean) | 0.17 / 0.08 | 0.17 / 0.17 | 0.08 / 0.08 |
| turns (mean) | 9.5 | 9.6 | 9.1 |
| total tokens incl. cache (mean) | 164604 | 186569 | 175897 |
| output tokens (mean) | 4659 | 5083 | 4728 |
| cache-write tokens (mean) | 13189 | 16375 | 15977 |
| cost USD, list price (mean) | 0.007 | 0.008 | 0.007 |
| wall seconds (mean) | 37.2 | 40.1 | 38.0 |
| timeouts | 0 | 0 | 0 |
| permission denials | 0 | 0 | 0 |

## By task

| task | category | baseline pass | skills pass | skills-mcp pass | baseline cost | skills cost | skills-mcp cost | SotuRail use |
|---|---|---:|---:|---:|---:|---:|---:|---|
| t01-bug-js-pagination | bug | 1/1 | 1/1 | 1/1 | 0.004 | 0.005 | 0.005 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t02-bug-py-csv-quoting | bug | 1/1 | 1/1 | 1/1 | 0.005 | 0.007 | 0.009 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t03-debug-js-config-leak | bug | 1/1 | 1/1 | 1/1 | 0.007 | 0.008 | 0.006 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t04-feature-js-rate-limit | feature | 0/1 (FR 1) | 1/1 | 1/1 | 0.006 | 0.005 | 0.007 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t05-feature-py-cli-json | feature | 1/1 | 1/1 | 1/1 | 0.005 | 0.006 | 0.006 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t06-refactor-js-validation | refactor | 1/1 | 1/1 | 1/1 | 0.009 | 0.009 | 0.009 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t07-review-js-discount | review | 1/1 | 1/1 | 0/1 | 0.008 | 0.006 | 0.005 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t08-security-js-path-traversal | security | 1/1 | 1/1 | 1/1 | 0.006 | 0.007 | 0.007 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t09-security-py-sql-injection | security | 1/1 | 1/1 | 1/1 | 0.007 | 0.011 | 0.008 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t10-requirements-js-shipping | requirements | 1/1 | 1/1 | 1/1 | 0.009 | 0.008 | 0.009 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t11-docs-js-retry | documentation | 0/1 (FR 1) | 1/1 | 0/1 (FR 1) | 0.008 | 0.009 | 0.007 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t12-release-js-prepare | release | 1/1 | 1/1 | 1/1 | 0.005 | 0.008 | 0.008 | skills: soturail-release; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |

## Failed oracle checks

- t04-feature-js-rate-limit / baseline: hidden node tests
- t07-review-js-discount / skills-mcp: finds bulk-threshold-off-by-one
- t11-docs-js-retry / baseline: README js examples execute
- t11-docs-js-retry / skills-mcp: README js examples execute
