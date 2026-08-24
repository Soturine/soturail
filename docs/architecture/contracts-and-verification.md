# Contracts and Verification

SotuRail separates intent, permission, engineering proof, execution, and acceptance so that one signal cannot impersonate another.

## Change Contract

`soturail.change-contract.v1` binds a stable ID to the workspace fingerprint, intended scope, risk, required checks, evidence policy, fidelity targets, and approval requirements. `contract create` persists it atomically; `contract verify` reports deterministic readiness inputs without executing hidden work.

Risk and evidence are separate. A low-risk change can still lack proof; a high-risk change can be ready only with the stronger evidence its contract requires.

## Decision and clarification

The future Decision Graph records facts, assumptions, material product choices, and unresolved blockers. Facts discoverable from code, configuration, history, or current artifacts should be resolved automatically. Only a product decision that changes scope or authority should interrupt the user.

## Fidelity and anti-cheat

Generated content is not reviewed. Review is not deterministic verification. Passing a surrogate check is not proof of the requested behavior. Fidelity evaluation must connect each acceptance condition to relevant checks and flag omitted or weakened requirements. No score may upgrade missing evidence.

## Evidence policy

Evidence is classified as verified, unverified, blocked, inferred, or stale. A workspace edit invalidates prior workspace-bound evidence. Evidence Receipts are a v1.6 target: each receipt will link the contract, Execution Envelope, exact checks, verdict, observed outcome, and provenance.

## Handoffs

The handoff contract is phase-specific:

- PLAN: scoped decisions, unknowns, risks, and proposed contract.
- IMPLEMENT: changed artifacts, contract digest, tests run, and remaining blockers.
- REVIEW: exact diff/envelope, fidelity findings, and evidence freshness.
- RELEASE: version/tag/commit, reproducibility manifest, SBOM/checksums, CI status, and known limitations.

A handoff cannot claim authority it did not receive or verification it did not observe.
