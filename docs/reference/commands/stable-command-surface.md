# Stable Command Surface

SotuRail v1.0.0 froze the first stable local command surface. v1.1–v1.5 added compatible host, harness, knowledge, evidence, evaluation and governance families. v1.6 adds agent-native Skills/capability discovery, Semantic Worker candidates and the verified Change Contract lifecycle.

## Stable v1 surface

- `soturail status`
- `soturail report`
- `soturail dashboard`
- `soturail obs`
- `soturail brain`
- `soturail eval`
- `soturail bench`
- `soturail native`
- `soturail self baseline`
- `soturail self schemas --check`
- `soturail self readiness --v1`
- `soturail self code-health`
- `soturail self architecture --check`
- `soturail release check`
- `soturail workflow`
- `soturail harness`
- `soturail harness init`
- `soturail harness audit`
- `soturail session start|end`
- `soturail handoff generate`
- `soturail feature add|start|done|list`
- `soturail diagram`
- `soturail agents`
- `soturail agents matrix`
- `soturail agents doctor --host <host>`
- `soturail agents doctor --all`
- `soturail mcp exposure`
- `soturail mcp resources report`
- `soturail mcp resources host-manifest`
- `soturail knowledge estimate|compile|update|verify|list`
- `soturail evidence collect|verify|report`
- `soturail eval dataset init|run`
- `soturail eval golden|regression`
- `soturail skills template|lint|eval|report|build|fold-in`
- `soturail tasklet create|list|run --dry-run|export`
- `soturail capabilities list|describe`
- `soturail candidates record|list`
- `soturail contract create|verify|revise|attest`
- `soturail skills discover|describe|migrate`
- `soturail skills export --layout portable`
- `soturail mcp smoke`

Stable means the command should remain local, documented, covered by smoke or contract tests, and changed compatibly where possible.

## Experimental Or Planned

- `graph` and `parse` seeds.
- Real native acceleration beyond detection, candidates and compare reports.
- Extended MCP mutation tools.
- Dashboard server mode.
- Large parser integrations.
- Full Knowledge Graph runtime.
- Full Design Rail runtime.
- Autonomous skill or tasklet execution.
- SotuRail Conductor commands and autonomous/runtime behavior.

Experimental surfaces may change before promotion. They must stay local, optional and honest about limitations.

## Internal Or Advanced

- Native build commands.
- Reducer benchmark internals.
- Low-level MCP smoke and serve flows.
- Self dogfood helpers beyond the stable baseline/readiness/code-health checks.
- Raw log expansion and internal evidence stores.

Advanced commands remain useful for diagnostics, but v1.0 compatibility focuses on the stable surface above.

## Deprecated

v1.6 deprecates legacy flat Skill export, new authoring of v1.5 Skill packs and the `gemini-legacy` host alias, with removal targeted for v2.0. Existing compatibility paths remain available in the v1 line. Every deprecation must name a replacement and removal timing in release notes. See [deprecation policy](../contracts/deprecation-policy.md).

## Related Contracts

- [v1 contract](../contracts/v1-contract.md)
- [schema contracts](../schemas/schema-contracts.md)
- [migration to v1](../../getting-started/migration-v1.md)
- [agent hosts](../../rails/hosts/agent-hosts.md)
- [host matrix schema](../schemas/host-matrix-schema.md)
- [agent export contract](../contracts/agent-export-contract.md)
- [MCP host manifest](../../rails/hosts/mcp-host-manifest.md)
- [Harness Lifecycle Rail](../../rails/harness/harness-lifecycle-rail.md)
- [Security Boundaries](../../security/security-boundaries.md)
- [Conductor Mode](../../ecosystem/conductor-mode.md)
- [v1.4 commands](v1.4-commands.md)
- [v1.5 commands](v1.5-commands.md)
- [v1.6 commands](v1.6-commands.md)
