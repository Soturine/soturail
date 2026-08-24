# Verified Control Plane Architecture

SotuRail is a local-first engineering control plane. It prepares verified context, records contracts and evidence, and determines engineering readiness. It does not replace the coding model, agent host, operating-system permissions, or execution runtime.

## Current v1.5 boundary

```text
IDE / CLI / CI / UI
        |
        v
Host Adapter / typed MCP
        |
        v
+-----------------------------------------+
|        SOTURAIL CONTROL PLANE           |
| Run Manifest       Capability Epoch     |
| Change Contract    Capability Registry  |
| Readiness Gate     Authority Gate       |
| NativeMinimal      GovernanceProvider   |
|          Execution Envelope             |
| Artifact Store / Registry / Lineage     |
| Verified Context / Evidence / Freshness |
+-----------------------------------------+
        |
        v
External executor or side effect
```

The TypeScript core is authoritative and offline-capable. Hosts such as Codex, Claude, IDEs, CI, and future runtimes consume the same contracts. MCP is an adapter over the canonical capability registry, not a second product surface.

## Deterministic first

Deterministic parsing, hashing, schemas, allow/deny rules, budgets, and checks run before any optional provider. Generated, reviewed, verified, runtime-observed, and human-approved are separate states. An external provider result is evidence with provenance, never ground truth by itself.

## Control sequence

1. A Run Manifest captures workspace identity, tool version, capability epoch, inputs, and explicit `UNKNOWN` or `UNAVAILABLE` facts.
2. The Change Contract declares scope, risk, required evidence, fidelity targets, and acceptance conditions.
3. The Authority Gate asks a `GovernanceProvider` whether the actor/capability may act.
4. The Readiness Gate checks the deterministic engineering prerequisites.
5. Both gates must pass. Any deny, unavailable provider, or not-ready result fails closed.
6. An Execution Envelope binds the approved payload digest, contract digest, provider verdict, workspace fingerprint, and capability epoch.
7. Execution is attested only when the executed payload digest exactly matches the evaluated digest.

## Capability epochs

The capability registry is canonical for maturity, CLI/MCP exposure, side effects, approval requirements, output schema, and security notes. An epoch snapshots its digest for one phase (`plan`, `implement`, `review`, or `release`). Epoch metadata detects drift; it does not grant operating-system authority or replace sandboxing.

## Provider neutrality

`GovernanceProvider` has an offline `NativeMinimal` implementation. The AGT/ACS adapter is a fail-closed boundary and reports unavailable until a pinned, licensed, tested upstream integration exists. The same pattern applies to future structural, dependency-doc, context-transform, runtime, registry, integration, and optional vector providers.

See [Governance Model](governance-model.md), [Artifact Model and Lineage](artifact-model-and-lineage.md), [Contracts and Verification](contracts-and-verification.md), and [Provider Architecture](provider-architecture.md).
