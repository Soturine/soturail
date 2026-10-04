# Contracts and Verification

SotuRail separates intent, permission, engineering proof, execution, and acceptance so that one signal cannot impersonate another.

## Change Contract

`soturail.change-contract.v1` binds a stable ID to the workspace fingerprint, intended scope, risk, required checks, evidence policy, fidelity targets, and approval requirements. `contract create` persists it atomically; `contract verify` reports deterministic readiness inputs without executing hidden work.

Risk and evidence are separate. A low-risk change can still lack proof; a high-risk change can be ready only with the stronger evidence its contract requires.

## Evidence-backed readiness (v1.6)

`soturail contract verify` builds its readiness snapshot from recorded evidence (`buildReadinessSnapshot`):

- a required check counts only when the latest `soturail run` of exactly that command exited 0 against the **current** workspace fingerprint (`checkEvidence[].state`: `current-pass`, `current-fail`, `stale`, `missing`);
- `--check-passed` is recorded as a caller assertion; an assertion without a current passing run is a blocker (`check_asserted_without_evidence`). Before v1.6 the flag alone satisfied the check and freshness was hard-coded to `current` — that let an agent reach `ready` by asserting;
- `--criterion-passed`, `--runtime-evidence`, `--independent-review` and `--human-approved` remain caller attestations and are echoed under `assertions`;
- every verdict carries `details[]` with stable reason codes (`src/core/trust-decision.ts`) next to the existing `reasons[]`.

Semantic Worker candidates (`soturail candidates`) never enter the snapshot. `evidence collect` reports them under `semanticCandidates` with `countsAsEvidence: false`.

Known product decision pending: a contract is bound to the fingerprint at creation, so a contract created *before* implementation reports `workspace_stale` after it. Re-binding rules (for example re-baselining scope after review) are not changed silently in v1.6.

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
