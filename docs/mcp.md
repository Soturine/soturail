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

## Planned MCP Exposure Report

Policy Rail should eventually make MCP exposure inspectable.

Possible future commands:

```bash
soturail mcp exposure
soturail mcp exposure --format json
soturail policy doctor --mcp
```

The report should include:

- resources exposed;
- tools exposed;
- whether arbitrary shell is exposed;
- whether raw logs are redacted by default;
- whether approved memory is the only memory exposed;
- whether risky tools require approval;
- host-specific config files generated;
- policy rules that apply to each exposed tool/resource.

Example future report:

```txt
SotuRail MCP exposure
transport: stdio
arbitrary_shell_tool_exposed: no
raw_expand_default: redacted
memory_resource: approved-only
policy_required_for: raw_allow, config_write, publish, shell
result: safe-default
```

## Planned MCP Resources

Future resources can expose more local evidence without allowing arbitrary execution:

- `soturail://context/latest`
- `soturail://context/role/<role>`
- `soturail://memory/approved`
- `soturail://workflow/<id>`
- `soturail://workflow/<id>/evidence`
- `soturail://policy/report`
- `soturail://diagram/<id>`
- `soturail://trace/<id>`
- `soturail://reports/latest`

Every resource should have a clear redaction policy and recovery path.

## Planned Payload Format Rules

MCP remains JSON. Even if SotuRail supports Markdown, tagged context, TOON/table-like compact formats and Mermaid diagrams for prompts or docs, MCP tool/resource messages must stay machine-readable.

Structured Payload Rail should therefore use:

```txt
MCP contract -> JSON
LLM prompt context -> Markdown or tagged blocks
visual workflow context -> Mermaid inside Markdown or dedicated resource text
compact repeated records -> TOON/table-like output where explicitly requested
```

## Planned Safety Tests

MCP smoke tests should continue confirming:

- initialize passes;
- resources/list passes;
- resources/read passes;
- tools/list passes;
- `soturail.run` is not exposed by default;
- raw expansion is redacted by default;
- approved memory is the default memory surface;
- exposure report says safe-default when no risky tools are enabled.

## Future UI Notes

MCP Apps/MCP-UI-style output can be explored later for local reports, but SotuRail should first expose static, local, safe resources.

Future UI resources should prioritize:

- evidence packs;
- policy queues;
- workflow traces;
- Mermaid diagrams;
- benchmark reports;
- memory recall reports.

No UI feature should require exposing arbitrary shell execution.
