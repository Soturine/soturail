# Agent qualification report — pilot-claude-001

Hosts/models: claude/claude-sonnet-5-5. Records: 36. Generated 2026-10-18T06:50:43.638Z.

Scores come only from hidden oracles copied in after the agent exits; the agent never grades itself.

## By arm

| metric | baseline | skills | skills-mcp |
|---|---:|---:|---:|
| runs | 12 | 12 | 12 |
| task success (oracle) | 100% | 100% | 100% |
| regressions (visible suite broke) | 0% | 0% | 0% |
| final STATUS correct | 100% | 100% | 100% |
| false-ready | 0% | 0% | 0% |
| false-verified | 0% | 8% | 0% |
| ran a check after last edit | 83% | 83% | 100% |
| used SotuRail (skill/CLI/MCP) | – | 25% | 33% |
| expected-skill recall | – | 4% | 4% |
| tool calls (mean) | 6.3 | 7.3 | 7.8 |
| duplicate tool calls (mean) | 0.00 | 0.00 | 0.08 |
| tool errors / recovered (mean) | 0.08 / 0.08 | 0.00 / 0.00 | 0.00 / 0.00 |
| turns (mean) | 7.3 | 8.4 | 8.9 |
| total tokens incl. cache (mean) | 118128 | 123928 | 128585 |
| output tokens (mean) | 1904 | 2002 | 2094 |
| cache-write tokens (mean) | 9101 | 11223 | 11552 |
| cost USD, list price (mean) | 0.065 | 0.076 | 0.078 |
| wall seconds (mean) | 23.8 | 22.8 | 23.4 |
| timeouts | 0 | 0 | 0 |
| permission denials | 0 | 0 | 0 |

## By task

| task | category | baseline pass | skills pass | skills-mcp pass | baseline cost | skills cost | skills-mcp cost | SotuRail use |
|---|---|---:|---:|---:|---:|---:|---:|---|
| t01-bug-js-pagination | bug | 1/1 | 1/1 | 1/1 | 0.046 | 0.058 | 0.061 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t02-bug-py-csv-quoting | bug | 1/1 | 1/1 | 1/1 | 0.066 | 0.080 | 0.097 | skills: no skill; 3 call(s)<br>skills-mcp: no skill; 4 call(s) |
| t03-debug-js-config-leak | bug | 1/1 | 1/1 | 1/1 | 0.068 | 0.067 | 0.071 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t04-feature-js-rate-limit | feature | 1/1 | 1/1 | 1/1 | 0.097 | 0.079 | 0.092 | skills: no skill; 1 call(s)<br>skills-mcp: no skill; 1 call(s) |
| t05-feature-py-cli-json | feature | 1/1 | 1/1 | 1/1 | 0.064 | 0.084 | 0.080 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t06-refactor-js-validation | refactor | 1/1 | 1/1 | 1/1 | 0.066 | 0.070 | 0.074 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t07-review-js-discount | review | 1/1 | 1/1 | 1/1 | 0.048 | 0.058 | 0.062 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t08-security-js-path-traversal | security | 1/1 | 1/1 | 1/1 | 0.062 | 0.103 | 0.066 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t09-security-py-sql-injection | security | 1/1 | 1/1 | 1/1 | 0.066 | 0.068 | 0.074 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t10-requirements-js-shipping | requirements | 1/1 | 1/1 | 1/1 | 0.093 | 0.095 | 0.096 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 0 call(s) |
| t11-docs-js-retry | documentation | 1/1 | 1/1 | 1/1 | 0.051 | 0.077 | 0.079 | skills: no skill; 0 call(s)<br>skills-mcp: no skill; 1 call(s) |
| t12-release-js-prepare | release | 1/1 | 1/1 | 1/1 | 0.053 | 0.067 | 0.083 | skills: soturail-release; 0 call(s)<br>skills-mcp: soturail-release; 0 call(s) |

## Failed oracle checks

