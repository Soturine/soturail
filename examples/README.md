# SotuRail Examples

These examples are small starting points for real local usage:

- `skills/`: reviewable Skill Rail YAML examples.
- `context-packs/`: context pack workflows.
- `mcp/`: JSON-RPC messages for the stdio MCP server.
- `hooks/`: prompt-only and hook guidance.

Run examples in a disposable folder first:

```bash
soturail init
soturail index
soturail context pack --target generic
```

Safety notes:

- Review generated files before enabling them in an agent.
- Do not paste raw logs into public issues without checking for secrets.
- MCP does not expose arbitrary shell execution by default.
