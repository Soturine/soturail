# Context Packs

Context packs are target-aware Markdown payloads for AI coding agents.

```bash
soturail context pack --target claude
soturail context pack --target codex
soturail context pack --target gemini
soturail context pack --target cursor
soturail context pack --target antigravity
soturail context pack --target generic
soturail context pack --target all
soturail context explain
soturail context doctor
```

Generated files live in `.soturail/context/`.

Common generated files:

- `.soturail/context/claude-context.md`
- `.soturail/context/codex-context.md`
- `.soturail/context/gemini-context.md`
- `.soturail/context/cursor-context.md`
- `.soturail/context/antigravity-context.md`
- `.soturail/context/generic-context.md`

Stable-cache order:

1. Static SotuRail header.
2. Governance files summary.
3. Project config.
4. Repo map summary.
5. Approved rules.
6. Approved specs.
7. Approved memory.
8. Skills summary.
9. Workflow summary.
10. MCP resource list.
11. Dynamic footer with timestamps, current commit, raw IDs and recent command notes.

Dynamic data never appears before stable blocks.

Review a generated pack before pasting it into an agent. Dynamic footer data can include recent command status, raw IDs or branch details.

`soturail init` scaffolds context-pack examples under `examples/context-packs/`, and v0.4 agent examples can be paired with `soturail context pack --target all` for a clean first setup.

## Future Query-Aware Context Selection

The v0.5 roadmap turns context packs into a stronger context intelligence layer.

Planned commands:

```bash
soturail context select --query "fix Windows CI timeout" --budget 1600
soturail context prune docs/release-workflow.md --query "npm publish"
soturail context route --query "prepare release"
```

Expected output should explain:

- source path;
- line range;
- score;
- reason for inclusion;
- stable block ID;
- omitted context summary;
- recovery pointer when content was offloaded.

## Future Context Expert Router

The context router is a local product metaphor inspired by expert routing, not a neural MoE implementation.

Planned expert profiles:

- **code expert**: source files, symbols, failing tests;
- **docs expert**: README, roadmap, usage guides;
- **release expert**: changelog, release notes, npm/GitHub state;
- **security expert**: raw logs, redaction, policy, secrets;
- **workflow expert**: current plan, tasks, verification;
- **memory expert**: approved memories and historical decisions;
- **research expert**: ecosystem notes, citations and comparison constraints.

The router should select only the smallest useful context bundle for a task and report why other bundles were skipped.

## Future Role-Based Context Packs

Deep Agents-style systems validate role separation, but SotuRail should not become the agent runtime. Instead, it can generate role-specific context packs.

Planned role packs:

```bash
soturail context pack --role planner
soturail context pack --role executor
soturail context pack --role reviewer
soturail context pack --role release-manager
soturail context pack --role researcher
```

Suggested role contents:

- **planner**: roadmap, PRD, specs, architecture notes and constraints;
- **executor**: task, target files, repo map, failing tests and safe commands;
- **reviewer**: diff summary, tests, rules, acceptance criteria and security notes;
- **release-manager**: version, changelog, release notes, packed package verification, npm/GitHub state;
- **researcher**: docs, external notes, citations and comparison constraints.

Each role pack should declare purpose, included sources, omitted sources, token estimate and raw/workflow recovery pointers.

## Future Context Offload

Long terminal/tool outputs should stay local when possible.

Planned commands:

```bash
soturail context offload <raw_id>
soturail context restore <offload_id>
soturail trace attach-raw <raw_id>
```

The agent should receive a compact payload:

```txt
summary + important paths + failure lines + raw_id/offload_id recovery pointer
```

Instead of receiving every raw terminal line.

## Quality Rules

Context selection and role packs should preserve:

- file paths;
- line ranges;
- exact command names;
- failed test names;
- root error messages;
- expected/actual values;
- security warnings;
- raw recovery hints.

If pruning would remove required evidence, SotuRail should report that pruning was not effective rather than pretending the context is sufficient.
