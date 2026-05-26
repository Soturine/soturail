# Context Intelligence

Context Intelligence is the v0.5.0 seed for selecting, pruning, routing and offloading local context before an agent handoff.

It is deterministic and local-first. It does not use embeddings, cloud databases or external LLM APIs.

## Commands

```bash
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

## Safety

- Raw logs are not included in context packs by default.
- Probable secrets are redacted before offload summaries.
- Offload records include recovery commands instead of dumping long content into prompts.
- Token counts are local estimates, not provider billing numbers.
