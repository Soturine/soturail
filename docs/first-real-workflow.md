# First Real Workflow

This guide starts from a clean folder and walks through the first useful SotuRail flow.

## macOS, Linux, PowerShell

```bash
mkdir my-soturail-test
cd my-soturail-test

soturail init
soturail index
soturail context pack --target generic
soturail skills init code-review
soturail skills validate
soturail skills export --target claude
soturail mcp doctor
soturail mcp manifest
soturail run node --version
soturail stats
```

## Windows CMD

```bat
mkdir my-soturail-test
cd my-soturail-test
soturail init
soturail index
soturail context pack --target generic
soturail skills init code-review
soturail skills validate
soturail skills export --target claude
soturail mcp doctor
soturail mcp manifest
soturail run node --version
soturail stats
```

Do not paste Markdown fence labels such as `bat` into CMD. Paste only the command lines.

## What should happen?

- `.soturail/` is created without overwriting your files.
- `docs/` and `examples/` starter files are created.
- `.soturail/indexes/repo-map.json` and `tree.txt` are generated.
- `.soturail/context/generic-context.md` is generated.
- `.soturail/skills/code-review/` is created with a starter skill.
- `soturail skills validate` should pass for the generated skill.
- `.soturail/exports/skills/claude/` receives a reviewed export.
- `soturail mcp doctor` reports stdio support and no arbitrary shell execution.
- `soturail stats` reports local metrics.

Stats may be zero in a fresh folder until you run commands through:

```bash
soturail run <command>
```

Raw command output can contain secrets. Keep `.soturail/raw` local and review logs before sharing them.
