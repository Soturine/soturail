---
name: soturail-review
description: "Review a diff, branch or pull request in a SotuRail repository against its change contract and recorded evidence: check correctness, impact, tests and stale or missing verification, and report findings with source references. Use when asked to review, audit a change or judge readiness. Not for implementing the change itself. Combine with soturail-core; add soturail-security for sensitive areas."
license: Apache-2.0
metadata:
  soturail-schema: soturail.skill.v2
  soturail-uses: project.read repo.index structural.impact contract.verify evidence.verify governance.evaluate
---

# SotuRail Review

Findings with evidence, not impressions.

## Workflow

1. **Scope.** Identify the change (diff/commits) and its contract if one exists.
2. **Read** changed files and their direct callers/tests through `project.read`. Build the `impact` candidate; mark structural relations you inferred.
3. **Check the contract** with `contract.verify` and recorded evidence with `evidence.verify`. Stale evidence (workspace changed after the check) is a finding.
4. **Judge** correctness, edge cases, error handling, security-sensitive paths, test adequacy and consistency with surrounding code.
5. **Report** each finding as a `claim` candidate with file/line references and a concrete failure scenario. Separate blocking issues from suggestions.
6. **Readiness** comes from `governance.evaluate` (authority + readiness gates), not from your verdict.

## Constraints

- Do not fix silently during a review; propose or ask.
- Quote code and docs in their original language.
- "Looks fine" without evidence is reported as unverified.

## Done

Findings listed with references and severity, evidence freshness stated, readiness result reported as SotuRail returned it.
