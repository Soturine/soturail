---
name: soturail-release
description: "Prepare and qualify a release of a SotuRail-managed project: version and changelog consistency, preflight checks, contract and evidence verification, authority and readiness gates, then human-approved tagging and publishing. Use for release, version bump, changelog, tag or package publication tasks. Not for ordinary changes. Combine with soturail-core; add soturail-security for provenance or credential concerns."
license: Apache-2.0
metadata:
  soturail-schema: soturail.skill.v2
  soturail-uses: release.preflight contract.verify evidence.verify governance.evaluate command.run
---

# SotuRail Release

Exact SHA, green evidence, explicit approval.

## Workflow

1. **Identify** the intended release commit and version; confirm the worktree is clean.
2. **Preflight** with `release.preflight`: version consistency, changelog/release notes, package contents, provenance prerequisites.
3. **Checks.** Run the project's release gates through `command.run`; confirm CI is green for the exact SHA.
4. **Evidence and gates.** `evidence.verify` (fresh for this workspace), `contract.verify` if a release contract exists, then `governance.evaluate`. Both authority and readiness must pass.
5. **Publish only with explicit human approval**: tag, release, registry publish. Never move or recreate an existing public tag.
6. **Verify after publishing**: registry version, installed-package smoke test, attached artifacts/checksums.

## Constraints

- Publishing, tagging and pushing are external, high-consequence side effects.
- Do not lower gates to ship; report blockers instead.
- Credentials stay in the host's secret store, never in context.

## Done

Released artifacts verified, or a precise list of blockers with the last green SHA.
