# Agent-Readable Reports

Agent-readable reports are compact Markdown handoffs generated from local report evidence.

```bash
soturail report agent --agent codex
soturail report agent --agent claude
soturail report agent --agent gemini
soturail report agent --agent generic
```

Artifacts:

```txt
.soturail/reports/agent-codex.md
.soturail/reports/agent-claude.md
.soturail/reports/agent-gemini.md
.soturail/reports/agent-generic.md
```

Report structure:

```txt
Current Project Status
Known Problems
Safe Next Commands
Do Not Do
Release Status
Brain Warnings
Benchmark Evidence
Native/Fallback Status
Baseline Snapshot
Workflow Evidence
Recommended Fix Order
Evidence Paths
```

Host-specific formatting stays conservative:

- Codex: AGENTS.md-friendly Markdown.
- Claude: Markdown with XML-like tagged wrapping.
- Gemini: larger-context Markdown sections.
- Generic: clean Markdown.

Agent reports do not include raw logs, `.env` contents or private tokens. Warnings are separated from verified facts, and unsupported claims are avoided.
