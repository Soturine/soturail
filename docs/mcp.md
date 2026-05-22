# MCP Server

SotuRail includes a local MCP-compatible server over stdio using JSON-RPC 2.0 style messages. It is designed for local context access, not remote execution.

```bash
soturail mcp doctor
soturail mcp manifest
soturail mcp config --agent generic
soturail mcp smoke
soturail mcp serve --transport stdio
```

The server exposes read-only resources such as the repo map, tree, rules, approved memory, self report, latest benchmarks and roadmap. It also exposes safe tools for indexing, progressive reads, formatting, rule checks, skill listing, context pack generation and raw log expansion.

## Copyable JSON-RPC Examples

Send one JSON object per line to `soturail mcp serve --transport stdio`.

Initialize:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"clientInfo":{"name":"manual-smoke","version":"0.1.0"}}}
```

List resources:

```json
{"jsonrpc":"2.0","id":2,"method":"resources/list"}
```

Read the repo map:

```json
{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"soturail://repo-map"}}
```

List tools:

```json
{"jsonrpc":"2.0","id":4,"method":"tools/list"}
```

The same payloads are available under `examples/mcp/`.

## Safe Tools

Default tools include:

- `soturail.index`
- `soturail.read`
- `soturail.format`
- `soturail.rules.check`
- `soturail.skills.list`
- `soturail.context.pack`
- `soturail.expand`

Security defaults:

- no arbitrary shell execution;
- no `soturail.run` MCP tool by default;
- raw log expansion redacts probable secrets unless `allow_raw=true`;
- provider cache hits are never invented.

## Host Config Helpers

`soturail mcp config --agent claude|cursor|generic` writes a reviewed stdio snippet under `.soturail/exports/mcp/<agent>/mcp-config.json`.

The snippet runs:

```bash
soturail mcp serve --transport stdio
```

It does not assume a global application config path. Review it before adding it to an agent host.

`soturail mcp smoke` verifies `initialize`, `resources/list`, `resources/read` and `tools/list` without starting a long-running process, and confirms `soturail.run` is not exposed by default.

`soturail init` scaffolds copyable MCP JSON-RPC examples under `examples/mcp/`.
