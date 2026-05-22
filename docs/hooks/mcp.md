# MCP Hook Integration

Use MCP mode when an agent host supports reviewed local MCP server configuration.

```bash
soturail hooks install --agent claude --mode mcp --dry-run
soturail mcp serve --transport stdio
```

Review generated instructions before enabling. SotuRail's MCP server exposes read-only resources and safe tools; it does not expose arbitrary shell execution.
