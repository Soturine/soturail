# Workflow Rail

Workflow Rail is planned for v0.4.0. It is not implemented in v0.2.x.

The goal is to describe repeatable engineering workflows as local, auditable artifacts that can later export into Skill Rail or an MCP server.

Planned commands:

```bash
soturail workflow new <name>
soturail workflow from-template <name>
soturail workflow validate
soturail workflow export skill
```

## Security Requirements

- Keep generated workflows local-first by default.
- Validate workflow files before execution or export.
- Scan for prompt injection.
- Scan for destructive shell commands.
- Scan for secret exfiltration.
- Scan for downloaded script execution such as `curl ... | sh` and `wget ... | bash`.
- Require human approval before enabling generated workflows or exported skills.

Workflow Rail should complement, not replace, the existing SotuRail rails: `soturail run`, raw log recovery, Knowledge-to-Rules, benchmarks, cache-normalized payloads and self-dogfooding reports.
