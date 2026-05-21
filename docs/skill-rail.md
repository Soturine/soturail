# Skill Rail

Skill Rail is planned for v0.3.0. It is not implemented in v0.2.2.

The goal is to turn approved SotuRail specs, rules and workflows into portable, reviewable agent skills without installing untrusted marketplace content automatically.

Planned commands:

```bash
soturail skills init <name>
soturail skills from-spec <spec-id>
soturail skills from-rules <rules-file>
soturail skills validate <path>
soturail skills export claude|codex|gemini|cursor
```

## Security Requirements

- No automatic marketplace install.
- Validate `SKILL.md` before use.
- Scan for prompt injection.
- Scan for destructive shell commands.
- Scan for secret exfiltration language.
- Scan for `curl`/`wget` pipe execution.
- Warn about untrusted scripts.
- Require human approval before enabling generated skills.

Skill Rail should preserve SotuRail's local-first evidence model: generated skills must cite the spec, rule or workflow that produced them.
