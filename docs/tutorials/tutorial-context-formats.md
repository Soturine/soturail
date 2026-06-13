# Tutorial: Choosing Context Formats

Pick the format that matches the host and the job.

| Host or surface | Useful format |
| --- | --- |
| Claude Code | Markdown plus XML-like tagged blocks and short `CLAUDE.md` references. |
| Codex | `AGENTS.md`, Markdown context packs and JSON only for configs/reports. |
| Gemini CLI | Markdown or tagged context, with large docs referenced rather than pasted. |
| Cursor | Project rules plus Markdown docs and file references. |
| MCP | JSON schemas and resource/tool payloads. |
| Deep Agents-style | Role packs, workflow evidence, policy notes and JSON config notes. |

Useful commands:

```bash
soturail format compare README.md
soturail validate json package.json --strict
soturail context budget --explain
soturail agents capabilities
```

Safety rules:

- duplicate JSON keys are risky;
- huge arrays should be summarized or offloaded;
- probable secrets should be redacted;
- Mermaid diagrams are context and evidence, not executable truth.
