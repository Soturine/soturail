# MCP Report Resources

v0.10.0 exposes report artifacts as read-only MCP resource metadata.

```bash
soturail mcp resources report
soturail mcp exposure
```

Generated manifest:

```txt
.soturail/mcp/report-resources.json
```

Seed resource URIs:

```txt
soturail://reports/latest
soturail://reports/status
soturail://reports/agent
soturail://brain/status
soturail://bench/latest
soturail://native/candidates
soturail://baseline/latest
soturail://observability/timeline
```

These resources are read-only. They do not expose destructive tools, shell execution or report mutation. Content is sanitized and redaction-aware where possible.

If a host does not consume MCP resources directly, the manifest still documents the safe local report artifacts an agent can inspect.
