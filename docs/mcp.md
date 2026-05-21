# MCP Server

SotuRail v0.3.0 includes a local MCP-compatible server over stdio using JSON-RPC 2.0 style messages.

```bash
soturail mcp doctor
soturail mcp manifest
soturail mcp serve --transport stdio
```

The server exposes read-only resources such as the repo map, tree, rules, approved memory, self report, latest benchmarks and roadmap. It also exposes safe tools for indexing, progressive reads, formatting, rule checks, skill listing, context pack generation and raw log expansion.

Security defaults:

- no arbitrary shell execution;
- no `soturail run` MCP tool in v0.3.0;
- raw log expansion redacts probable secrets unless `allow_raw=true`;
- provider cache hits are never invented.
