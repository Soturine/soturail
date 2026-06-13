# Agent Pipeline Workflow

This local-first workflow demonstrates a safe validate, fix, verify and report loop.

1. Collect source-backed evidence with `soturail evidence collect`.
2. Review the report before making changes.
3. Apply an explicitly approved change outside SotuRail.
4. Verify evidence with `soturail evidence verify`.
5. Export a concise report for humans or agents.

SotuRail prepares context and evidence. It does not autonomously edit the project or execute arbitrary shell commands.
