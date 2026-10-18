# Agent Qualification Suite

Measures the same coding agent **with and without SotuRail** on small, realistic engineering tasks, scored only by hidden oracles. Plan, metrics, budget and promotion criteria: [v1.7 Real-Agent Qualification Baseline](../../docs/audits/v1.7.0-real-agent-qualification-baseline.md).

This is a repository tool, not a shipped CLI surface.

## Layout

```text
tasks/<id>/
  task.json      prompt, category, stack, locale, visible test command, oracle command, expected skills
  repo/          fixture repository given to the agent
  branch/        optional overlay committed on a branch (review tasks)
  oracle/        hidden checks, copied into <workspace>/.oracle/ only after the agent exits
  reference/     reference solution (+ FINAL.md: the correct final claim) — positive control
  mutants/<n>/   plausible-but-wrong solutions the oracle must reject
harness/
  oracle-lib.mjs       oracle helpers (functional / claim / informational checks)
  lib.mjs              workspace + arm setup, host adapters, transcript parsing, scoring
  validate-oracles.mjs negative/positive/mutant controls — no agent, runs in CI
  run.mjs              tasks × arms × repetitions with a real agent
  report.mjs           aggregates records into <run>.summary.json and <run>.report.md
results/<run-id>/      run.json + one directory per run (record.json, final.md, diff.patch)
```

## Tasks

| id | category | stack | prompt locale | what makes it hard |
|---|---|---|---|---|
| t01 | bug | Node | en | partial last page; visible tests only cover page 1 |
| t02 | bug | Python | pt-BR | RFC 4180 quoting, escaped quotes, no new dependencies |
| t03 | bug/debug | Node | en | shared-state mutation; symptom patch at the call site is rejected |
| t04 | feature | Node | en | per-key overrides + `remaining()` without consuming budget; README update |
| t05 | feature | Python | ja | JSON output without changing default text output; Unicode |
| t06 | refactor | Node | en | behavior-preserving extraction, characterization oracle + single-definition check |
| t07 | review | Node | en | two seeded defects on a branch; source must stay untouched; correct claim is NOT_READY |
| t08 | security | Node | en | path traversal incl. encoded/backslash/absolute; `..` inside names stays legal |
| t09 | security | Python | en | SQL injection in two functions; apostrophes must keep working |
| t10 | requirements | Node | es | one self-contradictory rule must be recorded, not guessed; correct claim is NOT_READY |
| t11 | documentation | Node | en | README examples must execute against the real code; code must not change |
| t12 | release | Node | en | changelog claims a fix the code lacks; READY is correct only if the suite passes |

## Arms

- `baseline` — fixture only; any `soturail` on `PATH` is removed.
- `skills` — the documented quickstart with the **published** package: `soturail init`, `soturail index`, `soturail skills export --target <host> --layout portable --install`, committed before the agent starts.
- `skills-mcp` — `skills` plus the SotuRail MCP server registered for the session.

Every arm gets the same prompt (which never mentions SotuRail), model, limits and permission mode. The prompt asks for two trailing lines, `STATUS: READY|NOT_READY` and `VERIFIED: yes|no`, which feed the false-ready and false-verified metrics.

## Usage

```bash
# oracle quality gate (no agent, ~35 s)
node benchmarks/agent-qualification/harness/validate-oracles.mjs

# real runs (costs money / plan quota)
node benchmarks/agent-qualification/harness/run.mjs --host claude --model sonnet \
  --tasks all --arms baseline,skills --reps 1 --max-budget 3 --timeout-min 20 --parallel 2 --run-id pilot-claude-001
node benchmarks/agent-qualification/harness/report.mjs pilot-claude-001
```

Hosts: `claude` (Claude Code, `-p --output-format stream-json`) and `codex` (`codex exec --json`). Binaries are auto-detected from the VS Code extensions or set with `QUAL_CLAUDE_BIN` / `QUAL_CODEX_BIN`. Re-running the same `--run-id` skips finished runs.

## Isolation

- Each run uses a fresh workspace under the OS temp directory, outside this repository.
- Claude: `--setting-sources project`, `--strict-mcp-config`, `--no-session-persistence`, hard `--max-budget-usd`.
- Codex: a temporary `CODEX_HOME` holding only credentials (deleted after the run) — no user memories, `AGENTS.md`, plugins or MCP servers.
- Oracles and reference solutions never enter the workspace before the agent exits.
- Raw transcripts stay local (git-ignored); every record stores the transcript sha256.

## Limits

Small hand-built sample, Node/Python only, headless (no user interaction), list-price cost from Claude only (Codex reports tokens). Built-in host skills (for example Claude Code's own `debug`/`verify`) are present in every arm. Results indicate direction; promotion requires the repetition criteria in the baseline document.
