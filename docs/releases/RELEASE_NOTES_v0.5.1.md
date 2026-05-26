# SotuRail v0.5.1 - Agent UX And Payload Polish

SotuRail v0.5.1 polished the v0.5 rail outputs and added lightweight structured payload helpers for safer local agent handoffs.

## Highlights

- Light `soturail validate json <file> --strict` seed for JSON parse, duplicate-key, probable-secret and huge-array checks.
- Light `soturail format compare <file>` seed for Markdown, JSON, tagged-block and compact-format handoff hints.
- Migration notes for moving from v0.4.x to v0.5.x rails.
- Structured Payload Rail and Diagram Rail examples.
- Improved Memory Rail recall output with score, reason, source, tags, confidence and privacy details.
- Improved Memory Rail doctor output with storage, consolidated count, secret hints and approved-memory export guidance.
- Improved Context Intelligence output with recovery pointers, clearer prune sections and richer budget drivers.
- Improved Run Workspace show/clean output with summary, handoff, evidence and linked artifact status.
- Expanded docs for role packs, agent docs hygiene, approved-memory export and clean-folder onboarding.

## Security

JSON validation warns about probable secrets before agent handoff. Format comparison and structured payload docs recommend redaction, offload and review for large or sensitive payloads.
