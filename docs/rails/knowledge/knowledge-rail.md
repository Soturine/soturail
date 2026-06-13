# Knowledge Rail

Knowledge Rail compiles local project sources into concise, source-backed knowledge packs for coding agents. It is deterministic, offline and does not require embeddings or an LLM.

## Commands

```bash
soturail knowledge estimate README.md docs
soturail knowledge compile README.md docs --name project-guide
soturail knowledge update project-guide docs/new-guide.md
soturail knowledge verify project-guide
soturail knowledge list
```

## Local Layout

```txt
.soturail/knowledge/<name>/
  SKILL.md
  topics/
  glossary.md
  patterns.md
  cheatsheet.md
  metadata.json
  source-map.json
  verify.json
```

Compilation extracts headings, commands, terms, concise local summaries, file paths and source hashes. It does not copy large source bodies into generated files.

## Verification

`knowledge verify` compares current source hashes with `source-map.json`.

- `verified`: required artifacts and source hashes match.
- `stale`: a source changed or disappeared.
- `unverified`: the pack or required artifacts are missing.

`knowledge update` recompiles the pack while preserving its original creation date.

## Safety And Limits

- Sources must remain inside the project root.
- Binary, generated and oversized files are skipped.
- No cloud calls, embeddings, model calls or mandatory database.
- Generated summaries are source signals, not stronger claims than the original files.
- Knowledge Rail organizes source material; it does not replace Project Brain or a full static analyzer.

Related: [Evidence Provenance Rail](../evidence/evidence-provenance-rail.md), [Skill Rail 2.0](../skills/skill-rail-2.md), [Security Boundaries](../../security/security-boundaries.md).
