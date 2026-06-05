# OpenCode-Compatible Example

This is an example of the kind of Markdown SotuRail writes with:

```bash
soturail agents export --agent opencode
```

Use the generated `.soturail/agents/opencode/AGENTS.md` as the reviewed host-facing instruction file when an OpenCode-style host supports AGENTS-style project guidance.

## Boundaries

- Generic-compatible prompt/context handoff.
- Local status/report/schema evidence only.
- Read-only MCP host manifest where useful.
- No destructive MCP tools.
- No shell execution through MCP.
- No claim of full host-native integration.

## Recommended Evidence

- `.soturail/status/latest.json`
- `.soturail/reports/agent-opencode.md`
- `.soturail/agents/opencode/context-pack.md`
- `.soturail/agents/opencode/doctor.md`
- `.soturail/mcp/host-manifests/opencode.json`
