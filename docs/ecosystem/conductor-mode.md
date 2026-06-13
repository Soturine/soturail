# SotuRail Conductor Mode

Status: **Proposed future optional mode. Not implemented in v1.4.0.**

SotuRail Core remains the CLI-first, npm-first, local-first Context OS and harness layer. A future optional mode called **SotuRail Conductor** may coordinate planning, verification and documentation workflows without replacing agent hosts.

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

A future Conductor may read a repository, create plans and use the implemented dry-run tasklet templates, generate reports, validate links, compare host exports and propose patches. Applying a patch must require explicit approval.

It must not become a chat product, unbounded fix-everything loop, central shell agent, browser agent, cloud agent or provider-specific runtime.

See [Security Boundaries](../security/security-boundaries.md), [Harness Lifecycle Rail](../rails/harness/harness-lifecycle-rail.md) and [Future Rails Index](../roadmap/future-rails-index.md).
