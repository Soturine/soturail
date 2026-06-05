# Host Matrix Schema

SotuRail v1.1.0 keeps the v1 matrix artifact compatible with `soturail.agents.matrix.v1` and adds the v1.1 contract id:

```json
{
  "schemaVersion": "soturail.agents.matrix.v1",
  "contractId": "soturail.agent-host-matrix.v1",
  "createdAt": "ISO-8601",
  "version": "1.1.0",
  "status": "passed|warning|failed|unknown",
  "hosts": []
}
```

Each host row preserves the v1 fields (`host`, `id`, `status`, `exportSupport`, `reportAgentSupport`, `contextPackSupport`, `mcpResourcesSupport`, `installDryRunSupport`, `knownLimitations`, `recommendedCommand`) and adds host-compatibility fields:

- `displayName`
- `priority`
- `instructionFiles`
- `contextFormats`
- `reportFormats`
- `mcpSupport`
- `skillsSupport`
- `hooksSupport`
- `installSupport`
- `mutationAllowedByDefault`
- `recommendedCommands`
- `limitations`
- `policyNotes`

## Statuses

- `stable`: covered by the local v1/v1.1 surface.
- `generic-compatible`: safe generic Markdown/context handoff, but not host-native integration.
- `legacy`: prompt/context compatibility for older or mixed host behavior.
- `experimental`: prompt-only, docs-only or role-pack-only until promoted.
- `planned`: documented future surface.
- `unknown`: not enough evidence.

## Safety

`mutationAllowedByDefault` must be `false` for every host. The matrix must not claim destructive MCP tools, shell execution through MCP, cloud telemetry or autonomous editing behavior.
