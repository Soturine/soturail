# Spec-Driven Workflow

SotuRail specs live under `.soturail/specs/`.

```bash
soturail spec new "feature idea"
soturail spec status
soturail spec validate
soturail spec task add .soturail/specs/001-feature "Write tests"
soturail spec task list .soturail/specs/001-feature
soturail spec task done .soturail/specs/001-feature 1
```

v0.2.0 specs include:

- `constitution.md`
- `spec.md`
- `plan.md`
- `tasks.md`
- `verification.md`
- `context-budget.md`
- `security-impact.md`

## Planned Diagram-Driven Specs

The v0.7+ roadmap can extend specs with Diagram Rail.

The goal is to make visual contracts part of the spec workflow:

```txt
Idea -> PRD -> .spec.md + Mermaid -> Tasks -> TDD -> Implementation -> Review -> Evidence
```

A future `.spec.md` can include:

- feature purpose;
- requirements;
- constraints;
- Mermaid diagram;
- decision matrix;
- acceptance criteria;
- test plan;
- version/change notes.

Possible future commands:

```bash
soturail diagram new <feature>
soturail diagram audit <file>
soturail diagram validate
soturail workflow diagram <id>
```

## Why Diagrams Belong In Specs

Mermaid diagrams are text-based, versionable and compact. They can show state transitions, workflows, sequence flows and policy decisions in a form that both humans and agents can inspect.

A diagram should not replace tests or reviews. It should make the intended behavior explicit before implementation.

## Planned Validation

A future diagram/spec validator should catch:

- invalid Mermaid syntax;
- missing start or end states;
- unreachable states;
- unlabeled risky transitions;
- missing acceptance criteria;
- implementation without corresponding test plan;
- release path without verification evidence;
- policy flow without approve/reject state.

See [diagram-rail.md](diagram-rail.md) and [workflow-rail.md](workflow-rail.md).
