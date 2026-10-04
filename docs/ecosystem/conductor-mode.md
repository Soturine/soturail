# SotuRail Conductor Mode

Status: **Proposed future optional mode. Not implemented in v1.6.0.**

SotuRail Core is a local-first, agent-native engineering control plane. Skills/MCP are the preferred agent surface; CLI remains important for humans, CI, diagnostics and recovery. A future optional mode called **SotuRail Conductor** may coordinate planning, verification and documentation workflows without replacing agent hosts.

```txt
SotuRail
|-- Core
|   |-- context
|   |-- memory
|   |-- reports
|   |-- workflows
|   |-- evidence
|   |-- host exports
|   `-- dashboard
`-- Future optional Conductor mode
    |-- planner
    |-- verifier
    |-- reviewer
    |-- tasklet runner
    |-- evidence collector
    `-- approval gate
```

## Proposed Commands

These commands are documentation-only and do not currently exist:

```bash
soturail conductor plan
soturail conductor audit
soturail conductor propose
soturail conductor verify
soturail conductor apply --approved
```

## Safe Capability Boundary

A future Conductor may coordinate planning, verification and documentation using the existing capability, evidence and approval contracts. It must not bypass Authority/Readiness, evidence freshness or explicit approval boundaries.

It must not become a chat product, unbounded fix-everything loop, central shell agent, browser agent, cloud agent or provider-specific runtime.

See [Security Boundaries](../security/security-boundaries.md), [Harness Lifecycle Rail](../rails/harness/harness-lifecycle-rail.md) and [Future Rails Index](../roadmap/future-rails-index.md).
