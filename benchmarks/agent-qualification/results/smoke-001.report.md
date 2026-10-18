# Agent qualification report — smoke-001

Hosts/models: claude/claude-sonnet-5-5. Records: 2. Generated 2026-10-18T06:37:40.980Z.

Scores come only from hidden oracles copied in after the agent exits; the agent never grades itself.

## By arm

| metric | baseline | skills |
|---|---:|---:|
| runs | 1 | 1 |
| task success (oracle) | 100% | 100% |
| regressions (visible suite broke) | 0% | 0% |
| final STATUS correct | 100% | 100% |
| false-ready | 0% | 0% |
| false-verified | 0% | 0% |
| ran a check after last edit | 100% | 100% |
| used SotuRail (skill/CLI/MCP) | – | 0% |
| expected-skill recall | – | 0% |
| tool calls (mean) | 4.0 | 5.0 |
| duplicate tool calls (mean) | 0.00 | 0.00 |
| tool errors / recovered (mean) | 0.00 / 0.00 | 0.00 / 0.00 |
| turns (mean) | 5.0 | 6.0 |
| total tokens incl. cache (mean) | 86623 | 91829 |
| output tokens (mean) | 742 | 892 |
| cache-write tokens (mean) | 7782 | 9220 |
| cost USD, list price (mean) | 0.046 | 0.054 |
| wall seconds (mean) | 13.9 | 11.5 |
| timeouts | 0 | 0 |
| permission denials | 0 | 0 |

## By task

| task | category | baseline pass | skills pass | baseline cost | skills cost | SotuRail use |
|---|---|---:|---:|---:|---:|---|
| t01-bug-js-pagination | bug | 1/1 | 1/1 | 0.046 | 0.054 | skills: no skill; 0 call(s) |

## Failed oracle checks

