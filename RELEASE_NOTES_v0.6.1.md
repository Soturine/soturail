# SotuRail v0.6.1 - Agent UX Polish And Full Evaluation Suite

v0.6.1 adds the local evaluation suite and improves agent setup guidance on top of the v0.6.0 Agent Runtime Adapter.

## Highlights

- Added `soturail eval list`, `soturail eval run` and `soturail eval report`.
- Added deterministic local fixtures for memory recall, context selection, reducers, context routing, role packs, agent-doc hygiene, offload/restore, format quality, strict JSON, evidence packs, harness scenarios and Diagram Rail validation.
- Improved `agents doctor`, `agents status`, `agents capabilities` and `agents explain` with clearer copy/paste setup guidance.
- Added practical setup tutorials for Claude Code, Codex, Gemini CLI, Cursor, Antigravity prompt-only workflows and Deep Agents-style role packs.
- Documented how to read evaluation reports and why token savings without quality preservation is not enough.

## Safety

- No npm publish was run as part of this release prep.
- No provider APIs, paid services, real agent hosts or network calls are required for the evaluation suite.
- Agent installs remain project-local, dry-run/backup-first and review-first.
- SotuRail still does not expose arbitrary shell execution through MCP.

## Verification

Recommended local checks:

```bash
npm run typecheck
npm run build
npm test
soturail eval run
soturail eval report
```

Evaluation reports are written to:

```txt
.soturail/eval/latest.json
.soturail/eval/latest.md
```
