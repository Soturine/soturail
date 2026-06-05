# MCP Host Manifest

SotuRail v1.1.0 adds a read-only host manifest for agent hosts that can inspect local MCP-style resources.

```bash
soturail mcp resources host-manifest --host codex
soturail mcp resources host-manifest --host codex --json
```

Generated files:

```txt
.soturail/mcp/host-manifest.json
.soturail/mcp/host-manifests/<host>.json
```

Schema:

```json
{
  "schemaVersion": "soturail.mcp.host-manifest.v1",
  "version": "1.1.0",
  "host": "codex",
  "mode": "read-only",
  "mutationAllowed": false,
  "arbitraryShellExecutionExposed": false,
  "resources": []
}
```

Resources include status, report, agent report, Project Brain brief, schema check, v1 readiness, benchmark, native candidates, baseline, dashboard, host export and host doctor artifacts when present.

The manifest does not expose `.soturail/raw`, shell execution, write tools or destructive MCP tools. Missing artifacts are warnings with next commands, not crashes.
