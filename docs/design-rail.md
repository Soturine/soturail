# Design Rail

Design Rail is a planned post-v1 rail inspired by agent-readable design specs such as `DESIGN.md` and by SotuRail's own static dashboard/report surfaces.

## Goal

Give coding agents enough durable design context to keep local dashboards, docs, diagrams and generated UI consistent without pasting a large design wiki into every task.

## Planned Files

```txt
DESIGN.md
.soturail/design/tokens.json
.soturail/design/report.md
.soturail/design/diff.json
```

A local `DESIGN.md` may include:

- design tokens;
- typography and spacing notes;
- semantic color names;
- accessibility rules;
- dashboard/report component guidance;
- diagrams and icon rules;
- examples and anti-examples.

## Planned Commands

```bash
soturail design init
soturail design lint
soturail design diff
soturail design export --agent codex
soturail design export --agent opencode
soturail design export --agent generic
```

## Lint Ideas

- missing required tokens;
- duplicate token names;
- inconsistent naming style;
- obvious contrast/accessibility warnings;
- stale references to removed docs/assets;
- overlong guidance that should be split into referenced docs;
- secrets or private URLs accidentally embedded in design docs.

## Non-Goals

- no hosted design system;
- no Figma dependency;
- no remote rendering service;
- no claim that SotuRail validates every accessibility rule;
- no forced framework for dashboards.

## Where It Connects

| Existing rail | Connection |
| --- | --- |
| Dashboard Rail | local dashboard visual consistency |
| Report Rail | report HTML/Markdown style consistency |
| Diagram Rail | visual-contract consistency |
| Agent Exports | concise design guidance for hosts |
| Project Brain | verified design decisions and stale references |
