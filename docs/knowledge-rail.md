# Knowledge Rail

Knowledge Rail is a planned future surface for compiling project documentation into small, on-demand knowledge packs for coding agents.

It is inspired by document-to-skill workflows: extract structure, not a giant summary.

## Goal

Turn docs, specs, READMEs, ADRs, notes and technical references into local agent-usable knowledge:

```txt
source docs -> topic index -> SKILL.md -> topics -> glossary -> patterns -> cheatsheet -> provenance
```

## Proposed Commands

```bash
soturail knowledge ingest ./docs ./README.md ./architecture.md
soturail knowledge estimate ./docs
soturail knowledge compile --mode on-demand
soturail knowledge update project-brain ./new-docs
soturail knowledge verify
soturail skill build ./docs --name project-architecture
soturail skill fold-in project-architecture ./ADR-004.md
soturail skill export --target claude
```

## Local Layout

```txt
.soturail/knowledge/<name>/
  SKILL.md
  topics/
    architecture.md
    testing.md
    release.md
  glossary.md
  patterns.md
  cheatsheet.md
  source-map.json
  metadata.json
```

## On-Demand Context

Instead of loading all docs into every prompt, an export can say:

```txt
Read .soturail/knowledge/project/SKILL.md first.
For release tasks, read topics/release.md.
For testing tasks, read topics/testing.md.
Do not load unrelated topics unless needed.
```

## Metadata

A knowledge pack should record:

- source paths;
- extraction date;
- token estimate;
- topic list;
- source map;
- verification status;
- update/fold-in history.

## Copyright And Sharing Boundary

Knowledge packs generated from private or copyrighted material should stay local unless the user has rights to redistribute them. SotuRail should prefer synthesized structure and references over copying large source text.

## Non-Goals

- no vector database required;
- no cloud embeddings required;
- no publishing third-party book content by default;
- no replacing Project Brain or Knowledge Graph Rail. Knowledge Rail feeds them with organized source material.
