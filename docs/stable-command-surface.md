# Stable Command Surface

SotuRail v1.0.0 froze the first stable local Context OS surface. SotuRail v1.1.0 keeps that surface stable and adds Host Compatibility Rail commands for local exports, host doctors and read-only host manifests.

## Stable Surface For v1.0

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
- `soturail diagram`
- `soturail agents`
- `soturail agents matrix`
- `soturail agents doctor --host <host>`
- `soturail agents doctor --all`
- `soturail mcp exposure`
- `soturail mcp resources report`
- `soturail mcp resources host-manifest`

Stable means the command should remain local, documented, covered by smoke or contract tests, and changed compatibly where possible.

## Experimental Or Planned

- `graph` and `parse` seeds.
- Real native acceleration beyond detection, candidates and compare reports.
- Extended MCP mutation tools.
- Dashboard server mode.
- Large parser integrations.
- Full Knowledge Graph runtime.
- Full Design Rail runtime.
- Skill Rail 2.0 runtime.
- Governance and cost runtime.

Experimental surfaces may change before promotion. They must stay local, optional and honest about limitations.

## Internal Or Advanced

- Native build commands.
- Reducer benchmark internals.
- Low-level MCP smoke and serve flows.
- Self dogfood helpers beyond the stable baseline/readiness/code-health checks.
- Raw log expansion and internal evidence stores.

Advanced commands remain useful for diagnostics, but v1.0 compatibility focuses on the stable surface above.

## Deprecated

No public commands are deprecated in v1.0.0.

Future deprecations must name a replacement command, state the release that introduced the warning and include removal timing in release notes. See [deprecation policy](deprecation-policy.md).

## Related Contracts

- [v1 contract](v1-contract.md)
- [schema contracts](schema-contracts.md)
- [migration to v1](migration-v1.md)
- [agent hosts](agent-hosts.md)
- [host matrix schema](host-matrix-schema.md)
- [agent export contract](agent-export-contract.md)
- [MCP host manifest](mcp-host-manifest.md)
