# Skill Rail 2.0

Skill Rail 2.0 builds reviewed, source-mapped local skill packs. Skills are operating procedures for agent hosts, not self-modifying behavior.

## Commands

```bash
soturail skills template docs-review
soturail skills build README.md docs --name project-guide
soturail skills fold-in project-guide docs/new-guide.md
soturail skills lint
soturail skills eval
soturail skills report
```

The existing `skills init|list|validate|suggest|route|export|pack` commands remain available.

## Pack Layout

```txt
.soturail/skills/<skill-id>/
  SKILL.md
  skill.yml
  safety.md
  examples/
  topics/
  glossary.md
  patterns.md
  cheatsheet.md
  metadata.json
  source-map.json
```

Templates include supported hosts, risk level, examples, verification steps and safety boundaries. Built skills use Knowledge Rail output so generated topics and source maps remain locally traceable.

## Validation

Lint and evaluation check metadata, supported hosts, risk, examples, verification steps, source maps, unsafe commands, secret access, remote writes and MCP exposure warnings.

No skill should hide destructive commands or imply that SotuRail is an autonomous agent runtime.

Related: [Knowledge Rail](../knowledge/knowledge-rail.md), [Tasklet Rail](../tasklets/tasklet-rail.md), [Policy Rail](../governance/policy-rail.md).
