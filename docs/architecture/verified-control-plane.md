# Verified Control Plane Architecture

SotuRail is a local-first engineering control plane. It prepares verified context, records contracts and evidence, exposes self-describing capabilities, and determines engineering readiness. It does not replace the coding model, agent host, operating-system permissions or execution runtime.

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

The TypeScript core is authoritative for trust-state transitions and remains offline-capable. Hosts such as Codex, Claude, IDEs, CI and future runtimes consume the same contracts. MCP is an adapter over the canonical capability registry, not a second source of truth.

## v1.6 direction — agent-native semantic surface

```text
User in any supported language
          |
          v
AI agent / Semantic Worker
          |
          v
SotuRail Core Skill
          |
     capability discovery
          |
   +------+-------+----------------+
   |              |                |
 native facts   providers       project sources
   |              |                |
   +--------------+----------------+
                  |
          candidate artifacts
                  |
        SotuRail trust core
                  |
 provenance / freshness / policy / evidence
                  |
            readiness result
```

The agent performs natural-language interpretation and semantic synthesis. SotuRail owns the contracts and proof states.

See [Agent-Native Semantic Architecture](agent-native-semantic-architecture.md).

## Proof first, semantics delegated

Deterministic systems remain authoritative where the fact is machine-observable:

- workspace/path containment;
- Git state and hashes;
- schemas;
- package/tool versions;
- exact structured parser results;
- process exit codes;
- test/CI results;
- permissions and capability policy;
- provenance and freshness;
- evidence/readiness state transitions.

Natural-language intent, requirement meaning, ambiguity, semantic classification, project vocabulary and cross-language interpretation should not be implemented primarily through growing hardcoded keyword/regex tables.

The agent may produce `candidate`, `inferred`, `assumed` or `unverified` outputs. It cannot promote its own output to `verified`, `current`, `approved` or `ready`.

## Control sequence

1. A Run Manifest captures workspace identity, tool version, capability epoch, inputs and explicit `UNKNOWN` or `UNAVAILABLE` facts.
2. The active skill/capability surface gives the Semantic Worker only the relevant procedures and contracts.
3. The Semantic Worker may interpret the task, select capabilities and produce candidate artifacts.
4. The Change Contract declares scope, risk, required evidence, fidelity targets and acceptance conditions.
5. The Authority Gate asks a `GovernanceProvider` whether the actor/capability may act.
6. The Readiness Gate checks the engineering prerequisites against current evidence.
7. Both gates must pass. A deny, unavailable required authority provider or not-ready result fails closed.
8. An Execution Envelope binds the approved payload digest, contract digest, provider verdict, workspace fingerprint and capability epoch.
9. Execution is attested only when the executed payload digest exactly matches the evaluated digest.

## Capability epochs

The capability registry is canonical for maturity, exposed surfaces, side effects, approval requirements, output schema and security notes. v1.6 extends that model with Skill/semantic metadata without making display language part of machine identity.

An epoch snapshots the registry digest for one phase (`plan`, `implement`, `review` or `release`). Epoch metadata detects drift; it does not grant operating-system authority or replace sandboxing.

## Provider neutrality

`GovernanceProvider` has an offline `NativeMinimal` implementation. The AGT/ACS adapter remains fail-closed until a pinned, licensed, tested upstream integration exists.

The same boundary applies to future structural, dependency-doc, context-transform, runtime, registry, integration and vector providers.

A portable Skill references canonical capabilities, not provider brands. Provider replacement must not redefine skill workflow or trust state.

See [Governance Model](governance-model.md), [Artifact Model and Lineage](artifact-model-and-lineage.md), [Contracts and Verification](contracts-and-verification.md), [Provider Architecture](provider-architecture.md), and [Agent-Native Semantic Architecture](agent-native-semantic-architecture.md).
