# Contracts and Verification

SotuRail separates intent, permission, engineering proof, execution, and acceptance so that one signal cannot impersonate another.

## Change Contract

`soturail.change-contract.v1` binds a stable ID to the workspace fingerprint, intended scope, risk, required checks, evidence policy, fidelity targets, and approval requirements. `contract create` persists it atomically; `contract verify` reports deterministic readiness inputs without executing hidden work.

Risk and evidence are separate. A low-risk change can still lack proof; a high-risk change can be ready only with the stronger evidence its contract requires.

## Contract lifecycle and evidence-backed readiness (v1.6)

**Baseline vs verification.** A contract's `workspaceFingerprint` is its *baseline*: the workspace it was created against, kept as immutable provenance together with `baselineHead` and a `foundationDigest`. Readiness evaluates the *current* workspace. The difference between baseline and current is the change set itself and never blocks readiness. Verdicts report both `baselineWorkspaceFingerprint` and `verifiedWorkspaceFingerprint`.

**When a revision is required** (`contract_revision_required` family of codes):

| Code | Trigger |
|---|---|
| `contract_modified` | intent, criteria, checks, risk, policy, scope, sources or lineage edited after creation (foundation digest mismatch) |
| `contract_source_changed` | a declared `--source` requirement file changed or disappeared |
| `contract_scope_exceeded` | files changed since `baselineHead` outside the declared `--scope` prefixes |
| `contract_scope_unverifiable` | scope declared but no baseline commit to diff against |
| `contract_superseded` | a newer revision supersedes this one |

`soturail contract revise <file> --reason <text> [...]` writes `<id>.r<n>.json` once (never overwritten) with `revision`, `supersedes` (previous revision, path, foundation digest, baseline fingerprint), `revisionReason` and a fresh baseline. The previous file is not modified.

**Evidence stays bound to the current workspace.** Recorded runs, runtime checks, criteria commands and human receipts count only at the current fingerprint; anything recorded before a later change is stale and must be re-run or re-attested.

**Readiness inputs.**

| Input | Class | Satisfies readiness? |
|---|---|---|
| `--check-passed`, `--criterion-passed`, `--runtime-evidence`, `--independent-review`, `--human-approved` | UNVERIFIED_ASSERTION | no — recorded under `assertions`; uncorroborated ones become `*_asserted_without_*` blockers |
| latest `soturail run` of a required check / runtime check / criterion command, exit 0, current fingerprint | RECORDED_EVIDENCE | yes |
| `soturail contract attest --kind human-approval|independent-review|criterion` | HUMAN_ATTESTATION | yes, when the receipt matches the contract revision, foundation digest and current fingerprint |
| `soturail candidates record` | AGENT_CANDIDATE | no |

Objective criteria are mapped to commands with `contract create --criterion-check <command>` (`criteriaEvidence`); semantic/manual criteria need a human `criterion` attestation. Runtime evidence requires declared `--runtime-check` commands.

Attestation receipts (`soturail.contract-attestation.v1`, `.soturail/receipts/`) are created only from an interactive terminal after typing the contract id; non-interactive callers and MCP cannot create them, and no MCP tool exists for attestation. Residual risk: SotuRail cannot cryptographically distinguish a human from an agent that fully controls an interactive terminal; host permission prompts and OS controls remain the boundary. The same applies to the existing `soturail policy approve` command.

Every verdict carries `details[]` with stable reason codes (`src/core/trust-decision.ts`).

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
