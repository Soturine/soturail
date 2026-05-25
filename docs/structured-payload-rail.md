# Structured Payload Rail

Structured Payload Rail is a planned SotuRail area for choosing the right representation for each kind of context.

The core idea is simple:

```txt
SotuRail should not only send less context.
SotuRail should send context in the format the target agent understands best.
```

This does not mean replacing JSON with XML everywhere. It means using the right format for the right job.

## Format Rules

Planned default guidance:

```txt
JSON       -> machine/config/MCP/tool payloads
Markdown   -> human docs, README, ROADMAP, AGENTS.md
Tagged     -> long LLM prompt context with clear boundaries
TOON/table -> repetitive structured data
Mermaid    -> visual workflow, architecture and state context
```

## Why Not One Format?

Different consumers need different shapes.

- MCP tools and resources need strict machine-readable JSON.
- Humans need readable Markdown.
- LLM prompts often benefit from clearly delimited tagged blocks.
- Repetitive tabular records may be smaller as TOON-like or table-like payloads.
- Workflow states and architecture flows are often clearer as Mermaid diagrams.

## JSON Safety

JSON remains important, but unsafe or ambiguous JSON should be detected.

Future validator ideas:

```bash
soturail validate json config.json --strict
soturail format file.json --to tagged
soturail format file.json --to toon
soturail format compare docs/usage.md --formats markdown,tagged,json,toon
```

The strict JSON validator should warn about:

- duplicate keys;
- invalid JSON;
- huge arrays without summaries;
- very large objects;
- probable secrets;
- machine payloads being reused as poor prompt payloads;
- payloads that are valid JSON but bad LLM context.

## Tagged Context Blocks

For LLM context, SotuRail can emit XML-like tagged blocks without requiring a strict XML parser.

Example:

```xml
<soturail_context version="0.5.x">
  <project>
    <name>SotuRail</name>
    <goal>Local-first Context OS for coding agents.</goal>
  </project>

  <rules>
    <rule>No arbitrary shell execution through MCP.</rule>
    <rule>Prefer approved memory over raw logs.</rule>
  </rules>

  <repo_map>
    ...
  </repo_map>

  <terminal_summary>
    ...
  </terminal_summary>
</soturail_context>
```

Call this `tagged context` or `XML-like tagged context`, not mandatory XML.

## Target-Aware Context Packs

Possible future command shapes:

```bash
soturail context pack --target claude --format tagged
soturail context pack --target gemini --format tagged
soturail context pack --target codex --format markdown
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

## Format Comparison Report

SotuRail should eventually measure context formats instead of guessing.

A format comparison report should include:

- raw token estimate;
- formatted token estimate;
- metadata overhead;
- critical facts preserved;
- paths preserved;
- errors preserved;
- schema validity;
- recommended target format.

## Relationship With Reducers

Reducers decide what content survives.

Structured Payload Rail decides how surviving content is represented.

Both must preserve:

- file paths;
- exact commands;
- error messages;
- expected/actual values;
- security warnings;
- raw recovery IDs;
- source paths and line ranges where available.

## Acceptance Criteria

Structured Payload Rail should not be promoted until:

- JSON remains available for machine consumers;
- Markdown remains available for humans;
- tagged context is optional and documented;
- duplicate-key validation is tested;
- benchmark fixtures compare markdown vs tagged vs JSON vs compact formats;
- quality checks prove important evidence survives formatting.
