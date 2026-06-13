# Tutorial: OpenCode-Compatible Handoff

OpenCode support in SotuRail v1.1.0 is generic-compatible. SotuRail exports reviewed Markdown/context artifacts and does not claim full host-native integration.

## Generate The Handoff

```bash
soturail agents matrix
soturail agents export --agent opencode
soturail agents doctor --host opencode
soturail report agent --agent opencode
soturail mcp resources host-manifest --host opencode
```

Review:

```txt
.soturail/agents/opencode/AGENTS.md
.soturail/agents/opencode/context-pack.md
.soturail/agents/opencode/doctor.md
.soturail/reports/agent-opencode.md
.soturail/mcp/host-manifests/opencode.json
```

## What To Copy

Use `AGENTS.md` as the host-facing instruction file if your OpenCode-style host supports it. Keep the context pack as a linked evidence file instead of pasting all content into a prompt.

## Boundaries

- Prompt/context export only.
- Read-only local evidence references.
- No destructive MCP tools.
- No shell execution through MCP.
- No autonomous editing loop.

For unknown hosts, use `soturail agents export --agent generic`.
