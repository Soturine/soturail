# MCP Examples

These files are one-message JSON-RPC examples for `soturail mcp serve --transport stdio`.

Run:

```bash
soturail mcp serve --transport stdio
```

Then paste one JSON object per line. The server responds with one JSON-RPC response per line.

Safety notes:

- MCP does not expose arbitrary shell execution by default.
- `soturail.run` is not listed as an MCP tool.
- Raw log expansion redacts probable secrets unless `allow_raw=true`.
