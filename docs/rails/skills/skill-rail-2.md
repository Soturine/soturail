# Skill Rail 2.0

Skill Rail 2.0 is the implemented v1.4/v1.5 source-mapped local skill-pack foundation. Skills are operating procedures for agent hosts, not self-modifying behavior.

Current commands:

```bash
soturail skills template docs-review
soturail skills build README.md docs --name project-guide
soturail skills fold-in project-guide docs/new-guide.md
soturail skills lint
soturail skills eval
soturail skills report
```

The existing `skills init|list|validate|suggest|route|export|pack` commands remain available.

## Current pack layout

```text
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

## v1.6 compatibility direction

Skill Rail 2.0 remains a useful internal/source-backed pack format, but host-facing skills should converge on the portable Agent Skills shape:

```text
<skill>/
  SKILL.md
  references/   optional
  scripts/      optional
  assets/       optional
```

SotuRail sidecars such as provenance, source maps, risk and evidence metadata may remain in the pack. Hosts should not be required to understand private sidecars to discover and follow the basic Skill.

The canonical `SKILL.md` should carry the minimum interoperable metadata needed for discovery, while SotuRail keeps richer trust metadata in its own artifacts.

## Migration principles

- preserve existing v1.5 skills;
- provide explicit migration/doctor output instead of silently rewriting user skills;
- keep content hashes/provenance where still useful;
- separate host-portable instructions from SotuRail-internal trust state;
- avoid hardcoded host lists in the canonical skill identity;
- use host adapters for target-specific directories/metadata;
- keep generic portable fallback;
- do not make English keyword routing the authority for skill selection.

## Validation

Lint/eval continue to check metadata, risk, examples, verification steps, source maps, unsafe commands, secret access, remote writes and MCP exposure warnings.

v1.6 adds fixtures for:

- progressive disclosure;
- capability-to-skill binding;
- multilingual discovery;
- host adapter conformance;
- candidate-vs-verified state separation;
- provider unavailable/degraded behavior.

No skill should hide destructive actions or imply that SotuRail is an autonomous agent runtime.

Related: [Skill Rail](skill-rail.md), [Agent-Native Semantic Architecture](../../architecture/agent-native-semantic-architecture.md), [Knowledge Rail](../knowledge/knowledge-rail.md), [Tasklet Rail](../tasklets/tasklet-rail.md), and [Policy Rail](../governance/policy-rail.md).
