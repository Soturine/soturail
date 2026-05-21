# SotuRail v0.3.1 - Real Usage & Integration Polish

SotuRail v0.3.1 improves the installed user experience after the v0.3.0 Skill Rail, MCP and Context Pack release.

## Highlights

- `soturail init` now scaffolds v0.3 docs and examples.
- `soturail skills list` now prints richer skill details.
- `soturail skills init` now creates a more useful starter skill.
- MCP stdio behavior has stronger smoke coverage.
- Hooks doctor now shows next safe commands.
- Added first real workflow documentation.
- Added examples for skills, MCP, hooks and context packs.
- Added clean-folder smoke test coverage.

## Install

```bash
npm install -g soturail@0.3.1
soturail --version
```

## Validate

```bash
soturail init
soturail index
soturail context pack --target generic
soturail skills init demo-skill
soturail skills validate
soturail mcp doctor
soturail hooks doctor
```

## Notes

This is a polish release. It does not expose arbitrary shell execution through MCP.
