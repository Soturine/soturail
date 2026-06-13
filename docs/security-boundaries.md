# Security Boundaries

SotuRail is a local-first Context OS and harness layer. Its default role is to prepare, audit and export context, state, evidence, workflows and reports.

## Safe Defaults

- Local artifacts stay local unless the user explicitly moves or publishes them.
- MCP report and host resources are read-only.
- Harness audits validate files without executing verification commands.
- Handoffs include changed-file names and summaries, not private shell history.
- Reports and exports use secret redaction helpers.
- Publishing, release creation, destructive actions and external writes remain explicit user actions.

## Out Of Scope

SotuRail is not:

- a model or cloud gateway;
- a mandatory web server or hosted workspace;
- a heavy autonomous agent runtime;
- a destructive MCP tool provider;
- a model-serving, GPU-management or personal productivity platform.

## Future Conductor Boundary

The proposed [SotuRail Conductor](conductor-mode.md) may plan, audit, propose and verify local work only behind explicit approval gates. It must not introduce an unreviewed edit loop, central shell agent, cloud agent or hidden external service.

## Related Docs

- [Security Model](security-model.md)
- [MCP](mcp.md)
- [Harness Lifecycle Rail](harness-lifecycle-rail.md)
- [Host Compatibility Rail](host-compatibility-rail.md)
- [Observability Rail](observability-rail.md)
