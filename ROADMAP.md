# Roadmap

## v0.2.2 - Self-Dogfooding and Reliability

- `soturail self` command namespace.
- Self-dogfood report under `.soturail/reports/self-dogfood.md`.
- Build, test and benchmark orchestration through SotuRail itself.
- Tiny-output metadata overhead accounting.
- Expanded benchmark fixtures and categories.
- Windows usage documentation.
- Skill Rail and Workflow Rail planning docs.

## v0.2.1 - Native Performance and Public Polish

- Branding cleanup.
- Native Rust runner hot path.
- Benchmark category cleanup.
- JSON reducer improvement.
- Real Claude hook installer.

## v0.3.0 - Skill Rail

- Draft `soturail skills init <name>`.
- Generate skills from approved specs and rules.
- Validate `SKILL.md` before use.
- Export reviewed skills for Claude, Codex, Gemini and Cursor.
- Prompt-injection and destructive-command scans before enabling generated skills.

## v0.4.0 - Workflow Rail and MCP Server

- `soturail workflow new <name>`.
- Workflow templates and validation.
- Export workflow artifacts into Skill Rail.
- MCP server for local repo maps, logs, rules and memory.

## v0.5.0 - Semantic Memory and Knowledge Depth

- Tree-sitter repo map.
- Hardened PDF extraction.
- Deeper semantic memory with optional local embeddings.
- Stronger Knowledge-to-Rules search and citation workflows.
- Native runner packaging for npm prebuilds.
- External benchmark comparison docs.
- Real provider cache metadata import.

## Later

- Pluggable policy packs.
- TUI review surface for raw logs, specs, memory and rules.
- More host integrations as public APIs stabilize.
