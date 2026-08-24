# Governance Model

Governance answers two independent questions. Authority asks whether an actor may perform a capability. Readiness asks whether engineering evidence is sufficient. SotuRail permits progression only when both pass.

| Gate | Inputs | Passing result | Failure behavior |
|---|---|---|---|
| Authority | actor, capability, side effects, approval, capability epoch | `allow` | `deny` or `unavailable` fails closed |
| Readiness | Change Contract, checks, review, fidelity, evidence freshness | `ready` | missing or stale evidence yields `not-ready` |

## GovernanceProvider

The provider contract exposes `evaluate`, `validate`, `health`, and `capabilities`.

- `NativeMinimal` is the default deterministic offline provider. It denies unknown capabilities and capabilities whose required approval is absent.
- `AGT/ACS` is an adapter boundary only in v1.5. It returns unavailable and therefore cannot authorize an action. No mandatory Microsoft runtime dependency is installed.

Provider health must distinguish healthy, degraded, and unavailable. Fallback may reduce enrichment, but never weaken a deny or silently grant authority.

## Side-effect lifecycle

Capabilities declare `none`, `local-state`, `workspace`, or `external` effects plus approval requirements. A capability epoch snapshots this metadata for the current phase. The evaluated input, contract digest, authority verdict, readiness result, workspace fingerprint, and epoch are sealed in an Execution Envelope.

Immediately before an effect, the executor recomputes the payload digest. A mismatch produces `NOT_ATTESTED`; the previous approval is not reusable. External effects still require the host, OS, service, and human permissions applicable to that operation.

## Approval is not sandboxing

The governance layer records and validates decisions. It cannot contain a hostile process, override filesystem ACLs, prevent every shell trick, or prove an external service completed an action. Those controls belong to the execution environment. SotuRail's promise is a fail-closed, inspectable decision trail—not process isolation.
