# Skill Rail

Skill Rail exports safe local agent skills without depending on external skill ecosystems.

```bash
soturail skills init demo-skill
soturail skills list
soturail skills validate
soturail skills export --target claude
soturail skills export --target codex
soturail skills export --target gemini
soturail skills export --target cursor
soturail skills export --target generic
soturail skills pack --format json
soturail skills pack --format markdown
```

Skills live in `.soturail/skills/<skill-id>/` with `skill.yml`, `SKILL.md`, examples and validators.

Validation checks required metadata, target names, duplicate IDs, deterministic content hashes, destructive shell patterns, prompt-injection style instructions and probable embedded secrets.

Exports are written to `.soturail/exports/skills/<target>/`. Review every generated file before enabling it in Claude, Codex, Gemini, Cursor or another host.
