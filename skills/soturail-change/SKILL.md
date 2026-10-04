---
name: soturail-change
description: "Plan, implement and verify a code or configuration change in a SotuRail repository: scope it in a change contract, gather only the needed context, check structural impact and dependency docs, then prove it with recorded checks. Use for features, fixes and refactors. Not for read-only questions, pure reviews or releases. Combine with soturail-core; add soturail-debug, soturail-security or soturail-review when the task needs them."
license: Apache-2.0
metadata:
  soturail-schema: soturail.skill.v2
  soturail-uses: context.select project.read repo.index structural.impact dependency.docs contract.create contract.verify command.run evidence.collect evidence.verify
---

# SotuRail Change

Smallest sufficient change, proven by evidence.

## Workflow

1. **Clarify intent.** Restate the goal in your own words. If acceptance is ambiguous and the sources cannot settle it, record a `question` candidate and ask; otherwise proceed.
2. **Contract.** For non-trivial changes create a change contract (`contract.create`) with scope, risk, acceptance criteria and the checks that will prove it.
3. **Context.** Choose files from task meaning; use `context.select` only as a lexical hint. Read through `project.read`. Prefer the existing pattern and code already in the repository over new abstractions.
4. **Impact.** List affected files, symbols and tests as an `impact` candidate. `structural.impact` is currently unavailable — build the candidate from `repo.index` and reads, and mark it `inferred`.
5. **Dependencies.** When behavior depends on a library version, use version-matched upstream docs. `dependency.docs` is unavailable: cite the source and version you used.
6. **Implement** the change. Keep paths, identifiers and commands exact; match the surrounding code style.
7. **Verify** with `command.run` (typecheck, focused tests, linters the project uses), then `evidence.collect` and `contract.verify`.

## Constraints

- Do not widen scope silently; propose follow-ups as candidates.
- Dependency installation, deleting data, pushing or publishing need explicit human approval.
- A passing check you did not record is not evidence.

## Done

Change implemented, contract checks recorded and green (or blockers reported), impact candidate listed, unverified parts stated.
