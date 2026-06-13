# Spec-Driven Workflow

SotuRail specs live under `.soturail/specs/`, and v0.7.0 connects them with Diagram Rail visual contracts.

```bash
soturail spec new "feature idea"
soturail spec status
soturail spec validate
soturail spec task add .soturail/specs/001-feature "Write tests"
soturail spec task list .soturail/specs/001-feature
soturail spec task done .soturail/specs/001-feature 1
```

## Diagram-Driven Specs

The workflow is:

```txt
Idea -> PRD -> .spec.md + Mermaid -> Tasks -> TDD -> Implementation -> Review -> Evidence
```

v0.7.0 Diagram Rail commands:

```bash
soturail diagram init
soturail diagram new <feature>
soturail diagram audit <file>
soturail diagram validate
soturail workflow diagram <id>
```

## `.spec.md` Visual Contract

Generated contracts include:

- required nodes;
- required transitions;
- evidence links;
- validation checklist;
- known gaps.

They are designed to be reviewed by humans and handed to agents as compact context. A `.spec.md` contract should make the intended behavior explicit before implementation.

## Why Diagrams Belong In Specs

Mermaid diagrams are text-based, versionable and compact. They can show state transitions, workflows, sequence flows and policy decisions in a form that both humans and agents can inspect.

A diagram should not replace tests or reviews. It should make the intended behavior explicit and then point to verification evidence.

## Validation

`soturail diagram audit <file>` and `soturail diagram validate` catch basic local issues:

- missing Mermaid blocks;
- broken code fences;
- unsupported Mermaid declarations;
- missing `.spec.md` siblings;
- workflow state diagrams without verification transitions.

The validator is intentionally lightweight. It is useful as a local rail, not as a full Mermaid parser.

See [diagram-rail.md](diagram-rail.md) and [workflow-rail.md](../harness/workflow-rail.md).
