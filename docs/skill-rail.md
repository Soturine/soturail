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

`soturail skills list` prints each skill ID, risk level, name, description, version, targets and local path. If there are no local skills, it prints the command to create one.

The generated starter skill includes safe workflow steps, a verification checklist, example input/output, target metadata and human approval requirements for destructive commands, remote writes and dependency installation.

## Future Skill Routing

Deep Agents-style systems validate skills loaded by task, but SotuRail should stay the local rail layer and not become the runtime.

Planned commands:

```bash
soturail skills suggest --query "publish npm release"
soturail skills route --task "fix failing test"
soturail skills export --role reviewer
soturail skills export --role release-manager
```

A skill route should explain:

- which skill was selected;
- why it was selected;
- which context expert should accompany it;
- which role pack should accompany it;
- which policy checks apply;
- which workflow phase should use it.

Example mapping:

| Task | Likely skill | Role pack | Policy checks |
| --- | --- | --- | --- |
| Fix failing test | bug-triage / code-review | executor, reviewer | safe command execution |
| Publish npm release | release-manager | release-manager | npm publish, GitHub release, audit/pack evidence |
| Review external ecosystem docs | research-summary | researcher | citations, comparison claims |
| Improve agent docs | agent-docs-lint | planner, reviewer | secret/redaction checks |

## Future Role-Aware Skill Exports

Role-aware exports should not paste every skill into every context window. They should export only skills useful for the current phase.

Possible future outputs:

```txt
.soturail/exports/skills/claude/planner-skills.md
.soturail/exports/skills/claude/executor-skills.md
.soturail/exports/skills/claude/reviewer-skills.md
.soturail/exports/skills/claude/release-manager-skills.md
.soturail/exports/skills/deepagents/role-packs/reviewer-skills.md
```

## Safety Rule

Skill Rail should keep human approval requirements explicit for:

- destructive commands;
- dependency installation;
- npm publish;
- GitHub release creation;
- global configuration writes;
- raw log expansion without redaction;
- MCP exposure changes.
