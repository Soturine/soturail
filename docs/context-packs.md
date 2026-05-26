# Context Packs

Context packs are target-aware payloads for AI coding agents.

Today they are generated mainly as Markdown. The v0.5 line adds Context Intelligence, query-aware selection, role packs, context offload and early target-aware payload guidance.

```bash
soturail context pack --target claude
soturail context pack --target codex
soturail context pack --target gemini
soturail context pack --target cursor
soturail context pack --target antigravity
soturail context pack --target generic
soturail context pack --target all
soturail context pack --role planner
soturail context pack --role executor
soturail context pack --role reviewer
soturail context pack --role release-manager
soturail context pack --role researcher
soturail context select --query "fix Windows CI timeout"
soturail context prune --query "prepare npm release" --budget 8000
soturail context route --query "prepare release"
soturail context budget --target claude --explain
soturail context offload README.md
soturail context restore <offload-id>
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

## Query-Aware Context Selection

The v0.5.0 seed turns context packs into a stronger context intelligence layer.

Implemented seed commands:

```bash
soturail context select --query "fix Windows CI timeout" --limit 10
soturail context prune --query "npm publish" --budget 8000
soturail context route --query "prepare release"
soturail context budget --target claude --explain
```

Expected output should explain:

- source path;
- line range;
- score;
- reason for inclusion;
- stable block ID;
- omitted context summary;
- recovery pointer when content was offloaded.

## Role-Pack Examples

Role packs are practical v0.5.x outputs, not full sub-agent runtimes.

| Role | Purpose | Should include | Should omit | Safety note |
| --- | --- | --- | --- | --- |
| planner | decide scope and constraints | roadmap, specs, previous decisions, open gaps | terminal logs, full source dumps | keep plans human-reviewable |
| executor | implement a task | target files, repo map, safe commands, failing tests | broad research notes | do not include secrets or unrelated files |
| reviewer | assess changes | diffs, tests, rules, acceptance criteria, security notes | stale planning notes | preserve exact paths and failures |
| release-manager | prepare a release | version, changelog, release notes, pack checks, npm/GitHub state | feature ideation | never create GitHub release before npm publish |
| researcher | compare and cite context | docs, ecosystem notes, citations, constraints | raw private logs | citations should point to source docs |

Generate them with:

```bash
soturail context pack --role planner
soturail context pack --role executor
soturail context pack --role reviewer
soturail context pack --role release-manager
soturail context pack --role researcher
```

## Target-Aware Payload Formats

SotuRail should not only send less context. It should send context in the format the target agent or consumer can use best.

Planned guidance:

```txt
JSON       -> machine/config/MCP/tool payloads
Markdown   -> human docs, README, ROADMAP, AGENTS.md
Tagged     -> long LLM prompt context with clear boundaries
TOON/table -> repetitive structured data
Mermaid    -> visual workflow, architecture and state context
```

This does not mean XML-like tags replace JSON. JSON remains the right format for machine contracts such as MCP and tool manifests. Tagged blocks are planned for LLM prompt context where clear boundaries help separate project rules, evidence, repo maps and task inputs.

Possible future commands:

```bash
soturail context pack --target claude --format tagged
soturail context pack --target gemini --format tagged
soturail context pack --target codex --format markdown
soturail context pack --target cursor --format markdown
soturail context pack --target antigravity --format markdown
soturail context pack --target generic --format markdown
soturail context pack --target mcp --format json
```

Suggested defaults:

| Target | Preferred context shape |
| --- | --- |
| Claude | tagged blocks + Markdown summary |
| Gemini | tagged blocks or Markdown summary |
| Codex | concise Markdown + JSON only for configs/tools |
| Cursor | rules + Markdown context |
| Antigravity | prompt-only Markdown/tagged fallback until stable format is known |
| MCP | JSON |
| Generic | Markdown |

v0.6.0 agent runtime adapter output also reports host-aware recommendations through:

```bash
soturail agents capabilities
soturail agents explain --agent all
soturail agents doctor --verbose
```

v0.6.1 evaluation fixtures check that context selection, role packs, offload/restore and payload formats preserve critical evidence:

```bash
soturail eval run
soturail eval report
```

Examples:

- Claude Code: Markdown + tagged blocks + MCP stdio snippets + short `CLAUDE.md` references.
- Codex: `AGENTS.md` + Markdown context packs + prompt-only fallback.
- Gemini CLI: `GEMINI.md` + Markdown + large-context docs.
- Cursor: project rules + Markdown docs + file references.
- Generic/OpenCode/Amp/Kiro-style hosts: Markdown + JSON reports + prompt-only fallback.
- Deep Agents-style exports: role packs + workflow evidence + policy notes as context/config artifacts only.

See [structured-payload-rail.md](structured-payload-rail.md).

## JSON Safety And Strict Validation

Structured payload work should include a strict JSON validator for prompt and config safety.

v0.5.1 includes a light local seed:

```bash
soturail validate json config.json --strict
soturail format compare docs/usage.md
```

The validator should warn about:

- duplicate keys;
- invalid JSON;
- huge arrays without summaries;
- very large objects;
- probable secrets;
- machine payloads being reused as poor prompt payloads;
- payloads that are valid JSON but bad LLM context.

## Context Expert Router

The context router is a local product metaphor inspired by expert routing, not a neural MoE implementation.

Current seed profiles:

- **code expert**: source files, symbols, failing tests;
- **docs expert**: README, roadmap, usage guides;
- **release expert**: changelog, release notes, npm/GitHub state;
- **security expert**: raw logs, redaction, policy, secrets;
- **workflow expert**: current plan, tasks, verification;
- **memory expert**: approved memories and historical decisions;
- **research expert**: ecosystem notes, citations and comparison constraints.

The router should select only the smallest useful context bundle for a task and report why other bundles were skipped.

## Role-Based Context Packs

Deep Agents-style systems validate role separation, but SotuRail should not become the agent runtime. Instead, it can generate role-specific context packs.

Current role packs:

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

## Context Offload

Long terminal/tool outputs should stay local when possible.

Current commands:

```bash
soturail context offload <raw-id-or-file>
soturail context restore <offload-id>
```

Future trace commands may attach raw IDs to richer evidence packs.

The agent should receive a compact payload:

```txt
summary + important paths + failure lines + raw_id/offload_id recovery pointer
```

Instead of receiving every raw terminal line.

## Future Diagram Context

Diagram Rail can provide visual context for workflows and architecture without long prose.

Possible future diagram context:

- workflow phase diagram;
- release flow diagram;
- MCP resource/tool diagram;
- policy approval diagram;
- context router diagram;
- feature `.spec.md` Mermaid diagram.

See [diagram-rail.md](diagram-rail.md).

## Quality Rules

Context selection, formatting and role packs should preserve:

- file paths;
- line ranges;
- exact command names;
- failed test names;
- root error messages;
- expected/actual values;
- security warnings;
- raw recovery hints.

If pruning or formatting would remove required evidence, SotuRail should report that pruning was not effective rather than pretending the context is sufficient.
