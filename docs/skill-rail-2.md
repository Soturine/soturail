# Skill Rail 2.0 And Domain Skill Packs

Skill Rail 2.0 is the planned v1.4.x direction for safer, smaller, domain-aware skills that can be exported to different agent hosts.

## Goal

Move from generic skills to reviewed domain skill packs with metadata, fixtures, reports, role-aware exports and explicit safety boundaries.

## Planned Commands

```bash
soturail skills template typescript-cli
soturail skills template java-review
soturail skills template php-review
soturail skills template docs-review
soturail skills template release-manager
soturail skills template accessibility-review
soturail skills template security-review
soturail skills lint
soturail skills eval
soturail skills report
soturail skills export --agent opencode
soturail skills export --agent codex
soturail skills export --agent claude
soturail skills export --agent generic
```

## Domain Skill Structure

```txt
.soturail/skills/<skill-id>/
  skill.yml
  SKILL.md
  examples/
  fixtures/
  report-template.md
  safety.md
  validators/
```

## Required Metadata

- skill id;
- name;
- domain;
- supported hosts;
- risk level;
- required evidence;
- allowed commands;
- blocked commands;
- human approval requirements;
- verification checklist;
- output schema or report format.

## Domain Skill Report Format

A skill report should separate:

- finding;
- severity;
- confidence;
- evidence path;
- affected files;
- safe next command;
- human review requirement;
- false-positive note where relevant.

## Security Boundary

Security-related skills must stay defensive and authorization-aware.

They must not provide:

- exploit or bypass instructions;
- credential theft;
- malware or evasion logic;
- unauthorized access steps;
- instructions to hide activity;
- destructive actions without explicit human approval.

They may provide:

- scope checklist;
- safe evidence collection guidance;
- non-operational vulnerability summaries;
- remediation steps;
- redaction and reporting guidance;
- policy gates before risky tools.

## Relationship To Existing Rails

| Existing rail | Skill Rail 2.0 connection |
| --- | --- |
| Policy Rail | risk and approval checks |
| Report Rail | skill findings and evidence summaries |
| Host Compatibility Rail | host-aware skill exports |
| Workflow Rail | phase-specific skills |
| Evaluation Suite | fixture-based skill quality checks |
| Project Brain | repeated findings can become rules or stale evidence |
