# Context Intelligence

Context Intelligence is the v0.5.0 seed for selecting, pruning, routing and offloading local context before an agent handoff.

It is deterministic and local-first. It does not use embeddings, cloud databases or external LLM APIs.

## Commands

```bash
soturail context select --query "release checklist" --limit 10
soturail context prune --query "memory rail bug" --budget 8000
soturail context budget --target claude --explain
soturail context route --query "review security policy"
soturail context select --query "fix release packaging" --limit 10
soturail context prune --query "fix release packaging" --budget 8000
soturail context route --query "prepare npm release"
soturail context budget --target claude --explain
soturail context offload README.md
soturail context restore <offload-id>
soturail context pack --role planner
soturail context pack --role executor
soturail context pack --role reviewer
soturail context pack --role release-manager
soturail context pack --role researcher
```

## Storage

Context Intelligence writes local artifacts under:

```txt
.soturail/context/
  selections/
  offload/
  role-packs/
```

Selection records use JSON. Offloaded content is stored as redacted local text plus metadata. Role packs are Markdown so they can be reviewed before being pasted or exported.

## Routing

`context route` maps a task to one deterministic context expert:

- `code`
- `docs`
- `release`
- `security`
- `workflow`
- `memory`
- `research`

This is not neural MoE. It is a simple local router using keywords and path signals.

`context route` should explain why an expert was selected. For example, a query containing `security`, `policy`, `secret` or `MCP exposure` routes to the security expert and suggests a focused `context select` command instead of loading every project doc.

## Selection And Pruning Output

`context select` is designed for scan-friendly output:

```txt
SotuRail context select
query: release checklist
items_count: 4

- file: docs/release-workflow.md
  Score: 10
  Reason: keyword overlap, release path
  Estimated tokens: 520
  Summary: Release verification and publish ordering.
  Recovery: open docs/release-workflow.md
```

`context prune` separates what fits from what was omitted:

```txt
Included context:
- file: docs/memory-rail.md (440 tokens)
  Reason: keyword overlap

Omitted context:
- file: docs/evaluation-suite.md (1600 tokens)
  Recovery: rerun with a larger --budget or offload the file.
```

This keeps default output compact and gives a recovery pointer when the full file or offloaded record is needed.

## Context Budget

`context budget --explain` highlights local cost drivers before an agent handoff:

- root agent docs;
- role packs;
- memory;
- skills;
- MCP exposure;
- raw and offloaded logs;
- generated context packs;
- run workspace evidence.

Use it before long tasks:

```bash
soturail context budget --target claude --explain
soturail context pack --role planner
soturail context offload .soturail/raw/<raw-id>.txt
```

## Role-Pack Examples

Each role pack is written to `.soturail/context/role-packs/<role>.md`.

| Role | Purpose | Include | Omit | Command |
| --- | --- | --- | --- | --- |
| planner | choose direction and constraints | roadmap, specs, previous decisions | raw logs and full diffs | `soturail context pack --role planner` |
| executor | implement a focused task | target files, repo map, safe commands, failing tests | broad research notes | `soturail context pack --role executor` |
| reviewer | inspect risk and evidence | diff, tests, acceptance criteria, security notes | unrelated project docs | `soturail context pack --role reviewer` |
| release-manager | prepare release evidence | version, changelog, release notes, pack state | feature brainstorming | `soturail context pack --role release-manager` |
| researcher | gather external/internal background | docs, ecosystem notes, citations | secrets and private logs | `soturail context pack --role researcher` |

Safety note: review role packs before sharing them with an agent. They should reference raw/offload IDs instead of pasting large logs.

## Safety

- Raw logs are not included in context packs by default.
- Probable secrets are redacted before offload summaries.
- Offload records include recovery commands instead of dumping long content into prompts.
- Token counts are local estimates, not provider billing numbers.
